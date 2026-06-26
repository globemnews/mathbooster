/**
 * Math Blaster - Power-Up System
 * Manages active powerups, timers, UI indicators,
 * and powerup activation effects.
 * Uses CSS icons instead of SVG images for indicators.
 */

var PowerUpSystem = (function() {

    /**
     * Constructor
     * @param {Object} deps
     * @param {AudioEngine} deps.audio - Audio engine for powerup sounds
     * @param {ParticleSystem} deps.particles - Particle system for visual effects
     */
    function PowerUpSystem(deps) {
        /** Currently active powerups: { TYPE_KEY: { endTime, duration, color, name, icon } } */
        this.active = {};

        /** Audio engine reference */
        this.audio = deps.audio;

        /** Particle system reference */
        this.particles = deps.particles;

        /** DOM container for powerup indicator icons */
        this.indicatorContainer = document.getElementById('powerupIndicators');

        /** Callbacks for powerup-specific game effects */
        this._callbacks = {};
    }

    /**
     * Register a callback for when a powerup type is activated
     * @param {string} type - Powerup type key (e.g., 'BOMB', 'HEAL')
     * @param {Function} cb - Callback function
     */
    PowerUpSystem.prototype.onActivate = function(type, cb) {
        this._callbacks[type] = cb;
    };

    /**
     * Activate a powerup
     * Handles both instant powerups (BOMB, HEAL) and
     * duration-based powerups (SHIELD, SLOW, DOUBLE, FREEZE)
     * @param {string} type - Powerup type key
     * @param {number} x - X position for visual effects
     * @param {number} y - Y position for visual effects
     * @param {Object} gameState - Reference to game state for modifications
     * @returns {Object|null} Powerup config or null if invalid
     */
    PowerUpSystem.prototype.activate = function(type, x, y, gameState) {
        var config = POWERUP_TYPES[type];
        if (!config) return null;

        // Play powerup collection sound
        this.audio.play('powerup');

        // Create sparkle particle effect at collection point
        if (this.particles.enabled) {
            this.particles.createSparkle(x, y, config.color);
        }

        // --- Handle instant powerups ---
        if (config.instant) {
            if (type === 'BOMB') {
                // BOMB: Destroy all active enemies and add bonus score
                if (gameState && gameState.enemies) {
                    for (var i = 0; i < gameState.enemies.length; i++) {
                        var e = gameState.enemies[i];
                        if (e.active) {
                            // Award bonus score for each destroyed enemy
                            gameState.score += e.word.length * 5;
                            // Create explosion effect at each enemy position
                            if (this.particles.enabled) {
                                this.particles.createExplosion(e.x, e.y, '#ff006e', 10);
                            }
                            e.destroy();
                        }
                    }
                }
                // Create large bomb wave effect at screen center
                if (this.particles.enabled) {
                    this.particles.createBombWave(window.innerWidth / 2, window.innerHeight / 2);
                }
                // Fire bomb callback (screen flash)
                if (this._callbacks.BOMB) this._callbacks.BOMB();

            } else if (type === 'HEAL') {
                // HEAL: Restore 30 health points (capped at max)
                if (gameState) {
                    gameState.health = Math.min(
                        GAME_CONSTANTS.MAX_HEALTH,
                        gameState.health + 30
                    );
                }
                // Fire heal callback (screen flash)
                if (this._callbacks.HEAL) this._callbacks.HEAL();
            }
            return config;
        }

        // --- Handle duration-based powerups ---
        // Store in active powerups with expiration time
        this.active[type] = {
            endTime: Date.now() + config.duration,
            duration: config.duration,
            color: config.color,
            name: config.name,
            icon: config.icon
        };

        // FREEZE: additionally freeze all enemies via callback
        if (type === 'FREEZE' && this._callbacks.FREEZE) {
            this._callbacks.FREEZE(config.duration);
        }

        // Update the indicator UI
        this.updateIndicators();

        return config;
    };

    /**
     * Check if a specific powerup is currently active
     * @param {string} type - Powerup type key
     * @returns {boolean}
     */
    PowerUpSystem.prototype.isActive = function(type) {
        if (!this.active[type]) return false;
        return Date.now() < this.active[type].endTime;
    };

    /**
     * Update powerup timers
     * Removes expired powerups and refreshes indicators
     * Called every frame by the engine
     */
    PowerUpSystem.prototype.update = function() {
        var now = Date.now();
        var changed = false;

        // Check each active powerup for expiration
        for (var key in this.active) {
            if (now >= this.active[key].endTime) {
                delete this.active[key];
                changed = true;
            }
        }

        // Only rebuild indicators if something expired
        if (changed) this.updateIndicators();
    };

    /**
     * Update the powerup indicator DOM elements
     * Shows circular icons with timer bars for each active powerup
     * Uses CSS icons instead of SVG images
     */
    PowerUpSystem.prototype.updateIndicators = function() {
        if (!this.indicatorContainer) return;

        // Clear existing indicators
        this.indicatorContainer.innerHTML = '';

        for (var key in this.active) {
            var remaining = this.active[key].endTime - Date.now();
            if (remaining <= 0) continue;

            var config = POWERUP_TYPES[key];
            if (!config) continue;

            // Calculate remaining time as percentage
            var pct = (remaining / this.active[key].duration) * 100;

            // --- Create indicator element ---
            var div = document.createElement('div');
            div.className = 'powerup-indicator';
            div.style.borderColor = config.color;

            // --- CSS icon instead of img tag ---
            // Uses the icon name from POWERUP_TYPES config
            // Maps to CSS classes like 'icon-shield', 'icon-slow', etc.
            var icon = document.createElement('span');
            icon.className = 'icon icon-' + config.icon + ' icon-sm';
            icon.style.color = config.color;
            div.appendChild(icon);

            // --- Timer bar showing remaining duration ---
            var timerContainer = document.createElement('div');
            timerContainer.className = 'powerup-timer';

            var timerFill = document.createElement('div');
            timerFill.className = 'powerup-timer-fill';
            timerFill.style.width = pct + '%';
            timerFill.style.background = config.color;

            timerContainer.appendChild(timerFill);
            div.appendChild(timerContainer);

            this.indicatorContainer.appendChild(div);
        }
    };

    /**
     * Clear all active powerups
     * Called when starting a new game
     */
    PowerUpSystem.prototype.clear = function() {
        this.active = {};
        this.updateIndicators();
    };

    return PowerUpSystem;
})();

window.PowerUpSystem = PowerUpSystem;