const googleMaps = require('@google/maps');
const moment = require('moment');
const path = require('path');
const { drop, get, map, take } = require('lodash-fp');

const config = require('../config');
const files = require('../utils/files');

const DAILY_REQUEST_LIMIT = 2500;

const loadData = async () => 
  files.loadJson(path.join(config.INPUT_DIR, 'elevations'), 'elevations.json');

const saveData = async (data) => 
  files.saveJson(path.join(config.INPUT_DIR, 'elevations'), 'elevations.json', data);

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
    const response = await googleMapsClient.elevation({
      locations: map(coordsArrayToLatLng, coordsList2D)
    }).asPromise();
    console.log('response', map(elevationObjToCoordsArray, response.json.results));
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
  let data = await loadData();
  let counter = 0;
  
  console.log(`Known elevations: ${data.known.length}; Pending elevation queries: ${data.requested.length}`);

  while (isWithinFreeLimit(today, data.apiUsage) && areRequestsPending(data.requested) && counter < maxRequests) {
    const coordsList2D = take(coordsPerRequest, data.requested);
    const coordsList3D = await doQuery(googleMapsClient, coordsList2D);

    data = {
      ...data,
      known: [ ...data.known, ...coordsList3D ],
      requested: drop(coordsList2D.length, data.requested),
      apiUsage: incrementTodaysUsage(today, data.apiUsage, coordsPerRequest)
    };
    counter++;
  }

  if (!isWithinFreeLimit(today, data.apiUsage)) {
    console.log('Max daily free requests reached.');
  }

  return await saveData(data).then(() => {
    const t1 = Date.now();
    console.log(`Done querying Google Elevation API. Requested ${counter} elevations in ${t1-t0}ms.`);
  });
};

if (require.main === module) {
  (async function() {
    const argv = require('yargs').argv
    const { coordsPerRequest, maxRequests } = argv;
    await queryGoogle(coordsPerRequest, maxRequests);
  })();
}

module.exports = queryGoogle;
