'use client'

import { useState, useEffect } from 'react'
import MapPicker from './MapPicker'

interface WorkerLocationPickerProps {
  onLocationChange: (lat: number, lng: number) => void
  initialLat?: number | null
  initialLng?: number | null
}

export default function WorkerLocationPicker({
  onLocationChange,
  initialLat,
  initialLng,
}: WorkerLocationPickerProps) {
  const [lat, setLat] = useState<number | null>(initialLat || null)
  const [lng, setLng] = useState<number | null>(initialLng || null)
  const [isLocating, setIsLocating] = useState(false)
  const [showMapPicker, setShowMapPicker] = useState(false)

  useEffect(() => {
    // Try to get location from browser on mount if not already set
    if (!lat || !lng) {
      if (navigator.geolocation) {
        setIsLocating(true)
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const { latitude, longitude } = position.coords
            setLat(latitude)
            setLng(longitude)
            onLocationChange(latitude, longitude)
            setIsLocating(false)
          },
          () => {
            // User denied or error - show map picker
            setShowMapPicker(true)
            setIsLocating(false)
          }
        )
      } else {
        // No geolocation support - show map picker
        setShowMapPicker(true)
      }
    }
  }, [])

  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser. Please use the map to set your location.')
      setShowMapPicker(true)
      return
    }

    setIsLocating(true)
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords
        setLat(latitude)
        setLng(longitude)
        onLocationChange(latitude, longitude)
        setIsLocating(false)
      },
      (error) => {
        console.error('Error getting location:', error)
        setShowMapPicker(true)
        setIsLocating(false)
      }
    )
  }

  const handleMapChange = (newLat: number, newLng: number) => {
    setLat(newLat)
    setLng(newLng)
    onLocationChange(newLat, newLng)
  }

  if (showMapPicker || (!lat || !lng)) {
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-gray-700">
            Set your location to find nearby chores
          </p>
          <button
            type="button"
            onClick={handleUseMyLocation}
            disabled={isLocating}
            className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-50"
          >
            {isLocating ? 'Locating...' : 'Use My Location'}
          </button>
        </div>
        <MapPicker
          lat={lat}
          lng={lng}
          onChange={handleMapChange}
          heightClass="h-48"
        />
        {lat && lng && (
          <button
            type="button"
            onClick={() => setShowMapPicker(false)}
            className="text-sm text-blue-600 hover:text-blue-500"
          >
            ✓ Location set. Hide map
          </button>
        )}
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-gray-300 bg-gray-50 p-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-700">Your Location</p>
          <p className="text-xs text-gray-500">
            {lat.toFixed(4)}, {lng.toFixed(4)}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowMapPicker(true)}
          className="text-sm text-blue-600 hover:text-blue-500"
        >
          Change
        </button>
      </div>
    </div>
  )
}

