const path = require('path');
const { 
  compose, concat, curry, flatten, filter, find, get, includes, isArray, 
  isEqual, map, maxBy, minBy 
} = require('lodash/fp');
const initGetElevations = require('../elevation/getElevations');

const featureInNameList = curry((nameList, feature) => 
  includes(feature.properties.name, nameList)
);
  
const cleanupFeature = (feature) => ({
  ...feature,
  properties: {
    name: feature.properties.cmt || feature.properties.desc || feature.properties.name
  }
});

const simplifyMultiLineStringFeature = (feature) => ({
  ...feature,
  geometry: {
    ...feature.geometry,
    type: feature.geometry.type === 'MultiLineString' 
      ? 'LineString' 
      : feature.geometry.type,
    coordinates: feature.geometry.type === 'MultiLineString'
      ? flatten(feature.geometry.coordinates)
      : feature.geometry.coordinates
  }
});

const getLng = (coordinate) => coordinate[0];
const getLat = (coordinate) => coordinate[1];

const getBBox = (coords) => [
  minBy(getLng, coords)[0],
  minBy(getLat, coords)[1],

  maxBy(getLng, coords)[0],
  maxBy(getLat, coords)[1]
];

const addFeatureBoundingBox = (feature) => ({
  ...feature,
  bbox: feature.geometry.type === 'MultiLineString'
    ? getBBox(flatten(feature.geometry.coordinates))
    : feature.geometry.type === 'LineString'
    ? getBBox(feature.geometry.coordinates)
    : undefined
});

const addFeatureElevations = curry((getElevations, feature) => {
  const coordinates = feature.geometry.type === 'Point'
    ? getElevations([ feature.geometry.coordinates ])[0]
    : feature.geometry.type === 'LineString'
    ? getElevations(feature.geometry.coordinates)
    : feature.geometry.type === 'MultiLineString'
    ? map(getElevations, feature.geometry.coordinates)
    : feature.geometry.coordinates;
  
  return {
    ...feature,
    geometry: {
      ...feature.geometry,
      coordinates 
    }
  };
});

const normaliseGeoJson = curry(async (selectedFeatureNames, geoJson) => {
  const selectedFeatures = isArray(selectedFeatureNames)
    ? filter(featureInNameList(selectedFeatureNames), geoJson.features)
    : geoJson.features;

  const { getElevations, saveRequestedElevations } = initGetElevations();

  console.log(`geoJson: normalise; selected features: ${selectedFeatureNames}`);

  const features = selectedFeatures
    .map(
      compose(
        (feature) => {
          console.log(`Done processing feature: ${feature.properties.name} (${feature.geometry.type}).`);
          return feature;
        },
        addFeatureElevations(getElevations),
        addFeatureBoundingBox,
        simplifyMultiLineStringFeature,
        cleanupFeature
      )
    );

  saveRequestedElevations();

  return {
    type: 'FeatureCollection',
    features
  };
});

const combineFeatures = (geoJsons) => ({
  type: 'FeatureCollection',
  features: concat(...geoJsons.map((json) => json.features))
});

module.exports = {
  addFeatureBoundingBox,
  addFeatureElevations,
  combineFeatures,
  normaliseGeoJson,
};
