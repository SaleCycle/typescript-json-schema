const fs = require('fs');
const path = require('path');
const rmdir = require('rmdir');
const jsonToTypescript = require('../dist/index');

const outputDir = path.join(__dirname, './generatedInterfaces');

module.exports = () => {
  return new Promise((resolve, reject) => {
    // remove any existing interfaces so they don't confuse things
    rmdir(outputDir, (err) => {
      if (!err) {
        return resolve();
      }

      if (err.message.includes('ENOENT')) {
        return resolve();
      }

      return reject(err);
    });
  })
    .then(() => jsonToTypescript(path.join(__dirname, './testSchemas/**/*.json'), outputDir))
    .then(result => {
      console.assert(result.length === 4, 'Expected 4 interfaces to have been generated');
    });
};

