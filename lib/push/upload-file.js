'use strict';

const fs = require('fs');
const { createGzip } = require('zlib');
const { getType } = require('mime');
const pipe = require('../utils/pipe');

const compress = (uploadParams) =>
  Object.assign({}, uploadParams, {
    Body: uploadParams.Body.pipe(createGzip()),
    ContentEncoding: 'gzip',
  });

const cacheForever = (uploadParams) =>
  Object.assign({}, uploadParams, {
    CacheControl: 'public,max-age=31536000,immutable',
  });

const makeUpload = (s3) => (uploadParams) => s3.upload(uploadParams).promise();

const uploadFile = ({
  s3,
  localPath,
  destinationPath,
  shouldCompress = false,
  isImmutable = false,
  contentType = getType(localPath),
} = {}) => {
  const uploadParams = {
    Key: destinationPath,
    ACL: 'public-read',
    Body: fs.createReadStream(localPath),
    ContentType: contentType,
  };

  const transformations = [];
  if (shouldCompress) {
    transformations.push(compress);
  }
  if (isImmutable) {
    transformations.push(cacheForever);
  }

  const upload = makeUpload(s3);

  return pipe(...transformations, upload)(uploadParams);
};

module.exports = uploadFile;
