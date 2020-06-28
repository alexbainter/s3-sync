'use strict';

const { expect } = require('chai');
const mockFs = require('mock-fs');
const getLocalFilenames = require('./get-local-filenames');

describe('getLocalFilenames', () => {
  beforeEach(mockFs.restore);
  after(mockFs.restore);
  it('should return files from the given directory', () => {
    const relativeFiles = ['./file.js', './nested/other-file.css'];
    const absoluteFiles = [
      '/absolute/file.txt',
      '/absolute/ly/other-file.boop',
    ];
    mockFs(
      relativeFiles.concat(absoluteFiles).reduce((o, filename) => {
        o[filename] = '';
        return o;
      }, {})
    );

    return Promise.all(['./', '/absolute'].map(getLocalFilenames)).then(
      ([relativeResults, absoluteResults]) => {
        expect(relativeResults).to.eql(relativeFiles);
        expect(absoluteResults).to.eql(absoluteFiles);
      }
    );
  });
  it('should ignore directories', () => {
    mockFs({ './dir/file.js': '' });
    return getLocalFilenames('./').then((returnedFiles) => {
      expect(returnedFiles).to.not.contain('./dir');
    });
  });
});
