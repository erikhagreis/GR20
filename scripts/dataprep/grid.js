const path = require('path');
const { curry, get } = require('lodash/fp');
const files = require('./utils/files');
const config = require('./config');
const { addFeatureBoundingBox, addFeatureElevations, getFeatureByName } = require('./utils/geojson');
const initGetElevations = require('./elevation/getElevations');
const { getElevations, saveRequestedElevations } = initGetElevations();

const METERS_PER_DEGREE = 111111; // close enough: https://knowledge.safe.com/articles/725/calculating-accurate-length-in-meters-for-lat-long.html

// .283213 / (100/111111) = 314.68079643
// .38755442 / (100/111111) = 430.615591606
// 135020


const loadJson = files.loadJson(config.OUTPUT_DIR);

const saveJson = files.saveJson(config.OUTPUT_DIR);

const getRouteFeature = getFeatureByName('GR20 Nord');

const getBBox = get('bbox');

const expandBBox = curry((factor, [ lngMin, latMin, lngMax, latMax ]) => ([
  lngMin - (lngMax - lngMin) * factor / 2,
  latMin - (latMax - latMin) * factor / 2,
  lngMax + (lngMax - lngMin) * factor / 2,
  latMax + (latMax - latMin) * factor / 2
]));

const metersToDegrees = (meters) => meters / METERS_PER_DEGREE;

const createGrid = curry((degreeStep, [ lngMin, latMin, lngMax, latMax ]) => { 
  let rows = [];
  let lat = latMax;
  while (lat > latMin) {
    let lng = lngMin;
    let row = [];
    while (lng < lngMax) {
      row = [ ...row, [ lng, lat ] ];
      lng += degreeStep;
    }
    rows = [ ...rows, row ];
    lat -= degreeStep;
  }
  return rows;
});

const toFeature = curry((name, type, coordinates) => ({
  properties: {
    name
  },
  geometry: {
    type,
    coordinates
  }
}));

const log = curry((description, obj) => {
  console.log(description, obj);
  return obj;
});

loadJson('route.json')
  .then(getRouteFeature)
  .then(getBBox)
  .then(expandBBox(0.1))
  .then(createGrid(metersToDegrees(100)))
  .then(toFeature('Terrain Grid', 'MultiLineString'))
  .then(addFeatureBoundingBox)
  .then(addFeatureElevations(getElevations))
  .then((feature) => ({
    type: 'FeatureCollection',
    features: [ feature ]
  }))
  .then(saveJson('grid.json'))
  .then(() => {
    saveRequestedElevations();    
  });

  
