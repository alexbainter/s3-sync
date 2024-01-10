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
  aliasHtmlPages = true,
  mutableHtml = true,
} = {}) =>
  push({
    s3,
    distDir,
    mutableFilenames,
    compressExtensions,
    dryRun,
    aliasHtmlPages,
    mutableHtml,
  }).then((uploadedFiles) => {
    if (!cloudFront) {
      return Promise.resolve();
    }
    const mutableFilenameSet = new Set(mutableFilenames);
    const uploadedFileSet = new Set(uploadedFiles);
    const invalidationPaths = uploadedFiles.filter(
      (filename) =>
        mutableFilenameSet.has(filename) ||
        (mutableHtml &&
          (filename.endsWith('.html') ||
            (aliasHtmlPages && uploadedFileSet.has(`${filename}.html`))))
    );
    return invalidateCache({ cloudFront, dryRun, paths: invalidationPaths });
  });

module.exports = deploy;
