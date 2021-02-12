'use strict';

const { Readable } = require('stream');
const { Gzip } = require('zlib');
const { expect } = require('chai');
const mockFs = require('mock-fs');
const { getType } = require('mime');
const sinon = require('sinon');
const uploadFile = require('./upload-file');

const createMockS3 = () => ({
  upload: sinon.fake.returns({ promise: () => Promise.resolve() }),
});

describe('uploadFile', () => {
  const localPath = './test/file.txt';
  const destinationPath = 'destination/path/file.txt';
  beforeEach(() => {
    mockFs.restore;
    mockFs({
      [localPath]: '',
    });
  });
  after(mockFs.restore);
  it('should call s3.upload() with base parameters', () => {
    const mockS3 = createMockS3();
    uploadFile({
      s3: mockS3,
      localPath,
      destinationPath,
    });
    expect(mockS3.upload.calledOnce).to.be.true;
    const uploadParams = mockS3.upload.getCall(0).firstArg;
    expect(uploadParams).to.have.property('Key', destinationPath);
    expect(uploadParams).to.have.property('ACL', 'public-read');
    expect(uploadParams).to.have.property('ContentType', getType(localPath));
    expect(uploadParams)
      .to.have.property('Body')
      .which.is.an.instanceOf(Readable);
  });
  it('should add compression params if shouldCompress is true', () => {
    const mockS3 = createMockS3();
    uploadFile({
      s3: mockS3,
      localPath,
      destinationPath,
      shouldCompress: true,
    });
    expect(mockS3.upload.calledOnce).to.be.true;
    const uploadParams = mockS3.upload.getCall(0).firstArg;
    expect(uploadParams).to.have.property('ContentEncoding', 'gzip');
    expect(uploadParams).to.have.property('Body').which.is.an.instanceOf(Gzip);
  });
  it('should add aggressive cache params if isImmutable is true', () => {
    const mockS3 = createMockS3();
    uploadFile({
      s3: mockS3,
      localPath,
      destinationPath,
      isImmutable: true,
    });
    expect(mockS3.upload.calledOnce).to.be.true;
    const uploadParams = mockS3.upload.getCall(0).firstArg;
    expect(uploadParams).to.have.property('CacheControl');
    const cacheControlValues = uploadParams.CacheControl.split(',');
    expect(cacheControlValues).to.have.members([
      'public',
      'max-age=31536000',
      'immutable',
    ]);
  });
  it('should allow the contentType to be overriden', () => {
    const mockS3 = createMockS3();
    const mockContentType = 'mock/content-type';
    uploadFile({
      s3: mockS3,
      localPath,
      destinationPath,
      contentType: mockContentType,
    });
    expect(mockS3.upload.calledOnce).to.be.true;
    const uploadParams = mockS3.upload.getCall(0).firstArg;
    expect(uploadParams).to.have.property('ContentType', mockContentType);
  });
});
