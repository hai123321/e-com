import { NextRequest, NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import { join } from 'path'

/**
 * Serve logo files from public/logos/ at runtime.
 * Falls back to Clearbit logo CDN when the local file is missing.
 */

/** Map: logo filename → clearbit domain */
const CLEARBIT: Record<string, string> = {
  '1password':      '1password.com',
  adobe:            'adobe.com',
  'apple-music':    'apple.com',
  autocad:          'autodesk.com',
  autodesk:         'autodesk.com',
  beautifulai:      'beautiful.ai',
  bumble:           'bumble.com',
  busuu:            'busuu.com',
  camscanner:       'camscanner.com',
  canva:            'canva.com',
  capcut:           'capcut.com',
  chatgpt:          'openai.com',
  chegg:            'chegg.com',
  chess:            'chess.com',
  claude:           'anthropic.com',
  codecademy:       'codecademy.com',
  copilot:          'microsoft.com',
  corel:            'corel.com',
  coursera:         'coursera.org',
  cursor:           'cursor.com',
  datacamp:         'datacamp.com',
  davinci:          'blackmagicdesign.com',
  discord:          'discord.com',
  dropbox:          'dropbox.com',
  duolingo:         'duolingo.com',
  ejoy:             'ejoy.com',
  elevenlabs:       'elevenlabs.io',
  elsa:             'elsaspeak.com',
  expressvpn:       'expressvpn.com',
  figma:            'figma.com',
  filmora:          'filmora.wondershare.com',
  'fpt-play':       'fptplay.vn',
  'galaxy-play':    'galaxyplay.vn',
  gamma:            'gamma.app',
  gemini:           'google.com',
  'google-meet':    'google.com',
  'google-one':     'google.com',
  grammarly:        'grammarly.com',
  grok:             'x.com',
  hailuo:           'hailuoai.com',
  hellochinese:     'hellochinese.com',
  heygen:           'heygen.com',
  higgsfield:       'higgsfield.ai',
  hma:              'hidemyass.com',
  'hotspot-shield': 'hotspotshield.com',
  icloud:           'apple.com',
  iqiyi:            'iqiyi.com',
  jetbrains:        'jetbrains.com',
  kahoot:           'kahoot.com',
  kaspersky:        'kaspersky.com',
  kling:            'klingai.com',
  krea:             'krea.ai',
  krisp:            'krisp.ai',
  lastpass:         'lastpass.com',
  leetcode:         'leetcode.com',
  leonardo:         'leonardo.ai',
  lightroom:        'adobe.com',
  linkedin:         'linkedin.com',
  meitu:            'meitu.com',
  memrise:          'memrise.com',
  midjourney:       'midjourney.com',
  netflix:          'netflix.com',
  nordvpn:          'nordvpn.com',
  notion:           'notion.so',
  office365:        'microsoft.com',
  onedrive:         'microsoft.com',
  perplexity:       'perplexity.ai',
  pia:              'privateinternetaccess.com',
  picsart:          'picsart.com',
  quillbot:         'quillbot.com',
  quizizz:          'quizizz.com',
  quizlet:          'quizlet.com',
  retouch4me:       'retouch4.me',
  runway:           'runwayml.com',
  scribd:           'scribd.com',
  sketchup:         'sketchup.com',
  skillshare:       'skillshare.com',
  spotify:          'spotify.com',
  studocu:          'studocu.com',
  tidal:            'tidal.com',
  tinder:           'tinder.com',
  tradingview:      'tradingview.com',
  turnitin:         'turnitin.com',
  tv360:            'tv360.vn',
  udemy:            'udemy.com',
  veed:             'veed.io',
  veo3:             'deepmind.google.com',
  vieon:            'vieon.vn',
  vietmap:          'vietmap.vn',
  vtvcab:           'vtvcab.vn',
  windows:          'microsoft.com',
  wordwall:         'wordwall.net',
  youku:            'youku.com',
  youtube:          'youtube.com',
  zoom:             'zoom.us',
}

export async function GET(
  _req: NextRequest,
  { params }: { params: { key: string } }
) {
  const { key } = params

  if (!/^[a-z0-9_-]+\.(jpg|jpeg|png|webp)$/i.test(key)) {
    return new NextResponse('Not found', { status: 404 })
  }

  const filePath = join(process.cwd(), 'public', 'logos', key)

  try {
    const file = await readFile(filePath)
    const ext  = key.split('.').pop()?.toLowerCase()
    const contentType =
      ext === 'png'  ? 'image/png'  :
      ext === 'webp' ? 'image/webp' :
      'image/jpeg'

    return new NextResponse(file, {
      headers: {
        'Content-Type':  contentType,
        'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800',
      },
    })
  } catch {
    // File not found locally → proxy from Google favicon service
    // (Clearbit logo CDN is permanently down as of 2025)
    const stem   = key.replace(/\.[^.]+$/, '')
    const domain = CLEARBIT[stem]

    if (domain) {
      try {
        const url = `https://t2.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON` +
                    `&fallback_opts=TYPE,SIZE,URL&url=https://${domain}&size=128`
        const upstream = await fetch(url, { next: { revalidate: 86400 } })
        if (upstream.ok) {
          const buf = await upstream.arrayBuffer()
          return new NextResponse(buf, {
            headers: {
              'Content-Type':  upstream.headers.get('content-type') ?? 'image/png',
              'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800',
            },
          })
        }
      } catch { /* ignore, fall through to 404 */ }
    }

    return new NextResponse('Not found', {
      status: 404,
      headers: { 'Cache-Control': 'no-store' },
    })
  }
}
