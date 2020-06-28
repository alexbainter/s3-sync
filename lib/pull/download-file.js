'use strict';

const { promises, createWriteStream } = require('fs');
const { dirname } = require('path');
const { createGunzip } = require('zlib');

const { mkdir } = promises;

const createDownloadStream = (s3, key) =>
  new Promise((resolve, reject) => {
    const readStream = s3
      .getObject({ Key: key })
      .on('httpHeaders', (code, headers) => {
        if (code >= 400) {
          return reject(new Error(`s3.getObject HTTP code ${code} for ${key}`));
        }
        const contentEncoding = headers['content-encoding'];
        if (contentEncoding !== 'gzip') {
          return resolve(readStream);
        }
        return resolve(readStream.pipe(createGunzip()));
      })
      .createReadStream();
  });

const downloadFile = ({ s3, remoteFilename, distDir }) => {
  const localFileName = `${distDir}${
    distDir.endsWith('/') ? '' : '/'
  }${remoteFilename}`;
  return Promise.all([
    createDownloadStream(s3, remoteFilename),
    mkdir(dirname(localFileName), { recursive: true }),
  ]).then(
    ([downloadStream]) =>
      new Promise((resolve) => {
        downloadStream
          .pipe(createGunzip())
          .pipe(createWriteStream(localFileName))
          .on('finish', resolve);
      })
  );
};

module.exports = downloadFile;
