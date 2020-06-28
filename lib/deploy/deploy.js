'use strict';

const push = require('../push/push.js');
const invalidateCache = require('./invalidate-cache');

const deploy = ({
  s3,
  cloudFront,
  distDir,
  mutableFilenames,
  compressExtensions,
}) =>
  push({
    s3,
    distDir,
    mutableFilenames,
    compressExtensions,
  }).then((uploadedFiles) => {
    if (!cloudFront) {
      return Promise.resolve();
    }
    const mutableFilenameSet = new Set(mutableFilenames);
    const invalidationPaths = uploadedFiles.map((filename) =>
      mutableFilenameSet.has(filename)
    );
    return invalidateCache(cloudFront, invalidationPaths);
  });

module.exports = deploy;
