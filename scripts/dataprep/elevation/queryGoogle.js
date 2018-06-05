const googleMaps = require('@google/maps');
const moment = require('moment');
const path = require('path');
const { drop, get, head } = require('lodash-fp');

const config = require('../config');
const files = require('../utils/files');

const DAILY_REQUEST_LIMIT = 2500;

const loadData = async () => 
  files.loadJson(path.join(config.INPUT_DIR, 'elevations'), 'elevations.json');

const saveData = async (data) => 
  files.saveJson(path.join(config.INPUT_DIR, 'elevations'), 'elevations.json', data);

const getTodaysUsage = (today, usage) =>
  get(today, usage) || 0;

const incrementTodaysUsage = (today, usage) => ({
  ...usage,
  [ today ]: getTodaysUsage(today, usage) + 1
});

const isWithinFreeLimit = (today, usage) =>
  getTodaysUsage(today, usage) < DAILY_REQUEST_LIMIT;

const areRequestsPending = (requested) => requested.length > 0;

const doQuery = async (googleMapsClient, coords2D) => {
  try {
    const response = await googleMapsClient.elevation({
      locations: [ {
        lat: coords2D[1],
        lng: coords2D[0]
      } ] 
    }).asPromise();
    return [ ...coords2D, response.json.results[0].elevation ];
  } catch (e) {
    console.log(`doQuery failed: "${e.message}"`, e);
    return undefined;
  }
};

async function queryGoogle() {
  console.log('Starting query run of Google Elevation API.');
 
  const t0 = Date.now();
  const googleMapsClient = googleMaps.createClient({
    key: process.env.GOOGLE_MAPS_API_KEY,
    Promise: Promise
  });
  const today = moment().format('YYYY-MM-DD');
  let data, requestsDone;
  let counter = 0;
  
  data = await loadData();
  console.log(`Known elevations: ${data.known.length}; Pending elevation queries: ${data.requested.length}`);

  while (isWithinFreeLimit(today, data.apiUsage) && areRequestsPending(data.requested)) {
    const coords2D = head(data.requested);
    const coords3D = await doQuery(googleMapsClient, coords2D);

    data = {
      ...data,
      known: [ ...data.known, coords3D ],
      requested: drop(1, data.requested),
      apiUsage: incrementTodaysUsage(today, data.apiUsage)
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
    await queryGoogle();
  })();
}

module.exports = queryGoogle;
