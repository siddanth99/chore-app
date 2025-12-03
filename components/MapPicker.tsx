'use client'

import { useEffect, useState, useRef } from 'react'
import dynamic from 'next/dynamic'
import type { LatLngExpression, Map as LeafletMap } from 'leaflet'
import { cn } from '@/lib/utils'

// Dynamically import MapContainer and related components to avoid SSR issues
const MapContainer = dynamic(
  () => import('react-leaflet').then((mod) => mod.MapContainer),
  { ssr: false }
)

const TileLayer = dynamic(
  () => import('react-leaflet').then((mod) => mod.TileLayer),
  { ssr: false }
)

const Marker = dynamic(
  () => import('react-leaflet').then((mod) => mod.Marker),
  { ssr: false }
)

interface MapPickerProps {
  lat: number | null
  lng: number | null
  onChange: (lat: number, lng: number) => void
  heightClass?: string
  disabled?: boolean
}

// Component to handle map clicks - must be inside MapContainer
function MapClickHandler({ 
  onChange, 
  disabled 
}: { 
  onChange: (lat: number, lng: number) => void
  disabled?: boolean
}) {
  if (typeof window === 'undefined') return null

  const { useMapEvents } = require('react-leaflet')
  useMapEvents({
    click: (e: any) => {
      if (!disabled) {
        const { lat, lng } = e.latlng
        onChange(lat, lng)
      }
    },
  })
  return null
}

// Component to re-center map when lat/lng props change
function MapCenterUpdater({ 
  lat, 
  lng 
}: { 
  lat: number | null
  lng: number | null
}) {
  if (typeof window === 'undefined') return null

  const { useMap } = require('react-leaflet')
  const map = useMap()
  
  useEffect(() => {
    if (lat !== null && lng !== null && map) {
      // Fly to new position with animation
      map.flyTo([lat, lng], Math.max(map.getZoom(), 13), {
        duration: 0.5
      })
    }
  }, [lat, lng, map])
  
  return null
}

export default function MapPicker({
  lat,
  lng,
  onChange,
  heightClass = 'h-64',
  disabled = false,
}: MapPickerProps) {
  const [isClient, setIsClient] = useState(false)
  const [isLocating, setIsLocating] = useState(false)

  useEffect(() => {
    setIsClient(true)
    // Fix for Leaflet default marker icon in Next.js
    if (typeof window !== 'undefined') {
      import('leaflet').then((L) => {
        delete (L.Icon.Default.prototype as any)._getIconUrl
        L.Icon.Default.mergeOptions({
          iconRetinaUrl:
            'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
          iconUrl:
            'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
          shadowUrl:
            'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
        })
      })
    }
  }, [])

  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser')
      return
    }

    setIsLocating(true)
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords
        onChange(latitude, longitude)
        setIsLocating(false)
      },
      (error) => {
        console.error('Error getting location:', error)
        alert('Unable to retrieve your location. Please click on the map to set coordinates.')
        setIsLocating(false)
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    )
  }

  // Default center - India (since this app uses ₹)
  const defaultCenter: LatLngExpression = [20.5937, 78.9629]
  const center: LatLngExpression =
    lat !== null && lng !== null ? [lat, lng] : defaultCenter
  const position: LatLngExpression | null =
    lat !== null && lng !== null ? [lat, lng] : null
  const initialZoom = lat !== null && lng !== null ? 15 : 4

  if (!isClient) {
    return (
      <div className={cn("w-full", heightClass)}>
        <div className="w-full h-full rounded-lg border border-border bg-muted flex items-center justify-center">
          <div className="text-center">
            <div className="animate-pulse mb-2">🗺️</div>
            <p className="text-sm text-muted-foreground">Loading map...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* Header with instructions and Use My Location button */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          Click on the map to set location, or use your current location
        </p>
        <button
          type="button"
          onClick={handleUseMyLocation}
          disabled={isLocating || disabled}
          className={cn(
            "inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors",
            "bg-primary text-primary-foreground hover:bg-primary/90",
            "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            "disabled:opacity-50 disabled:cursor-not-allowed"
          )}
        >
          {isLocating ? (
            <>
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Locating...
            </>
          ) : (
            <>
              <svg 
                className="w-4 h-4" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" 
                />
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" 
                />
              </svg>
              Use My Location
            </>
          )}
        </button>
      </div>

      {/* Map Container */}
      <div
        className={cn(
          "w-full rounded-xl border border-border overflow-hidden shadow-sm",
          heightClass,
          disabled && "opacity-50 pointer-events-none"
        )}
      >
        <MapContainer
          center={center}
          zoom={initialZoom}
          style={{ height: '100%', width: '100%' }}
          scrollWheelZoom={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {position && (
            <Marker
              position={position}
              draggable={!disabled}
              eventHandlers={{
                dragend: (e: any) => {
                  if (!disabled) {
                    const marker = e.target
                    const { lat, lng } = marker.getLatLng()
                    onChange(lat, lng)
                  }
                },
              }}
            />
          )}
          <MapClickHandler onChange={onChange} disabled={disabled} />
          <MapCenterUpdater lat={lat} lng={lng} />
        </MapContainer>
      </div>

      {/* Coordinates Display */}
      {lat !== null && lng !== null && (
        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">📍 Selected:</span>
          <code className="px-2 py-1 bg-muted rounded text-xs font-mono">
            {lat.toFixed(6)}, {lng.toFixed(6)}
          </code>
        </div>
      )}
    </div>
  )
}
