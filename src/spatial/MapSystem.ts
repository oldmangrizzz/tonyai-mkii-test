import mapboxgl from '@mapbox/mapbox-gl-js';
import { EventEmitter } from 'events';
import { Vector3 } from 'three';

interface MapLocation {
  coordinates: [number, number];
  name: string;
  type: 'waypoint' | 'destination' | 'route';
}

interface RouteOptions {
  profile: 'driving' | 'walking' | 'cycling';
  alternatives?: boolean;
  waypoints?: [number, number][];
}

export class MapSystem extends EventEmitter {
  private map: mapboxgl.Map | null = null;
  private markers: Map<string, mapboxgl.Marker> = new Map();
  private routes: Map<string, mapboxgl.GeoJSONSource> = new Map();
  
  constructor() {
    super();
    mapboxgl.accessToken = process.env.MAPBOX_ACCESS_TOKEN!;
  }

  async initialize(container: HTMLElement) {
    this.map = new mapboxgl.Map({
      container,
      style: 'mapbox://styles/mapbox/dark-v11',
      center: [-74.5, 40],
      zoom: 9
    });

    this.map.on('load', () => this.emit('ready'));
  }

  async getDirections(
    start: [number, number],
    end: [number, number],
    options: RouteOptions
  ) {
    const waypoints = options.waypoints 
      ? `&waypoints=${options.waypoints.map(w => w.join(',')).join(';')}`
      : '';

    const response = await fetch(
      `https://api.mapbox.com/directions/v5/mapbox/${options.profile}/` +
      `${start.join(',')};${end.join(',')}` +
      `?alternatives=${options.alternatives}` +
      `&geometries=geojson` +
      `&access_token=${mapboxgl.accessToken}` +
      waypoints
    );

    const data = await response.json();
    return this.processRoutes(data.routes);
  }

  private processRoutes(routes: any[]) {
    return routes.map(route => ({
      distance: route.distance,
      duration: route.duration,
      geometry: route.geometry,
      steps: route.legs[0].steps.map((step: any) => ({
        instruction: step.maneuver.instruction,
        distance: step.distance,
        duration: step.duration
      }))
    }));
  }

  async addLocation(location: MapLocation) {
    if (!this.map) return;

    const marker = new mapboxgl.Marker()
      .setLngLat(location.coordinates)
      .addTo(this.map);

    this.markers.set(location.name, marker);
  }

  async visualizeRoute(routeId: string, geometry: any) {
    if (!this.map) return;

    if (!this.map.getSource(routeId)) {
      this.map.addSource(routeId, {
        type: 'geojson',
        data: {
          type: 'Feature',
          properties: {},
          geometry
        }
      });

      this.map.addLayer({
        id: `${routeId}-layer`,
        type: 'line',
        source: routeId,
        layout: {
          'line-join': 'round',
          'line-cap': 'round'
        },
        paint: {
          'line-color': '#3898ff',
          'line-width': 8,
          'line-opacity': 0.8
        }
      });
    }
  }

  // Advanced features for TonyAI's spatial awareness
  async analyzeArea(center: [number, number], radius: number) {
    const response = await fetch(
      `https://api.mapbox.com/v4/mapbox.mapbox-terrain-v2/tilequery/` +
      `${center.join(',')}.json?radius=${radius}&limit=50&access_token=${mapboxgl.accessToken}`
    );

    return response.json();
  }

  convertToVector3(coordinates: [number, number]): Vector3 {
    // Convert geo coordinates to 3D space for integration with other systems
    const projection = this.map?.project(coordinates);
    return new Vector3(
      projection?.x || 0,
      projection?.y || 0,
      0
    );
  }
}