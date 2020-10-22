'use strict';

const { extname } = require('path');
const { SingleBar, Presets } = require('cli-progress');
const getFilenames = require('../shared/get-filenames');
const uploadFile = require('./upload-file');

const getDestinationFilename = (localFilename, distDir) =>
  localFilename.replace(distDir.endsWith('/') ? distDir : `${distDir}/`, '');

const push = ({
  s3,
  distDir,
  mutableFilenames = [],
  compressExtensions = [],
  dryRun = false,
} = {}) =>
  getFilenames({ s3, distDir }).then(({ localFilenames, remoteFilenames }) => {
    const mutableFilenameSet = new Set(mutableFilenames);
    const remoteFilenameSet = new Set(remoteFilenames);
    const uploadFilenames = localFilenames.filter((localFilename) => {
      const destinationFilename = getDestinationFilename(
        localFilename,
        distDir
      );
      return (
        mutableFilenameSet.has(destinationFilename) ||
        !remoteFilenameSet.has(destinationFilename)
      );
    });

    if (uploadFilenames.length === 0) {
      console.log('Nothing to upload.');
      return Promise.resolve([]);
    }

    const compressExtensionSet = new Set(
      compressExtensions.map((extension) =>
        extension.startsWith('.') ? extension : `.${extension}`
      )
    );

    const progressBar = new SingleBar(
      {
        format: `Uploading: {bar} {percentage}% | ETA: {eta}s | {value}/{total} files`,
      },
      Presets.shades_classic
    );
    progressBar.start(uploadFilenames.length, 0);

    return Promise.all(
      uploadFilenames.map((localPath) => {
        const destinationPath = getDestinationFilename(localPath, distDir);
        const uploadPromise = dryRun
          ? Promise.resolve({ Key: destinationPath })
          : uploadFile({
              s3,
              localPath,
              destinationPath,
              shouldCompress: compressExtensionSet.has(extname(localPath)),
              isImmutable: !mutableFilenameSet.has(destinationPath),
            });
        return uploadPromise.then((result) => {
          progressBar.increment();
          return result;
        });
      })
    )
      .then((results) => {
        const uploadedFilenames = results.map(({ Key }) => Key);
        console.log(`Uploaded\n${uploadedFilenames.join('\n')}\n`);
        return uploadedFilenames;
      })
      .finally(() => {
        progressBar.stop();
      });
  });

module.exports = push;
