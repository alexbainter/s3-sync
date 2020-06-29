'use strict';

const invalidateCache = ({ cloudFront, paths = [], dryRun = false } = {}) => {
  if (paths.length === 0) {
    console.log('No cached paths require invalidation.');
    return Promise.resolve();
  }
  const invalidatePaths = paths.map((path) => `/${path}`).concat(['/']);
  const invalidationPromise = dryRun
    ? Promise.resolve()
    : cloudFront
        .createInvalidation({
          InvalidationBatch: {
            CallerReference: Date.now().toString(),
            Paths: {
              Quantity: invalidatePaths.length,
              Items: invalidatePaths,
            },
          },
        })
        .promise();
  return invalidationPromise.then(() => {
    console.log(
      `Invalidated ${invalidatePaths.length} paths:\n${invalidatePaths.join(
        '\n'
      )}\n`
    );
  });
};

module.exports = invalidateCache;
