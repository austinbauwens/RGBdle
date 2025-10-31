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

        this.initializeElements();
        this.setupEventListeners();
        this.updateDisplay();
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
        this.currentGuessEl = document.getElementById('currentGuess');
        this.currentColorPreviewEl = document.getElementById('currentColorPreview');
        this.currentRgbDisplayEl = document.getElementById('currentRgbDisplay');
        this.submitBtnEl = document.getElementById('submitBtn');
        this.newGameBtnEl = document.getElementById('newGameBtn');
        this.messageAreaEl = document.getElementById('messageArea');

        // Set target color
        const rgb = this.parseRGBString(this.answer);
        const targetColor = this.rgbToHex(rgb.r, rgb.g, rgb.b);
        
        // Set target color preview - use exact same color
        this.targetColorEl.style.backgroundColor = targetColor;
        
        // Set background to exact same color value
        document.body.style.background = targetColor;
        document.body.style.backgroundColor = targetColor;
        
        // Calculate brightness for text contrast
        const brightness = (rgb.r * 299 + rgb.g * 587 + rgb.b * 114) / 1000;
        const textColor = brightness > 128 ? '#333' : '#fff';
        document.body.style.color = textColor;
        const container = document.querySelector('.container');
        if (container) {
            container.style.color = textColor;
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

    setupEventListeners() {
        // Keyboard input
        document.addEventListener('keydown', (e) => this.handleKeyPress(e));

        // Submit button
        this.submitBtnEl.addEventListener('click', () => this.submitGuess());

        // New game button
        this.newGameBtnEl.addEventListener('click', () => this.newGame());

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
            guessArray[emptyIndex] = char;
            this.currentGuess = guessArray.join('');
            
            // Add typing animation
            const cell = this.currentGuessEl.children[emptyIndex];
            if (cell) {
                cell.classList.add('typing');
                setTimeout(() => cell.classList.remove('typing'), 300);
            }
            
            this.updateCurrentGuessDisplay();
            this.updateSubmitButton();
        }
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
        const cells = this.currentGuessEl.querySelectorAll('.current-cell');
        cells.forEach((cell, index) => {
            const char = this.currentGuess[index];
            cell.textContent = (char && char !== ' ') ? char : '';
            cell.classList.toggle('filled', (char && char !== ' '));
        });

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
        this.submitBtnEl.disabled = cleanGuess.length !== 9 || this.gameOver;
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
    }

    renderGuesses() {
        this.guessesContainerEl.innerHTML = '';

        this.guesses.forEach((guessObj, guessIndex) => {
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
        this.currentGuessEl.innerHTML = '';

        // Create 9 cells in a row
        for (let i = 0; i < 9; i++) {
            const cell = document.createElement('div');
            const char = this.currentGuess[i];
            const isFixed = this.fixedPositions.has(i);
            
            cell.className = 'current-cell';
            if (isFixed) {
                cell.classList.add('fixed');
            }
            
            cell.textContent = (char && char !== ' ') ? char : '';
            if (char && char !== ' ') {
                cell.classList.add('filled');
            } else {
                cell.classList.remove('filled');
            }
            // Add visual separators between R, G, B groups
            if (i === 3 || i === 6) {
                cell.style.marginLeft = '8px';
            }
            this.currentGuessEl.appendChild(cell);
        }

        // Update color preview and RGB display
        this.updateCurrentGuessDisplay();
    }

    handleWin() {
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
        this.currentColorPreviewEl.style.backgroundColor = '#e5e7eb';
        this.currentRgbDisplayEl.textContent = 'RGB(---, ---, ---)';
        
        // Set background to exact same color value
        document.body.style.background = targetColor;
        document.body.style.backgroundColor = targetColor;
        
        // Calculate brightness for text contrast
        const brightness = (rgb.r * 299 + rgb.g * 587 + rgb.b * 114) / 1000;
        const textColor = brightness > 128 ? '#333' : '#fff';
        document.body.style.color = textColor;
        const container = document.querySelector('.container');
        if (container) {
            container.style.color = textColor;
        }

        this.updateDisplay();
    }
}

// Initialize game when page loads
window.addEventListener('DOMContentLoaded', () => {
    new RGBWordleGame();
});

