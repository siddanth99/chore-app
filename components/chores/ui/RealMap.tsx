'use client'

import * as L from 'leaflet'

import React, { useEffect, useMemo } from 'react'

import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet'

import { useRouter } from 'next/navigation'

import { haversineDistanceKm } from '@/lib/utils/distance'

import 'leaflet/dist/leaflet.css'

type ChoreWithCoords = {
  id: string
  title: string
  category?: string
  budget?: number | null
  price?: number | null
  quote?: number | null
  amount?: number | null
  lat?: number | null
  lng?: number | null
  description?: string | null
}

type Props = {
  chores: ChoreWithCoords[]
  userPosition?: { lat: number; lng: number } | null
  radius?: number // km
  className?: string
  isDark?: boolean
}

function MapResizeOnShow() {
  const map = useMap()

  useEffect(() => {
    const t = setTimeout(() => {
      try { map.invalidateSize() } catch (e) {}
    }, 200)

    return () => clearTimeout(t)
  }, [map])

  return null
}

// helper: approximate zoom for radius (km)
function zoomForRadiusKm(radiusKm: number) {
  if (!radiusKm || radiusKm <= 0.5) return 16;
  if (radiusKm <= 2) return 15;
  if (radiusKm <= 5) return 14;
  if (radiusKm <= 10) return 13;
  if (radiusKm <= 20) return 12;
  if (radiusKm <= 40) return 11;
  if (radiusKm <= 80) return 10;
  if (radiusKm <= 160) return 8;
  return 6; // very large radius -> world view-ish
}

function FitMapToBounds({ chores, userPosition, radius }: { chores: ChoreWithCoords[]; userPosition?: { lat: number; lng: number } | null; radius: number }) {
  const map = useMap()

  useEffect(() => {
    if (!map) return;
    
    const r = Number(radius ?? 0);
    
    if (r > 0 && userPosition) {
      const inRadius = (chores || []).filter(c => c.lat != null && c.lng != null && haversineDistanceKm(userPosition.lat, userPosition.lng, c.lat, c.lng) <= r + 0.0001);
      
      if (inRadius.length > 0) {
        const bounds = L.latLngBounds(inRadius.map(c => [c.lat!, c.lng!] as [number, number]));
        bounds.extend([userPosition.lat, userPosition.lng] as [number, number]);
        try { 
          map.fitBounds(bounds.pad(0.2)) 
        } catch (e) { 
          map.setView([userPosition.lat, userPosition.lng], zoomForRadiusKm(r)) 
        }
      } else {
        map.setView([userPosition.lat, userPosition.lng], zoomForRadiusKm(r));
      }
      return;
    }
    
    // fallback: fit to chores
    const pts = (chores || []).filter(c => c.lat != null && c.lng != null).map(c => [c.lat!, c.lng!] as [number, number]);
    if (pts.length) {
      const bounds = L.latLngBounds(pts);
      try { 
        map.fitBounds(bounds.pad(0.1)) 
      } catch (e) { 
        /* ignore */ 
      }
    } else if (userPosition) {
      map.setView([userPosition.lat, userPosition.lng], 13);
    }
  }, [map, radius, userPosition, chores])

  return null
}

function MapControls({ userPosition }: { userPosition?: { lat: number; lng: number } | null }) {
  const map = useMap()

  const centerToUser = async () => {
    // If we already have a userPosition from props, use it
    if (userPosition && map) {
      try {
        map.flyTo([userPosition.lat, userPosition.lng], 16, { duration: 0.7 })
        return
      } catch (e) {
        console.warn('map.flyTo failed with userPosition', e)
      }
    }

    // Otherwise, request the browser's geolocation
    if (!('geolocation' in navigator)) {
      console.warn('Geolocation not available in this browser')
      return
    }

    const getPos = () =>
      new Promise<GeolocationPosition>((resolve, reject) =>
        navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true, maximumAge: 0, timeout: 10000 })
      )

    try {
      const pos = await getPos()
      const lat = pos.coords.latitude
      const lng = pos.coords.longitude
      if (map) {
        map.flyTo([lat, lng], 16, { duration: 0.7 })
      }
    } catch (err) {
      console.warn('User denied geolocation or it failed', err)
    }
  }

  // button styles: absolute inside map container, bottom-right
  return (
    <div className="absolute bottom-4 right-4 z-[1000]">
      <button
        onClick={centerToUser}
        aria-label="Center map to my location"
        title="Center to my location"
        className="w-12 h-12 rounded-full bg-indigo-600 text-white shadow-lg
                   flex items-center justify-center hover:bg-indigo-700
                   transition active:scale-95"
      >
        {/* simple inline SVG locate icon (lucide-style) */}
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" >
          <circle cx="12" cy="12" r="3"></circle>
          <path d="M19.4 15 A7 7 0 0 0 16 9.6"></path>
          <path d="M4.6 9 A7 7 0 0 0 8 14.4"></path>
        </svg>
      </button>
    </div>
  )
}

export default function RealMap({ chores = [], userPosition, radius = 5, className, isDark }: Props) {
  const router = useRouter()
  
  // Prevent SSR rendering
  if (typeof window === 'undefined') {
    return null
  }

  // Currency formatter for Indian Rupees
  const formatINR = (value?: number | string | null) => {
    const v = typeof value === 'string' && value.trim() !== '' ? Number(value) : value;
    if (v == null || Number.isNaN(Number(v))) return '—';
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(Number(v));
  }

  // Beautiful modern tiles - Stadiamaps (no API key required)
  const lightUrl = 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png'
const darkUrl  = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png'

const tileUrl = useMemo(() => (isDark ? darkUrl : lightUrl), [isDark])
  // Default center fallback
  const defaultCenter: [number, number] = userPosition
    ? [userPosition.lat, userPosition.lng]
    : chores.length && chores[0].lat && chores[0].lng
      ? [chores[0].lat as number, chores[0].lng as number]
      : [19.075983, 72.877655] // fallback (Mumbai)

  // === INLINE SVG ICONS (cannot fail) ===
  const svgChore = `
<svg xmlns="http://www.w3.org/2000/svg" width="34" height="46">
  <path d="M17 0 C7 0 0 7 0 17 C0 30 17 46 17 46 C17 46 34 30 34 17 C34 7 27 0 17 0Z" fill="#6366f1" stroke="white" stroke-width="2"/>
  <circle cx="17" cy="17" r="7" fill="white"/>
</svg>
`

  const svgUser = `
<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32">
  <circle cx="16" cy="16" r="10" fill="#10b981" stroke="white" stroke-width="2"/>
</svg>
`

  const choreIcon = L.icon({
    iconUrl: "data:image/svg+xml;base64," + btoa(svgChore),
    iconRetinaUrl: "data:image/svg+xml;base64," + btoa(svgChore),
    iconSize: [34, 46],
    iconAnchor: [17, 46],
    popupAnchor: [0, -42],
  })

  const userIcon = L.icon({
    iconUrl: "data:image/svg+xml;base64," + btoa(svgUser),
    iconRetinaUrl: "data:image/svg+xml;base64," + btoa(svgUser),
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -12],
  })

  // Wrapper classes
  const wrapper = (className && className.trim())
    ? className
    : 'w-full h-full min-h-[350px] md:min-h-[420px] relative z-0 rounded-2xl overflow-hidden shadow-lg animate-fade-in'

  return (
    <div className={wrapper}>
      <MapContainer 
        center={defaultCenter} 
        zoom={userPosition ? 16 : chores.length > 0 ? 15 : 13} 
        minZoom={2}
        scrollWheelZoom 
        worldCopyJump={true}
        className="w-full h-full"
      >
        <MapResizeOnShow />
        <FitMapToBounds chores={chores} userPosition={userPosition} radius={radius} />

        <TileLayer
  url={tileUrl}
  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  maxZoom={19}
/>

        {/* User location marker and circle */}
        {userPosition && (
          <>
            <Marker 
              position={[userPosition.lat, userPosition.lng]} 
              icon={userIcon}
              zIndexOffset={1000}
            >
              <Popup>
                <div className="map-popup">
                  <div className="font-semibold text-sm mb-1">You are here</div>
                  <div className="text-xs text-muted-foreground">Search radius: {radius} km</div>
                </div>
              </Popup>
            </Marker>
            <Circle 
              center={[userPosition.lat, userPosition.lng]} 
              radius={radius * 1000} 
              pathOptions={{ 
                color: '#6366F1', 
                fillColor: '#6366F1',
                opacity: 0.2, 
                fillOpacity: 0.1 
              }} 
            />
          </>
        )}

        {/* Chore markers with popups */}
        {chores.map((c: ChoreWithCoords) => {
          const lat = c.lat
          const lng = c.lng
          if (lat == null || lng == null) return null

          return (
            <Marker
              key={c.id}
              position={[lat, lng]}
              icon={choreIcon}
            >
              <Popup autoPan={true} closeButton={false}>
                <div className="p-4 rounded-xl shadow-lg
                  bg-white/90 dark:bg-neutral-900/90
                  backdrop-blur-xl border border-white/10 dark:border-white/5
                  text-neutral-900 dark:text-neutral-100
                  animate-fadeIn"
                  style={{ width: "220px" }}>
                  
                  <div className="font-semibold text-lg mb-1">{c.title}</div>

                  {c.category && (
                    <div className="inline-block px-2 py-1 text-xs rounded-full 
                      bg-indigo-600/20 text-indigo-400 mb-2">
                      {c.category}
                    </div>
                  )}

                  <div className="inline-flex items-center gap-2 mb-3">
                    <span 
                      aria-label={`price ${formatINR(c.price ?? c.quote ?? c.budget ?? c.amount ?? null)}`}
                      className="rounded-full bg-emerald-800/80 text-white px-2 py-1 text-sm font-semibold">
                      {formatINR(c.price ?? c.quote ?? c.budget ?? c.amount ?? null)}
                    </span>
                  </div>

                  {c.description ? (
                    <p className="text-sm opacity-70 line-clamp-2 mb-3">{c.description}</p>
                  ) : null}

                  <button
                    className="w-full bg-indigo-600 text-white py-2 rounded-lg
                    hover:bg-indigo-700 transition"
                    onClick={() => {
                      const view = typeof window !== 'undefined' ? (new URLSearchParams(window.location.search)).get('view') || localStorage.getItem('choreflow_view_v1') || 'list' : 'list';
                      router.push(`/chores/${c.id}?from=chores&view=${view}`);
                    }}
                  >
                    View chore →
                  </button>
                </div>
              </Popup>
            </Marker>
          )
        })}

        <MapControls userPosition={userPosition} />
      </MapContainer>
    </div>
  )
}
