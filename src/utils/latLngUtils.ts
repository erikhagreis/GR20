import { mapValues, maxBy, minBy } from 'lodash';

export interface IPixel {
  x: number,
  y: number
};

export interface ISize {
  width: number,
  height: number
};

export interface ILatLng {
  lat: number,
  lng: number
};

export interface ILatLngBounds {
  northWest: ILatLng,
  southEast: ILatLng
}

export function createLatLngMapper(pixelBounds:ISize, latLngBounds:ILatLngBounds):Function {
  const latLngSize = getLatLngBoundsSize(latLngBounds);
  const ratioLatToY = pixelBounds.height / latLngSize.lat;
  const ratioLngToX = pixelBounds.width / latLngSize.lng;
  const ratio = Math.min(ratioLngToX, ratioLatToY);
  const pixelCenter = {
    x: pixelBounds.width / 2,
    y: pixelBounds.height / 2
  };
  const latLngCenter = {
    lat: latLngBounds.northWest.lat - latLngSize.lat / 2,
    lng: latLngBounds.northWest.lng + latLngSize.lng / 2
  };

  return function mapLatLng(latLng:ILatLng):IPixel {
    return {
      x: pixelCenter.x + (latLng.lng - latLngCenter.lng) * ratio,
      y: pixelCenter.y - (latLng.lat - latLngCenter.lat) * ratio,
    }
  }
}

export function latLngToPixel (mapper:Function, latLng:ILatLng):IPixel {
  return mapper(latLng);
}

export function getLatLngBounds(coordinates:Array<ILatLng>):ILatLngBounds {
  return {
    northWest: {
      lat: maxBy(coordinates, 'lat')!.lat,
      lng: minBy(coordinates, 'lng')!.lng
    },
    southEast: {
      lat: minBy(coordinates, 'lat')!.lat,
      lng: maxBy(coordinates, 'lng')!.lng
    }
  }
}

export function growLatLngBounds(bounds:ILatLngBounds, fraction:number):ILatLngBounds {
  const size = getLatLngBoundsSize(bounds);
  const halfFraction = fraction / 2;
  
  return {
    northWest: {
      lat: bounds.northWest.lat + halfFraction * size.lat,
      lng: bounds.northWest.lng - halfFraction * size.lng
    }, 
    southEast: {
      lat: bounds.southEast.lat - halfFraction * size.lat,
      lng: bounds.southEast.lng + halfFraction * size.lng
    }
  };
}

export function getLatLngBoundsSize(bounds:ILatLngBounds):ILatLng {
  return {
    lat: bounds.northWest.lat - bounds.southEast.lat,
    lng: bounds.southEast.lng - bounds.northWest.lng
  }
}
