class RGBWordleGame {
    constructor() {
        this.answer = this.generateRandomRGB();
        this.guesses = [];
        this.fixedPositions = new Set(); // Track which positions are fixed/pre-filled
        const initialData = this.getInitialGuess();
        this.currentGuess = initialData.guess;
        this.fixedPositions = initialData.fixedPositions;
        this.maxAttempts = 6;
        this.gameOver = false;
        this.won = false;
        this.audioContext = null;
        this.soundFiles = {
            typing: 'sounds/typing.wav',
            win: 'sounds/win.wav',
            veryClose: 'sounds/very-close.wav',
            close: 'sounds/close.wav',
            far: 'sounds/far.wav'
        };
        this.audioBuffers = {};

        this.initializeElements();
        this.setupEventListeners();
        this.updateDisplay();
        this.initAudio();
    }

    initAudio() {
        // Initialize audio context (needs user interaction, so lazy init)
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
            console.warn('Web Audio API not supported');
        }
        
        // Preload sound files if they exist
        this.preloadSounds();
    }

    async preloadSounds() {
        if (!this.audioContext) return;
        
        for (const [key, path] of Object.entries(this.soundFiles)) {
            try {
                const response = await fetch(path);
                if (response.ok) {
                    const arrayBuffer = await response.arrayBuffer();
                    const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
                    this.audioBuffers[key] = audioBuffer;
                }
            } catch (e) {
                // Sound file doesn't exist, will fall back to programmatic sounds
                console.log(`Sound file not found: ${path}, using programmatic sound`);
            }
        }
    }

    playSoundFile(soundKey) {
        if (!this.audioContext || !this.audioBuffers[soundKey]) {
            return false; // File not loaded, return false to use fallback
        }
        
        this.ensureAudioContext();
        
        try {
            const source = this.audioContext.createBufferSource();
            const gainNode = this.audioContext.createGain();
            
            source.buffer = this.audioBuffers[soundKey];
            source.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            gainNode.gain.setValueAtTime(0.5, this.audioContext.currentTime);
            
            source.start(0);
            return true;
        } catch (e) {
            console.warn(`Error playing sound file: ${soundKey}`, e);
            return false;
        }
    }

    ensureAudioContext() {
        if (!this.audioContext) {
            this.initAudio();
        }
        // AudioContext needs to be resumed after user interaction
        if (this.audioContext && this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
    }

    // Minimal, satisfying typing sound
    playTypingSound() {
        // Try to play sound file first, fall back to programmatic sound
        if (this.playSoundFile('typing')) {
            return;
        }
        
        // Fallback to programmatic sound
        if (!this.audioContext) return;
        this.ensureAudioContext();

        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(800, this.audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(600, this.audioContext.currentTime + 0.05);

        gainNode.gain.setValueAtTime(0.15, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.05);

        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + 0.05);
    }

    // Satisfying win sound - arpeggio with major chord
    playWinSound() {
        // Try to play sound file first, fall back to programmatic sound
        if (this.playSoundFile('win')) {
            return;
        }
        
        // Fallback to programmatic sound
        if (!this.audioContext) return;
        this.ensureAudioContext();

        const now = this.audioContext.currentTime;
        
        // Major chord: C4, E4, G4 (261.63, 329.63, 392.00 Hz)
        const frequencies = [523.25, 659.25, 783.99]; // C5, E5, G5 (one octave higher for more satisfying sound)
        
        frequencies.forEach((freq, index) => {
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(freq, now);
            
            const startTime = now + (index * 0.1); // Staggered start for arpeggio effect
            const duration = 0.4;
            
            gainNode.gain.setValueAtTime(0, startTime);
            gainNode.gain.linearRampToValueAtTime(0.25, startTime + 0.05);
            gainNode.gain.linearRampToValueAtTime(0.2, startTime + duration - 0.1);
            gainNode.gain.linearRampToValueAtTime(0, startTime + duration);
            
            oscillator.start(startTime);
            oscillator.stop(startTime + duration);
        });
    }

    // Sound for very close guesses (>80% match) - pleasant ascending major third
    playVeryCloseSound() {
        // Try to play sound file first, fall back to programmatic sound
        if (this.playSoundFile('veryClose')) {
            return;
        }
        
        // Fallback to programmatic sound
        if (!this.audioContext) return;
        this.ensureAudioContext();

        const now = this.audioContext.currentTime;
        const oscillator1 = this.audioContext.createOscillator();
        const oscillator2 = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();

        oscillator1.connect(gainNode);
        oscillator2.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        // Major third interval for pleasant sound
        oscillator1.type = 'sine';
        oscillator2.type = 'sine';
        oscillator1.frequency.setValueAtTime(523.25, now); // C5
        oscillator1.frequency.exponentialRampToValueAtTime(659.25, now + 0.25); // E5
        oscillator2.frequency.setValueAtTime(659.25, now); // E5
        oscillator2.frequency.exponentialRampToValueAtTime(783.99, now + 0.25); // G5

        gainNode.gain.setValueAtTime(0, now);
        gainNode.gain.linearRampToValueAtTime(0.22, now + 0.05);
        gainNode.gain.linearRampToValueAtTime(0, now + 0.25);

        oscillator1.start(now);
        oscillator1.stop(now + 0.25);
        oscillator2.start(now);
        oscillator2.stop(now + 0.25);
    }

    // Sound for close guesses (50-80% match) - neutral tone, slight rise
    playCloseSound() {
        // Try to play sound file first, fall back to programmatic sound
        if (this.playSoundFile('close')) {
            return;
        }
        
        // Fallback to programmatic sound
        if (!this.audioContext) return;
        this.ensureAudioContext();

        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(440, this.audioContext.currentTime); // A4
        oscillator.frequency.exponentialRampToValueAtTime(494, this.audioContext.currentTime + 0.18); // B4

        gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.18, this.audioContext.currentTime + 0.05);
        gainNode.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + 0.18);

        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + 0.18);
    }

    // Sound for far guesses (<50% match) - lower, more dissonant descending tone
    playFarSound() {
        // Try to play sound file first, fall back to programmatic sound
        if (this.playSoundFile('far')) {
            return;
        }
        
        // Fallback to programmatic sound
        if (!this.audioContext) return;
        this.ensureAudioContext();

        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        oscillator.type = 'triangle'; // Triangle wave for slightly harsher sound
        oscillator.frequency.setValueAtTime(277.18, this.audioContext.currentTime); // C#4 (lower)
        oscillator.frequency.exponentialRampToValueAtTime(220, this.audioContext.currentTime + 0.22); // A3 (even lower)

        gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.15, this.audioContext.currentTime + 0.05);
        gainNode.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + 0.22);

        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + 0.22);
    }
    
    getInitialGuess() {
        // Pre-fill 1 random digit from each RGB component (3 digits total)
        // Ensure the initial guess color is far enough from target (not too close)
        const answerStr = this.answer;
        const answerRGB = this.parseRGBString(this.answer);
        let initialGuess, fixedPositions, initialRGB;
        let attempts = 0;
        const maxAttempts = 20;
        const minDistance = 100; // Minimum color distance required
        
        do {
            // Start fresh for each attempt
            initialGuess = '         '.split(''); // 9 spaces
            fixedPositions = new Set();
            
            // R component (positions 0-2): randomly pick one position
            const rPos = Math.floor(Math.random() * 3);
            initialGuess[rPos] = answerStr[rPos];
            fixedPositions.add(rPos);
            
            // G component (positions 3-5): randomly pick one position
            const gPos = 3 + Math.floor(Math.random() * 3);
            initialGuess[gPos] = answerStr[gPos];
            fixedPositions.add(gPos);
            
            // B component (positions 6-8): randomly pick one position
            const bPos = 6 + Math.floor(Math.random() * 3);
            initialGuess[bPos] = answerStr[bPos];
            fixedPositions.add(bPos);
            
            // Calculate the color of the initial guess (using 0 for empty positions)
            const guessStr = initialGuess.join('').replace(/\s/g, '0');
            initialRGB = this.parseRGBString(guessStr);
            
            // Calculate distance between initial guess and target
            const rDiff = initialRGB.r - answerRGB.r;
            const gDiff = initialRGB.g - answerRGB.g;
            const bDiff = initialRGB.b - answerRGB.b;
            const distance = Math.sqrt(rDiff * rDiff + gDiff * gDiff + bDiff * bDiff);
            
            attempts++;
            
            // If distance is sufficient or we've tried too many times, use this guess
            if (distance >= minDistance || attempts >= maxAttempts) {
                break;
            }
        } while (attempts < maxAttempts);
        
        return {
            guess: initialGuess.join(''),
            fixedPositions: fixedPositions
        };
    }

    initializeElements() {
        this.targetColorEl = document.getElementById('targetColor');
        this.guessesContainerEl = document.getElementById('guessesContainer');
        this.currentGuessEl = document.getElementById('currentGuess'); // Keep for backward compatibility
        this.rgbDigitsEls = {
            r: document.querySelector('.rgb-digits[data-component="r"]'),
            g: document.querySelector('.rgb-digits[data-component="g"]'),
            b: document.querySelector('.rgb-digits[data-component="b"]')
        };
        this.rgbProgressFills = {
            r: document.querySelector('.rgb-progress-fill[data-component="r"]'),
            g: document.querySelector('.rgb-progress-fill[data-component="g"]'),
            b: document.querySelector('.rgb-progress-fill[data-component="b"]')
        };
        this.currentColorPreviewEl = document.getElementById('currentColorPreview');
        this.currentRgbDisplayEl = document.getElementById('currentRgbDisplay');
        this.submitBtnEl = document.getElementById('submitBtn');
        this.newGameBtnEl = document.getElementById('newGameBtn');
        this.messageAreaEl = document.getElementById('messageArea');
        this.numpadEl = document.getElementById('numpad');
        this.numpadBackspaceEl = document.getElementById('numpadBackspace');
        this.numpadEnterEl = document.getElementById('numpadEnter');

        // Set target color
        const rgb = this.parseRGBString(this.answer);
        const targetColor = this.rgbToHex(rgb.r, rgb.g, rgb.b);
        
        // Set target color preview - use exact same color
        this.targetColorEl.style.backgroundColor = targetColor;
        
        // Set background to exact same color value
        document.body.style.background = targetColor;
        document.body.style.backgroundColor = targetColor;
        
        // Calculate best text color for contrast (WCAG compliant)
        const bestTextColor = this.getBestTextColor(rgb);
        const textColorHex = this.rgbToHex(bestTextColor.r, bestTextColor.g, bestTextColor.b);
        
        // Update body and container text color
        document.body.style.color = textColorHex;
        const container = document.querySelector('.container');
        if (container) {
            container.style.color = textColorHex;
        }
    }

    generateRandomRGB() {
        // Generate RGB as 9-digit string: RRRGGGBBB (each 000-255)
        const r = Math.floor(Math.random() * 256);
        const g = Math.floor(Math.random() * 256);
        const b = Math.floor(Math.random() * 256);
        return `${r.toString().padStart(3, '0')}${g.toString().padStart(3, '0')}${b.toString().padStart(3, '0')}`;
    }

    parseRGBString(rgbString) {
        // Convert "123045067" to {r: 123, g: 45, b: 67}
        // Handle spaces by replacing with '0' for parsing
        const cleaned = rgbString.replace(/\s/g, '0');
        return {
            r: parseInt(cleaned.substring(0, 3)) || 0,
            g: parseInt(cleaned.substring(3, 6)) || 0,
            b: parseInt(cleaned.substring(6, 9)) || 0
        };
    }

    rgbToHex(r, g, b) {
        return `#${[r, g, b].map(x => {
            const hex = x.toString(16);
            return hex.length === 1 ? '0' + hex : hex;
        }).join('')}`;
    }

    formatRGBDisplay(rgbString) {
        const rgb = this.parseRGBString(rgbString);
        return `RGB(${rgb.r}, ${rgb.g}, ${rgb.b})`;
    }

    // Calculate relative luminance per WCAG 2.1
    getRelativeLuminance(r, g, b) {
        const [rs, gs, bs] = [r, g, b].map(val => {
            val = val / 255;
            return val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4);
        });
        return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
    }

    // Calculate contrast ratio per WCAG 2.1
    getContrastRatio(color1Rgb, color2Rgb) {
        const l1 = this.getRelativeLuminance(color1Rgb.r, color1Rgb.g, color1Rgb.b);
        const l2 = this.getRelativeLuminance(color2Rgb.r, color2Rgb.g, color2Rgb.b);
        const lighter = Math.max(l1, l2);
        const darker = Math.min(l1, l2);
        return (lighter + 0.05) / (darker + 0.05);
    }

    // Get best text color (white or black) for background based on contrast
    getBestTextColor(backgroundColorRgb) {
        const white = { r: 255, g: 255, b: 255 };
        const black = { r: 0, g: 0, b: 0 };
        
        const whiteContrast = this.getContrastRatio(backgroundColorRgb, white);
        const blackContrast = this.getContrastRatio(backgroundColorRgb, black);
        
        // Return the color with higher contrast ratio (meets WCAG AA for large text if >= 3:1)
        return whiteContrast > blackContrast ? white : black;
    }

    setupEventListeners() {
        // Initialize audio on first user interaction
        const initAudioOnInteraction = () => {
            this.ensureAudioContext();
            document.removeEventListener('click', initAudioOnInteraction);
            document.removeEventListener('keydown', initAudioOnInteraction);
        };
        document.addEventListener('click', initAudioOnInteraction);
        document.addEventListener('keydown', initAudioOnInteraction);

        // Keyboard input
        document.addEventListener('keydown', (e) => this.handleKeyPress(e));

        // Submit button
        this.submitBtnEl.addEventListener('click', () => this.submitGuess());

        // New game button
        this.newGameBtnEl.addEventListener('click', () => this.newGame());

        // Numpad buttons
        const numpadButtons = this.numpadEl.querySelectorAll('.numpad-btn[data-digit]');
        numpadButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const digit = btn.getAttribute('data-digit');
                this.addCharacter(digit);
            });
        });

        // Numpad backspace
        this.numpadBackspaceEl.addEventListener('click', () => {
            this.removeLastCharacter();
        });

        // Numpad enter
        this.numpadEnterEl.addEventListener('click', () => {
            this.submitGuess();
        });
    }

    handleKeyPress(e) {
        if (this.gameOver) return;

        const key = e.key.toUpperCase();

        if (key === 'ENTER' || key === 'RETURN') {
            this.submitGuess();
            return;
        }

        if (key === 'BACKSPACE' || key === 'DELETE') {
            this.removeLastCharacter();
            return;
        }

        // Check if valid digit
        if (/[0-9]/.test(key)) {
            this.addCharacter(key);
        }
    }

    // Validate if a digit can be placed at a given position (RGB values are 0-255)
    isValidDigit(digit, position, guessArray) {
        const digitValue = parseInt(digit);
        
        // Determine which component this position belongs to (R, G, or B)
        const componentStart = Math.floor(position / 3) * 3;
        const positionInComponent = position % 3; // 0 = hundreds, 1 = tens, 2 = ones
        
        // Get current digits for this component
        const hundreds = guessArray[componentStart] !== ' ' ? parseInt(guessArray[componentStart]) : null;
        const tens = guessArray[componentStart + 1] !== ' ' ? parseInt(guessArray[componentStart + 1]) : null;
        
        if (positionInComponent === 0) {
            // First digit (hundreds): can only be 0, 1, or 2
            return digitValue >= 0 && digitValue <= 2;
        } else if (positionInComponent === 1) {
            // Second digit (tens)
            if (hundreds === 2) {
                // If hundreds is 2, tens can only be 0-5 (since max is 255)
                return digitValue >= 0 && digitValue <= 5;
            } else {
                // If hundreds is 0 or 1, or doesn't exist yet, tens can be 0-9
                return digitValue >= 0 && digitValue <= 9;
            }
        } else {
            // Third digit (ones)
            // Check if we have "25" already (both hundreds and tens exist and form 25)
            if (hundreds === 2 && tens !== null && tens === 5) {
                // If we have 25X, ones can only be 0-5 (since max is 255)
                return digitValue >= 0 && digitValue <= 5;
            } else {
                // Otherwise, ones can be 0-9
                return digitValue >= 0 && digitValue <= 9;
            }
        }
    }

    addCharacter(char) {
        // Find the first empty position (space) that is not fixed
        const guessArray = this.currentGuess.split('');
        
        // If we have less than 9 characters, pad with spaces
        while (guessArray.length < 9) {
            guessArray.push(' ');
        }
        
        // Find first empty position that is not fixed
        const emptyIndex = guessArray.findIndex((c, idx) => (c === ' ' || !c) && !this.fixedPositions.has(idx));
        
        if (emptyIndex !== -1) {
            // Validate if this digit can be placed at this position
            if (!this.isValidDigit(char, emptyIndex, guessArray)) {
                return; // Invalid digit for this position
            }
            
            guessArray[emptyIndex] = char;
            this.currentGuess = guessArray.join('');
            
            // Play typing sound
            this.playTypingSound();
            
            // Add typing animation
            const cell = this.getCellAtIndex(emptyIndex);
            if (cell) {
                cell.classList.add('typing');
                setTimeout(() => cell.classList.remove('typing'), 300);
            }
            
            this.updateCurrentGuessDisplay();
            this.updateSubmitButton();
        }
    }

    // Helper to get cell by index in the new grouped structure
    getCellAtIndex(index) {
        let component, localIndex;
        if (index < 3) {
            component = 'r';
            localIndex = index;
        } else if (index < 6) {
            component = 'g';
            localIndex = index - 3;
        } else {
            component = 'b';
            localIndex = index - 6;
        }
        
        const groupEl = this.rgbDigitsEls[component];
        if (groupEl && groupEl.children[localIndex]) {
            return groupEl.children[localIndex];
        }
        return null;
    }

    removeLastCharacter() {
        const guessArray = this.currentGuess.split('');
        
        // Find the last non-empty, non-fixed position
        for (let i = guessArray.length - 1; i >= 0; i--) {
            if (guessArray[i] && guessArray[i] !== ' ' && !this.fixedPositions.has(i)) {
                guessArray[i] = ' ';
                this.currentGuess = guessArray.join('');
                this.updateCurrentGuessDisplay();
                this.updateSubmitButton();
                break;
            }
        }
    }

    updateCurrentGuessDisplay() {
        const guessArray = this.currentGuess.split('');
        let hasChanges = false;
        
        // Clean up invalid digits that violate RGB constraints (0-255)
        for (let i = 0; i < 9; i++) {
            if (guessArray[i] && guessArray[i] !== ' ' && !this.fixedPositions.has(i)) {
                if (!this.isValidDigit(guessArray[i], i, guessArray)) {
                    // This digit is invalid, clear it
                    guessArray[i] = ' ';
                    hasChanges = true;
                }
            }
        }
        
        if (hasChanges) {
            this.currentGuess = guessArray.join('');
        }
        
        // Update all cells in the grouped structure
        for (let i = 0; i < 9; i++) {
            const cell = this.getCellAtIndex(i);
            if (cell) {
                const char = this.currentGuess[i];
                cell.textContent = (char && char !== ' ') ? char : '';
                cell.classList.toggle('filled', (char && char !== ' '));
            }
        }

        // Update RGB display with actual digits (using 0 for missing)
        let display = 'RGB(';
        const rStr = this.currentGuess.substring(0, 3).replace(/\s/g, '0');
        const gStr = this.currentGuess.substring(3, 6).replace(/\s/g, '0');
        const bStr = this.currentGuess.substring(6, 9).replace(/\s/g, '0');
        
        // Show actual values or --- for missing components
        const hasR = this.currentGuess.substring(0, 3).replace(/\s/g, '').length > 0;
        const hasG = this.currentGuess.substring(3, 6).replace(/\s/g, '').length > 0;
        const hasB = this.currentGuess.substring(6, 9).replace(/\s/g, '').length > 0;
        
        if (hasR) {
            const r = parseInt(rStr) || 0;
            display += `${r}, `;
        } else {
            display += '---, ';
        }
        
        if (hasG) {
            const g = parseInt(gStr) || 0;
            display += `${g}, `;
        } else {
            display += '---, ';
        }
        
        if (hasB) {
            const b = parseInt(bStr) || 0;
            display += `${b})`;
        } else {
            display += '---)';
        }
        
        this.currentRgbDisplayEl.textContent = display;
        
        // Show color preview using actual entered digits (0 for spaces)
        const r = parseInt(rStr) || 0;
        const g = parseInt(gStr) || 0;
        const b = parseInt(bStr) || 0;
        const color = this.rgbToHex(r, g, b);
        this.currentColorPreviewEl.style.backgroundColor = color;

        // Update progress bars (0-255, so percentage = value / 255 * 100)
        const updateProgressBar = (component, value) => {
            const fillEl = this.rgbProgressFills[component];
            if (fillEl) {
                const percentage = Math.min(100, Math.max(0, (value / 255) * 100));
                fillEl.style.width = `${percentage}%`;
            }
        };

        updateProgressBar('r', r);
        updateProgressBar('g', g);
        updateProgressBar('b', b);
    }

    rgbToHsl(r, g, b) {
        r /= 255;
        g /= 255;
        b /= 255;

        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        let h, s, l = (max + min) / 2;

        if (max === min) {
            h = s = 0;
        } else {
            const d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
            
            switch (max) {
                case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
                case g: h = ((b - r) / d + 2) / 6; break;
                case b: h = ((r - g) / d + 4) / 6; break;
            }
        }

        return { h: h * 360, s: s * 100, l: l * 100 };
    }

    hslToRgb(h, s, l) {
        h /= 360;
        s /= 100;
        l /= 100;

        let r, g, b;

        if (s === 0) {
            r = g = b = l;
        } else {
            const hue2rgb = (p, q, t) => {
                if (t < 0) t += 1;
                if (t > 1) t -= 1;
                if (t < 1/6) return p + (q - p) * 6 * t;
                if (t < 1/2) return q;
                if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
                return p;
            };

            const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
            const p = 2 * l - q;
            r = hue2rgb(p, q, h + 1/3);
            g = hue2rgb(p, q, h);
            b = hue2rgb(p, q, h - 1/3);
        }

        return {
            r: Math.round(r * 255),
            g: Math.round(g * 255),
            b: Math.round(b * 255)
        };
    }

    updateSubmitButton() {
        const cleanGuess = this.currentGuess.replace(/\s/g, '');
        const isDisabled = cleanGuess.length !== 9 || this.gameOver;
        this.submitBtnEl.disabled = isDisabled;
        this.numpadEnterEl.disabled = isDisabled;
    }

    submitGuess() {
        const cleanGuess = this.currentGuess.replace(/\s/g, '');
        if (cleanGuess.length !== 9 || this.gameOver) return;
        
        // Use clean guess (no spaces) for submission
        this.currentGuess = cleanGuess;

        const guess = this.currentGuess;
        const feedback = this.evaluateGuess(guess);
        this.guesses.push({ guess, feedback });

        // Preserve correct digits and fixed positions for next guess
        const nextGuess = '         '.split(''); // Start with empty
        const answerStr = this.answer;
        
        // Keep fixed positions
        this.fixedPositions.forEach(pos => {
            nextGuess[pos] = answerStr[pos];
        });
        
        // Keep correct digits from this guess
        feedback.correctDigits.forEach(pos => {
            nextGuess[pos] = answerStr[pos];
            // Add to fixed positions if not already fixed
            this.fixedPositions.add(pos);
        });
        
        this.currentGuess = nextGuess.join('');
        this.updateCurrentGuessDisplay();
        this.updateSubmitButton();

        // Play sound based on closeness
        const percentage = feedback.temperature.percentage;
        if (percentage >= 80) {
            this.playVeryCloseSound();
        } else if (percentage >= 50) {
            this.playCloseSound();
        } else {
            this.playFarSound();
        }

        // Check win condition
        if (feedback.feedback.r.type === 'correct' && 
            feedback.feedback.g.type === 'correct' && 
            feedback.feedback.b.type === 'correct') {
            this.won = true;
            this.gameOver = true;
            this.handleWin();
        } else if (this.guesses.length >= this.maxAttempts) {
            this.gameOver = true;
            this.handleLose();
        }

        this.updateDisplay();
    }

    evaluateGuess(guess) {
        const answerRGB = this.parseRGBString(this.answer);
        const guessRGB = this.parseRGBString(guess);
        
        // Evaluate each RGB component
        const feedback = {
            r: this.evaluateComponent(guessRGB.r, answerRGB.r),
            g: this.evaluateComponent(guessRGB.g, answerRGB.g),
            b: this.evaluateComponent(guessRGB.b, answerRGB.b)
        };
        
        // Calculate overall temperature (closeness)
        const temperature = this.calculateTemperature(guessRGB, answerRGB);
        
        // Track which individual digits are correct
        const correctDigits = new Set();
        const answerStr = this.answer;
        const guessStr = guess;
        
        for (let i = 0; i < 9; i++) {
            if (answerStr[i] === guessStr[i]) {
                correctDigits.add(i);
            }
        }
        
        return { feedback, temperature, correctDigits };
    }
    
    evaluateComponent(guessValue, answerValue) {
        const diff = Math.abs(guessValue - answerValue);
        
        if (diff === 0) {
            return { type: 'correct', arrows: 0 };
        } else if (guessValue > answerValue) {
            if (diff <= 25) {
                return { type: 'high', arrows: 1 };
            } else if (diff <= 75) {
                return { type: 'high', arrows: 2 };
            } else {
                return { type: 'high', arrows: 3 };
            }
        } else {
            if (diff <= 25) {
                return { type: 'low', arrows: 1 };
            } else if (diff <= 75) {
                return { type: 'low', arrows: 2 };
            } else {
                return { type: 'low', arrows: 3 };
            }
        }
    }
    
    calculateTemperature(guessRGB, answerRGB) {
        // Calculate Euclidean distance in RGB space
        const rDiff = guessRGB.r - answerRGB.r;
        const gDiff = guessRGB.g - answerRGB.g;
        const bDiff = guessRGB.b - answerRGB.b;
        const distance = Math.sqrt(rDiff * rDiff + gDiff * gDiff + bDiff * bDiff);
        
        // Max distance is sqrt(255^2 * 3) ≈ 441
        // Convert to percentage (inverse, so 0% = far, 100% = exact match)
        const maxDistance = Math.sqrt(255 * 255 * 3);
        const percentage = Math.round((1 - distance / maxDistance) * 100);
        
        return {
            percentage: Math.max(0, percentage),
            distance: Math.round(distance)
        };
    }

    updateDisplay() {
        this.renderGuesses();
        this.renderCurrentGuess();
        this.updateSubmitButton();
    }

    renderGuesses() {
        this.guessesContainerEl.innerHTML = '';

        // Reverse the guesses array so newest appears first (directly below input)
        [...this.guesses].reverse().forEach((guessObj, guessIndex) => {
            const row = document.createElement('div');
            row.className = 'guess-row';

            // Add color swatch
            const swatch = document.createElement('div');
            swatch.className = 'color-swatch';
            const rgb = this.parseRGBString(guessObj.guess);
            swatch.style.backgroundColor = this.rgbToHex(rgb.r, rgb.g, rgb.b);
            row.appendChild(swatch);

            // Add RGB container
            const rgbContainer = document.createElement('div');
            rgbContainer.className = 'guess-rgb';

            // Add RGB display with feedback
            const rgbDisplay = document.createElement('div');
            rgbDisplay.className = 'guess-rgb-display';
            
            const rgbText = document.createElement('div');
            rgbText.className = 'guess-rgb-text';
            rgbText.textContent = this.formatRGBDisplay(guessObj.guess);
            rgbDisplay.appendChild(rgbText);
            
            // Add component feedback
            const feedbackRow = document.createElement('div');
            feedbackRow.className = 'component-feedback';
            
            const components = [
                { name: 'R', value: rgb.r, feedback: guessObj.feedback.feedback.r },
                { name: 'G', value: rgb.g, feedback: guessObj.feedback.feedback.g },
                { name: 'B', value: rgb.b, feedback: guessObj.feedback.feedback.b }
            ];
            
            components.forEach((comp, index) => {
                const compEl = document.createElement('div');
                compEl.className = `component-item ${comp.feedback.type}`;
                compEl.style.animationDelay = `${index * 0.15}s`;
                
                const compRow = document.createElement('div');
                compRow.className = 'component-item-row';
                
                const compLabel = document.createElement('span');
                compLabel.className = 'component-label';
                compLabel.textContent = comp.name;
                
                const compValue = document.createElement('span');
                compValue.className = 'component-value';
                compValue.textContent = comp.value;
                
                const compIcon = document.createElement('span');
                compIcon.className = 'component-icon';
                compIcon.textContent = this.getFeedbackIcon(comp.feedback);
                
                compRow.appendChild(compLabel);
                compRow.appendChild(compValue);
                compRow.appendChild(compIcon);
                
                const compHint = document.createElement('span');
                compHint.className = 'component-hint';
                compHint.textContent = this.getFeedbackLabel(comp.feedback);
                
                compEl.appendChild(compRow);
                compEl.appendChild(compHint);
                feedbackRow.appendChild(compEl);
            });
            
            rgbDisplay.appendChild(feedbackRow);
            rgbContainer.appendChild(rgbDisplay);

            // Add temperature indicator
            const tempIndicator = document.createElement('div');
            tempIndicator.className = 'temperature-indicator';
            
            const tempText = document.createElement('div');
            tempText.className = 'temperature-text';
            tempText.textContent = `${guessObj.feedback.temperature.percentage}% match`;
            
            const tempBar = document.createElement('div');
            tempBar.className = 'temperature-bar';
            const tempFill = document.createElement('div');
            tempFill.className = 'temperature-fill';
            tempFill.style.width = `${guessObj.feedback.temperature.percentage}%`;
            tempBar.appendChild(tempFill);
            
            tempIndicator.appendChild(tempText);
            tempIndicator.appendChild(tempBar);
            
            rgbContainer.appendChild(tempIndicator);
            row.appendChild(rgbContainer);
            this.guessesContainerEl.appendChild(row);
        });
    }
    
    getFeedbackIcon(feedback) {
        if (feedback.type === 'correct') {
            return '✓';
        } else if (feedback.type === 'high') {
            // Too high - arrows point DOWN to indicate need to decrease
            return '↓'.repeat(feedback.arrows);
        } else if (feedback.type === 'low') {
            // Too low - arrows point UP to indicate need to increase
            return '↑'.repeat(feedback.arrows);
        }
        return '';
    }
    
    getFeedbackLabel(feedback) {
        if (feedback.type === 'correct') {
            return 'Perfect!';
        } else if (feedback.type === 'high') {
            return 'Too high';
        } else if (feedback.type === 'low') {
            return 'Too low';
        }
        return '';
    }

    renderCurrentGuess() {
        // Clear all RGB digit groups
        Object.values(this.rgbDigitsEls).forEach(groupEl => {
            if (groupEl) groupEl.innerHTML = '';
        });

        // Create cells grouped by R, G, B
        const components = ['r', 'g', 'b'];
        components.forEach((component, compIndex) => {
            const groupEl = this.rgbDigitsEls[component];
            if (!groupEl) return;
            
            // Create 3 cells for this component
            for (let i = 0; i < 3; i++) {
                const globalIndex = compIndex * 3 + i;
                const char = this.currentGuess[globalIndex];
                const isFixed = this.fixedPositions.has(globalIndex);
                
                const cell = document.createElement('div');
                cell.className = 'current-cell';
                if (isFixed) {
                    cell.classList.add('fixed');
                }
                
                cell.textContent = (char && char !== ' ') ? char : '';
                if (char && char !== ' ') {
                    cell.classList.add('filled');
                }
                
                groupEl.appendChild(cell);
            }
        });

        // Update color preview and RGB display
        this.updateCurrentGuessDisplay();
    }

    handleWin() {
        // Play satisfying win sound
        this.playWinSound();
        
        // Show win message
        const rgb = this.parseRGBString(this.answer);
        this.messageAreaEl.innerHTML = `<div class="win-message">🎉 Correct! The color is RGB(${rgb.r}, ${rgb.g}, ${rgb.b})</div>`;

        // Create satisfying color animation
        this.createColorAnimation();
    }

    handleLose() {
        // Show lose message
        const rgb = this.parseRGBString(this.answer);
        this.messageAreaEl.innerHTML = `<div class="lose-message">Game Over! The answer was RGB(${rgb.r}, ${rgb.g}, ${rgb.b})</div>`;
    }

    createColorAnimation() {
        const rgb = this.parseRGBString(this.answer);
        const color = this.rgbToHex(rgb.r, rgb.g, rgb.b);
        
        // Create celebration container
        const celebration = document.createElement('div');
        celebration.className = 'color-celebration';
        document.body.appendChild(celebration);

        // Create multiple ripples from center
        const centerX = window.innerWidth / 2;
        const centerY = window.innerHeight / 2;

        for (let i = 0; i < 5; i++) {
            setTimeout(() => {
                const ripple = document.createElement('div');
                ripple.className = 'color-ripple';
                ripple.style.backgroundColor = color;
                ripple.style.left = `${centerX}px`;
                ripple.style.top = `${centerY}px`;
                ripple.style.width = '100px';
                ripple.style.height = '100px';
                ripple.style.marginLeft = '-50px';
                ripple.style.marginTop = '-50px';
                celebration.appendChild(ripple);

                setTimeout(() => ripple.remove(), 1500);
            }, i * 200);
        }

        // Create particle explosion with varied sizes and speeds
        const particleCount = 60;
        for (let i = 0; i < particleCount; i++) {
            const angle = (Math.PI * 2 * i) / particleCount + (Math.random() - 0.5) * 0.5;
            const distance = 150 + Math.random() * 400;
            const dx = Math.cos(angle) * distance;
            const dy = Math.sin(angle) * distance;
            const size = 6 + Math.random() * 10;

            const particle = document.createElement('div');
            particle.className = 'color-particles';
            particle.style.backgroundColor = color;
            particle.style.left = `${centerX}px`;
            particle.style.top = `${centerY}px`;
            particle.style.width = `${size}px`;
            particle.style.height = `${size}px`;
            particle.style.setProperty('--dx', `${dx}px`);
            particle.style.setProperty('--dy', `${dy}px`);
            celebration.appendChild(particle);

            setTimeout(() => particle.remove(), 2500);
        }

        // Animate background color transition with smooth gradient
        const hsl = this.hexToHsl(color);
        const lighter = this.hslToHex(hsl.h, hsl.s, Math.min(100, hsl.l + 20));
        const darker = this.hslToHex(hsl.h, hsl.s, Math.max(0, hsl.l - 20));
        
        document.body.style.transition = 'background 1.5s cubic-bezier(0.4, 0, 0.2, 1)';
        document.body.style.background = `linear-gradient(135deg, ${lighter} 0%, ${color} 50%, ${darker} 100%)`;

        // Add pulsing effect to target color
        this.targetColorEl.style.animation = 'pulse 2s ease-in-out infinite';
        
        // Clean up celebration container
        setTimeout(() => {
            celebration.remove();
        }, 3000);
    }

    hexToHsl(hex) {
        const r = parseInt(hex.slice(1, 3), 16) / 255;
        const g = parseInt(hex.slice(3, 5), 16) / 255;
        const b = parseInt(hex.slice(5, 7), 16) / 255;

        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        let h, s, l = (max + min) / 2;

        if (max === min) {
            h = s = 0;
        } else {
            const d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
            
            switch (max) {
                case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
                case g: h = ((b - r) / d + 2) / 6; break;
                case b: h = ((r - g) / d + 4) / 6; break;
            }
        }

        return { h: h * 360, s: s * 100, l: l * 100 };
    }

    hslToHex(h, s, l) {
        h /= 360;
        s /= 100;
        l /= 100;

        let r, g, b;

        if (s === 0) {
            r = g = b = l;
        } else {
            const hue2rgb = (p, q, t) => {
                if (t < 0) t += 1;
                if (t > 1) t -= 1;
                if (t < 1/6) return p + (q - p) * 6 * t;
                if (t < 1/2) return q;
                if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
                return p;
            };

            const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
            const p = 2 * l - q;
            r = hue2rgb(p, q, h + 1/3);
            g = hue2rgb(p, q, h);
            b = hue2rgb(p, q, h - 1/3);
        }

        const toHex = (x) => {
            const hex = Math.round(x * 255).toString(16);
            return hex.length === 1 ? '0' + hex : hex;
        };

        return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
    }

    newGame() {
        this.answer = this.generateRandomRGB();
        this.guesses = [];
        const initialData = this.getInitialGuess();
        this.currentGuess = initialData.guess;
        this.fixedPositions = initialData.fixedPositions;
        this.gameOver = false;
        this.won = false;

        // Reset display
        const rgb = this.parseRGBString(this.answer);
        const targetColor = this.rgbToHex(rgb.r, rgb.g, rgb.b);
        
        // Set target color preview - use exact same color
        this.targetColorEl.style.backgroundColor = targetColor;
        this.targetColorEl.style.animation = '';
        this.messageAreaEl.innerHTML = '';
        this.currentColorPreviewEl.style.backgroundColor = '#2a2a2a';
        this.currentRgbDisplayEl.textContent = 'RGB(---, ---, ---)';
        
        // Set background to exact same color value
        document.body.style.background = targetColor;
        document.body.style.backgroundColor = targetColor;
        
        // Calculate best text color for contrast (WCAG compliant)
        const bestTextColor = this.getBestTextColor(rgb);
        const textColorHex = this.rgbToHex(bestTextColor.r, bestTextColor.g, bestTextColor.b);
        
        // Update body and container text color
        document.body.style.color = textColorHex;
        const container = document.querySelector('.container');
        if (container) {
            container.style.color = textColorHex;
        }

        this.updateDisplay();
    }
}

// Initialize game when page loads
window.addEventListener('DOMContentLoaded', () => {
    new RGBWordleGame();
});

