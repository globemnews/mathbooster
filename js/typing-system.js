/**
 * Math Blaster - Number Input System
 * 
 * AUTO-TARGETING:
 * - Automatically targets the CLOSEST enemy to the bottom
 * - Laser pointer shows which problem to solve
 * - Player can only solve the targeted problem
 * - When destroyed, auto-targets next closest enemy
 * 
 * BOSS RE-TARGETING:
 * When a boss survives a hit, handleBossHit() is called which:
 * 1. Clears targetedEnemy reference
 * 2. Clears currentInput
 * 3. Auto-targets again (boss can be re-targeted)
 * 
 * INPUT CHANGES:
 * - Accepts numbers 0-9
 * - Accepts negative sign (-)
 * - Rejects letters (no a-z)
 * 
 * ANSWER DISPLAY:
 * - Shows ONLY what the player types
 * - NO HINTS about correct answer
 * - Pure mental math challenge
 */

var TypingSystem = (function() {

    function TypingSystem(deps) {
        /** Audio engine */
        this.audio = deps.audio;

        /** Current typed input string */
        this.currentInput = '';

        /** Currently targeted enemy (null if none) */
        this.targetedEnemy = null;

        // Statistics
        this.totalCharsTyped = 0;
        this.correctChars = 0;
        this.wordsTyped = 0;
        this.combo = 0;
        this.maxCombo = 0;
        this.startTime = 0;

        /** Reference to current enemy list */
        this._enemies = [];

        /** Whether accepting input */
        this._active = false;

        /** Hidden input element */
        this._hiddenInput = document.getElementById('hiddenInput');

        /** Typing display element */
        this._typingDisplay = document.getElementById('typingDisplay');

        // Callbacks
        this.onCorrectChar = null;
        this.onMissChar = null;
        this.onWordComplete = null;
        this.onComboChange = null;

        // Bound handlers
        var self = this;
        this._boundKeyDown = function(e) { self._handleKeyDown(e); };
        this._boundMobileInput = function(e) { self._handleMobileInput(e); };
        this._boundBlur = function() {};
    }

    /** Start accepting input */
    TypingSystem.prototype.start = function() {
        this._active = true;
        this.startTime = Date.now();
        document.addEventListener('keydown', this._boundKeyDown);
        if (this._hiddenInput) {
            this._hiddenInput.addEventListener('input', this._boundMobileInput);
            this._hiddenInput.addEventListener('blur', this._boundBlur);
        }
    };

    /** Stop accepting input */
    TypingSystem.prototype.stop = function() {
        this._active = false;
        document.removeEventListener('keydown', this._boundKeyDown);
        if (this._hiddenInput) {
            this._hiddenInput.removeEventListener('input', this._boundMobileInput);
            this._hiddenInput.removeEventListener('blur', this._boundBlur);
        }
    };

    /** Reset for new game */
    TypingSystem.prototype.reset = function() {
        this.currentInput = '';
        this.targetedEnemy = null;
        this.totalCharsTyped = 0;
        this.correctChars = 0;
        this.wordsTyped = 0;
        this.combo = 0;
        this.maxCombo = 0;
        this.startTime = Date.now();
        this._updateDisplay();
    };

    /** Focus hidden input for native keyboard */
    TypingSystem.prototype.focusInput = function() {
        if (this._hiddenInput) {
            this._hiddenInput.value = '';
            this._hiddenInput.focus({ preventScroll: true });
            this.audio.init();
        }
    };

    /** Handle physical keyboard */
    TypingSystem.prototype._handleKeyDown = function(e) {
        if (!this._active) return;
        if (e.key === 'Escape') return;

        if (e.key === 'Backspace') {
            e.preventDefault();
            this.currentInput = this.currentInput.slice(0, -1);
            if (this.currentInput === '') {
                this._releaseTarget();
                this._autoTarget(); // Auto-target after clearing
            } else if (this.targetedEnemy && this.targetedEnemy.active) {
                this.targetedEnemy.typed = this.currentInput.length;
            }
            this._updateDisplay();
            return;
        }

        // Accept numbers 0-9 and negative sign
        if (e.key.length === 1) {
            if (/[0-9]/.test(e.key)) {
                e.preventDefault();
                this._processChar(e.key);
            } else if (e.key === '-' && this.currentInput.length === 0) {
                // Allow negative sign only at start
                e.preventDefault();
                this._processChar('-');
            }
        }
    };

    /** Handle mobile input */
    TypingSystem.prototype._handleMobileInput = function(e) {
        if (!this._active) return;
        var v = e.target.value;
        if (v.length > 0) {
            var c = v.slice(-1);
            if (/[0-9]/.test(c)) {
                this._processChar(c);
            } else if (c === '-' && this.currentInput.length === 0) {
                this._processChar('-');
            }
        }
        e.target.value = '';
    };

    /**
     * AUTO-TARGET: Find the closest enemy to the bottom
     * This is called automatically when:
     * 1. Player starts typing (no current target)
     * 2. Current target is destroyed
     * 3. Boss is hit and needs re-targeting
     * 4. Player clears their input
     */
    TypingSystem.prototype._autoTarget = function() {
        var closest = null;
        var closestY = -1;

        // Find enemy closest to bottom (highest Y value)
        for (var i = 0; i < this._enemies.length; i++) {
            var e = this._enemies[i];
            if (!e.active) continue;

            // Pick the one closest to bottom
            if (e.y > closestY) {
                closestY = e.y;
                closest = e;
            }
        }

        // Target the closest enemy
        if (closest) {
            // Release old target
            if (this.targetedEnemy && this.targetedEnemy !== closest) {
                this.targetedEnemy.resetTyping();
            }

            this.targetedEnemy = closest;
            closest.setTargeted(true);
            closest.typed = 0; // Reset typing progress
            this._updateDisplay();
        } else {
            this.targetedEnemy = null;
            this._updateDisplay();
        }
    };

    /**
     * Process a single typed character
     * Checks against the currently targeted enemy
     */
    TypingSystem.prototype._processChar = function(char) {
        this.totalCharsTyped++;
        this.audio.play('type');

        // Auto-target if no current target
        if (!this.targetedEnemy || !this.targetedEnemy.active) {
            this._autoTarget();
            if (!this.targetedEnemy) {
                // No enemies available
                this.currentInput = '';
                return;
            }
        }

        // Add character to input
        this.currentInput += char;

        // Check if it matches the targeted enemy's answer
        if (this.targetedEnemy.matchesPrefix(this.currentInput)) {
            // Correct so far!
            this.targetedEnemy.typed = this.currentInput.length;
            this.correctChars++;
            this.audio.play('shoot');
            if (this.onCorrectChar) this.onCorrectChar(this.targetedEnemy);

            // Check if complete
            if (this.targetedEnemy.isFullyTyped()) {
                this._complete(this.targetedEnemy);
                return;
            }
            this._updateDisplay();
        } else {
            // Wrong answer - reset
            this._miss();
        }
    };

    /** Handle problem completion - notify game */
    TypingSystem.prototype._complete = function(enemy) {
        this.combo++;
        if (this.combo > this.maxCombo) this.maxCombo = this.combo;
        if (this.combo >= GAME_CONSTANTS.COMBO_THRESHOLD) this.audio.play('combo');
        this.wordsTyped++;

        if (this.onWordComplete) this.onWordComplete(enemy, this.combo);
        if (this.onComboChange) this.onComboChange(this.combo, this.maxCombo);

        // Clear target and input
        this.targetedEnemy = null;
        this.currentInput = '';
        
        // Auto-target next enemy
        this._autoTarget();
    };

    /** Handle miss - reset combo and target */
    TypingSystem.prototype._miss = function() {
        this.combo = 0;
        this.audio.play('miss');
        if (this.onComboChange) this.onComboChange(0, this.maxCombo);
        if (this.onMissChar) this.onMissChar(this.currentInput);
        this._releaseTarget();

        var self = this;
        if (this._typingDisplay) {
            this._typingDisplay.innerHTML = '<span class="typing-wrong">&#x2715;</span>';
            setTimeout(function() { 
                self.currentInput = '';
                self._autoTarget(); // Auto-target after miss
                self._updateDisplay(); 
            }, 300);
        } else {
            this.currentInput = '';
            this._autoTarget();
        }
    };

    /** Release current target */
    TypingSystem.prototype._releaseTarget = function() {
        if (this.targetedEnemy) {
            this.targetedEnemy.resetTyping();
            this.targetedEnemy = null;
        }
    };

    /**
     * Handle boss surviving a hit
     * 
     * Called by engine when enemy.hit() returns false
     * The enemy already has typed=0 and targeted=false from hit()
     * 
     * We auto-target again (boss can be re-selected as closest)
     */
    TypingSystem.prototype.handleBossHit = function(enemy) {
        // Clear our reference to this enemy
        if (this.targetedEnemy === enemy) {
            this.targetedEnemy = null;
        }
        // Clear input so player starts fresh
        this.currentInput = '';
        // Auto-target (boss will likely be re-targeted as it's still closest)
        this._autoTarget();
    };

    /** Handle enemy destroyed externally (bomb) */
    TypingSystem.prototype.handleEnemyDestroyed = function(e) {
        if (this.targetedEnemy === e) {
            this.targetedEnemy = null;
            this.currentInput = '';
            this._autoTarget(); // Auto-target next enemy
        }
    };

    /** Handle enemy reaching bottom */
    TypingSystem.prototype.handleEnemyReachedBottom = function(e) {
        if (this.targetedEnemy === e) {
            this.targetedEnemy = null;
            this.currentInput = '';
            this.combo = 0;
            if (this.onComboChange) this.onComboChange(0, this.maxCombo);
            this._autoTarget(); // Auto-target next enemy
        }
    };

    /**
     * Update the typing display
     * Shows ONLY what the player has typed
     * NO HINTS about the correct answer - player solves completely blind
     */
    TypingSystem.prototype._updateDisplay = function() {
        if (!this._typingDisplay) return;
        this._typingDisplay.classList.toggle('has-text', this.currentInput.length > 0);

        // ONLY show what player has typed - NO answer hints!
        if (this.currentInput.length > 0) {
            this._typingDisplay.innerHTML =
                '<span class="typing-correct">' + this.currentInput + '</span>';
        } else {
            // Empty - show placeholder
            this._typingDisplay.innerHTML = '';
        }
    };

    /**
     * Set enemies and auto-target closest one
     * Called every frame by the engine
     */
    TypingSystem.prototype.setEnemies = function(e) { 
        this._enemies = e; 
        
        // Auto-target if we don't have a target or current target is dead
        if (!this.targetedEnemy || !this.targetedEnemy.active) {
            this._autoTarget();
        }
    };

    // Simple getters
    TypingSystem.prototype.getWPM = function() { return Utils.calculateWPM(this.correctChars, Date.now() - this.startTime); };
    TypingSystem.prototype.getAccuracy = function() { return Utils.calculateAccuracy(this.correctChars, this.totalCharsTyped); };
    TypingSystem.prototype.getStats = function() {
        return {
            wordsTyped: this.wordsTyped, totalCharsTyped: this.totalCharsTyped,
            correctChars: this.correctChars, combo: this.combo, maxCombo: this.maxCombo,
            wpm: this.getWPM(), accuracy: this.getAccuracy(), elapsed: Date.now() - this.startTime
        };
    };
    TypingSystem.prototype.hasTarget = function() { return this.targetedEnemy !== null && this.targetedEnemy.active; };
    TypingSystem.prototype.getTarget = function() {
        return (this.targetedEnemy && this.targetedEnemy.active && this.targetedEnemy.targeted) ? this.targetedEnemy : null;
    };
    TypingSystem.prototype.pause = function() { this._active = false; };
    TypingSystem.prototype.resume = function() { this._active = true; };
    TypingSystem.prototype.isActive = function() { return this._active; };

    return TypingSystem;
})();

window.TypingSystem = TypingSystem;