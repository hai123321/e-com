interface ServiceConfig {
  icon: string
  bg: string
}

const SERVICE_MAP: Record<string, ServiceConfig> = {
  netflix:     { icon: '🎬', bg: 'from-red-700 to-red-900' },
  youtube:     { icon: '▶️',  bg: 'from-red-500 to-red-700' },
  spotify:     { icon: '🎵', bg: 'from-green-500 to-green-700' },
  chatgpt:     { icon: '🤖', bg: 'from-teal-500 to-teal-700' },
  openai:      { icon: '🤖', bg: 'from-teal-500 to-teal-700' },
  claude:      { icon: '🧠', bg: 'from-orange-500 to-orange-700' },
  anthropic:   { icon: '🧠', bg: 'from-orange-500 to-orange-700' },
  gemini:      { icon: '✨', bg: 'from-blue-500 to-purple-600' },
  copilot:     { icon: '💡', bg: 'from-blue-600 to-indigo-700' },
  perplexity:  { icon: '🔍', bg: 'from-teal-600 to-cyan-700' },
  midjourney:  { icon: '🎨', bg: 'from-purple-700 to-purple-900' },
  duolingo:    { icon: '🦜', bg: 'from-green-400 to-green-700' },
  coursera:    { icon: '🎓', bg: 'from-blue-600 to-blue-800' },
  skillshare:  { icon: '🖌️', bg: 'from-purple-500 to-purple-700' },
  linkedin:    { icon: '💼', bg: 'from-blue-700 to-blue-900' },
  udemy:       { icon: '📖', bg: 'from-violet-600 to-violet-800' },
  grammarly:   { icon: '✍️', bg: 'from-green-600 to-green-800' },
  canva:       { icon: '🎨', bg: 'from-teal-400 to-cyan-600' },
  capcut:      { icon: '🎬', bg: 'from-gray-600 to-gray-900' },
  adobe:       { icon: '🖼️', bg: 'from-red-700 to-red-900' },
  figma:       { icon: '✏️', bg: 'from-purple-500 to-pink-600' },
  nordvpn:     { icon: '🔒', bg: 'from-blue-600 to-blue-900' },
  expressvpn:  { icon: '🔐', bg: 'from-red-500 to-red-800' },
  surfshark:   { icon: '🦈', bg: 'from-teal-600 to-teal-800' },
  google:      { icon: '☁️', bg: 'from-blue-500 to-blue-700' },
  dropbox:     { icon: '💾', bg: 'from-blue-600 to-blue-800' },
  onedrive:    { icon: '📁', bg: 'from-blue-500 to-indigo-600' },
  icloud:      { icon: '☁️', bg: 'from-sky-400 to-blue-600' },
  notion:      { icon: '📝', bg: 'from-gray-600 to-gray-800' },
  hbo:         { icon: '📺', bg: 'from-indigo-600 to-indigo-900' },
  disney:      { icon: '🎠', bg: 'from-blue-700 to-blue-900' },
  apple:       { icon: '🍎', bg: 'from-gray-600 to-gray-900' },
}

const CATEGORY_MAP: Record<string, ServiceConfig> = {
  'AI':        { icon: '🤖', bg: 'from-purple-600 to-purple-900' },
  'Streaming': { icon: '📺', bg: 'from-red-600 to-red-900' },
  'Học tập':   { icon: '📚', bg: 'from-blue-600 to-blue-900' },
  'Thiết kế':  { icon: '🎨', bg: 'from-teal-500 to-teal-800' },
  'VPN':       { icon: '🔒', bg: 'from-gray-700 to-gray-900' },
  'Năng suất': { icon: '⚡', bg: 'from-orange-500 to-orange-800' },
  'Lưu trữ':  { icon: '💾', bg: 'from-green-600 to-green-900' },
  'Khác':      { icon: '📦', bg: 'from-indigo-500 to-indigo-800' },
}

export function getServiceConfig(name: string, category?: string): ServiceConfig {
  const nameLower = name.toLowerCase()
  for (const [key, cfg] of Object.entries(SERVICE_MAP)) {
    if (nameLower.includes(key)) return cfg
  }
  if (category && CATEGORY_MAP[category]) return CATEGORY_MAP[category]
  return { icon: '⭐', bg: 'from-primary-600 to-primary-900' }
}
