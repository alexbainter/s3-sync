'use strict';

const { SingleBar, Presets } = require('cli-progress');
const getFilenames = require('../shared/get-filenames');
const getLocalDestinationFilename = require('../shared/get-local-destination-filename');
const downloadFile = require('./download-file');

const pull = ({ s3, distDir, mutableFilenames = [], dryRun = false } = {}) =>
  getFilenames({ s3, distDir }).then(({ localFilenames, remoteFilenames }) => {
    const mutableFilenameSet = new Set(mutableFilenames);
    const localFilenameSet = new Set(localFilenames);
    const downloadFilenames = remoteFilenames.filter((remoteFilename) => {
      const destinationFilename = getLocalDestinationFilename(
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
        const destinationPath = getLocalDestinationFilename(
          remotePath,
          distDir
        );
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
  });

module.exports = pull;
