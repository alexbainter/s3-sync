'use strict';

const CloudFront = require('aws-sdk/clients/cloudfront');

const API_VERSION = '2018-11-05';

const createCloudFront = (distributionId) =>
  new CloudFront({
    apiVersion: API_VERSION,
    params: { DistributionId: distributionId },
  });

module.exports = createCloudFront;
