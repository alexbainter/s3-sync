'use strict';

const glob = require('glob');

const getLocalFiles = (distDir, cwd = process.cwd()) =>
  new Promise((resolve, reject) => {
    glob(`${distDir}/**/*.*`, { cwd }, (err, files) => {
      if (err) {
        return reject(err);
      }
      return resolve(files);
    });
  });

module.exports = getLocalFiles;
