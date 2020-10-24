'use strict';

const getFilenames = require('../shared/get-filenames');
const getRemoteDestinationFilename = require('../shared/get-remote-destination-filename');
const getLocalDestinationFilename = require('../shared/get-local-destination-filename');

const diff = ({ s3, distDir } = {}) =>
  getFilenames({
    s3,
    distDir,
  }).then(({ localFilenames, remoteFilenames }) => {
    const localFilenameSet = new Set(localFilenames);
    const remoteFilenameSet = new Set(remoteFilenames);
    console.log(
      `Local-only files:\n\n${localFilenames
        .filter(
          (localFilename) =>
            !remoteFilenameSet.has(
              getRemoteDestinationFilename(localFilename, distDir)
            )
        )
        .join('\n')}`
    );
    console.log(
      `Remote-only files:\n\n${remoteFilenames
        .filter(
          (remoteFilename) =>
            !localFilenameSet.has(
              getLocalDestinationFilename(remoteFilename, distDir)
            )
        )
        .join('\n')}`
    );
  });

module.exports = diff;
