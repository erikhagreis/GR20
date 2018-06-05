#!/usr/bin/env node

const path = require('path');
const _ = require('lodash');
const { normaliseGeoJson, combineFeatures, saveRequestedElevations } = require('./utils/geojson');
const files = require('./utils/files');
const config = require('./config');

const waypointNames = [
  'Calenzana',
  'Piobbu',
  'Carrozzu',
  'Asco Stagnu',
  'Tighjettu',
  'Ballone',
  'Verghio',
  'Manganu',
  'PetraPiana',
  'Onda',
  'Vizzavona'
];

function getWaypoints(names) {
  return files.loadJson(
      path.join(config.INPUT_DIR, 'gr20-all-waypoints'), 
      'waypoints.geojson'
    )
    .then(normaliseGeoJson(waypointNames))
    .then(files.saveJson(config.OUTPUT_DIR, 'waypoints.json'))
}

function getRoute() {
  return files.loadJson(
      path.join(config.INPUT_DIR, 'gr20-nord'), 
      'tracks.geojson'
    )
    .then(normaliseGeoJson(['GR20 Nord']))
    .then(files.saveJson(config.OUTPUT_DIR, 'route.json'));
}

Promise.all([
  getWaypoints(waypointNames),
  getRoute()
])
  .then(combineFeatures)
  .then(files.saveJson(config.OUTPUT_DIR, 'combined.json'))
  .then(() => {
    console.log('Done prepping GPS data.')
  })
  .catch(error => {
      console.error(`ERROR :( ${error.message}`, error.stack);
  });
