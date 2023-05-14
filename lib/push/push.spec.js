'use strict';

const { expect } = require('chai');
const sinon = require('sinon');
const mockFs = require('mock-fs');
const push = require('./push');

const getContentForFilename = (filename) => `${filename}_CONTENT`;

const createMockS3 = (remoteFilenames = []) => ({
  listObjectsV2: () => ({
    promise: () =>
      Promise.resolve({
        Contents: remoteFilenames.map((key) => ({ Key: key })),
      }),
  }),
  upload: sinon.spy(({ Key }) => ({
    promise: () => Promise.resolve({ Key }),
  })),
});

describe('push', () => {
  beforeEach(mockFs.restore);
  after(mockFs.restore);
  it('should upload missing and mutable files', () => {
    const distDir = './dist/';
    const untouchedFilenames = ['untouched.txt', 'untouched/untouched.txt'];
    const mutableFilenames = ['mutable.txt', 'mutable/mutable.txt'];
    const missingFilenames = ['missing.txt', 'missing/missing.txt'];
    mockFs(
      untouchedFilenames
        .concat(mutableFilenames)
        .concat(missingFilenames)
        .reduce((o, filename) => {
          o[`${distDir}${filename}`] = getContentForFilename(filename);
          return o;
        }, {})
    );
    const mockS3 = createMockS3(untouchedFilenames.concat(mutableFilenames));
    return push({
      s3: mockS3,
      distDir,
      mutableFilenames,
    }).then(() => {
      expect(mockS3.upload.callCount).to.equal(
        mutableFilenames.length + missingFilenames.length
      );
      const allUploadParams = mockS3.upload
        .getCalls()
        .map(({ firstArg }) => firstArg);
      return Promise.all(
        mutableFilenames.concat(missingFilenames).map((filename) => {
          const uploadParams = allUploadParams.find(
            ({ Key }) => Key === filename
          );
          expect(uploadParams).to.exist;
          return new Promise((resolve) => {
            uploadParams.Body.setEncoding('utf8');
            const contentParts = [];
            uploadParams.Body.on('data', (data) => {
              contentParts.push(data);
            });
            uploadParams.Body.on('end', () => {
              resolve(contentParts.join(''));
            });
          }).then((content) => {
            expect(content).to.equal(getContentForFilename(filename));
          });
        })
      );
    });
  });
  it('should upload extensionless copies of non-index HTML files if aliasHtmlPages is enabled', () => {
    const distDir = './dist/';
    const htmlFiles = [
      'index.html',
      'page1.html',
      'more-pages/index.html',
      'more-pages/page2.html',
    ];
    mockFs(
      htmlFiles.reduce((o, filename) => {
        o[`${distDir}${filename}`] = getContentForFilename(filename);
        return o;
      }, {})
    );
    const mockS3 = createMockS3();
    return push({
      s3: mockS3,
      distDir,
      aliasHtmlPages: true,
    }).then(() => {
      expect(mockS3.upload.callCount).to.equal(6); // 2 for index files and 4 for the 2 named pages
      const allUploadParams = mockS3.upload
        .getCalls()
        .map(({ firstArg }) => firstArg);
      htmlFiles.forEach((filename) => {
        const htmlExtensionUploadParams = allUploadParams.find(
          ({ Key }) => Key === filename
        );
        expect(htmlExtensionUploadParams).to.exist;
        expect(htmlExtensionUploadParams).to.have.property(
          'ContentType',
          'text/html'
        );
        if (filename.endsWith('index.html')) {
          return;
        }
        const extensionlessUploadParams = allUploadParams.find(
          ({ Key }) => Key === filename.replace('.html', '')
        );
        expect(extensionlessUploadParams).to.exist;
        expect(extensionlessUploadParams).to.have.property(
          'ContentType',
          'text/html'
        );
      });
    });
  });
});
