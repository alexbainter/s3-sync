'use strict';

const { expect } = require('chai');
const mockFs = require('mock-fs');
const sinon = require('sinon');
const pruneRemote = require('./prune-remote');

const createMockS3 = (remoteFilenames = []) => {
  const mockS3 = {
    listObjectsV2: () => ({
      promise: () =>
        Promise.resolve({
          Contents: remoteFilenames.map((key) => ({ Key: key })),
        }),
    }),
    deleteObjects: sinon.spy(() => ({
      promise: () => Promise.resolve(),
    })),
  };
  return mockS3;
};

describe('prune remote', () => {
  beforeEach(mockFs.restore);
  after(mockFs.restore);
  it("should call s3.deleteObjects for files which are not mutable and don't exist locally", () => {
    const distDir = './dist/';
    const untouchedFilenames = ['untouched.txt', 'untouched/untouched.txt'];
    const mutableFilenames = ['mutable.txt', 'mutable/mutable.txt'];
    const deletedFilenames = ['deleted.txt', 'deleted/deleted.txt'];
    mockFs(
      untouchedFilenames.concat(mutableFilenames).reduce((o, filename) => {
        o[`${distDir}${filename}`] = '';
        return o;
      }, {})
    );
    const mockS3 = createMockS3(
      untouchedFilenames.concat(mutableFilenames).concat(deletedFilenames)
    );
    return pruneRemote({ s3: mockS3, distDir, mutableFilenames }).then(() => {
      expect(mockS3.deleteObjects.calledOnce).to.be.true;
      expect(mockS3.deleteObjects.firstCall.firstArg).to.have.deep.property(
        'Objects',
        deletedFilenames.map((key) => ({ Key: key }))
      );
    });
  });
});
