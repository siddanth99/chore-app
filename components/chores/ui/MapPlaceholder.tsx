'use client'

import dynamic from 'next/dynamic'

import React from 'react'

import type { Chore } from '@/components/chores/types'

// dynamic import so Leaflet code only loads in the browser
const RealMap = dynamic(() => import('./RealMap'), { ssr: false })

type Props = {
  userPos: { lat: number; lng: number } | null
  radiusKm: number
  visibleChores: Chore[]
  onMarkerClick?: (chore: Chore) => void
  className?: string
}

export default function MapPlaceholder(props: Props) {
  return (
    <div className={props.className ?? 'w-full h-[420px] rounded-2xl overflow-hidden shadow-lg bg-muted/30'}>
      <RealMap {...props} />
    </div>
  )
}
