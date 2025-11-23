'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import type { LatLngExpression } from 'leaflet'

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
}

// Component to handle map clicks - must be inside MapContainer
function MapClickHandler({ onChange }: { onChange: (lat: number, lng: number) => void }) {
  if (typeof window === 'undefined') return null

  const { useMapEvents } = require('react-leaflet')
  useMapEvents({
    click: (e: any) => {
      const { lat, lng } = e.latlng
      onChange(lat, lng)
    },
  })
  return null
}

export default function MapPicker({
  lat,
  lng,
  onChange,
  heightClass = 'h-64',
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
      }
    )
  }

  // Default center (can be adjusted)
  const defaultCenter: LatLngExpression = [40.7128, -74.006] // New York City
  const center: LatLngExpression =
    lat !== null && lng !== null ? [lat, lng] : defaultCenter
  const position: LatLngExpression | null =
    lat !== null && lng !== null ? [lat, lng] : null

  if (!isClient) {
    return (
      <div
        className={`w-full rounded-lg border border-gray-300 overflow-hidden ${heightClass} flex items-center justify-center bg-gray-100`}
      >
        <p className="text-gray-500">Loading map...</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600">
          Click on the map to set the location, or use your current location
        </p>
        <button
          type="button"
          onClick={handleUseMyLocation}
          disabled={isLocating}
          className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLocating ? 'Locating...' : 'Use My Location'}
        </button>
      </div>
      <div
        className={`w-full rounded-lg border border-gray-300 overflow-hidden ${heightClass}`}
      >
        <MapContainer
          center={center}
          zoom={lat !== null && lng !== null ? 13 : 2}
          style={{ height: '100%', width: '100%' }}
          scrollWheelZoom={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {position && (
            <Marker
              position={position}
              draggable={true}
              eventHandlers={{
                dragend: (e: any) => {
                  const marker = e.target
                  const { lat, lng } = marker.getLatLng()
                  onChange(lat, lng)
                },
              }}
            />
          )}
          <MapClickHandler onChange={onChange} />
        </MapContainer>
      </div>
      {lat !== null && lng !== null && (
        <p className="text-xs text-gray-500">
          Lat: {lat.toFixed(6)}, Lng: {lng.toFixed(6)}
        </p>
      )}
    </div>
  )
}
