'use strict';

const { expect } = require('chai');
const mockFs = require('mock-fs');
const getLocalFiles = require('./get-local-files');

describe('getLocalFiles', () => {
  beforeEach(() => {
    mockFs.restore();
  });
  it('should return files from the given directory', () => {
    const files = ['./file.txt', './nested/other-file.js'];
    mockFs(
      files.reduce((o, filename) => {
        o[filename] = '';
        return o;
      }, {})
    );
    return getLocalFiles('./').then((returnedFiles) => {
      expect(returnedFiles).to.equal(files);
      console.log(returnedFiles);
    });
  });
});
