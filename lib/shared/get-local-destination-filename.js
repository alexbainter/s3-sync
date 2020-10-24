'use strict';

const getLocalDestinationFilename = (remoteFilename, distDir) =>
  `${distDir}${distDir.endsWith('/') ? '' : '/'}${remoteFilename}`;

module.exports = getLocalDestinationFilename;
