'use strict';

const { Readable } = require('stream');
const { promises: fsp, constants } = require('fs');
const { expect } = require('chai');
const mockFs = require('mock-fs');
const pull = require('./pull');

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
                fsp.readFile(`${distDir}${filename}`, 'utf8')
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
  it("should ignore remote files which don't match any filters", () => {
    const distDir = './dist/';
    const ignoredFilenames = ['something.ignore', 'something/else.ignore'];
    const missingFilenames = ['missing.txt', 'missing/missing.txt'];
    const remoteFilenames = ignoredFilenames.concat(missingFilenames);
    mockFs({});
    const mockS3 = createMockS3(remoteFilenames);
    return pull({
      distDir,
      s3: mockS3,
      filters: [/\.txt$/],
    })
      .then(() =>
        Promise.all(
          remoteFilenames.map((filename) =>
            fsp
              .access(`${distDir}${filename}`, constants.F_OK)
              .then(() => true)
              .catch(() => false)
          )
        )
      )
      .then((accessResults) => {
        expect(accessResults).eql(
          remoteFilenames.map((remoteFilename) =>
            missingFilenames.includes(remoteFilename)
          )
        );
      });
  });
});
