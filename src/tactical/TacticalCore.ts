import { EventEmitter } from 'events';
import { Vector3 } from 'three';
import { MapSystem } from '../spatial/MapSystem';

interface TacticalElement {
  id: string;
  type: 'unit' | 'asset' | 'incident' | 'marker';
  position: [number, number];
  metadata: {
    callsign?: string;
    status?: 'active' | 'standby' | 'emergency';
    notes?: string;
    timestamp: number;
  };
}

interface TacticalLayer {
  id: string;
  name: string;
  elements: Map<string, TacticalElement>;
  visible: boolean;
}

export class TacticalCore extends EventEmitter {
  private mapSystem: MapSystem;
  private layers: Map<string, TacticalLayer>;
  private activeLayer: string | null;
  private osintFeeds: Map<string, any>;
  
  constructor(mapSystem: MapSystem) {
    super();
    this.mapSystem = mapSystem;
    this.layers = new Map();
    this.activeLayer = null;
    this.osintFeeds = new Map();
    this.initializeTacticalSystems();
  }

  private async initializeTacticalSystems() {
    // Create default tactical layers
    await this.createLayer('operations', 'Operations');
    await this.createLayer('intel', 'Intelligence');
    await this.createLayer('assets', 'Assets');
    
    // Initialize OSINT data streams
    this.initializeOSINTFeeds();
  }

  private async initializeOSINTFeeds() {
    // Setup data feeds for real-time situational awareness
    const feeds = [
      { id: 'weather', url: 'https://api.weather.gov/points/' },
      { id: 'traffic', url: 'https://api.mapbox.com/traffic/v1/' },
      { id: 'alerts', url: 'https://api.weather.gov/alerts/active' }
    ];

    feeds.forEach(feed => {
      this.osintFeeds.set(feed.id, {
        url: feed.url,
        lastUpdate: null,
        data: null
      });
    });
  }

  async createLayer(id: string, name: string): Promise<TacticalLayer> {
    const layer: TacticalLayer = {
      id,
      name,
      elements: new Map(),
      visible: true
    };
    
    this.layers.set(id, layer);
    this.emit('layer:created', { id, name });
    return layer;
  }

  async addTacticalElement(
    layerId: string,
    element: Omit<TacticalElement, 'id'>
  ): Promise<string> {
    const layer = this.layers.get(layerId);
    if (!layer) throw new Error(`Layer ${layerId} not found`);

    const id = `tac-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const fullElement: TacticalElement = {
      ...element,
      id,
      metadata: {
        ...element.metadata,
        timestamp: Date.now()
      }
    };

    layer.elements.set(id, fullElement);
    
    // Add to map visualization
    await this.mapSystem.addLocation({
      coordinates: fullElement.position,
      name: id,
      type: 'waypoint'
    });

    this.emit('element:added', { layerId, element: fullElement });
    return id;
  }

  async updateSituationalAwareness(center: [number, number], radius: number) {
    // Update OSINT feeds
    const updates = await Promise.all([
      this.updateWeatherData(center),
      this.updateTrafficData(center, radius),
      this.updateAlertData(center)
    ]);

    // Process and correlate data
    const situationalUpdate = this.correlateTacticalData(updates);
    this.emit('situation:updated', situationalUpdate);
    
    return situationalUpdate;
  }

  private async updateWeatherData(center: [number, number]) {
    const feed = this.osintFeeds.get('weather');
    const response = await fetch(`${feed.url}${center.join(',')}`);
    const data = await response.json();
    
    feed.lastUpdate = Date.now();
    feed.data = data;
    
    return data;
  }

  private async updateTrafficData(center: [number, number], radius: number) {
    const feed = this.osintFeeds.get('traffic');
    const bbox = this.calculateBoundingBox(center, radius);
    
    const response = await fetch(
      `${feed.url}${bbox.join(',')}/traffic?access_token=${process.env.MAPBOX_ACCESS_TOKEN}`
    );
    
    const data = await response.json();
    feed.lastUpdate = Date.now();
    feed.data = data;
    
    return data;
  }

  private async updateAlertData(center: [number, number]) {
    const feed = this.osintFeeds.get('alerts');
    const response = await fetch(feed.url);
    const data = await response.json();
    
    feed.lastUpdate = Date.now();
    feed.data = data;
    
    return data;
  }

  private calculateBoundingBox(
    center: [number, number],
    radiusKm: number
  ): [number, number, number, number] {
    const lat = center[0];
    const lon = center[1];
    const latRadius = radiusKm / 111.32; // degrees latitude per km
    const lonRadius = radiusKm / (111.32 * Math.cos(lat * Math.PI / 180));
    
    return [
      lon - lonRadius,
      lat - latRadius,
      lon + lonRadius,
      lat + latRadius
    ];
  }

  private correlateTacticalData(updates: any[]) {
    // Combine and analyze all data sources
    const [weather, traffic, alerts] = updates;
    
    return {
      timestamp: Date.now(),
      weather: {
        conditions: weather.properties?.forecast || {},
        alerts: alerts.features || []
      },
      traffic: {
        incidents: traffic.incidents || [],
        congestion: traffic.congestion || {}
      },
      tacticalElements: Array.from(this.layers.values())
        .flatMap(layer => Array.from(layer.elements.values()))
    };
  }
}</content>