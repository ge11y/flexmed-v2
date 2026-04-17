'use client'

import { useState, useRef } from 'react'

interface ProductImageProps {
  slug: string
  displayName: string
  accentColorHex: string
  image: string
  hoverSpinFrames: string[]
  height?: number
}

export function ProductImage({
  slug,
  displayName,
  accentColorHex,
  image,
  hoverSpinFrames,
  height = 140,
}: ProductImageProps) {
  const [frameIndex, setFrameIndex] = useState(0)
  const [isHovering, setIsHovering] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const hasSpin = hoverSpinFrames.length > 1

  const handleMouseEnter = () => {
    if (!hasSpin) return
    setIsHovering(true)
    let i = 0
    intervalRef.current = setInterval(() => {
      i = (i + 1) % hoverSpinFrames.length
      setFrameIndex(i)
    }, 80)
  }

  const handleMouseLeave = () => {
    if (!hasSpin) return
    setIsHovering(false)
    if (intervalRef.current) clearInterval(intervalRef.current)
    setFrameIndex(0)
  }

  const src = hasSpin
    ? hoverSpinFrames[frameIndex]
    : (image && !image.includes('REQUIRED')) ? image : null

  return (
    <div
      style={{
        height: `${height}px`,
        background: 'var(--bg-elevated)',
        borderRadius: 'var(--radius-md)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        border: '1px solid var(--border)',
        overflow: 'hidden',
        position: 'relative',
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {src ? (
        <img
          src={src}
          alt={displayName}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            padding: '12px',
            transition: hasSpin ? 'none' : 'transform 0.3s ease',
            transform: hasSpin ? 'none' : isHovering ? 'scale(1.03)' : 'scale(1)',
          }}
        />
      ) : (
        <div
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '11px',
            color: 'var(--text-muted)',
            letterSpacing: '0.08em',
            textAlign: 'center',
            padding: '12px',
          }}
        >
          <div style={{ marginBottom: '4px', color: accentColorHex, fontSize: '13px' }}>
            {displayName}
          </div>
          <div>[IMAGE REQUIRED]</div>
        </div>
      )}

      {/* Hover-spin indicator dot */}
      {hasSpin && (
        <div
          style={{
            position: 'absolute',
            bottom: '6px',
            right: '8px',
            display: 'flex',
            gap: '3px',
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
                transition: 'background 0.1s',
              }}
            />
          ))}
        </div>
      )}
    </div>
  )
}
