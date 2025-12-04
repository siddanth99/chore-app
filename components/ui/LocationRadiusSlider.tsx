'use client'

import React from 'react'

type Props = {
  value: number
  min?: number
  max?: number
  step?: number
  onChange: (v: number) => void
}

export default function LocationRadiusSlider({
  value,
  min = 1,
  max = 50,
  step = 1,
  onChange,
}: Props) {
  return (
    <div className="mt-4">
      <label htmlFor="location-radius" className="text-sm font-medium text-muted-foreground">
        Location radius (km)
      </label>

      <div className="flex items-center gap-3 mt-2">
        <input
          id="location-radius"
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-full"
          aria-label="Location radius in kilometers"
        />
        <div className="w-24">
          <input
            type="number"
            min={min}
            max={max}
            step={step}
            value={value}
            onChange={(e) => {
              const v = Number(e.target.value || min)
              if (!Number.isNaN(v)) onChange(Math.max(min, Math.min(max, v)))
            }}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
            aria-label="Location radius value in kilometres"
          />
        </div>
      </div>

      <p className="text-xs text-muted-foreground mt-2">
        Show chores within {value} km of your location.
      </p>
    </div>
  )
}

