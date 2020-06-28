'use strict';

const { promises } = require('fs');
const { Readable } = require('stream');
const { createGzip } = require('zlib');
const { dirname } = require('path');
const { expect } = require('chai');
const mockFs = require('mock-fs');
const downloadFile = require('./download-file');

const { readFile, access } = promises;

const createMockS3 = ({
  fileMap = new Map(),
  httpStatus = 200,
  contentEncoding,
  error,
} = {}) => ({
  getObject: ({ Key: key }) => {
    const request = {
      on: (event, callback) => {
        if (event === 'httpHeaders' && !error) {
          setTimeout(() => {
            callback(httpStatus, { 'content-encoding': contentEncoding });
          }, 0);
        } else if (event === 'error' && error) {
          setTimeout(() => {
            callback(error);
          }, 0);
        }
        return request;
      },
      createReadStream: () => {
        const contentStream = Readable.from([fileMap.get(key)]);
        if (contentEncoding !== 'gzip') {
          return contentStream;
        }
        return contentStream.pipe(createGzip());
      },
    };
    return request;
  },
});

describe('downloadFile', () => {
  beforeEach(() => {
    mockFs.restore();
    mockFs();
  });
  after(mockFs.restore);
  it('should download the file from s3', () => {
    const remotePath = 'remote.txt';
    const fileContent = 'MOCK_FILE_CONTENT';
    const fileMap = new Map([[remotePath, fileContent]]);
    const destinationPath = './destination.txt';
    const mockS3 = createMockS3({ fileMap });
    return downloadFile({ s3: mockS3, remotePath, destinationPath })
      .then(() => readFile(destinationPath, 'utf8'))
      .then((savedContent) => {
        expect(savedContent).to.equal(fileContent);
      });
  });
  it('should uncompress the file if necessary', () => {
    const remotePath = 'remote.txt';
    const fileContent = 'MOCK_FILE_CONTENT';
    const fileMap = new Map([[remotePath, fileContent]]);
    const destinationPath = './destination.txt';
    const mockS3 = createMockS3({ fileMap, contentEncoding: 'gzip' });
    return downloadFile({ s3: mockS3, remotePath, destinationPath })
      .then(() => readFile(destinationPath, 'utf8'))
      .then((savedContent) => {
        expect(savedContent).to.equal(fileContent);
      });
  });
  it('should create directories for the local file as necessary', () => {
    const remotePath = 'remote.txt';
    const fileContent = 'MOCK_FILE_CONTENT';
    const fileMap = new Map([[remotePath, fileContent]]);
    const destinationPath = './nested/path/to/destination.txt';
    const mockS3 = createMockS3({ fileMap });
    return downloadFile({ s3: mockS3, remotePath, destinationPath })
      .then(() => access(dirname(destinationPath)))
      .catch(() => {
        expect.fail('Directory not created');
      });
  });
  it('should reject if the HTTP status code indicates an error', () => {
    const statusCodes = [300, 400, 500];
    const remotePath = 'remote.txt';
    Promise.allSettled(
      statusCodes.map((httpStatus) => {
        const mockS3 = createMockS3({ httpStatus });
        return downloadFile({
          remotePath,
          s3: mockS3,
          destinationPath: './destination.txt',
        });
      })
    ).then((results) => {
      results.forEach(({ status, reason }, i) => {
        const httpStatusCode = statusCodes[i];
        expect(status).to.equal('rejected');
        expect(reason.message).to.equal(
          `s3.getObject HTTP code ${httpStatusCode} for ${remotePath}`
        );
      });
    });
  });
  it('should reject if s3 reports an error', () => {
    const errorMessage = "It's broken";
    const mockS3 = createMockS3({ error: new Error(errorMessage) });
    return downloadFile({
      s3: mockS3,
      remotePath: 'remote.txt',
      destinationPath: './destination.txt',
    })
      .then(() => {
        expect.fail('Promise did not reject');
      })
      .catch((error) => {
        expect(error.message).to.equal(errorMessage);
      });
  });
});
