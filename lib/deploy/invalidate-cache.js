'use strict';

const invalidateCache = (cloudFront, paths = []) => {
  if (paths.length === 0) {
    console.log('No cached paths require invalidation.');
    return Promise.resolve();
  }
  return cloudFront
    .createInvalidation({
      InvalidationBatch: {
        CallerReference: Date.now().toString(),
        Paths: {
          Quantity: paths.length,
          Items: paths,
        },
      },
    })
    .promise()
    .then(() => {
      console.log(`Invalidated ${paths.length} paths:\n${paths.join('\n')}\n`);
    });
};

module.exports = invalidateCache;
