'use strict';

const { Readable } = require('stream');
const { promises } = require('fs');
const { expect } = require('chai');
const mockFs = require('mock-fs');
const pull = require('./pull');

const { readFile } = promises;

const getPrepullContentForFilename = (filename) => `${filename}_PREPULL`;
const getPostpullContentForFilename = (filename) => `${filename}_POSTPULL`;

const createMockS3 = (remoteFilenames = []) => ({
  listObjectsV2: () => ({
    promise: () =>
      Promise.resolve({
        Contents: remoteFilenames.map((key) => ({ Key: key })),
      }),
  }),
  getObject: ({ Key: key }) => {
    const request = {
      on: (event, callback) => {
        if (event === 'httpHeaders') {
          setTimeout(() => {
            callback(200, {});
          }, 0);
        }
        return request;
      },
      createReadStream: () => {
        const contentStream = Readable.from([
          getPostpullContentForFilename(key),
        ]);
        return contentStream;
      },
    };
    return request;
  },
});

describe('pull', () => {
  beforeEach(mockFs.restore);
  after(mockFs.restore);
  it('should download missing or mutable remote files', () => {
    const distDir = './dist/';
    const untouchedFilenames = ['untouched.txt', 'untouched/untouched.txt'];
    const mutableFilenames = ['mutable.txt', 'mutable/mutable.txt'];
    const missingFilenames = ['missing.txt', 'missing/missing.txt'];
    mockFs(
      untouchedFilenames.concat(mutableFilenames).reduce((o, filename) => {
        o[`${distDir}${filename}`] = getPrepullContentForFilename(filename);
        return o;
      }, {})
    );
    const mockS3 = createMockS3(
      untouchedFilenames.concat(mutableFilenames).concat(missingFilenames)
    );
    return pull({
      s3: mockS3,
      distDir,
      mutableFilenames,
    })
      .then(() =>
        Promise.all(
          [
            untouchedFilenames,
            mutableFilenames,
            missingFilenames,
          ].map((filenames) =>
            Promise.all(
              filenames.map((filename) =>
                readFile(`${distDir}${filename}`, 'utf8')
              )
            )
          )
        )
      )
      .then(([untouchedFiles, mutableFiles, missingFiles]) => {
        expect(untouchedFiles).to.eql(
          untouchedFilenames.map(getPrepullContentForFilename)
        );
        expect(mutableFiles).to.eql(
          mutableFilenames.map(getPostpullContentForFilename)
        );
        expect(missingFiles).to.eql(
          missingFilenames.map(getPostpullContentForFilename)
        );
      });
  });
});
