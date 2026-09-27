#!/bin/zsh
# Mac replacement for _generate_thumbs.bat / _bajar_calidad.bat.
# Uses sips (built into macOS), no ImageMagick needed.
#
# Usage (from images/posts):
#   ./_generate_thumbs.sh 2026_argamasilla 2026_villanueva
#   ./_generate_thumbs.sh --reduce 2026_argamasilla   # also shrink originals to max 1920px
#
# Thumbs: max 800px, quality 75, written to <folder>/thumbs/
# Reduce: originals larger than 1920px are resized in place, quality 80

reduce=0
if [[ "$1" == "--reduce" ]]; then reduce=1; shift; fi
if [[ $# -eq 0 ]]; then echo "Usage: $0 [--reduce] folder [folder...]"; exit 1; fi

cd "${0:A:h}"
setopt null_glob

max_dim() { sips -g pixelWidth -g pixelHeight "$1" | awk '/pixel/{if($2>m)m=$2}END{print m}'; }

for dir in "$@"; do
  dir=${dir%/}
  mkdir -p "$dir/thumbs"
  for f in "$dir"/*.{jpg,jpeg,JPG,JPEG,png,PNG}; do
    if (( reduce )) && (( $(max_dim "$f") > 1920 )); then
      sips -Z 1920 -s formatOptions 80 "$f" >/dev/null
    fi
    out="$dir/thumbs/${f:t}"
    if (( $(max_dim "$f") > 800 )); then
      sips -Z 800 -s formatOptions 75 "$f" --out "$out" >/dev/null
    else
      cp "$f" "$out"
    fi
    echo "$out"
  done
done
