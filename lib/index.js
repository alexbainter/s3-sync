'use strict';

const deploy = require('./deploy/deploy');
const pull = require('./pull/pull');
const createS3 = require('./create-s3');
const createCloudFront = require('./create-cloud-front');

module.exports = {
  deploy,
  pull,
  createS3,
  createCloudFront,
};
