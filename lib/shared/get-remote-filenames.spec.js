'use strict';

const { expect } = require('chai');
const getRemoteFileInfo = require('./get-remote-filenames');

const createMockS3 = (filenamesByContinuationToken = new Map()) => {
  const mockS3 = {
    listObjectsV2: ({ ContinuationToken: continuationToken }) => ({
      promise: () => {
        const filenames =
          filenamesByContinuationToken.get(continuationToken) || [];
        filenamesByContinuationToken.delete(continuationToken);
        const nextContinuationToken = filenamesByContinuationToken.keys().next()
          .value;
        return Promise.resolve({
          Contents: filenames.map((filename) => ({
            Key: filename,
          })),
          IsTruncated: Boolean(nextContinuationToken),
          NextContinuationToken: nextContinuationToken,
        });
      },
    }),
  };
  return mockS3;
};

describe('getRemoteFilenames', () => {
  it('should return the Keys of the remote files', () => {
    const mockFilenames = ['file1.txt', 'nested/file2.js'];
    // eslint-disable-next-line no-undefined
    const mockS3 = createMockS3(new Map([[undefined, mockFilenames]]));
    return getRemoteFileInfo(mockS3).then((results) => {
      expect(results).to.eql(mockFilenames);
    });
  });
  it('should exhuast the listed objects using continuation tokens', () => {
    const mockFilenames = Array.from(
      { length: 20 },
      (_, i) => `FILENAME_${i}.css`
    );
    const mockFilenamesByContinuationToken = mockFilenames.reduce(
      (map, filename) => {
        const addedFilenames = Array.from(map.values());
        if (addedFilenames.length === 0) {
          //eslint-disable-next-line no-undefined
          map.set(undefined, [filename]);
          return map;
        }
        const [lastFilename] = addedFilenames[addedFilenames.length - 1];
        map.set(lastFilename, [filename]);
        return map;
      },
      new Map()
    );
    const mockS3 = createMockS3(mockFilenamesByContinuationToken);
    return getRemoteFileInfo(mockS3).then((results) => {
      expect(results).to.eql(mockFilenames);
    });
  });
});
