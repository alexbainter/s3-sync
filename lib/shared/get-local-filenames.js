'use strict';

const glob = require('glob');

const getLocalFilenames = (distDir = './') =>
  new Promise((resolve, reject) => {
    glob(
      `${distDir}${distDir.endsWith('/') ? '' : '/'}**/*`,
      { nodir: true },
      (err, files) => {
        if (err) {
          return reject(err);
        }
        return resolve(files);
      }
    );
  });

module.exports = getLocalFilenames;
