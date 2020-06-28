'use strict';

const { extname } = require('path');
const { SingleBar, Presets } = require('cli-progress');
const getLocalFilenames = require('../shared/get-local-filenames');
const getRemoteFilenames = require('../shared/get-remote-filenames');
const uploadFile = require('./upload-file');

const getDestinationFilename = (localFilename, distDir) =>
  localFilename.replace(distDir.endsWith('/') ? distDir : `${distDir}/`, '');

const push = ({
  s3,
  distDir,
  mutableFilenames = [],
  compressExtensions = [],
} = {}) =>
  Promise.all([getLocalFilenames(distDir), getRemoteFilenames(s3)]).then(
    ([localFilenames, remoteFilenames]) => {
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
        uploadFilenames
          .map((localFilename) => {
            const destinationPath = getDestinationFilename(localFilename);
            return uploadFile({
              s3,
              localFilename,
              destinationPath,
              shouldCompress: compressExtensionSet.has(extname(localFilename)),
              isImmutable: !mutableFilenames(destinationPath),
            }).then((result) => {
              progressBar.increment();
              return result;
            });
          })
          .then((results) => {
            progressBar.stop();
            return results.map(({ Key }) => Key);
          })
      );
    }
  );

module.exports = push;
