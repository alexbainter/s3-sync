'use strict';

const getFilenames = require('../shared/get-filenames');
const getLocalDestinationFilename = require('../shared/get-local-destination-filename');

const MAX_OBJECT_COUNT_PER_REQUEST = 1000;

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
      const destinationFilename = getLocalDestinationFilename(
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

    const deleteGroups = deleteFilenames.reduce(
      (groups, filename, i) => {
        const groupIndex = Math.floor(i / MAX_OBJECT_COUNT_PER_REQUEST);
        groups[groupIndex].push(filename);
        return groups;
      },
      Array.from(
        {
          length: Math.ceil(
            deleteFilenames.length / MAX_OBJECT_COUNT_PER_REQUEST
          ),
        },
        () => []
      )
    );

    const deleteRequests = deleteGroups.map((filenames) =>
      dryRun
        ? Promise.resolve()
        : s3.deleteObjects({
            Delete: { Objects: filenames.map((key) => ({ Key: key })) },
          })
    );

    return Promise.all(deleteRequests).then(() => {
      console.log(
        `Removed ${deleteFilenames.length} files:\n${deleteFilenames.join(
          '\n'
        )}\n`
      );
    });
  });

module.exports = pruneRemote;
