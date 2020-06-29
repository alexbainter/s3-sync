'use strict';

const { expect } = require('chai');
const sinon = require('sinon');
const invalidateCache = require('./invalidate-cache');

const createMockCloudFront = () => ({
  createInvalidation: sinon.fake.returns({ promise: () => Promise.resolve() }),
});

describe('invalidateCache', () => {
  it("should just return if there's nothing to invalidate", () => {
    const mockCloudFront = createMockCloudFront();
    return invalidateCache({ cloudFront: mockCloudFront }).then(() => {
      expect(mockCloudFront.createInvalidation.notCalled).to.be.true;
    });
  });
  it('should invalidate the given paths prefixed with "/" and the root path ("/")', () => {
    const mockCloudFront = createMockCloudFront();
    const paths = ['index.html'];
    return invalidateCache({ cloudFront: mockCloudFront, paths }).then(() => {
      expect(mockCloudFront.createInvalidation.calledOnce).to.be.true;
      const invalidationBatch = mockCloudFront.createInvalidation.getCall(0)
        .firstArg.InvalidationBatch;
      expect(invalidationBatch)
        .to.have.property('CallerReference')
        .which.is.a('string');
      expect(invalidationBatch)
        .to.have.property('Paths')
        .that.eql({
          Quantity: paths.length + 1,
          Items: paths.map((path) => `/${path}`).concat(['/']),
        });
    });
  });
});
