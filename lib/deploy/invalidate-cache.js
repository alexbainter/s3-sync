'use strict';

const invalidateCache = (cloudFront, paths = []) => {
  if (paths.length === 0) {
    console.log('No cached paths require invalidation.');
    return Promise.resolve();
  }
  const invalidatePaths = paths.concat('/');
  return cloudFront
    .createInvalidation({
      InvalidationBatch: {
        CallerReference: Date.now().toString(),
        Paths: {
          Quantity: invalidatePaths.length,
          Items: invalidatePaths,
        },
      },
    })
    .promise()
    .then(() => {
      console.log(
        `Invalidated ${invalidatePaths.length} paths:\n${invalidatePaths.join(
          '\n'
        )}\n`
      );
    });
};

module.exports = invalidateCache;
