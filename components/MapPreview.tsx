'use client'

import { useEffect } from 'react'
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

const Popup = dynamic(
  () => import('react-leaflet').then((mod) => mod.Popup),
  { ssr: false }
)

interface MapPreviewProps {
  lat: number
  lng: number
  heightClass?: string
  markerLabel?: string
}

export default function MapPreview({
  lat,
  lng,
  heightClass = 'h-64',
  markerLabel,
}: MapPreviewProps) {
  useEffect(() => {
    // Fix for Leaflet default marker icon in Next.js
    if (typeof window !== 'undefined') {
      import('leaflet').then((L) => {
        // Fix for default marker icon in Next.js
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

  const center: LatLngExpression = [lat, lng]
  const position: LatLngExpression = [lat, lng]

  return (
    <div
      className={`w-full rounded-lg border border-gray-300 overflow-hidden ${heightClass}`}
    >
      <MapContainer
        center={center}
        zoom={13}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={position}>
          {markerLabel && <Popup>{markerLabel}</Popup>}
        </Marker>
      </MapContainer>
    </div>
  )
}

