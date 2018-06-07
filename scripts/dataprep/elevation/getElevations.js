const path = require('path');
const fs = require('fs-extra');
const { compose, find, isEqual, map, take, uniqBy } = require('lodash/fp');
const config = require('../config');

const load = (fileName) => fs.readJsonSync(path.join(config.INPUT_DIR, 'elevations', fileName), 'utf-8');

const save = (fileName, data) => {
  fs.outputJsonSync(path.join(config.INPUT_DIR, 'elevations', fileName), data, {
    encoding: 'utf-8',
    spaces: 2
  });
};

const findCoords3D = (known, coords2D) => find(compose(isEqual(coords2D), take(2)), known);

module.exports = function init() {
  let known = load('known.json');
  let requested = load('requested.json');

  const getElevations = (coordsList2D) => {
    let results = [];
    let missing = [];
    for (const coords2D of coordsList2D) {
      const coords3D = findCoords3D(known, coords2D);
      results = [ ...results, coords3D || coords2D ];

      if (!coords3D) {
        missing = [ ...missing, coords2D ];
      }
    }

    requested = [ ...requested, ...missing ];

    return results;
  };

  const saveRequestedElevations = () => {
    requested = uniqBy(([lng, lat]) => `${lng},${lat}`, requested);
    save('requested.json', requested);
  };

  return {
    getElevations,
    saveRequestedElevations
  };
};
  
