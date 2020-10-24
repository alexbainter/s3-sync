#!/usr/bin/env node

'use strict';

const yargs = require('yargs');
const deploy = require('../lib/deploy/deploy');
const pull = require('../lib/pull/pull');
const pruneRemote = require('../lib/prune/prune-remote');
const createS3 = require('../lib/create-s3');
const createCloudFront = require('../lib/create-cloud-front');

const program = yargs
  .command(
    'deploy',
    'Upload files and optionally invalidate CloudFront cache',
    {
      bucket: {
        descrption:
          'The name of the bucket to upload to (requires read and write access)',
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
          '(Optional) The ID of a CloudFront distribution to invalidate',
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
      dryRun: {
        description:
          '(Optional) Run command without uploading any files or invalidating a cache',
        type: 'boolean',
        default: false,
      },
    }
  )
  .command('pull', 'Download remote files to local file system', {
    bucket: {
      descrption:
        'The name of the bucket to download from (requires read access)',
      type: 'string',
      requiresArg: true,
      nargs: 1,
      demand: true,
    },
    directory: {
      alias: 'dir',
      descrption: 'The local directory to download files to',
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
    dryRun: {
      description: '(Optional) Run command without downloading any files',
      type: 'boolean',
      default: false,
    },
  })
  .command(
    'prune <target>',
    'Remove immutable files which only exist on the target',
    (commandYargs) => {
      const options = {
        bucket: {
          descrption:
            'The name of the bucket to download from (requires read access)',
          type: 'string',
          requiresArg: true,
          nargs: 1,
          demand: true,
        },
        directory: {
          alias: 'dir',
          descrption: 'The local directory to download files to',
          type: 'string',
          requiresArg: true,
          nargs: 1,
          demand: true,
          default: 'dist',
        },
        mutableFilenames: {
          alias: 'mutables',
          description:
            '(Optional) A list of filenames whose content may change',
          type: 'array',
          requiresArg: true,
          nargs: 1,
          default: ['index.html'],
        },
        dryRun: {
          description: '(Optional) Run command without downloading any files',
          type: 'boolean',
          default: false,
        },
      };
      Object.keys(options).forEach((optionName) => {
        commandYargs.option(optionName, options[optionName]);
      });
      commandYargs.positional('target', {
        choices: ['remote', 'local'],
      });
    }
  )
  .command(
    'diff',
    "Show files which aren't shared between the bucket and local directory",
    {
      bucket: {
        descrption:
          'The name of the bucket to download from (requires read access)',
        type: 'string',
        requiresArg: true,
        nargs: 1,
        demand: true,
      },
      directory: {
        alias: 'dir',
        descrption: 'The local directory to download files to',
        type: 'string',
        requiresArg: true,
        nargs: 1,
        demand: true,
        default: 'dist',
      },
    }
  )
  .env('S3_SYNC')
  .help()
  .demandCommand(1, 'Please choose a command')
  .scriptName('s3');

const {
  bucket,
  directory,
  distributionId,
  mutableFilenames,
  compressExtensions,
  dryRun,
  target,
  _,
} = program.argv;
const [command] = _;

if (command === 'deploy') {
  deploy({
    mutableFilenames,
    compressExtensions,
    dryRun,
    s3: createS3(bucket),
    distDir: directory,
    cloudFront: distributionId && createCloudFront(distributionId),
  })
    .then(() => {
      console.log('Deploy completed successfully');
    })
    .catch((err) => {
      console.error('Deploy failed');
      throw err;
    });
} else if (command === 'pull') {
  pull({
    mutableFilenames,
    dryRun,
    s3: createS3(bucket),
    distDir: directory,
  })
    .then(() => {
      console.log('Pull completed successfully');
    })
    .catch((err) => {
      console.error('Pull failed');
      throw err;
    });
} else if (command === 'prune') {
  if (target === 'local') {
    console.log('prune local is not available yet');
  } else if (target === 'remote') {
    pruneRemote({
      mutableFilenames,
      dryRun,
      s3: createS3(bucket),
      distDir: directory,
    });
  }
}
