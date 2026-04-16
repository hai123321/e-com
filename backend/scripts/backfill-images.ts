/**
 * One-shot script: backfill group_key and image for existing products
 * Run: npx tsx scripts/backfill-images.ts
 */
import { drizzle } from 'drizzle-orm/node-postgres'
import { sql } from 'drizzle-orm'
import pg from 'pg'
import 'dotenv/config'

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL })
const db   = drizzle(pool)

// group_key patterns: [pattern, key]
const GROUP_PATTERNS: [string, string][] = [
  ['ChatGPT', 'chatgpt'], ['GPT Add Team', 'chatgpt'], ['GPT Dùng chung', 'chatgpt'],
  ['GPT GO', 'chatgpt'], ['Code GPT', 'chatgpt'],
  ['Claude', 'claude'], ['Cursor', 'cursor'], ['Perplexity', 'perplexity'],
  ['Leonardo', 'leonardo'], ['ElevenLabs', 'elevenlabs'], ['Kling', 'kling'],
  ['Grok', 'grok'], ['KREA', 'krea'], ['VEO3', 'veo3'],
  ['Midjourney', 'midjourney'], ['Runway', 'runway'], ['Higgsfield', 'higgsfield'],
  ['Heygen', 'heygen'], ['Hailuo', 'hailuo'], ['Krisp', 'krisp'],
  ['Capcut', 'capcut'], ['Canva', 'canva'], ['Figma', 'figma'],
  ['Lightroom', 'lightroom'], ['Filmora', 'filmora'], ['Davinci', 'davinci'],
  ['Meitu', 'meitu'], ['Picsart', 'picsart'], ['Beautiful', 'beautifulai'],
  ['Veed', 'veed'], ['SketchUP', 'sketchup'], ['Corel', 'corel'],
  ['AutoCAD', 'autocad'], ['Retouch4me', 'retouch4me'],
  ['Duolingo', 'duolingo'], ['Elsa', 'elsa'], ['Grammarly', 'grammarly'],
  ['Ejoy', 'ejoy'], ['Quillbot', 'quillbot'], ['Memrise', 'memrise'],
  ['Hellochinese', 'hellochinese'], ['Quizlet', 'quizlet'], ['Codecademy', 'codecademy'],
  ['Studocu', 'studocu'], ['Datacamp', 'datacamp'], ['Coursera', 'coursera'],
  ['Skillshare', 'skillshare'], ['Udemy', 'udemy'], ['Chegg', 'chegg'],
  ['Kahoot', 'kahoot'], ['Wordwall', 'wordwall'], ['Leetcode', 'leetcode'],
  ['Quizizz', 'quizizz'], ['Scribd', 'scribd'], ['Busuu', 'busuu'],
  ['Netflix', 'netflix'], ['YouTube', 'youtube'], ['Spotify', 'spotify'],
  ['Apple Music', 'apple-music'], ['Tidal', 'tidal'], ['Galaxy Play', 'galaxy-play'],
  ['TV360', 'tv360'], ['VTVCab', 'vtvcab'], ['Youku', 'youku'],
  ['FPT', 'fpt-play'], ['iQIYI', 'iqiyi'], ['Vieon', 'vieon'],
  ['Notion', 'notion'], ['Office 365', 'office365'], ['Copilot', 'copilot'],
  ['Zoom', 'zoom'], ['Gamma', 'gamma'], ['Turnitin', 'turnitin'],
  ['Google Meet', 'google-meet'], ['Tradingview', 'tradingview'], ['Camscanner', 'camscanner'],
  ['Jetbrains', 'jetbrains'], ['Linkedin', 'linkedin'], ['Gemini', 'gemini'],
  ['Google One', 'google-one'], ['OneDrive', 'onedrive'], ['Dropbox', 'dropbox'],
  ['iCloud', 'icloud'], ['NordVPN', 'nordvpn'], ['ExpressVPN', 'expressvpn'],
  ['PIA VPN', 'pia'], ['HMA VPN', 'hma'], ['Hotspot Shield', 'hotspot-shield'],
  ['LastPass', 'lastpass'], ['1Password', '1password'], ['Kaspersky', 'kaspersky'],
  ['Windows', 'windows'], ['Vietmap', 'vietmap'], ['Chess', 'chess'],
  ['Discord', 'discord'], ['Tinder', 'tinder'], ['Bumble', 'bumble'],
  ['Autodesk', 'autodesk'], ['Adobe', 'adobe'],
]

// group_key → image URL (all Clearbit — no hotlink restrictions)
const IMAGES: Record<string, string> = {
  chatgpt:          'https://logo.clearbit.com/openai.com',
  claude:           'https://logo.clearbit.com/anthropic.com',
  cursor:           'https://logo.clearbit.com/cursor.sh',
  perplexity:       'https://logo.clearbit.com/perplexity.ai',
  leonardo:         'https://logo.clearbit.com/leonardo.ai',
  elevenlabs:       'https://logo.clearbit.com/elevenlabs.io',
  kling:            'https://logo.clearbit.com/klingai.com',
  grok:             'https://logo.clearbit.com/x.ai',
  krea:             'https://logo.clearbit.com/krea.ai',
  veo3:             'https://logo.clearbit.com/deepmind.google',
  midjourney:       'https://logo.clearbit.com/midjourney.com',
  runway:           'https://logo.clearbit.com/runwayml.com',
  higgsfield:       'https://logo.clearbit.com/higgsfield.ai',
  heygen:           'https://logo.clearbit.com/heygen.com',
  hailuo:           'https://logo.clearbit.com/hailuoai.com',
  krisp:            'https://logo.clearbit.com/krisp.ai',
  capcut:           'https://logo.clearbit.com/capcut.com',
  canva:            'https://logo.clearbit.com/canva.com',
  adobe:            'https://logo.clearbit.com/adobe.com',
  lightroom:        'https://logo.clearbit.com/lightroom.adobe.com',
  figma:            'https://logo.clearbit.com/figma.com',
  filmora:          'https://logo.clearbit.com/filmora.wondershare.com',
  davinci:          'https://logo.clearbit.com/blackmagicdesign.com',
  meitu:            'https://logo.clearbit.com/meitu.com',
  picsart:          'https://logo.clearbit.com/picsart.com',
  beautifulai:      'https://logo.clearbit.com/beautiful.ai',
  veed:             'https://logo.clearbit.com/veed.io',
  sketchup:         'https://logo.clearbit.com/sketchup.com',
  corel:            'https://logo.clearbit.com/corel.com',
  autocad:          'https://logo.clearbit.com/autodesk.com',
  autodesk:         'https://logo.clearbit.com/autodesk.com',
  retouch4me:       'https://logo.clearbit.com/retouch4me.com',
  duolingo:         'https://logo.clearbit.com/duolingo.com',
  elsa:             'https://logo.clearbit.com/elsaspeak.com',
  grammarly:        'https://logo.clearbit.com/grammarly.com',
  ejoy:             'https://logo.clearbit.com/ejoy.com',
  quillbot:         'https://logo.clearbit.com/quillbot.com',
  memrise:          'https://logo.clearbit.com/memrise.com',
  hellochinese:     'https://logo.clearbit.com/hellochinese.com',
  quizlet:          'https://logo.clearbit.com/quizlet.com',
  codecademy:       'https://logo.clearbit.com/codecademy.com',
  studocu:          'https://logo.clearbit.com/studocu.com',
  datacamp:         'https://logo.clearbit.com/datacamp.com',
  coursera:         'https://logo.clearbit.com/coursera.org',
  skillshare:       'https://logo.clearbit.com/skillshare.com',
  udemy:            'https://logo.clearbit.com/udemy.com',
  chegg:            'https://logo.clearbit.com/chegg.com',
  kahoot:           'https://logo.clearbit.com/kahoot.com',
  wordwall:         'https://logo.clearbit.com/wordwall.net',
  leetcode:         'https://logo.clearbit.com/leetcode.com',
  quizizz:          'https://logo.clearbit.com/quizizz.com',
  scribd:           'https://logo.clearbit.com/scribd.com',
  busuu:            'https://logo.clearbit.com/busuu.com',
  netflix:          'https://logo.clearbit.com/netflix.com',
  youtube:          'https://logo.clearbit.com/youtube.com',
  spotify:          'https://logo.clearbit.com/spotify.com',
  'apple-music':    'https://logo.clearbit.com/music.apple.com',
  tidal:            'https://logo.clearbit.com/tidal.com',
  'galaxy-play':    'https://logo.clearbit.com/galaxyplay.vn',
  tv360:            'https://logo.clearbit.com/tv360.vn',
  vtvcab:           'https://logo.clearbit.com/vtvcabon.vn',
  youku:            'https://logo.clearbit.com/youku.com',
  'fpt-play':       'https://logo.clearbit.com/fptplay.vn',
  iqiyi:            'https://logo.clearbit.com/iqiyi.com',
  vieon:            'https://logo.clearbit.com/vieon.vn',
  notion:           'https://logo.clearbit.com/notion.so',
  office365:        'https://logo.clearbit.com/microsoft.com',
  copilot:          'https://logo.clearbit.com/microsoft.com',
  zoom:             'https://logo.clearbit.com/zoom.us',
  gamma:            'https://logo.clearbit.com/gamma.app',
  turnitin:         'https://logo.clearbit.com/turnitin.com',
  'google-meet':    'https://logo.clearbit.com/meet.google.com',
  tradingview:      'https://logo.clearbit.com/tradingview.com',
  camscanner:       'https://logo.clearbit.com/camscanner.com',
  jetbrains:        'https://logo.clearbit.com/jetbrains.com',
  linkedin:         'https://logo.clearbit.com/linkedin.com',
  gemini:           'https://logo.clearbit.com/gemini.google.com',
  'google-one':     'https://logo.clearbit.com/one.google.com',
  onedrive:         'https://logo.clearbit.com/onedrive.live.com',
  dropbox:          'https://logo.clearbit.com/dropbox.com',
  icloud:           'https://logo.clearbit.com/icloud.com',
  nordvpn:          'https://logo.clearbit.com/nordvpn.com',
  expressvpn:       'https://logo.clearbit.com/expressvpn.com',
  pia:              'https://logo.clearbit.com/privateinternetaccess.com',
  hma:              'https://logo.clearbit.com/hidemyass.com',
  'hotspot-shield': 'https://logo.clearbit.com/hotspotshield.com',
  lastpass:         'https://logo.clearbit.com/lastpass.com',
  '1password':      'https://logo.clearbit.com/1password.com',
  kaspersky:        'https://logo.clearbit.com/kaspersky.com',
  windows:          'https://logo.clearbit.com/microsoft.com',
  vietmap:          'https://logo.clearbit.com/vietmap.vn',
  chess:            'https://logo.clearbit.com/chess.com',
  discord:          'https://logo.clearbit.com/discord.com',
  tinder:           'https://logo.clearbit.com/tinder.com',
  bumble:           'https://logo.clearbit.com/bumble.com',
}

let groupUpdated = 0
let imageUpdated = 0

// 1. Backfill group_key
for (const [pattern, key] of GROUP_PATTERNS) {
  const res = await db.execute(
    sql`UPDATE products SET group_key = ${key} WHERE name ILIKE ${'%' + pattern + '%'} AND (group_key = '' OR group_key IS NULL)`
  )
  const count = (res as any).rowCount ?? 0
  if (count > 0) { console.log(`  group_key=${key}: ${count} rows`); groupUpdated += count }
}

// 2. Backfill image
for (const [key, imgUrl] of Object.entries(IMAGES)) {
  const res = await db.execute(
    sql`UPDATE products SET image = ${imgUrl} WHERE group_key = ${key} AND (image = '' OR image IS NULL)`
  )
  const count = (res as any).rowCount ?? 0
  if (count > 0) { console.log(`  image[${key}]: ${count} rows`); imageUpdated += count }
}

console.log(`\n✅ Done. group_key: ${groupUpdated} rows, image: ${imageUpdated} rows`)
await pool.end()
