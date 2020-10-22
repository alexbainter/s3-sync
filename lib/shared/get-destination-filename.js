'use strict';

const getDestinationFilename = (remoteFilename, distDir) =>
  `${distDir}${distDir.endsWith('/') ? '' : '/'}${remoteFilename}`;

module.exports = getDestinationFilename;
