'use strict';

const pipe = (...fns) => (x) => fns.reduce((y, fn) => fn(y), x);

module.exports = pipe;
