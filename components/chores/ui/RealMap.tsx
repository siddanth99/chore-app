'use client'

import React, { useEffect } from 'react'

import { MapContainer, TileLayer, Marker, Circle, Popup, useMap } from 'react-leaflet'

import L from 'leaflet'

import 'leaflet/dist/leaflet.css'

import { Chore } from '@/components/chores/types'

// Use CDN fallback URLs for marker images (safe and avoids bundler issues)
const markerIcon2x = 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png'
const markerIcon = 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png'
const markerShadow = 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png'

type Props = {
  userPos: { lat: number; lng: number } | null
  radiusKm: number
  visibleChores: Chore[]
  onMarkerClick?: (chore: Chore) => void
  className?: string
}

function FitMapToBounds({ userPos, visibleChores, radiusKm }: { userPos: Props['userPos']; visibleChores: Chore[]; radiusKm: number }) {
  const map = useMap()

  useEffect(() => {
    try {
      const bounds: L.LatLngExpression[] = []
      if (userPos) bounds.push([userPos.lat, userPos.lng])
      visibleChores.forEach((c) => {
        if (typeof c.lat === 'number' && typeof c.lng === 'number') bounds.push([c.lat, c.lng])
      })

      if (bounds.length === 0) {
        if (userPos) map.setView([userPos.lat, userPos.lng], 13)
        return
      }
      const leafletBounds = L.latLngBounds(bounds)
      if (userPos && radiusKm > 0) {
        const circle = L.circle([userPos.lat, userPos.lng], { radius: radiusKm * 1000 })
        leafletBounds.extend(circle.getBounds())
      }
      map.fitBounds(leafletBounds.pad(0.2), { maxZoom: 15, animate: true })
    } catch (err) {
      // ignore fit errors
      // console.error('FitMapBounds failed', err)
    }
  }, [map, userPos, visibleChores, radiusKm])

  return null
}

export default function RealMap({ userPos, radiusKm, visibleChores, onMarkerClick, className }: Props) {
  // Ensure icon patch runs in browser
  useEffect(() => {
    try {
      // @ts-ignore
      delete (L.Icon.Default as any).prototype._getIconUrl
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: markerIcon2x,
        iconUrl: markerIcon,
        shadowUrl: markerShadow,
      })
    } catch (e) {
      // ignore icon setup errors
    }
  }, [])

  const defaultCenter: [number, number] = userPos ? [userPos.lat, userPos.lng] : [20.0, 78.0] // fallback center

  return (
    <div className={className ?? 'w-full h-[420px] rounded-2xl overflow-hidden shadow-lg'}>
      <MapContainer center={defaultCenter} zoom={13} scrollWheelZoom style={{ height: '100%', width: '100%' }}>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        {userPos && (
          <>
            <Marker position={[userPos.lat, userPos.lng]}>
              <Popup>You are here</Popup>
            </Marker>
            <Circle
              center={[userPos.lat, userPos.lng]}
              radius={radiusKm * 1000}
              pathOptions={{ color: '#7c3aed', fillColor: '#7c3aed', fillOpacity: 0.08 }}
            />
          </>
        )}

        {visibleChores.map((c) => {
          if (typeof c.lat !== 'number' || typeof c.lng !== 'number') return null
          return (
            <Marker
              key={c.id}
              position={[c.lat, c.lng]}
              eventHandlers={{
                click: () => onMarkerClick?.(c),
              }}
            >
              <Popup>
                <div className="min-w-[180px]">
                  <div className="font-semibold">{c.title ?? 'Chore'}</div>
                  <div className="text-xs text-muted-foreground">{c.location ?? ''}</div>
                  <div className="mt-1 text-sm font-medium">{c.budget ? `₹${c.budget}` : 'No budget'}</div>
                </div>
              </Popup>
            </Marker>
          )
        })}

        <FitMapToBounds userPos={userPos} visibleChores={visibleChores} radiusKm={radiusKm} />
      </MapContainer>
    </div>
  )
}

