#!/usr/bin/env node

const path = require('path');
const fs = require('fs-extra');
const _ = require('lodash');
const { cleanupGeoJson, combineFeatures, loadGeoJson, saveData } = require('./geojson');

const waypointNames = [
  'Calenzana',
  'Piobbu',
  'Carrozzu',
  'Asco Stagnu',
  'Ballone',
  'Verghio',
  'Manganu',
  'PetraPiana',
  'Onda',
  'Vizzavona'
];

function getWaypoints(names) {
  return loadGeoJson('gr20-all-waypoints/waypoints.geojson')
    .then(cleanupGeoJson(waypointNames))
    .then(saveData('waypoints.json'))
}

function getRoute() {
  return loadGeoJson('gr20-nord/tracks.geojson')
    .then(cleanupGeoJson(['GR20 Nord']))
    .then(saveData('route.json'));
}

Promise.all([
  getWaypoints(waypointNames),
  getRoute()
])
  .then(combineFeatures)
  .then(saveData('combined.json'))
  .then(() => {
    console.log('Done prepping GPS data.')
  })
  .catch(error => {
      console.error(`error ${error.message}`, error);
  });

