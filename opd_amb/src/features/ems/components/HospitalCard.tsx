import React, { useState } from 'react'
import { Hospital } from '../api/emsTypes'
import { MapPin, Navigation, Phone, ExternalLink, Bed, Activity, ShieldCheck, ChevronDown, ChevronUp } from 'lucide-react'

interface HospitalCardProps {
  hospital: Hospital
  isSelected?: boolean
  onSelect?: (hospital: Hospital) => void
  showMapEmbed?: boolean
}

export const HospitalCard: React.FC<HospitalCardProps> = ({
  hospital,
  isSelected = false,
  onSelect,
  showMapEmbed = true,
}) => {
  const [expandedMap, setExpandedMap] = useState(isSelected)

  const googleMapsSearchUrl =
    hospital.googleMapsUrl ||
    `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(hospital.name + ' ' + hospital.address)}`

  const googleMapsDirectionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${
    hospital.latitude && hospital.longitude
      ? `${hospital.latitude},${hospital.longitude}`
      : encodeURIComponent(hospital.name + ' ' + hospital.address)
  }`

  const embedMapUrl = `https://maps.google.com/maps?q=${encodeURIComponent(
    hospital.name + ' ' + hospital.address
  )}&t=&z=14&ie=UTF8&iwloc=&output=embed`

  return (
    <div
      className={`bg-surface border rounded-xl p-4 shadow-sm transition-all ${
        isSelected ? 'border-primary ring-2 ring-primary/20 bg-primary/5' : 'border-outline-variant hover:border-outline'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span
              className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                hospital.emergencyStatus === 'OPEN'
                  ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                  : hospital.emergencyStatus === 'BUSY'
                  ? 'bg-amber-500/10 text-amber-600 border border-amber-500/20'
                  : 'bg-red-500/10 text-red-600 border border-red-500/20'
              }`}
            >
              ● {hospital.emergencyStatus === 'OPEN' ? 'Emergency Open' : hospital.emergencyStatus === 'BUSY' ? 'ER High Volume' : 'Diverting'}
            </span>
            <span className="text-xs font-semibold text-secondary px-2 py-0.5 bg-secondary-container rounded-md">
              {hospital.traumaLevel.replace('_', ' ')}
            </span>
          </div>
          <h3 className="text-base font-bold text-on-surface leading-snug line-clamp-2">{hospital.name}</h3>
          <p className="text-xs text-on-surface-variant flex items-center gap-1 mt-1">
            <MapPin className="w-3.5 h-3.5 shrink-0 text-primary" />
            <span className="truncate">{hospital.address}</span>
          </p>
        </div>

        <div className="text-right shrink-0">
          <span className="text-lg font-extrabold text-primary leading-none block">{hospital.driveMinutes} min</span>
          <span className="text-xs text-on-surface-variant font-medium">{hospital.distanceKm} km away</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-outline-variant/60 text-xs">
        <div className="flex items-center gap-1.5 text-on-surface">
          <Bed className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>
            ICU Beds: <strong className="text-emerald-700">{hospital.icuBedsAvailable} Available</strong>
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-on-surface">
          <Activity className="w-4 h-4 text-primary shrink-0" />
          <span className="truncate">{hospital.type.replace('_', ' ')}</span>
        </div>
      </div>

      {hospital.specialties && hospital.specialties.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2.5">
          {hospital.specialties.map((spec) => (
            <span key={spec} className="text-[11px] font-medium bg-surface-container text-on-surface-variant px-2 py-0.5 rounded">
              {spec}
            </span>
          ))}
        </div>
      )}

      {showMapEmbed && (
        <div className="mt-3">
          <button
            type="button"
            onClick={() => setExpandedMap(!expandedMap)}
            className="w-full flex items-center justify-between text-xs font-semibold text-primary py-1.5 px-2 bg-primary/5 hover:bg-primary/10 rounded-lg transition-colors"
          >
            <span className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5" />
              {expandedMap ? 'Hide Hospital Location Map' : 'View Hospital Location on Google Maps'}
            </span>
            {expandedMap ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {expandedMap && (
            <div className="mt-2 rounded-xl overflow-hidden border border-outline-variant shadow-inner relative bg-slate-100">
              <iframe
                title={`Google Map for ${hospital.name}`}
                width="100%"
                height="160"
                style={{ border: 0 }}
                loading="lazy"
                allowFullScreen
                src={embedMapUrl}
                className="w-full h-40"
              />
              <div className="p-2 bg-surface-container-high flex items-center justify-between gap-2 border-t border-outline-variant">
                <span className="text-[11px] font-medium text-on-surface-variant truncate">
                  Google Maps Pin: {hospital.name}
                </span>
                <a
                  href={googleMapsDirectionsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs font-bold text-white bg-primary hover:bg-primary/90 px-3 py-1 rounded-md transition-colors shrink-0 shadow-sm"
                >
                  <Navigation className="w-3.5 h-3.5" />
                  Navigate (Google Maps)
                </a>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="flex items-center gap-2 mt-3 pt-2">
        {onSelect && (
          <button
            type="button"
            onClick={() => onSelect(hospital)}
            className={`flex-1 py-2.5 px-3 rounded-lg font-bold text-xs transition-colors flex items-center justify-center gap-1.5 ${
              isSelected
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-primary text-on-primary hover:bg-primary/90'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            {isSelected ? 'Hospital Selected for Destination' : 'Select Destination Hospital'}
          </button>
        )}

        <a
          href={googleMapsSearchUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="p-2.5 text-on-surface-variant hover:text-primary bg-surface-container hover:bg-surface-container-high rounded-lg transition-colors"
          title="Open in Google Maps App"
        >
          <ExternalLink className="w-4 h-4" />
        </a>

        <a
          href={`tel:${hospital.phone}`}
          className="p-2.5 text-emerald-600 bg-emerald-500/10 hover:bg-emerald-500/20 rounded-lg transition-colors"
          title="Call Hospital ER Desk"
        >
          <Phone className="w-4 h-4" />
        </a>
      </div>
    </div>
  )
}
