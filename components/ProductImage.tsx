'use client'

import Image from 'next/image'
import { useState, useRef } from 'react'

interface Props {
  slug: string
  displayName: string
  accentColorHex: string
  image: string
  hoverSpinFrames: string[]
  height?: number
  className?: string
}

export function ProductImage({
  displayName,
  accentColorHex,
  image,
  hoverSpinFrames,
  height = 90,
  className,
}: Props) {
  const [frameIndex, setFrameIndex] = useState(0)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const hasSpin = hoverSpinFrames.length > 1

  const handleMouseEnter = () => {
    if (!hasSpin) return
    let i = 0
    intervalRef.current = setInterval(() => {
      i = (i + 1) % hoverSpinFrames.length
      setFrameIndex(i)
    }, 80)
  }

  const handleMouseLeave = () => {
    if (!hasSpin) return
    if (intervalRef.current) clearInterval(intervalRef.current)
    setFrameIndex(0)
  }

  const src = hasSpin
    ? hoverSpinFrames[frameIndex]
    : (image && !image.includes('REQUIRED')) ? image : null

  return (
    <div
      className={className}
      style={{
        position: 'relative',
        height: `${height}px`,
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Glow behind vial */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `radial-gradient(ellipse at center, ${accentColorHex}14 0%, transparent 70%)`,
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />

      {src ? (
        <div style={{ position: 'relative', width: '100%', height: '100%', zIndex: 1 }}>
          <Image
            src={src}
            alt={displayName}
            fill
            sizes="(max-width: 768px) 50vw, 25vw"
            quality={72}
            style={{
              objectFit: 'contain',
              objectPosition: 'center center',
            }}
          />
        </div>
      ) : (
        <div
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '11px',
            color: 'var(--text-muted)',
            letterSpacing: '0.08em',
            textAlign: 'center',
          }}
        >
          <div style={{ marginBottom: '4px', color: accentColorHex, fontSize: '13px' }}>
            {displayName}
          </div>
          <div>[IMAGE REQUIRED]</div>
        </div>
      )}

      {hasSpin && (
        <div
          style={{
            position: 'absolute',
            bottom: '4px',
            right: '8px',
            display: 'flex',
            gap: '3px',
            zIndex: 2,
          }}
        >
          {hoverSpinFrames.map((_, i) => (
            <div
              key={i}
              style={{
                width: '3px',
                height: '3px',
                borderRadius: '50%',
                background: i === frameIndex ? accentColorHex : 'var(--border)',
              }}
            />
          ))}
        </div>
      )}
    </div>
  )
}
