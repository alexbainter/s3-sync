'use strict';

const { SingleBar, Presets } = require('cli-progress');
const getLocalFilenames = require('../shared/get-local-filenames');
const getRemoteFilenames = require('../shared/get-remote-filenames');
const downloadFile = require('./download-file');

const getDestinationFilename = (remoteFilename, distDir) =>
  `${distDir}${distDir.endsWith('/') ? '' : '/'}${remoteFilename}`;

const pull = ({ s3, distDir, mutableFilenames = [], dryRun = false } = {}) =>
  Promise.all([getLocalFilenames(distDir), getRemoteFilenames(s3)]).then(
    ([localFilenames, remoteFilenames]) => {
      const mutableFilenameSet = new Set(mutableFilenames);
      const localFilenameSet = new Set(localFilenames);
      const downloadFilenames = remoteFilenames.filter((remoteFilename) => {
        const destinationFilename = getDestinationFilename(
          remoteFilename,
          distDir
        );
        return (
          mutableFilenameSet.has(remoteFilename) ||
          !localFilenameSet.has(destinationFilename)
        );
      });

      if (downloadFilenames.length === 0) {
        console.log('Nothing to download.');
        return Promise.resolve();
      }

      const progressBar = new SingleBar(
        {
          format: `Downloading: {bar} {percentage}% | ETA: {eta}s | {value}/{total} files`,
        },
        Presets.shades_classic
      );
      progressBar.start(downloadFilenames.length, 0);
      return Promise.all(
        downloadFilenames.map((remotePath) => {
          const destinationPath = getDestinationFilename(remotePath, distDir);
          const downloadPromise = dryRun
            ? Promise.resolve()
            : downloadFile({ s3, remotePath, destinationPath });
          return downloadPromise.then((result) => {
            progressBar.increment();
            return result;
          });
        })
      )
        .then(() => {
          console.log(`Downloaded\n${downloadFilenames.join('\n')}\n`);
        })
        .finally(() => {
          progressBar.stop();
        });
    }
  );

module.exports = pull;
