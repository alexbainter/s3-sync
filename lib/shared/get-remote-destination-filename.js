'use strict';

const getRemoteDestinationFilename = (localFilename, distDir) =>
  localFilename.replace(distDir.endsWith('/') ? distDir : `${distDir}/`, '');

module.exports = getRemoteDestinationFilename;
