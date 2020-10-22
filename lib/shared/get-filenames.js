'use strict';

const getLocalFilenames = require('./get-local-filenames');
const getRemoteFilenames = require('./get-remote-filenames');

const getFilenames = ({ distDir, s3 }) =>
  Promise.all([getLocalFilenames(distDir), getRemoteFilenames(s3)]).then(
    ([localFilenames, remoteFilenames]) => ({
      localFilenames,
      remoteFilenames,
    })
  );

module.exports = getFilenames;
