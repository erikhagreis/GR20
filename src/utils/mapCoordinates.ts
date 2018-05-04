import { Feature, GeometryObject } from 'geojson';
import { curry, mapValues, max, min } from 'lodash';


export function createCoordinatesMapper(
  canvasWidth:number, canvasHeight:number, bounds:[ number, number, number, number ]):Function {
  const lngSize = bounds[ 2 ] - bounds[ 0 ];
  const latSize = bounds[ 3 ] - bounds[ 1 ];
  const lngCenter = bounds[ 0 ] + lngSize / 2;
  const latCenter = bounds[ 1 ] + latSize / 2;

  const ratioLngToX = canvasWidth / latSize;
  const ratioLatToY = canvasHeight / latSize;
  const ratioDegreesToPixels = Math.min(ratioLngToX, ratioLatToY);

  const canvasCenterX = canvasWidth / 2;
  const canvasCenterY = canvasHeight / 2;

  return curry(mapCoordinates)(
    canvasCenterX, canvasCenterY, lngCenter, latCenter, ratioDegreesToPixels);
}

export function mapCoordinates(
  canvasCenterX:number, canvasCenterY:number, 
  lngCenter:number, latCenter:number, 
  ratioDegreesToPixels:number, 
  coordinates:[ number, number ]):[ number, number ] {

  return [
    canvasCenterX + (coordinates[ 0 ] - lngCenter) * ratioDegreesToPixels,
    canvasCenterY - (coordinates[ 1 ] - latCenter) * ratioDegreesToPixels,
  ];
}
