'use strict';

const path = require('path');
const { SingleBar, Presets } = require('cli-progress');
const getFilenames = require('../shared/get-filenames');
const uploadFile = require('./upload-file');
const getRemoteDestinationFilename = require('../shared/get-remote-destination-filename');

const push = ({
  s3,
  distDir,
  mutableFilenames = [],
  compressExtensions = [],
  dryRun = false,
  aliasHtmlPages = true,
  mutableHtml = true,
} = {}) =>
  getFilenames({ s3, distDir }).then(({ localFilenames, remoteFilenames }) => {
    const mutableFilenameSet = new Set(mutableFilenames);
    const remoteFilenameSet = new Set(remoteFilenames);
    const htmlAliasSet = new Set(
      aliasHtmlPages
        ? localFilenames
            .filter(
              (localFilename) =>
                localFilename.endsWith('.html') &&
                !localFilename.endsWith('index.html')
            )
            .map((localFilename) => localFilename.replace('.html', ''))
        : []
    );
    const uploadFilenames = localFilenames
      .concat(Array.from(htmlAliasSet))
      .filter((localFilename) => {
        const destinationFilename = getRemoteDestinationFilename(
          localFilename,
          distDir
        );
        return (
          mutableFilenameSet.has(destinationFilename) ||
          !remoteFilenameSet.has(destinationFilename) ||
          (mutableHtml && destinationFilename.endsWith('.html')) ||
          (mutableHtml && htmlAliasSet.has(localFilename))
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
        const isAliasedHtmlFile = htmlAliasSet.has(localPath);
        const destinationPath = getRemoteDestinationFilename(
          localPath,
          distDir
        );
        const uploadFileParams = {
          s3,
          destinationPath,
          localPath: isAliasedHtmlFile ? `${localPath}.html` : localPath,
          shouldCompress: compressExtensionSet.has(path.extname(localPath)),
          isImmutable: !mutableFilenameSet.has(destinationPath),
        };
        if (isAliasedHtmlFile) {
          uploadFileParams.contentType = 'text/html';
        }
        const uploadPromise = dryRun
          ? Promise.resolve({ Key: destinationPath })
          : uploadFile(uploadFileParams);
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
