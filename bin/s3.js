#!/usr/bin/env node

'use strict';

const yargs = require('yargs');
const deploy = require('../lib/deploy/deploy');
const pull = require('../lib/pull/pull');
const createS3 = require('../lib/create-s3');
const createCloudFront = require('../lib/create-cloud-front');

const program = yargs
  .command(
    'deploy',
    'Upload files and optionally invalidate CloudFront cache',
    {
      bucket: {
        descrption:
          'The name of the bucket to push to (must have write access)',
        type: 'string',
        requiresArg: true,
        nargs: 1,
        demand: true,
      },
      directory: {
        alias: 'dir',
        descrption: 'The local directory containing files to upload',
        type: 'string',
        requiresArg: true,
        nargs: 1,
        demand: true,
        default: 'dist',
      },
      distributionId: {
        description:
          '(Optional) The ID of a CloudFront distribution to invalidate ',
        type: 'string',
        requiresArgs: true,
        nargs: 1,
      },
      mutableFilenames: {
        alias: 'mutables',
        description: '(Optional) A list of filenames whose content may change',
        type: 'array',
        requiresArg: true,
        nargs: 1,
        default: ['index.html'],
      },
      compressExtensions: {
        alias: 'compress',
        description:
          '(Optional) A list of file extension which should be compressed before upload',
        type: 'array',
        requiresArg: true,
        nargs: 1,
        default: ['css', 'js', 'html', 'png', 'json', 'xml', 'webapp'],
      },
    }
  )
  .command('pull', 'Download remote files to local file system', {
    bucket: {
      descrption: 'The name of the bucket to push to (must have read access)',
      type: 'string',
      requiresArg: true,
      nargs: 1,
      demand: true,
    },
    directory: {
      alias: 'dir',
      descrption: 'The local directory containing files to upload',
      type: 'string',
      requiresArg: true,
      nargs: 1,
      demand: true,
      default: 'dist',
    },
    mutableFilenames: {
      alias: 'mutables',
      description: '(Optional) A list of filenames whose content may change',
      type: 'array',
      requiresArg: true,
      nargs: 1,
      default: ['index.html'],
    },
  })
  .help()
  .demandCommand(1, 'Please choose a command')
  .scriptName('s3')
  .strict();

const {
  bucket,
  directory,
  distributionId,
  mutableFilenames,
  compressExtensions,
  _,
} = program.argv;
const [command] = _;

if (command === 'deploy') {
  deploy({
    mutableFilenames,
    compressExtensions,
    s3: createS3(bucket),
    distDir: directory,
    cloudFront: distributionId && createCloudFront(distributionId),
  })
    .then(() => {
      console.log('Deploy completed successfully');
    })
    .catch((err) => {
      console.error(err);
      console.error('Deploy failed');
    });
} else if (command === 'pull') {
  pull({
    mutableFilenames,
    s3: createS3(bucket),
    distDir: directory,
  })
    .then(() => {
      console.log('Pull completed successfully');
    })
    .catch((err) => {
      console.error(err);
      console.error('Pull failed');
    });
}
