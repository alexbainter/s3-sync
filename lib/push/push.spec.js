'use strict';

const { expect } = require('chai');
const sinon = require('sinon');
const mockFs = require('mock-fs');
const push = require('./push');

const getContentForFilename = (filename) => `${filename}_CONTENT`;

const createMockS3 = (remoteFilenames) => ({
  listObjectsV2: () => ({
    promise: () =>
      Promise.resolve({
        Contents: remoteFilenames.map((key) => ({ Key: key })),
      }),
  }),
  upload: sinon.fake.returnValue({
    promise: ({ Key }) => Promise.resolve({ Key }),
  }),
});

describe('push', () => {
  beforeEach(mockFs.restore);
  after(mockFs.restore);
  it('should push missing and mutable files', () => {
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
        })
    );
    const mockS3 = createMockS3(untouchedFilenames.concat(mutableFilenames));
    return push({
      s3: mockS3,
      distDir,
      mutableFilenames,
    }).then(() => {
      expect();
    });
  });
});
