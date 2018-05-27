const path = require('path');
const fs = require('fs-extra');
const { compose, find, isEqual, map, take, uniqWith } = require('lodash/fp');
const config = require('../config');

const loadData = () => fs.readJsonSync(path.join(config.INPUT_DIR, 'elevations', 'elevations.json'), 'utf-8');

const saveData = (data) => {
  fs.outputJsonSync(path.join(config.INPUT_DIR, 'elevations', 'elevations.json'), data, {
    encoding: 'utf-8',
    spaces: 2
  });
};

const findCoords3D = (known, coords2D) => find(compose(isEqual(coords2D), take(2)), known);

module.exports = function getElevations(coordsList2D) {
  const data = loadData();

  let results = [];
  let missing = [];
  for (const coords2D of coordsList2D) {
    const coords3D = findCoords3D(data.known, coords2D);
    results = [ ...results, coords3D || coords2D ];

    if (!coords3D) {
      missing = [ ...missing, coords2D ];
    }
  }

  saveData({
    ...data,
    requested: uniqWith(isEqual, [ ...data.requested, ...missing ])
  });

  return results;
};
  
