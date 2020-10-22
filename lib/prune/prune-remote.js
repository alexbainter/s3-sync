'use strict';

const getFilenames = require('../shared/get-filenames');
const getDestinationFilename = require('../shared/get-destination-filename');

const pruneRemote = ({
  s3,
  distDir,
  mutableFilenames = [],
  dryRun = false,
} = {}) =>
  getFilenames({
    s3,
    distDir,
  }).then(({ localFilenames, remoteFilenames }) => {
    const mutableFilenameSet = new Set(mutableFilenames);
    const localFilenameSet = new Set(localFilenames);
    const deleteFilenames = remoteFilenames.filter((remoteFilename) => {
      const destinationFilename = getDestinationFilename(
        remoteFilename,
        distDir
      );
      return (
        !mutableFilenameSet.has(remoteFilename) &&
        !localFilenameSet.has(destinationFilename)
      );
    });

    if (deleteFilenames.length === 0) {
      console.log('Nothing to delete.');
      return Promise.resolve();
    }

    return (dryRun
      ? Promise.resolve()
      : s3
          .deleteObjects({
            Objects: deleteFilenames.map((key) => ({ Key: key })),
          })
          .promise()
    ).then(() => {
      console.log(`Removed\n${deleteFilenames.join('\n')}\n`);
    });
  });

module.exports = pruneRemote;
