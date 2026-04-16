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

// group_key → image URL
const IMAGES: Record<string, string> = {
  chatgpt:       'https://upload.wikimedia.org/wikipedia/commons/thumb/0/04/ChatGPT_logo.svg/240px-ChatGPT_logo.svg.png',
  claude:        'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8b/Claude_Logo.png/240px-Claude_Logo.png',
  cursor:        'https://logo.clearbit.com/cursor.sh',
  perplexity:    'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3f/Perplexity_AI_logo.svg/240px-Perplexity_AI_logo.svg.png',
  netflix:       'https://upload.wikimedia.org/wikipedia/commons/thumb/0/08/Netflix_2015_logo.svg/340px-Netflix_2015_logo.svg.png',
  youtube:       'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b8/YouTube_Logo_2017.svg/320px-YouTube_Logo_2017.svg.png',
  spotify:       'https://upload.wikimedia.org/wikipedia/commons/thumb/1/19/Spotify_logo_without_text.svg/240px-Spotify_logo_without_text.svg.png',
  'apple-music': 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5f/Apple_Music_icon.svg/240px-Apple_Music_icon.svg.png',
  tidal:         'https://logo.clearbit.com/tidal.com',
  canva:         'https://upload.wikimedia.org/wikipedia/commons/thumb/a/ab/Canva_Logo.png/240px-Canva_Logo.png',
  figma:         'https://upload.wikimedia.org/wikipedia/commons/thumb/3/33/Figma-logo.svg/200px-Figma-logo.svg.png',
  adobe:         'https://upload.wikimedia.org/wikipedia/commons/thumb/a/af/Adobe_Photoshop_CC_icon.svg/240px-Adobe_Photoshop_CC_icon.svg.png',
  lightroom:     'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b6/Adobe_Photoshop_Lightroom_CC_logo.svg/240px-Adobe_Photoshop_Lightroom_CC_logo.svg.png',
  office365:     'https://upload.wikimedia.org/wikipedia/commons/thumb/4/44/Microsoft_logo.svg/240px-Microsoft_logo.svg.png',
  copilot:       'https://upload.wikimedia.org/wikipedia/commons/thumb/4/44/Microsoft_logo.svg/240px-Microsoft_logo.svg.png',
  onedrive:      'https://upload.wikimedia.org/wikipedia/commons/thumb/4/44/Microsoft_logo.svg/240px-Microsoft_logo.svg.png',
  windows:       'https://upload.wikimedia.org/wikipedia/commons/thumb/4/44/Microsoft_logo.svg/240px-Microsoft_logo.svg.png',
  zoom:          'https://upload.wikimedia.org/wikipedia/commons/thumb/9/91/Zoom_Communications_Logo.svg/240px-Zoom_Communications_Logo.svg.png',
  notion:        'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f9/Notion-logo.svg/240px-Notion-logo.svg.png',
  gemini:        'https://upload.wikimedia.org/wikipedia/commons/thumb/4/43/Gemini_language_model_logo.svg/240px-Gemini_language_model_logo.svg.png',
  'google-one':  'https://upload.wikimedia.org/wikipedia/commons/thumb/1/12/Google_Drive_icon_%282020%29.svg/240px-Google_Drive_icon_%282020%29.svg.png',
  'google-meet': 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9b/Google_Meet_icon_%282020%29.svg/240px-Google_Meet_icon_%282020%29.svg.png',
  duolingo:      'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2f/Duolingo_logo.svg/320px-Duolingo_logo.svg.png',
  grammarly:     'https://upload.wikimedia.org/wikipedia/commons/thumb/f/fb/Grammarly_logo_2024.svg/320px-Grammarly_logo_2024.svg.png',
  coursera:      'https://upload.wikimedia.org/wikipedia/commons/thumb/9/97/Coursera-Logo_600x600.svg/240px-Coursera-Logo_600x600.svg.png',
  skillshare:    'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0b/Skillshare_logo.svg/320px-Skillshare_logo.svg.png',
  udemy:         'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e3/Udemy_logo.svg/320px-Udemy_logo.svg.png',
  linkedin:      'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a9/LinkedIn_logo_initials.png/240px-LinkedIn_logo_initials.png',
  dropbox:       'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5f/Dropbox_logo_2017.svg/320px-Dropbox_logo_2017.svg.png',
  icloud:        'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1b/Apple_logo_grey.svg/200px-Apple_logo_grey.svg.png',
  nordvpn:       'https://upload.wikimedia.org/wikipedia/commons/thumb/b/bd/NordVPN_logo.svg/320px-NordVPN_logo.svg.png',
  leetcode:      'https://upload.wikimedia.org/wikipedia/commons/thumb/9/91/LeetCode_logo_black.svg/240px-LeetCode_logo_black.svg.png',
  midjourney:    'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e9/Midjourney_Emblem.png/240px-Midjourney_Emblem.png',
  tinder:        'https://upload.wikimedia.org/wikipedia/commons/thumb/3/35/Tinder_Logo.svg/320px-Tinder_Logo.svg.png',
  chess:         'https://upload.wikimedia.org/wikipedia/commons/thumb/a/ad/ChesscomLogo.svg/320px-ChesscomLogo.svg.png',
  jetbrains:     'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9f/JetBrains_Logo_2016.svg/240px-JetBrains_Logo_2016.svg.png',
  kaspersky:     'https://upload.wikimedia.org/wikipedia/commons/thumb/0/01/Kaspersky_logo_2019.svg/320px-Kaspersky_logo_2019.svg.png',
  discord:       'https://upload.wikimedia.org/wikipedia/commons/thumb/1/19/Discord-Logo-Color.svg/240px-Discord-Logo-Color.svg.png',
  // clearbit fallbacks
  kling:         'https://logo.clearbit.com/klingai.com',
  grok:          'https://logo.clearbit.com/x.ai',
  krea:          'https://logo.clearbit.com/krea.ai',
  veo3:          'https://logo.clearbit.com/deepmind.google',
  runway:        'https://logo.clearbit.com/runwayml.com',
  higgsfield:    'https://logo.clearbit.com/higgsfield.ai',
  heygen:        'https://logo.clearbit.com/heygen.com',
  hailuo:        'https://logo.clearbit.com/hailuoai.com',
  krisp:         'https://logo.clearbit.com/krisp.ai',
  capcut:        'https://logo.clearbit.com/capcut.com',
  filmora:       'https://logo.clearbit.com/filmora.wondershare.com',
  davinci:       'https://logo.clearbit.com/blackmagicdesign.com',
  meitu:         'https://logo.clearbit.com/meitu.com',
  picsart:       'https://logo.clearbit.com/picsart.com',
  beautifulai:   'https://logo.clearbit.com/beautiful.ai',
  veed:          'https://logo.clearbit.com/veed.io',
  sketchup:      'https://logo.clearbit.com/sketchup.com',
  corel:         'https://logo.clearbit.com/corel.com',
  autocad:       'https://logo.clearbit.com/autodesk.com',
  autodesk:      'https://logo.clearbit.com/autodesk.com',
  retouch4me:    'https://logo.clearbit.com/retouch4me.com',
  elsa:          'https://logo.clearbit.com/elsaspeak.com',
  ejoy:          'https://logo.clearbit.com/ejoy.com',
  quillbot:      'https://logo.clearbit.com/quillbot.com',
  memrise:       'https://logo.clearbit.com/memrise.com',
  hellochinese:  'https://logo.clearbit.com/hellochinese.com',
  quizlet:       'https://logo.clearbit.com/quizlet.com',
  codecademy:    'https://logo.clearbit.com/codecademy.com',
  studocu:       'https://logo.clearbit.com/studocu.com',
  datacamp:      'https://logo.clearbit.com/datacamp.com',
  chegg:         'https://logo.clearbit.com/chegg.com',
  kahoot:        'https://logo.clearbit.com/kahoot.com',
  wordwall:      'https://logo.clearbit.com/wordwall.net',
  quizizz:       'https://logo.clearbit.com/quizizz.com',
  scribd:        'https://logo.clearbit.com/scribd.com',
  busuu:         'https://logo.clearbit.com/busuu.com',
  'galaxy-play': 'https://logo.clearbit.com/galaxyplay.vn',
  tv360:         'https://logo.clearbit.com/tv360.vn',
  vtvcab:        'https://logo.clearbit.com/vtvcabon.vn',
  youku:         'https://logo.clearbit.com/youku.com',
  'fpt-play':    'https://logo.clearbit.com/fptplay.vn',
  iqiyi:         'https://logo.clearbit.com/iqiyi.com',
  vieon:         'https://logo.clearbit.com/vieon.vn',
  gamma:         'https://logo.clearbit.com/gamma.app',
  turnitin:      'https://logo.clearbit.com/turnitin.com',
  tradingview:   'https://logo.clearbit.com/tradingview.com',
  camscanner:    'https://logo.clearbit.com/camscanner.com',
  expressvpn:    'https://logo.clearbit.com/expressvpn.com',
  pia:           'https://logo.clearbit.com/privateinternetaccess.com',
  hma:           'https://logo.clearbit.com/hidemyass.com',
  'hotspot-shield': 'https://logo.clearbit.com/hotspotshield.com',
  lastpass:      'https://logo.clearbit.com/lastpass.com',
  '1password':   'https://logo.clearbit.com/1password.com',
  vietmap:       'https://logo.clearbit.com/vietmap.vn',
  bumble:        'https://logo.clearbit.com/bumble.com',
  leonardo:      'https://logo.clearbit.com/leonardo.ai',
  elevenlabs:    'https://logo.clearbit.com/elevenlabs.io',
  'apple-music': 'https://logo.clearbit.com/apple.com',
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
