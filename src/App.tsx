import React, { useEffect, useRef, useState } from 'react';
import { TonyCore } from './core/TonyCore';
import { WorkshopUI } from './ui/WorkshopUI';

export default function App() {
  const [core] = useState(() => new TonyCore());
  const mapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (mapRef.current) {
      // Initialize map when component mounts
      core.initializeMap(mapRef.current);
    }
  }, []);

  return (
    <div className="min-h-screen bg-zinc-900">
      <WorkshopUI core={core} mapRef={mapRef} />
    </div>
  );
}