import { NextRequest, NextResponse } from 'next/server'
import { readdir } from 'fs/promises'
import { join } from 'path'

// Canonical mapping: logo key → clearbit domain
const LOGOS: Record<string, string> = {
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

async function checkAuth(req: NextRequest): Promise<boolean> {
  const token = (req.headers.get('Authorization') ?? '').replace('Bearer ', '').trim()
  if (!token) return false
  const apiBase = process.env.API_INTERNAL_URL ?? 'http://api:3001'
  const res = await fetch(`${apiBase}/api/v1/admin/orders?limit=1`, {
    headers: { Authorization: `Bearer ${token}` },
  }).catch(() => null)
  return !!res && res.status !== 401 && res.status !== 403
}

export async function GET(req: NextRequest) {
  if (!await checkAuth(req)) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  // Which logos exist locally?
  const logosDir = join(process.cwd(), 'public', 'logos')
  const localFiles = new Set<string>()
  try {
    const files = await readdir(logosDir)
    for (const f of files) {
      if (/\.(jpg|jpeg|png|webp)$/i.test(f)) {
        localFiles.add(f.replace(/\.[^.]+$/, ''))
      }
    }
  } catch { /* directory may not exist yet */ }

  const logos = Object.entries(LOGOS)
    .map(([key, domain]) => ({
      key,
      domain,
      hasLocal: localFiles.has(key),
      url: `/api/logos/${key}.jpg?t=${Date.now()}`,
    }))
    .sort((a, b) => a.key.localeCompare(b.key))

  const total  = logos.length
  const local  = logos.filter(l => l.hasLocal).length

  return NextResponse.json({ success: true, data: { logos, total, local } })
}
