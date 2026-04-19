#!/usr/bin/env bash
# Download product-group logos from Clearbit CDN (256×256 JPEG).
# Usage:  bash scripts/download-logos.sh [target-dir]
# Default target-dir: public/logos
set -uo pipefail

DEST="${1:-public/logos}"
mkdir -p "$DEST"

declare -A LOGOS=(
  [1password]="1password.com"
  [adobe]="adobe.com"
  [apple-music]="apple.com"
  [autocad]="autodesk.com"
  [autodesk]="autodesk.com"
  [beautifulai]="beautiful.ai"
  [bumble]="bumble.com"
  [busuu]="busuu.com"
  [camscanner]="camscanner.com"
  [canva]="canva.com"
  [capcut]="capcut.com"
  [chatgpt]="openai.com"
  [chegg]="chegg.com"
  [chess]="chess.com"
  [claude]="anthropic.com"
  [codecademy]="codecademy.com"
  [copilot]="microsoft.com"
  [corel]="corel.com"
  [coursera]="coursera.org"
  [cursor]="cursor.com"
  [datacamp]="datacamp.com"
  [davinci]="blackmagicdesign.com"
  [discord]="discord.com"
  [dropbox]="dropbox.com"
  [duolingo]="duolingo.com"
  [ejoy]="ejoy.com"
  [elevenlabs]="elevenlabs.io"
  [elsa]="elsaspeak.com"
  [expressvpn]="expressvpn.com"
  [figma]="figma.com"
  [filmora]="filmora.wondershare.com"
  [fpt-play]="fptplay.vn"
  [galaxy-play]="galaxyplay.vn"
  [gamma]="gamma.app"
  [gemini]="google.com"
  [google-meet]="google.com"
  [google-one]="google.com"
  [grammarly]="grammarly.com"
  [grok]="x.com"
  [hailuo]="hailuoai.com"
  [hellochinese]="hellochinese.com"
  [heygen]="heygen.com"
  [higgsfield]="higgsfield.ai"
  [hma]="hidemyass.com"
  [hotspot-shield]="hotspotshield.com"
  [icloud]="apple.com"
  [iqiyi]="iqiyi.com"
  [jetbrains]="jetbrains.com"
  [kahoot]="kahoot.com"
  [kaspersky]="kaspersky.com"
  [kling]="klingai.com"
  [krea]="krea.ai"
  [krisp]="krisp.ai"
  [lastpass]="lastpass.com"
  [leetcode]="leetcode.com"
  [leonardo]="leonardo.ai"
  [lightroom]="adobe.com"
  [linkedin]="linkedin.com"
  [meitu]="meitu.com"
  [memrise]="memrise.com"
  [midjourney]="midjourney.com"
  [netflix]="netflix.com"
  [nordvpn]="nordvpn.com"
  [notion]="notion.so"
  [office365]="microsoft.com"
  [onedrive]="microsoft.com"
  [perplexity]="perplexity.ai"
  [pia]="privateinternetaccess.com"
  [picsart]="picsart.com"
  [quillbot]="quillbot.com"
  [quizizz]="quizizz.com"
  [quizlet]="quizlet.com"
  [retouch4me]="retouch4.me"
  [runway]="runwayml.com"
  [scribd]="scribd.com"
  [sketchup]="sketchup.com"
  [skillshare]="skillshare.com"
  [spotify]="spotify.com"
  [studocu]="studocu.com"
  [tidal]="tidal.com"
  [tinder]="tinder.com"
  [tradingview]="tradingview.com"
  [turnitin]="turnitin.com"
  [tv360]="tv360.vn"
  [udemy]="udemy.com"
  [veed]="veed.io"
  [veo3]="deepmind.google.com"
  [vieon]="vieon.vn"
  [vietmap]="vietmap.vn"
  [vtvcab]="vtvcab.vn"
  [windows]="microsoft.com"
  [wordwall]="wordwall.net"
  [youku]="youku.com"
  [youtube]="youtube.com"
  [zoom]="zoom.us"
)

ok=0; fail=0
for key in "${!LOGOS[@]}"; do
  domain="${LOGOS[$key]}"
  out="$DEST/${key}.jpg"
  if [[ -f "$out" ]]; then
    echo "  skip  $key (already exists)"
    ok=$((ok+1)); continue
  fi
  if curl -sfL --max-time 10 \
       "https://logo.clearbit.com/${domain}?size=256" \
       -o "$out"; then
    echo "  ✓  $key"
    ok=$((ok+1))
  else
    echo "  ✗  $key (${domain})"
    rm -f "$out"
    fail=$((fail+1))
  fi
done

echo ""
echo "Done: ${ok} ok, ${fail} failed"
echo "Logos saved to ${DEST}/"
# Exit 0 even if some logos failed — clearbit CDN fallback handles missing files
exit 0
