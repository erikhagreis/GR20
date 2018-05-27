const path = require('path');
const fs = require('fs-extra');
const { curry } = require('lodash/fp');

module.exports = {
  loadJson: curry(async (directory, fileName) => {
    const fullPath = path.join(directory, fileName);
    return fs.readJson(fullPath, 'utf-8')
      .catch((error) => {
        console.error(`Cannot load JSON: ${error.message}`);
      });
  }),

  saveJson: curry(async (directory, fileName, data) => {
    const fullPath = path.join(directory, fileName);
    await fs.outputJson(fullPath, data, {
      encoding: 'utf-8',
      spaces: 2
    });
    return data;
  })
};
