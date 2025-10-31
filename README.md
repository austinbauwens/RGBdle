# RGB Wordle

A color guessing game inspired by Wordle, where players guess RGB color values to match a target color.

## How to Play

1. You start with 3 pre-filled digits (one from each RGB component) that are randomly positioned
2. Type digits (0-9) to fill in the remaining positions
3. Press Enter or click Submit to make a guess
4. Get feedback for each RGB component:
   - ✓ = Perfect match
   - ↓ = Too high (need to decrease)
   - ↑ = Too low (need to increase)
   - More arrows = further from correct value
5. Correct digits are locked and preserved for your next guess
6. You have 6 attempts to guess the exact RGB values

## Features

- **Component-level feedback**: See if each R, G, B value is too high or too low
- **Temperature indicator**: Visual percentage showing how close you are overall
- **Dynamic background**: Background matches the target color you're guessing
- **Live color preview**: See the color as you type
- **Satisfying animations**: Visual feedback on every action

## Setup

Simply open `index.html` in a web browser - no build step required!

## Technology

- Pure HTML, CSS, and JavaScript
- No dependencies or frameworks
- Responsive design

