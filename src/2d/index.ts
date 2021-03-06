import svgJs from 'svg.js';
import routeJson from '../../.generated/route.json';
import waypointsJson from '../../.generated/waypoints.json';
import { coordinateMapperFactory } from '../utils/mapCoordinates';

export const render2D = () => {
  const canvas = svgJs('gr20').size(600, 600);
  const border = canvas.rect(600, 600).fill('none').stroke({ width: 1, color: '#F06' });
  const routeDrawing = canvas.group().x(20).y(20);

  const routeFeature = routeJson.features[0];
  const mapCoordinates = coordinateMapperFactory(560, 560, routeFeature.bbox);

  const polyline = routeDrawing.polyline(
    routeFeature.geometry.coordinates.map(mapCoordinates),
  ).fill('none').stroke({ width: 1 });
  
  waypointsJson.features.forEach((waypoint:any) => {
    const position = mapCoordinates(waypoint.geometry.coordinates);
    const label = createWaypointLabel(routeDrawing, waypoint.properties.name);
    label.x(position[ 0 ]).y(position[ 1 ]);
  });
};

function createWaypointLabel(parent:svgJs.Container, labelText:string):svgJs.G {
  const waypointLabel = parent.group();
  const text = waypointLabel.text(labelText).font({
    family: 'Helvetica',
    size: 12,
    weight: 'bold',
  }).fill('#fff').stroke('none');

  const textRect = text.node.getBoundingClientRect();
  text.move(15, textRect.height / -2);

  const left = 13;
  const right = 18 + textRect.width;
  const top = -2 - textRect.height / 2;
  const bottom = 2 + textRect.height / 2;

  const shape = waypointLabel.group();
  shape.fill('#F06');
  // shape.circle(8).move(-4, -4);
  shape.polygon(`5, 0 ${left}, ${top} ${right}, ${top} ${right}, ${bottom} ${left}, ${bottom} `);
  shape.back();

  return waypointLabel;
}
