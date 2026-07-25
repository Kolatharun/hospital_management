import React, { useState } from 'react'
import { IncidentLocation } from '../api/emsTypes'
import { Navigation, MapPin, ExternalLink, Layers, Compass } from 'lucide-react'

interface MissionMapProps {
  location: IncidentLocation
  targetName?: string
  estimatedMinutes?: number
  distanceKm?: number
  className?: string
}

export const MissionMap: React.FC<MissionMapProps> = ({
  location,
  targetName = 'Incident Scene',
  estimatedMinutes = 7,
  distanceKm = 3.8,
  className = '',
}) => {
  const [mapType, setMapType] = useState<'embed' | 'schematic'>('embed')

  const googleMapsDirectionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${
    location.latitude && location.longitude
      ? `${location.latitude},${location.longitude}`
      : encodeURIComponent(`${location.address}, ${location.city}`)
  }`

  const embedMapUrl = `https://maps.google.com/maps?q=${encodeURIComponent(
    `${location.address}, ${location.city}`
  )}&t=&z=15&ie=UTF8&iwloc=&output=embed`

  return (
    <div className={`bg-surface border border-outline-variant rounded-2xl overflow-hidden shadow-sm ${className}`}>
      {/* Map Header Toolbar */}
      <div className="bg-surface-container-high px-4 py-2.5 flex items-center justify-between border-b border-outline-variant text-xs">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-500"></span>
          </span>
          <span className="font-bold text-on-surface">GPS Live Telematics</span>
          <span className="text-[11px] text-on-surface-variant font-mono">
            {location.latitude.toFixed(4)}°N, {location.longitude.toFixed(4)}°E
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setMapType(mapType === 'embed' ? 'schematic' : 'embed')}
            className="p-1 px-2 text-[11px] font-semibold text-on-surface-variant hover:text-primary bg-surface hover:bg-surface-container-highest rounded border border-outline-variant transition-colors flex items-center gap-1"
          >
            <Layers className="w-3 h-3" />
            {mapType === 'embed' ? 'Schematic' : 'Google Map'}
          </button>

          <a
            href={googleMapsDirectionsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-[11px] font-bold text-white bg-primary hover:bg-primary/90 px-2.5 py-1 rounded transition-colors shadow-xs"
          >
            <Navigation className="w-3 h-3" />
            Google Maps
            <ExternalLink className="w-2.5 h-2.5" />
          </a>
        </div>
      </div>

      {/* Map View Container */}
      <div className="relative w-full h-64 bg-slate-900 overflow-hidden">
        {mapType === 'embed' ? (
          <iframe
            title={`Google Map Navigation to ${targetName}`}
            width="100%"
            height="100%"
            style={{ border: 0 }}
            loading="lazy"
            allowFullScreen
            src={embedMapUrl}
            className="w-full h-full"
          />
        ) : (
          <div className="w-full h-full bg-slate-950 p-4 flex flex-col justify-between relative">
            <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px] opacity-40"></div>
            <div className="relative z-10 flex justify-between items-start text-slate-300 text-xs">
              <div className="bg-slate-900/90 border border-slate-800 p-2 rounded-lg">
                <p className="text-[10px] uppercase text-slate-400 font-bold tracking-wider">Destination</p>
                <p className="font-bold text-white">{targetName}</p>
                <p className="text-[11px] text-slate-300">{location.address}</p>
              </div>
              <Compass className="w-8 h-8 text-cyan-500 animate-pulse" />
            </div>

            <div className="relative z-10 flex items-center justify-center">
              <div className="flex items-center gap-3 bg-slate-900/90 border border-cyan-500/30 px-4 py-2 rounded-full text-cyan-400">
                <MapPin className="w-5 h-5 text-red-500 animate-bounce" />
                <span className="font-mono text-sm font-bold">{distanceKm} km • {estimatedMinutes} mins away</span>
              </div>
            </div>
          </div>
        )}

        {/* Floating Telemetry Pill */}
        <div className="absolute bottom-3 left-3 right-3 bg-background/95 backdrop-blur border border-outline-variant p-3 rounded-xl shadow-lg flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 min-w-0">
            <div className="p-2 bg-primary/10 rounded-lg text-primary shrink-0">
              <MapPin className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="font-bold text-on-surface truncate">{location.address}</p>
              {location.landmark && (
                <p className="text-[11px] text-on-surface-variant truncate">Near: {location.landmark}</p>
              )}
            </div>
          </div>

          <a
            href={googleMapsDirectionsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 flex items-center gap-1.5 font-bold text-xs bg-emerald-600 text-white px-3 py-2 rounded-lg shadow-sm hover:bg-emerald-700 transition-colors"
          >
            <Navigation className="w-4 h-4" />
            Navigate
          </a>
        </div>
      </div>
    </div>
  )
}
