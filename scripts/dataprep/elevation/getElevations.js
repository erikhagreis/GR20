const path = require('path');
const fs = require('fs-extra');
const { compose, find, isEqual, map, take, uniqBy } = require('lodash/fp');
const config = require('../config');

const loadData = () => fs.readJsonSync(path.join(config.INPUT_DIR, 'elevations', 'elevations.json'), 'utf-8');

const saveData = (data) => {
  fs.outputJsonSync(path.join(config.INPUT_DIR, 'elevations', 'elevations.json'), data, {
    encoding: 'utf-8',
    spaces: 2
  });
};

const findCoords3D = (known, coords2D) => find(compose(isEqual(coords2D), take(2)), known);

module.exports = function init() {
  let data = loadData();

  const getElevations = (coordsList2D) => {
    let { known, requested } = data;
    let results = [];
    let missing = [];
    for (const coords2D of coordsList2D) {
      const coords3D = findCoords3D(known, coords2D);
      results = [ ...results, coords3D || coords2D ];

      if (!coords3D) {
        missing = [ ...missing, coords2D ];
      }
    }

    data = {
      ...data,
      requested: [ ...requested, ...missing ]
    };

    return results;
  };

  const saveRequestedElevations = () => {
    const t0 = Date.now();
    console.log('save, before uniqBy', data.requested.length);
    data = {
      ...data,
      requested: uniqBy(([lng, lat]) => `${lng},${lat}`, data.requested)
    }
    console.log('save, after uniqBy', Date.now() - t0, 'ms');
    saveData(data);
  };

  return {
    getElevations,
    saveRequestedElevations
  };
};
  
