'use strict';

const { S3 } = require('aws-sdk');

const API_VERSION = '2006-03-01';

const getS3 = (bucketName) =>
  new S3({
    apiVersion: API_VERSION,
    params: { Bucket: bucketName },
  });

module.exports = getS3;
