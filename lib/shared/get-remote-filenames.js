'use strict';

const getRemoteFilenames = (s3, continuationToken) =>
  s3
    .listObjectsV2({ ContinuationToken: continuationToken })
    .promise()
    .then(
      ({
        Contents: contents,
        IsTruncated: isTruncated,
        NextContinuationToken: nextContinuationToken,
      }) => {
        const fileNames = contents.map(({ Key: filename }) => filename);
        if (!isTruncated || !nextContinuationToken) {
          return fileNames;
        }
        return getRemoteFilenames(
          s3,
          nextContinuationToken
        ).then((nextFileNames) => fileNames.concat(nextFileNames));
      }
    );

module.exports = getRemoteFilenames;
