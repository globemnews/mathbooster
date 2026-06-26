/**
 * Math Blaster - HUD Manager
 * 
 * Displays:
 * - Score (yellow number, top left)
 * - Game Level number (shows which level 1-100 is being played)
 * - XP bar (progress toward next XP rank)
 * - Wave number (which wave within the level)
 * - Health bar (green/orange/red with pulse)
 * - Combo counter (pink, pulses on high combos)
 * - SPM (solutions per minute - replaces WPM)
 * 
 * The "Level" shown on screen is the GAME LEVEL (1-100),
 * not the XP rank. This matches what the player selected
 * in the level select screen.
 */

var HUDManager = (function() {

    function HUDManager() {
        // Cache all DOM references
        this._els = {
            hud: document.getElementById('hud'),
            score: document.getElementById('scoreDisplay'),
            combo: document.getElementById('comboDisplay'),
            wave: document.getElementById('waveDisplay'),
            level: document.getElementById('levelDisplay'),
            healthBar: document.getElementById('healthBar'),
            xpBar: document.getElementById('xpBar'),
            wpm: document.getElementById('wpmDisplay'),
            inputArea: document.getElementById('inputArea'),
            pauseBtn: document.getElementById('pauseBtn'),
            pauseIcon: document.getElementById('pauseIcon'),
            keyboardBtn: document.getElementById('keyboardBtn'),
            powerupIndicators: document.getElementById('powerupIndicators')
        };

        // Value cache - only update DOM when values change
        this._cache = {
            score: -1,
            combo: -1,
            wave: -1,
            level: -1,
            healthPct: -1,
            healthState: '',
            xpPct: -1,
            wpm: -1
        };

        /** Whether HUD is visible */
        this._visible = false;

        /** Active floating text elements */
        this._floats = [];

        /** Game container for appending elements */
        this._container = document.getElementById('gameContainer');
    }

    // ============================================
    // SHOW / HIDE
    // ============================================

    /** Show all HUD elements */
    HUDManager.prototype.show = function() {
        if (this._visible) return;
        this._visible = true;

        this._els.hud.style.display = 'flex';
        this._els.inputArea.style.display = 'block';
        this._els.pauseBtn.style.display = 'flex';
        this._els.powerupIndicators.style.display = 'flex';

        if (Utils.isMobile()) {
            this._els.keyboardBtn.style.display = 'flex';
        }

        // Ensure pause icon shows correctly
        this.updatePauseButton(false);
    };

    /** Hide all HUD elements */
    HUDManager.prototype.hide = function() {
        if (!this._visible) return;
        this._visible = false;

        this._els.hud.style.display = 'none';
        this._els.inputArea.style.display = 'none';
        this._els.pauseBtn.style.display = 'none';
        this._els.keyboardBtn.style.display = 'none';
        this._els.powerupIndicators.style.display = 'none';

        // Clean up floating texts
        for (var i = 0; i < this._floats.length; i++) {
            if (this._floats[i].parentNode) {
                this._floats[i].parentNode.removeChild(this._floats[i]);
            }
        }
        this._floats = [];
    };

    // ============================================
    // VALUE UPDATES (cached)
    // ============================================

    /** Update score display */
    HUDManager.prototype.updateScore = function(v) {
        if (this._cache.score === v) return;
        this._cache.score = v;
        this._els.score.textContent = Utils.formatNumber(v);
    };

    /** Update combo display with pulse animation */
    HUDManager.prototype.updateCombo = function(v) {
        if (this._cache.combo === v) return;
        this._cache.combo = v;
        this._els.combo.textContent = 'x' + v;

        if (v >= GAME_CONSTANTS.COMBO_THRESHOLD) {
            this._els.combo.classList.remove('combo-active');
            void this._els.combo.offsetWidth;
            this._els.combo.classList.add('combo-active');
        }
    };

    /** Update wave number display */
    HUDManager.prototype.updateWave = function(v) {
        if (this._cache.wave === v) return;
        this._cache.wave = v;
        this._els.wave.textContent = v;
    };

    /**
     * Update level display
     * This shows the GAME LEVEL (1-100), the actual level being played
     * NOT the XP rank
     */
    HUDManager.prototype.updateLevel = function(v) {
        if (this._cache.level === v) return;
        this._cache.level = v;
        this._els.level.textContent = v;
    };

    /** Update health bar */
    HUDManager.prototype.updateHealth = function(h, max) {
        var pct = Math.round((h / max) * 100);
        if (this._cache.healthPct === pct) return;
        this._cache.healthPct = pct;

        this._els.healthBar.style.width = pct + '%';

        // Color changes based on health percentage
        var st = '';
        if (pct <= 30) st = 'low';        // Red with pulse
        else if (pct <= 60) st = 'medium'; // Orange

        if (this._cache.healthState !== st) {
            this._cache.healthState = st;
            this._els.healthBar.classList.remove('low', 'medium');
            if (st) this._els.healthBar.classList.add(st);
        }
    };

    /** Update XP progress bar */
    HUDManager.prototype.updateXP = function(xp, xpTo) {
        var p = Math.round((xp / xpTo) * 100);
        if (this._cache.xpPct === p) return;
        this._cache.xpPct = p;
        this._els.xpBar.style.width = p + '%';
    };

    /** Update SPM display (Solutions Per Minute - replaces WPM) */
    HUDManager.prototype.updateWPM = function(v) {
        if (this._cache.wpm === v) return;
        this._cache.wpm = v;
        this._els.wpm.textContent = v;
    };

    /**
     * Update pause button icon
     * Replaces innerHTML to guarantee correct icon
     */
    HUDManager.prototype.updatePauseButton = function(paused) {
        var btn = this._els.pauseBtn;
        if (!btn) return;

        if (paused) {
            // Show play/resume icon
            btn.innerHTML = '<span class="icon icon-resume" id="pauseIcon"></span>';
        } else {
            // Show pause icon
            btn.innerHTML = '<span class="icon icon-pause" id="pauseIcon"></span>';
        }

        this._els.pauseIcon = document.getElementById('pauseIcon');
    };

    /**
     * Batch update all HUD values
     * Only updates DOM for values that actually changed
     * 
     * @param {Object} d - Data object
     * @param {number} d.score - Current score
     * @param {number} d.combo - Current combo
     * @param {number} d.level - GAME LEVEL being played (1-100)
     * @param {number} d.wave - Current wave within level
     * @param {number} d.health - Current health
     * @param {number} d.maxHealth - Maximum health
     * @param {number} d.xp - Current XP
     * @param {number} d.xpToLevel - XP needed for next rank
     * @param {number} d.wpm - Solutions per minute
     */
    HUDManager.prototype.updateAll = function(d) {
        if (d.score !== undefined) this.updateScore(d.score);
        if (d.combo !== undefined) this.updateCombo(d.combo);
        if (d.wave !== undefined) this.updateWave(d.wave);
        if (d.level !== undefined) this.updateLevel(d.level);
        if (d.health !== undefined && d.maxHealth !== undefined) {
            this.updateHealth(d.health, d.maxHealth);
        }
        if (d.xp !== undefined && d.xpToLevel !== undefined) {
            this.updateXP(d.xp, d.xpToLevel);
        }
        if (d.wpm !== undefined) this.updateWPM(d.wpm);
    };

    // ============================================
    // VISUAL EFFECTS
    // ============================================

    /** Show floating score/combo text */
    HUDManager.prototype.showFloatingText = function(text, x, y, color, opts) {
        if (!this._container) return;
        opts = opts || {};

        // Limit active floating texts
        if (this._floats.length >= 15) {
            var old = this._floats.shift();
            if (old && old.parentNode) old.parentNode.removeChild(old);
        }

        var el = document.createElement('div');
        el.className = 'float-text';
        el.textContent = text;
        el.style.left = x + 'px';
        el.style.top = y + 'px';
        el.style.color = color;
        el.style.fontSize = opts.large ? '18px' : '14px';
        el.style.textShadow = '0 0 10px ' + color;

        this._container.appendChild(el);
        this._floats.push(el);

        setTimeout(function() {
            if (el.parentNode) el.parentNode.removeChild(el);
        }, GAME_CONSTANTS.FLOAT_TEXT_DURATION);
    };

    /** Show full-screen color flash */
    HUDManager.prototype.showScreenFlash = function(type) {
        if (!this._container) return;
        var f = document.createElement('div');
        f.className = 'screen-flash ' + type;
        this._container.appendChild(f);
        setTimeout(function() {
            if (f.parentNode) f.parentNode.removeChild(f);
        }, GAME_CONSTANTS.SCREEN_FLASH_DURATION);
    };

    /** Show wave announcement banner */
    HUDManager.prototype.showWaveBanner = function(wave, isBoss) {
        if (!this._container) return;

        var ex = this._container.querySelector('.wave-banner');
        if (ex) ex.parentNode.removeChild(ex);

        var b = document.createElement('div');
        b.className = 'wave-banner' + (isBoss ? ' boss-wave' : '');
        b.textContent = isBoss ? 'BOSS WAVE ' + wave : 'WAVE ' + wave;
        this._container.appendChild(b);

        setTimeout(function() {
            if (b.parentNode) b.parentNode.removeChild(b);
        }, GAME_CONSTANTS.WAVE_BANNER_DURATION);
    };

    /** Show achievement popup */
    HUDManager.prototype.showAchievement = function(title, name) {
        if (!this._container) return;
        var p = document.createElement('div');
        p.className = 'achievement-popup';
        p.innerHTML =
            '<div class="achieve-title">' +
            '<span class="icon icon-star icon-sm earned" style="margin-right:4px;"></span> ' +
            title + '</div><div class="achieve-name">' + name + '</div>';
        this._container.appendChild(p);
        setTimeout(function() {
            if (p.parentNode) p.parentNode.removeChild(p);
        }, GAME_CONSTANTS.ACHIEVEMENT_DURATION);
    };

    /** Trigger screen shake */
    HUDManager.prototype.triggerShake = function(heavy) {
        if (!this._container) return;
        var cn = heavy ? 'shake' : 'shake-light';
        this._container.classList.add(cn);
        var container = this._container;
        setTimeout(function() {
            container.classList.remove(cn);
        }, heavy ? 300 : 200);
    };

    /** Reset cached values to force full update */
    HUDManager.prototype.resetCache = function() {
        for (var k in this._cache) {
            this._cache[k] = k === 'healthState' ? '' : -1;
        }
    };

    /** Check if HUD is visible */
    HUDManager.prototype.isVisible = function() {
        return this._visible;
    };

    return HUDManager;
})();

window.HUDManager = HUDManager;