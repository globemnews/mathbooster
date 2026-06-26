/**
 * Math Blaster - Math Problem Enemy
 * 
 * Enemy types:
 * - normal: standard speed, 1 HP
 * - fast: 1.5x speed, 1 HP
 * - boss: 0.6x speed, 3 HP (must solve the problem 3 times to kill)
 * - zigzag: moves side to side, 1 HP
 * - stealth: nearly invisible until targeted, 1 HP
 * 
 * BOSS MECHANIC:
 * When a boss is hit (problem solved correctly), HP decreases by 1.
 * If HP > 0, the boss is NOT dead yet. The problem resets so the
 * player must solve it again. The targeting is also released so
 * the input system can re-acquire the boss as a new target.
 * 
 * PROBLEM STRUCTURE:
 * Each enemy has a problem object: { problem: "5+3", answer: "8" }
 * Players type the ANSWER (not the problem)
 */

var WordEnemy = (function() {

    function WordEnemy(config) {
        /** Unique ID */
        this.id = config.id || 0;

        /** The problem object { problem: "5+3", answer: "8" } */
        this.problemObj = config.problemObj;

        /** The problem text to display (e.g., "5+3") */
        this.word = this.problemObj.problem;

        /** The correct answer (e.g., "8") */
        this.answer = this.problemObj.answer;

        /** Current X position */
        this.x = config.x;

        /** Current Y position */
        this.y = config.y;

        /** Fall speed in pixels per frame */
        this.speed = config.speed;

        /** Enemy type: 'normal', 'fast', 'boss', 'zigzag', 'stealth' */
        this.type = config.type || 'normal';

        /** How many characters of the ANSWER have been typed so far */
        this.typed = 0;

        /** Whether this enemy is alive */
        this.active = true;

        /** Whether this enemy is currently being targeted by the player */
        this.targeted = false;

        /** Calculated width (set during rendering) */
        this.width = 0;

        /** Height of the enemy box */
        this.height = ENEMY_TYPES[this.type] ? ENEMY_TYPES[this.type].height : 30;

        /** Current opacity (for fade-in and stealth) */
        this.opacity = 0;

        /** Whether still fading in */
        this._fadeIn = true;

        /** Current scale (for spawn animation) */
        this.scale = 0.5;

        /** Current hit points */
        this.hp = ENEMY_TYPES[this.type] ? ENEMY_TYPES[this.type].hp : 1;

        /** Maximum hit points (for HP bar display) */
        this.maxHp = this.hp;

        /** Flash intensity when hit (0 to 1) */
        this.flash = 0;

        /** Color based on enemy type */
        this.color = ENEMY_TYPES[this.type] ? ENEMY_TYPES[this.type].color : '#00d4ff';

        /** Powerup to drop when destroyed (null if none) */
        this.powerup = config.powerup || null;

        /** Whether this enemy is frozen by freeze powerup */
        this.frozen = false;

        /** Score multiplier based on type */
        this.scoreMultiplier = ENEMY_TYPES[this.type] ? ENEMY_TYPES[this.type].scoreMultiplier : 1.0;

        /** Zigzag wobble phase */
        this._wobblePhase = Math.random() * Math.PI * 2;

        /** Zigzag wobble speed */
        this._wobbleSpeed = Math.random() * 0.02 + 0.01;

        /** Zigzag wobble amount (0 for non-zigzag) */
        this._wobbleAmount = this.type === 'zigzag' ? 60 : 0;
    }

    /**
     * Update enemy position and state each frame
     * @param {number} canvasWidth - Canvas width for boundary clamping
     * @param {number} bottomLimit - Y position of danger line
     * @param {boolean} slowActive - Whether slow powerup is active
     * @param {boolean} freezeActive - Whether freeze powerup is active
     * @returns {boolean} True if enemy reached the bottom
     */
    WordEnemy.prototype.update = function(canvasWidth, bottomLimit, slowActive, freezeActive) {
        if (!this.active) return false;

        // Fade in animation
        if (this._fadeIn) {
            this.opacity = Math.min(1, this.opacity + 0.05);
            this.scale = Math.min(1, this.scale + 0.05);
            if (this.opacity >= 1) this._fadeIn = false;
        }

        // Flash decay after being hit
        if (this.flash > 0) this.flash = Math.max(0, this.flash - 0.05);

        // Don't move if frozen
        if (freezeActive || this.frozen) return false;

        // Calculate speed with slow powerup
        var spd = this.speed;
        if (slowActive) spd *= 0.4;

        // Move downward
        this.y += spd;

        // Zigzag movement
        if (this._wobbleAmount > 0) {
            this._wobblePhase += this._wobbleSpeed;
            this.x += Math.sin(this._wobblePhase) * 1.5;
            this.x = Utils.clamp(this.x, 10, canvasWidth - 10);
        }

        // Stealth visibility
        if (this.type === 'stealth') {
            this.opacity = this.targeted ? 0.9 : 0.25;
        }

        // Check if reached bottom
        return this.y >= bottomLimit;
    };

    /**
     * Apply a hit to this enemy
     * For bosses: decreases HP, resets typed count AND targeting
     * so the player must re-target and re-solve the problem
     * 
     * @returns {boolean} True if enemy is destroyed (HP reached 0)
     */
    WordEnemy.prototype.hit = function() {
        this.hp--;
        this.flash = 1;

        if (this.hp <= 0) {
            // Enemy is dead
            this.active = false;
            this.targeted = false;
            return true;
        }

        // Boss still alive - MUST reset targeting completely
        // This allows the input system to re-acquire this enemy
        // as a fresh target, requiring the player to solve the problem again
        this.typed = 0;
        this.targeted = false;

        return false;
    };

    /** Set whether this enemy is being targeted */
    WordEnemy.prototype.setTargeted = function(t) {
        this.targeted = t;
    };

    /** Check if the next expected character matches (for typing the ANSWER) */
    WordEnemy.prototype.matchesNextChar = function(c) {
        if (this.typed >= this.answer.length) return false;
        return this.answer[this.typed] === c;
    };

    /** Check if the answer starts with a given prefix */
    WordEnemy.prototype.matchesPrefix = function(p) {
        return this.answer.startsWith(p);
    };

    /** Advance the typed character counter by one */
    WordEnemy.prototype.advanceTyped = function() {
        if (this.typed < this.answer.length) this.typed++;
    };

    /** Check if the entire answer has been typed */
    WordEnemy.prototype.isFullyTyped = function() {
        return this.typed >= this.answer.length;
    };

    /**
     * Reset typing state completely
     * Used when player makes a mistake or target is released
     */
    WordEnemy.prototype.resetTyping = function() {
        this.typed = 0;
        this.targeted = false;
    };

    /** Freeze this enemy for a duration */
    WordEnemy.prototype.freeze = function(d) {
        var self = this;
        this.frozen = true;
        setTimeout(function() { self.frozen = false; }, d);
    };

    /** Deactivate enemy */
    WordEnemy.prototype.destroy = function() {
        this.active = false;
        this.targeted = false;
    };

    return WordEnemy;
})();

/**
 * EnemyFactory - Creates math problem enemies with proper configuration
 */
var EnemyFactory = {
    _nextId: 0,

    /**
     * Create a new enemy
     * @param {Object} p - Parameters
     * @param {Object} p.problemObj - Problem object { problem: "5+3", answer: "8" }
     * @param {number} p.canvasWidth - Canvas width for positioning
     * @param {string} p.type - Enemy type
     * @param {number} p.baseSpeed - Base speed
     * @param {number} p.wave - Current wave number
     * @param {string} p.difficulty - Difficulty key
     * @returns {WordEnemy}
     */
    create: function(p) {
        var tc = ENEMY_TYPES[p.type] || ENEMY_TYPES.normal;
        var dc = DIFFICULTY_CONFIG[p.difficulty] || DIFFICULTY_CONFIG.easy;

        // Random X position with padding from edges
        var pad = 60;
        var x = pad + Math.random() * (p.canvasWidth - pad * 2);

        // Calculate speed based on type, wave, and difficulty
        var speed = p.baseSpeed * tc.speedMultiplier * (1 + p.wave * dc.speedScaling);

        // Random powerup drop
        var powerup = null;
        if (Math.random() < GAME_CONSTANTS.POWERUP_DROP_CHANCE) {
            powerup = Utils.randomFrom(Object.keys(POWERUP_TYPES));
        }

        return new WordEnemy({
            id: this._nextId++,
            problemObj: p.problemObj,
            x: x,
            y: -30,
            speed: speed,
            type: p.type,
            powerup: powerup
        });
    },

    /** Select enemy type based on difficulty and wave */
    selectType: function(diff, wave, spawned) {
        var dc = DIFFICULTY_CONFIG[diff];
        if (!dc) return 'normal';
        if (wave % GAME_CONSTANTS.BOSS_WAVE_INTERVAL === 0 && spawned === 0 && diff !== 'easy') return 'boss';
        return Utils.randomFrom(dc.enemyTypes);
    },

    /** Select a random problem for the difficulty and wave */
    selectProblem: function(diff, wave) {
        var pool = Utils.getWordPool(diff, wave);
        return Utils.randomFrom(pool);
    },

    /** Reset ID counter for new game */
    resetIds: function() { this._nextId = 0; }
};

window.WordEnemy = WordEnemy;
window.EnemyFactory = EnemyFactory;