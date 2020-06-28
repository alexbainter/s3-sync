'use strict';

const push = require('../push/push.js');
const invalidateCache = require('./invalidate-cache');

const deploy = ({
  s3,
  cloudFront,
  distDir,
  mutableFilenames = [],
  compressExtensions = [],
  dryRun = false,
} = {}) =>
  push({
    s3,
    distDir,
    mutableFilenames,
    compressExtensions,
    dryRun,
  }).then((uploadedFiles) => {
    if (!cloudFront) {
      return Promise.resolve();
    }
    const mutableFilenameSet = new Set(mutableFilenames);
    const invalidationPaths = uploadedFiles.map((filename) =>
      mutableFilenameSet.has(filename)
    );
    return invalidateCache({ cloudFront, dryRun, paths: invalidationPaths });
  });

module.exports = deploy;
