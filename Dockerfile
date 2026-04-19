# ── Stage 1: Dependencies ─────────────────────────────────────────────────────
FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

# ── Stage 2: Build ────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
# NEXT_PUBLIC_* vars must be available at build time (baked into JS bundle)
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
RUN npm run build

# ── Download product-group logos from Clearbit (baked into image) ─────────────
# Uses wget (built-in to alpine). Each logo is fetched once at build time so
# the API route serves them locally without any external redirect at runtime.
RUN mkdir -p public/logos && \
  for pair in \
    "1password:1password.com" "adobe:adobe.com" "apple-music:apple.com" \
    "autocad:autodesk.com" "autodesk:autodesk.com" "beautifulai:beautiful.ai" \
    "bumble:bumble.com" "busuu:busuu.com" "camscanner:camscanner.com" \
    "canva:canva.com" "capcut:capcut.com" "chatgpt:openai.com" \
    "chegg:chegg.com" "chess:chess.com" "claude:anthropic.com" \
    "codecademy:codecademy.com" "copilot:microsoft.com" "corel:corel.com" \
    "coursera:coursera.org" "cursor:cursor.com" "datacamp:datacamp.com" \
    "davinci:blackmagicdesign.com" "discord:discord.com" "dropbox:dropbox.com" \
    "duolingo:duolingo.com" "ejoy:ejoy.com" "elevenlabs:elevenlabs.io" \
    "elsa:elsaspeak.com" "expressvpn:expressvpn.com" "figma:figma.com" \
    "filmora:filmora.wondershare.com" "fpt-play:fptplay.vn" "galaxy-play:galaxyplay.vn" \
    "gamma:gamma.app" "gemini:google.com" "google-meet:google.com" \
    "google-one:google.com" "grammarly:grammarly.com" "grok:x.com" \
    "hailuo:hailuoai.com" "hellochinese:hellochinese.com" "heygen:heygen.com" \
    "higgsfield:higgsfield.ai" "hma:hidemyass.com" "hotspot-shield:hotspotshield.com" \
    "icloud:apple.com" "iqiyi:iqiyi.com" "jetbrains:jetbrains.com" \
    "kahoot:kahoot.com" "kaspersky:kaspersky.com" "kling:klingai.com" \
    "krea:krea.ai" "krisp:krisp.ai" "lastpass:lastpass.com" \
    "leetcode:leetcode.com" "leonardo:leonardo.ai" "lightroom:adobe.com" \
    "linkedin:linkedin.com" "meitu:meitu.com" "memrise:memrise.com" \
    "midjourney:midjourney.com" "netflix:netflix.com" "nordvpn:nordvpn.com" \
    "notion:notion.so" "office365:microsoft.com" "onedrive:microsoft.com" \
    "perplexity:perplexity.ai" "pia:privateinternetaccess.com" "picsart:picsart.com" \
    "quillbot:quillbot.com" "quizizz:quizizz.com" "quizlet:quizlet.com" \
    "retouch4me:retouch4.me" "runway:runwayml.com" "scribd:scribd.com" \
    "sketchup:sketchup.com" "skillshare:skillshare.com" "spotify:spotify.com" \
    "studocu:studocu.com" "tidal:tidal.com" "tinder:tinder.com" \
    "tradingview:tradingview.com" "turnitin:turnitin.com" "tv360:tv360.vn" \
    "udemy:udemy.com" "veed:veed.io" "veo3:deepmind.google.com" \
    "vieon:vieon.vn" "vietmap:vietmap.vn" "vtvcab:vtvcab.vn" \
    "windows:microsoft.com" "wordwall:wordwall.net" "youku:youku.com" \
    "youtube:youtube.com" "zoom:zoom.us" \
  ; do \
    key="${pair%%:*}"; domain="${pair#*:}"; \
    out="public/logos/${key}.jpg"; \
    [ -f "$out" ] && continue; \
    wget -qO "$out" "https://logo.clearbit.com/${domain}?size=256" 2>/dev/null \
      && echo "  ✓ $key" || { rm -f "$out"; echo "  ✗ $key"; }; \
  done

# ── Stage 3: Production ────────────────────────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs && \
    adduser  --system --uid 1001 nextjs

COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s \
  CMD wget -qO- http://localhost:3000/ || exit 1

CMD ["node", "server.js"]
