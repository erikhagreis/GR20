const googleMaps = require('@google/maps');
const moment = require('moment');
const path = require('path');
const { drop, get, map, take } = require('lodash-fp');

const config = require('../config');
const files = require('../utils/files');

const DAILY_REQUEST_LIMIT = 2500;

const load = async (fileName) => 
  files.loadJson(path.join(config.INPUT_DIR, 'elevations'), fileName);

const save = async (fileName, data) => 
  files.saveJson(path.join(config.INPUT_DIR, 'elevations'), fileName, data);

const getTodaysUsage = (today, usage) =>
  get(today, usage) || 0;

const incrementTodaysUsage = (today, usage, increment = 1) => ({
  ...usage,
  [ today ]: getTodaysUsage(today, usage) + increment
});

const isWithinFreeLimit = (today, usage) =>
  getTodaysUsage(today, usage) < DAILY_REQUEST_LIMIT;

const areRequestsPending = (requested) => requested.length > 0;

const coordsArrayToLatLng = (coordsArray) => ({
  lat: coordsArray[1],
  lng: coordsArray[0]
});

const elevationObjToCoordsArray = (elevationObj) => ([
  elevationObj.location.lng, elevationObj.location.lat, elevationObj.elevation
]);

const doQuery = async (googleMapsClient, coordsList2D) => {
  try {
    console.log(`Requesting ${coordsList2D.length} elevations.`);
    const response = await googleMapsClient.elevation({
      locations: map(coordsArrayToLatLng, coordsList2D)
    }).asPromise();
    return map(elevationObjToCoordsArray, response.json.results);
  } catch (e) {
    console.log(`doQuery failed: "${e.message}"`, e);
    return undefined;
  }
};

async function queryGoogle(coordsPerRequest = 1, maxRequests = Infinity) {
  console.log('Starting query run of Google Elevation API.');
 
  const t0 = Date.now();
  const googleMapsClient = googleMaps.createClient({
    key: process.env.GOOGLE_MAPS_API_KEY,
    Promise: Promise
  });
  const today = moment().format('YYYY-MM-DD');
  let known = await load('known.json');
  let requested = await load('requested.json');
  let apiUsage = await load('apiusage.json');
  let counter = 0;
  
  console.log(`Known elevations: ${known.length}; Pending coordinates: ${requested.length}`);

  while (isWithinFreeLimit(today, apiUsage) && areRequestsPending(requested) && counter < maxRequests) {
    const coordsList2D = take(coordsPerRequest, requested);
    const coordsList3D = await doQuery(googleMapsClient, coordsList2D);

    known = [ ...known, ...coordsList3D ];
    requested = drop(coordsList2D.length, requested);
    apiUsage = incrementTodaysUsage(today, apiUsage, 1);
    counter++;
  }

  if (!isWithinFreeLimit(today, apiUsage)) {
    console.log('Max daily free requests reached.');
  }

  return Promise.all([
    save('known.json', known),
    save('requested.json', requested),
    save('apiusage.json', apiUsage)
  ]).then(() => {
    const t1 = Date.now();
    console.log(`Done querying Google Elevation API. Requested ~${counter * coordsPerRequest} elevations in ${counter} requests in ${t1-t0}ms.`);
  }).catch((e) => {
    console.log('error', e);
  });
}

if (require.main === module) {
  (async function() {
    const argv = require('yargs').argv
    const { coordsPerRequest, maxRequests } = argv;
    await queryGoogle(coordsPerRequest, maxRequests);
  })();
}

module.exports = queryGoogle;
