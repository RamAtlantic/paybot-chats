"use client"

import { useEffect, useRef, type ReactNode } from "react"
import type * as THREE from "three"
import Header from "@/components/layout/header"

interface VantaEffect {
  destroy: () => void
}

interface VantaWavesOptions {
  el: HTMLDivElement
  THREE: typeof THREE
  mouseControls: boolean
  touchControls: boolean
  gyroControls: boolean
  minHeight: number
  minWidth: number
  scale: number
  scaleMobile: number
  color: number
  shininess: number
  waveHeight: number
  waveSpeed: number
  zoom: number
}

declare global {
  interface Window {
    VANTA: {
      WAVES: (options: VantaWavesOptions) => VantaEffect
    }
    THREE: typeof THREE
  }
}

interface VantaBackgroundLayoutProps {
  children: ReactNode
}

export function VantaBackgroundLayout({ children }: VantaBackgroundLayoutProps) {
  const vantaRef = useRef<HTMLDivElement>(null)
  const vantaEffect = useRef<VantaEffect | null>(null)

  // Initialize Vanta.js background
  useEffect(() => {
    // Load Three.js
    const threeScript = document.createElement("script")
    threeScript.src = "https://cdnjs.cloudflare.com/ajax/libs/three.js/r134/three.min.js"
    threeScript.async = true
    document.body.appendChild(threeScript)

    threeScript.onload = () => {
      // Load Vanta.js WAVES effect
      const vantaScript = document.createElement("script")
      vantaScript.src = "https://cdn.jsdelivr.net/npm/vanta@latest/dist/vanta.waves.min.js"
      vantaScript.async = true
      document.body.appendChild(vantaScript)

      vantaScript.onload = () => {
        if (vantaRef.current && !vantaEffect.current) {
          vantaEffect.current = (
            window.VANTA as unknown as { WAVES: (options: VantaWavesOptions) => VantaEffect }
          ).WAVES({
            el: vantaRef.current,
            THREE: window.THREE,
            mouseControls: true,
            touchControls: true,
            gyroControls: false,
            minHeight: 200.0,
            minWidth: 200.0,
            scale: 1.0,
            scaleMobile: 1.0,
            color: 0x0a0a0a,
            shininess: 60.0,
            waveHeight: 15.0,
            waveSpeed: 0.6,
            zoom: 0.75,
          })
        }
      }
    }

    return () => {
      if (vantaEffect.current) {
        vantaEffect.current.destroy()
      }
    }
  }, [])

  return (
    <div ref={vantaRef} className="relative min-h-screen w-full overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-black/40 via-transparent to-primary/10 pointer-events-none z-0" />

      <div className="relative z-10 flex flex-col min-h-screen">
        <Header />
        <div className="flex-1 flex items-center justify-center w-full">
          {children}
        </div>
      </div>
    </div>
  )
}
