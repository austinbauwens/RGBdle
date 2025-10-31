# Sound Files

This directory contains the sound effects for the game. The game will automatically use these files if they exist, otherwise it falls back to programmatically generated sounds.

## Recommended Sources for Satisfying Sounds

### GitHub Repositories

1. **Kenney Assets** - High quality game assets
   - Repository: Check https://kenney.nl/assets/ui-audio
   - Free CC0 license (public domain)

2. **Mixkit** - Free sound effects (no attribution required)
   - Typing/Click: https://mixkit.co/free-sound-effects/click/
   - Success/Win: https://mixkit.co/free-sound-effects/game-win/
   - UI feedback: https://mixkit.co/free-sound-effects/ui/

3. **Freesound** (https://freesound.org)
   - Search for: "ui click", "button click", "game success"
   - Filter by CC0 license for no attribution
   - Direct downloads available

4. **Zapsplat** (https://www.zapsplat.com)
   - Free account required (free for non-commercial)
   - Large collection of UI sounds
   - Search: "ui click", "button press", "success"

## Sound Files Needed

Place these files in this `sounds/` directory:

- `typing.mp3` or `typing.wav` - Short click/tap sound (0.05-0.1s duration)
- `win.mp3` or `win.wav` - Satisfying success sound (0.5-1s duration)
- `very-close.mp3` or `very-close.wav` - Pleasant ascending sound (0.2-0.3s)
- `close.mp3` or `close.wav` - Neutral feedback sound (0.15-0.2s)
- `far.mp3` or `far.wav` - Lower/descending sound (0.2-0.25s)

## File Format

- Supports both `.mp3` and `.wav` formats
- Files are automatically loaded when placed in this directory
- If files don't exist, the game uses programmatically generated sounds as fallback

## Quick Setup from Mixkit

1. Visit https://mixkit.co/free-sound-effects/
2. Download:
   - A "click" or "tap" sound for typing
   - A "game win" or "success" sound
   - UI feedback sounds for close/far feedback
3. Rename and place in this directory following the naming above
4. The game will automatically detect and use them!

