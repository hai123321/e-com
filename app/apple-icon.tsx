import { ImageResponse } from 'next/og'

export const size = { width: 180, height: 180 }
export const contentType = 'image/png'

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 180,
          height: 180,
          borderRadius: 40,
          background: 'linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <span
          style={{
            color: 'white',
            fontSize: 100,
            fontWeight: 800,
            fontFamily: 'sans-serif',
            letterSpacing: '-4px',
            lineHeight: 1,
          }}
        >
          M
        </span>
      </div>
    ),
    { ...size }
  )
}
