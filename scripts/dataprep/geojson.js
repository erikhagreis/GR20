const path = require('path');
const fs = require('fs-extra');
const R = require('ramda');
const _ = require('lodash');

const BASE_PATH = path.join(__dirname, '../../gpsdata-raw/');

function loadGeoJson(file) {
  return fs.readJson(path.join(BASE_PATH, file), 'utf-8')
}

function cleanupGeoJson(selectedFeatureNames, geoJson) {
    const selectedFeatures = _.isArray(selectedFeatureNames)
      ? selectedFeatureNames.map(
          (featureName) => geoJson.features.find((feature) => feature.properties.name === featureName)
        )
      : geoJson.features;

  return {
    type: 'FeatureCollection',
    features: selectedFeatures.map(cleanupFeature)
  };
};

function cleanupFeature(feature) {
  return {
    ...feature,
    properties: {
      name: feature.properties.cmt || feature.properties.desc || feature.properties.name
    },
    bbox: getFeatureBBox(feature)
  };
}

function getFeatureBBox(feature) {
  return feature.geometry.type === 'MultiLineString'
    ? [
        _.minBy(_.flatten(feature.geometry.coordinates), (coordinate) => coordinate[0])[0],
        _.minBy(_.flatten(feature.geometry.coordinates), (coordinate) => coordinate[1])[1],

        _.maxBy(_.flatten(feature.geometry.coordinates), (coordinate) => coordinate[0])[0],
        _.maxBy(_.flatten(feature.geometry.coordinates), (coordinate) => coordinate[1])[1]
      ]
    : undefined;
}

function combineFeatures(geoJsons) {
  return {
    type: 'FeatureCollection',
    features: _.concat(...geoJsons.map((json) => json.features))
  };
}

function saveData(fileName, data) {
  return Promise
    .resolve(data)
    .then((data) => {
      return fs.writeFile(
        path.join(__dirname, '../../.generated', fileName), JSON.stringify(data, true, 2)
      ).then(() => data);
    });
}

module.exports = {
  loadGeoJson: _.curry(loadGeoJson),
  cleanupGeoJson: _.curry(cleanupGeoJson),
  cleanupFeature: _.curry(cleanupFeature),
  combineFeatures,
  saveData: _.curry(saveData),
};
