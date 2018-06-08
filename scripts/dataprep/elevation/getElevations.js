const path = require('path');
const fs = require('fs-extra');
const { find, uniqBy } = require('lodash/fp');
const config = require('../config');

const load = (fileName) => fs.readJsonSync(path.join(config.INPUT_DIR, 'elevations', fileName), 'utf-8');

const save = (fileName, data) => {
  fs.outputJsonSync(path.join(config.INPUT_DIR, 'elevations', fileName), data, {
    encoding: 'utf-8',
    spaces: 2
  });
};

const coordsMatch = (coords2D) => (coords3D) => 
  (coords2D[0] === coords3D[0] && coords2D[1] === coords3D[1]);

const findCoords3D = (known, coords2D) => find(coordsMatch(coords2D), known);

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
    
    console.log(
      `getElevations retrieving ${coordsList2D.length} coordinates from a known list of ${known.length}. `
    + `Missing and added to requested list: ${missing.length}.`);
    return results;
  };

  const saveRequestedElevations = () => {
    requested = uniqBy(([lng, lat]) => `${lng},${lat}`, requested);
    console.log(`saveRequestedElevations saving a list of ${requested.length} coordinates to query.`);
    save('requested.json', requested);
  };

  return {
    getElevations,
    saveRequestedElevations
  };
};
  
