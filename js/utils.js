/**
 * Math Blaster - Utility Functions & Constants
 * 
 * This file contains:
 * - Math problem generator (easy, normal, hard, insane)
 * - Custom problems merger (from config/custom-words.js)
 * - Difficulty configurations
 * - Enemy type definitions
 * - Powerup definitions
 * - Game constants
 * - Screen identifiers
 * - Game state constants
 * - Storage keys for LocalStorage
 * - Utility helper functions
 * 
 * This file must load AFTER config/custom-words.js
 * and BEFORE all other game scripts.
 */

// ============================================
// MATH PROBLEM GENERATOR
// Four difficulty levels with appropriate complexity
// Easy: Single-digit addition/subtraction
// Normal: Double-digit operations, simple multiplication
// Hard: Larger multiplication, division, multi-step
// Insane: Complex expressions, powers, roots
// ============================================

var MATH_PROBLEM_GENERATOR = {
    
    /**
     * Generate a random math problem based on difficulty
     * @param {string} difficulty - 'easy', 'normal', 'hard', 'insane'
     * @returns {Object} { problem: "5+3", answer: "8" }
     */
    generate: function(difficulty) {
        switch(difficulty) {
            case 'easy': return this._generateEasy();
            case 'normal': return this._generateNormal();
            case 'hard': return this._generateHard();
            case 'insane': return this._generateInsane();
            default: return this._generateEasy();
        }
    },

    // ============================================
    // EASY: Single-digit addition/subtraction
    // ============================================
    _generateEasy: function() {
        var type = Math.random() > 0.5 ? 'add' : 'sub';
        
        if (type === 'add') {
            var a = this._randomInt(1, 9);
            var b = this._randomInt(1, 9);
            return {
                problem: a + '+' + b,
                answer: String(a + b)
            };
        } else {
            // Subtraction - ensure no negatives
            var a = this._randomInt(5, 9);
            var b = this._randomInt(1, a);
            return {
                problem: a + '-' + b,
                answer: String(a - b)
            };
        }
    },

    // ============================================
    // NORMAL: Double-digit, simple multiplication
    // ============================================
    _generateNormal: function() {
        var types = ['add', 'sub', 'mul'];
        var type = types[Math.floor(Math.random() * types.length)];
        
        if (type === 'add') {
            var a = this._randomInt(10, 50);
            var b = this._randomInt(10, 50);
            return {
                problem: a + '+' + b,
                answer: String(a + b)
            };
        } else if (type === 'sub') {
            var a = this._randomInt(20, 50);
            var b = this._randomInt(10, a);
            return {
                problem: a + '-' + b,
                answer: String(a - b)
            };
        } else {
            // Multiplication (single digit × single digit)
            var a = this._randomInt(2, 9);
            var b = this._randomInt(2, 9);
            return {
                problem: a + '×' + b,
                answer: String(a * b)
            };
        }
    },

    // ============================================
    // HARD: Larger multiplication, division, order of operations
    // ============================================
    _generateHard: function() {
        var types = ['mul', 'div', 'mixed'];
        var type = types[Math.floor(Math.random() * types.length)];
        
        if (type === 'mul') {
            var a = this._randomInt(5, 15);
            var b = this._randomInt(2, 12);
            return {
                problem: a + '×' + b,
                answer: String(a * b)
            };
        } else if (type === 'div') {
            // Division with exact results
            var b = this._randomInt(2, 10);
            var result = this._randomInt(2, 12);
            var a = b * result;
            return {
                problem: a + '÷' + b,
                answer: String(result)
            };
        } else {
            // Mixed: a + b × c (order of operations)
            var a = this._randomInt(2, 10);
            var b = this._randomInt(2, 9);
            var c = this._randomInt(2, 9);
            var answer = a + (b * c); // Multiplication first
            return {
                problem: a + '+' + b + '×' + c,
                answer: String(answer)
            };
        }
    },

    // ============================================
    // INSANE: Complex expressions, powers, roots
    // ============================================
    _generateInsane: function() {
        var types = ['complex', 'power', 'root', 'parentheses'];
        var type = types[Math.floor(Math.random() * types.length)];
        
        if (type === 'complex') {
            // Multi-step: a × b + c ÷ d
            var a = this._randomInt(2, 10);
            var b = this._randomInt(2, 8);
            var d = this._randomInt(2, 6);
            var cResult = this._randomInt(2, 10);
            var c = d * cResult;
            var answer = (a * b) + cResult;
            return {
                problem: a + '×' + b + '+' + c + '÷' + d,
                answer: String(answer)
            };
        } else if (type === 'power') {
            // Powers: a²
            var bases = [2, 3, 4, 5, 6, 7, 8, 9, 10];
            var a = bases[Math.floor(Math.random() * bases.length)];
            var exp = this._randomInt(2, 3); // ² or ³
            var answer = Math.pow(a, exp);
            return {
                problem: a + (exp === 2 ? '²' : '³'),
                answer: String(answer)
            };
        } else if (type === 'root') {
            // Square roots: √a
            var perfects = [4, 9, 16, 25, 36, 49, 64, 81, 100];
            var a = perfects[Math.floor(Math.random() * perfects.length)];
            var answer = Math.sqrt(a);
            return {
                problem: '√' + a,
                answer: String(answer)
            };
        } else {
            // Parentheses: (a + b) × c
            var a = this._randomInt(5, 20);
            var b = this._randomInt(5, 20);
            var c = this._randomInt(2, 9);
            var answer = (a + b) * c;
            return {
                problem: '(' + a + '+' + b + ')×' + c,
                answer: String(answer)
            };
        }
    },

    /**
     * Pre-generate a pool of problems for a difficulty level
     * Used to create variety without repeating same problems
     * @param {string} difficulty
     * @param {number} count - How many to generate
     * @returns {Array} Array of problem objects
     */
    generatePool: function(difficulty, count) {
        var pool = [];
        for (var i = 0; i < count; i++) {
            pool.push(this.generate(difficulty));
        }
        return pool;
    },

    /**
     * Helper: random integer
     */
    _randomInt: function(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }
};

// ============================================
// MATH PROBLEM DATABASE
// Stores generated problems as objects with problem and answer
// Structure: { problem: "5+3", answer: "8" }
// ============================================

var WORD_DB = {
    easy: [],
    normal: [],
    hard: [],
    insane: []
};

// Pre-generate initial problem pools
(function() {
    WORD_DB.easy = MATH_PROBLEM_GENERATOR.generatePool('easy', 100);
    WORD_DB.normal = MATH_PROBLEM_GENERATOR.generatePool('normal', 100);
    WORD_DB.hard = MATH_PROBLEM_GENERATOR.generatePool('hard', 100);
    WORD_DB.insane = MATH_PROBLEM_GENERATOR.generatePool('insane', 100);
})();

// ============================================
// CUSTOM PROBLEMS MERGER
// If the owner has added custom problems in
// config/custom-words.js, merge them into
// the problem database here.
// 
// Problems are validated:
// - Must be an object with 'problem' and 'answer'
// - problem must be a string
// - answer must be a string
// - Duplicates are skipped
// 
// Two modes:
// - replaceBuiltIn: false = add custom problems alongside generated
// - replaceBuiltIn: true = use ONLY custom problems
// ============================================

(function() {
    // Check if custom problems config exists and is enabled
    if (typeof CUSTOM_WORDS === 'undefined' || !CUSTOM_WORDS || !CUSTOM_WORDS.enabled) return;

    var cw = CUSTOM_WORDS.words;
    if (!cw) return;

    // Process each difficulty level
    var diffs = ['easy', 'normal', 'hard', 'insane'];

    for (var i = 0; i < diffs.length; i++) {
        var d = diffs[i];
        var cl = cw[d];

        // Skip if no custom problems for this difficulty
        if (!cl || !Array.isArray(cl) || cl.length === 0) continue;

        // Validate each problem
        var valid = [];
        for (var j = 0; j < cl.length; j++) {
            var p = cl[j];

            // Must be an object
            if (typeof p !== 'object' || p === null) continue;

            // Must have problem and answer properties
            if (typeof p.problem !== 'string' || typeof p.answer !== 'string') continue;

            // Clean up whitespace
            p.problem = p.problem.trim();
            p.answer = p.answer.trim();

            // Must not be empty
            if (p.problem.length === 0 || p.answer.length === 0) continue;

            // Skip duplicates within custom list
            var isDuplicate = false;
            for (var k = 0; k < valid.length; k++) {
                if (valid[k].problem === p.problem) {
                    isDuplicate = true;
                    break;
                }
            }
            if (isDuplicate) continue;

            valid.push(p);
        }

        // Skip if no valid problems after filtering
        if (valid.length === 0) continue;

        if (CUSTOM_WORDS.replaceBuiltIn) {
            // Replace mode: use ONLY custom problems
            WORD_DB[d] = valid;
        } else {
            // Mix mode: add custom problems that don't already exist
            for (var m = 0; m < valid.length; m++) {
                var exists = false;
                for (var n = 0; n < WORD_DB[d].length; n++) {
                    if (WORD_DB[d][n].problem === valid[m].problem) {
                        exists = true;
                        break;
                    }
                }
                if (!exists) {
                    WORD_DB[d].push(valid[m]);
                }
            }
        }
    }
})();

// ============================================
// DIFFICULTY CONFIGURATIONS
// Each difficulty has different settings that
// affect how the game plays:
// 
// baseSpeed: how fast enemies fall (pixels per frame)
// baseSpawnRate: milliseconds between enemy spawns
// wordPool: which problem list to use
// enemyTypes: which enemy types can appear
// healthDamage: damage when enemy reaches bottom
// speedScaling: how much speed increases per wave
// spawnScaling: how much spawn rate decreases per wave
// ============================================

var DIFFICULTY_CONFIG = {
    easy: {
        baseSpeed: 0.3,          // Slow falling speed
        baseSpawnRate: 3000,      // 3 seconds between spawns
        wordPool: 'easy',         // Simple problems
        enemyTypes: ['normal'],   // Only normal enemies
        healthDamage: 10,         // Low damage per miss
        speedScaling: 0.03,       // Gentle speed increase per wave
        spawnScaling: 0.02        // Gentle spawn rate increase per wave
    },
    normal: {
        baseSpeed: 0.5,          // Medium speed
        baseSpawnRate: 2200,      // 2.2 seconds between spawns
        wordPool: 'normal',       // Medium problems
        enemyTypes: ['normal', 'fast'],  // Normal and fast enemies
        healthDamage: 15,
        speedScaling: 0.04,
        spawnScaling: 0.025
    },
    hard: {
        baseSpeed: 0.7,          // Fast
        baseSpawnRate: 1600,      // 1.6 seconds between spawns
        wordPool: 'hard',         // Complex problems
        enemyTypes: ['normal', 'fast', 'zigzag', 'stealth'],
        healthDamage: 20,
        speedScaling: 0.05,
        spawnScaling: 0.03
    },
    insane: {
        baseSpeed: 1.0,          // Very fast
        baseSpawnRate: 1200,      // 1.2 seconds between spawns
        wordPool: 'insane',       // Very complex problems
        enemyTypes: ['normal', 'fast', 'zigzag', 'stealth', 'boss'],
        healthDamage: 25,
        speedScaling: 0.06,
        spawnScaling: 0.035
    }
};

// ============================================
// ENEMY TYPE CONFIGURATIONS
// Each enemy type has different visual and
// gameplay properties:
// 
// color: hex color for the enemy box border
// speedMultiplier: multiplied with base speed
// hp: hit points (boss needs 3 hits to kill)
// scoreMultiplier: bonus score for harder enemies
// height: pixel height of the enemy box
// ============================================

var ENEMY_TYPES = {
    normal:  { color: '#00d4ff', speedMultiplier: 1.0, hp: 1, scoreMultiplier: 1.0, height: 30 },
    fast:    { color: '#ff006e', speedMultiplier: 1.5, hp: 1, scoreMultiplier: 1.5, height: 30 },
    boss:    { color: '#ff006e', speedMultiplier: 0.6, hp: 3, scoreMultiplier: 3.0, height: 40 },
    zigzag:  { color: '#fb5607', speedMultiplier: 1.0, hp: 1, scoreMultiplier: 1.2, height: 30 },
    stealth: { color: '#8338ec', speedMultiplier: 0.9, hp: 1, scoreMultiplier: 1.5, height: 30 }
};

// ============================================
// POWERUP CONFIGURATIONS
// Each powerup has:
// 
// icon: CSS icon class name (without 'icon-' prefix)
// color: hex color for the indicator
// name: display name
// duration: how long the effect lasts in milliseconds
// instant: true = takes effect immediately (no duration)
// 
// Instant powerups: BOMB (destroys all), HEAL (restores health)
// Duration powerups: SHIELD, SLOW, DOUBLE, FREEZE
// ============================================

var POWERUP_TYPES = {
    SHIELD: { icon: 'shield',    color: '#00d4ff', name: 'Shield',    duration: 8000,  instant: false },
    SLOW:   { icon: 'slow',      color: '#00ff87', name: 'Slow Time', duration: 6000,  instant: false },
    DOUBLE: { icon: 'double',    color: '#ffbe0b', name: '2x Score',  duration: 10000, instant: false },
    BOMB:   { icon: 'bomb',      color: '#ff006e', name: 'Clear All', duration: 0,     instant: true  },
    HEAL:   { icon: 'heart',     color: '#ff006e', name: 'Heal',      duration: 0,     instant: true  },
    FREEZE: { icon: 'snowflake', color: '#88ddff', name: 'Freeze',    duration: 5000,  instant: false }
};

// ============================================
// GAME CONSTANTS
// Global numeric values used throughout the game
// ============================================

var GAME_CONSTANTS = {
    MAX_HEALTH: 100,              // Maximum player health points
    BASE_XP_TO_LEVEL: 100,        // XP needed for first rank up
    XP_SCALING: 1.3,              // Each rank needs 1.3x more XP
    LEVEL_HEALTH_BONUS: 10,       // Health restored on rank up
    POWERUP_DROP_CHANCE: 0.15,    // 15% chance enemy drops a powerup
    MAX_COMBO_MULTIPLIER: 20,     // Maximum combo score multiplier
    COMBO_THRESHOLD: 3,           // Combo count to trigger effects
    WAVE_COOLDOWN: 3000,          // Milliseconds between waves
    BASE_WORDS_PER_WAVE: 5,       // Starting enemies per wave
    WORDS_PER_WAVE_INCREMENT: 2,  // Additional enemies per wave
    BOSS_WAVE_INTERVAL: 5,        // Boss appears every N waves
    PROJECTILE_SPEED: 15,         // Bullet travel speed
    PROJECTILE_TRAIL_LENGTH: 8,   // Trail points behind bullet
    STAR_COUNT: 100,              // Background star count
    GRID_SIZE: 50,                // Background grid cell size
    FLOAT_TEXT_DURATION: 1000,    // Floating text lifetime (ms)
    SCREEN_FLASH_DURATION: 300,   // Screen flash lifetime (ms)
    ACHIEVEMENT_DURATION: 3000,   // Achievement popup lifetime (ms)
    WAVE_BANNER_DURATION: 2500,   // Wave banner lifetime (ms)
    MAX_LEADERBOARD_ENTRIES: 20,  // Max stored leaderboard scores
    TOTAL_LEVELS: 100             // Total waves shown in grid (not used now)
};

// ============================================
// SCREEN IDENTIFIERS
// These match the HTML element IDs for each
// screen overlay. Used by ScreenManager to
// show/hide screens.
// ============================================

var SCREENS = {
    MAIN_MENU: 'mainMenu',           // Main menu with New Game / Continue
    GAME_OVER: 'gameOverScreen',     // Game over with stats
    PAUSE: 'pauseScreen',           // Pause menu
    LEADERBOARD: 'leaderboardScreen', // High scores
    SETTINGS: 'settingsScreen',      // Settings toggles
    KEYBOARD_CHOICE: 'keyboardChoiceScreen' // Mobile keyboard choice
};

// ============================================
// GAME STATE CONSTANTS
// The game can be in one of these states
// at any given time.
// ============================================

var GAME_STATES = {
    MENU: 'menu',            // On main menu or other menu screens
    PLAYING: 'playing',      // Actively playing the game
    PAUSED: 'paused',        // Game is paused
    GAME_OVER: 'gameover'    // Player died, showing game over screen
};

// ============================================
// LOCAL STORAGE KEYS
// Keys used to save/load data from the
// browser's LocalStorage.
// 
// Each key is prefixed with 'mathblaster_'
// to avoid conflicts with other websites.
// ============================================

var STORAGE_KEYS = {
    LEADERBOARD: 'mathblaster_leaderboard',    // Top 20 high scores
    SETTINGS: 'mathblaster_settings',           // Player preferences
    PROGRESS: 'mathblaster_progress',           // General progress data
    LEVEL_SCORES: 'mathblaster_level_scores'    // Level completion data (legacy)
};

// ============================================
// UTILITY FUNCTIONS
// Shared helper functions used by all modules
// ============================================

var Utils = {
    /**
     * Clamp a value between min and max
     * @param {number} v - Value to clamp
     * @param {number} min - Minimum allowed
     * @param {number} max - Maximum allowed
     * @returns {number} Clamped value
     */
    clamp: function(v, min, max) {
        return Math.max(min, Math.min(max, v));
    },

    /**
     * Linear interpolation between two values
     * @param {number} a - Start value
     * @param {number} b - End value
     * @param {number} t - Progress (0 to 1)
     * @returns {number} Interpolated value
     */
    lerp: function(a, b, t) {
        return a + (b - a) * t;
    },

    /**
     * Get a random element from an array
     * @param {Array} arr - Source array
     * @returns {*} Random element
     */
    randomFrom: function(arr) {
        return arr[Math.floor(Math.random() * arr.length)];
    },

    /**
     * Get a random float between min and max
     * @param {number} min - Minimum value
     * @param {number} max - Maximum value
     * @returns {number} Random float
     */
    randomRange: function(min, max) {
        return Math.random() * (max - min) + min;
    },

    /**
     * Get a random integer between min and max (inclusive)
     * @param {number} min - Minimum value
     * @param {number} max - Maximum value
     * @returns {number} Random integer
     */
    randomInt: function(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    },

    /**
     * Calculate distance between two points
     * @param {number} x1 - First point X
     * @param {number} y1 - First point Y
     * @param {number} x2 - Second point X
     * @param {number} y2 - Second point Y
     * @returns {number} Distance
     */
    distance: function(x1, y1, x2, y2) {
        var dx = x2 - x1, dy = y2 - y1;
        return Math.sqrt(dx * dx + dy * dy);
    },

    /**
     * Format a number with locale-specific separators
     * Example: 1234567 becomes "1,234,567"
     * @param {number} n - Number to format
     * @returns {string} Formatted string
     */
    formatNumber: function(n) {
        return n.toLocaleString();
    },

    /**
     * Get the problem pool for a difficulty and wave number
     * Higher waves mix in harder problems automatically
     * 
     * Example: On easy difficulty wave 5, you get easy problems.
     * On easy difficulty wave 10, you get easy + some normal problems.
     * On easy difficulty wave 15, you get easy + normal + some hard problems.
     * 
     * @param {string} difficulty - Difficulty key
     * @param {number} wave - Current wave number
     * @returns {Array} Array of problem objects
     */
    getWordPool: function(difficulty, wave) {
        // Start with the base pool for this difficulty
        var pool = WORD_DB[difficulty] ? WORD_DB[difficulty].slice() : WORD_DB.easy.slice();
        var keys = ['easy', 'normal', 'hard', 'insane'];
        var idx = keys.indexOf(difficulty);

        // Mix in harder problems at higher waves
        // This makes the game progressively harder even within a difficulty
        if (wave > 3 && idx < 1 && WORD_DB.normal) {
            // After wave 3 on easy: add some normal problems
            pool = pool.concat(WORD_DB.normal.slice(0, Math.min(wave * 2, WORD_DB.normal.length)));
        }
        if (wave > 6 && idx < 2 && WORD_DB.hard) {
            // After wave 6 on easy/normal: add some hard problems
            pool = pool.concat(WORD_DB.hard.slice(0, Math.min(wave, WORD_DB.hard.length)));
        }
        if (wave > 10 && idx < 3 && WORD_DB.insane) {
            // After wave 10 on easy/normal/hard: add some insane problems
            pool = pool.concat(WORD_DB.insane.slice(0, Math.min(Math.floor(wave / 2), WORD_DB.insane.length)));
        }

        return pool;
    },

    /**
     * Get a shuffled subset of unique problems from a pool
     * @param {Array} pool - Source problem pool
     * @param {number} count - How many problems to get
     * @returns {Array} Shuffled subset
     */
    getUniqueWords: function(pool, count) {
        var s = pool.slice().sort(function() { return Math.random() - 0.5; });
        return s.slice(0, Math.min(count, s.length));
    },

    /**
     * Calculate Solutions Per Minute from correct characters and time
     * SPM = (problems solved) / minutes
     * @param {number} cc - Correct characters typed
     * @param {number} ms - Elapsed time in milliseconds
     * @returns {number} Solutions per minute
     */
    calculateWPM: function(cc, ms) {
        var m = ms / 1000 / 60; // Convert ms to minutes
        // Estimate problems as characters / 3 (average problem length)
        return m > 0 ? Math.round(cc / 3 / m) : 0;
    },

    /**
     * Calculate typing accuracy as a percentage
     * @param {number} cc - Correct characters
     * @param {number} tc - Total characters typed
     * @returns {number} Accuracy percentage (0-100)
     */
    calculateAccuracy: function(cc, tc) {
        return tc > 0 ? Math.round(cc / tc * 100) : 0;
    },

    /**
     * Calculate star rating based on accuracy and score
     * 3 stars: accuracy >= 95% AND score ratio >= 90%
     * 2 stars: accuracy >= 80% AND score ratio >= 60%
     * 1 star: everything else
     * 
     * @param {number} acc - Accuracy percentage
     * @param {number} sr - Score ratio (actual / target)
     * @returns {number} Stars (1, 2, or 3)
     */
    calculateStars: function(acc, sr) {
        if (acc >= 95 && sr >= 0.9) return 3;
        if (acc >= 80 && sr >= 0.6) return 2;
        return 1;
    },

    /**
     * Safely load and parse JSON from LocalStorage
     * Returns fallback value if key doesn't exist or parse fails
     * 
     * @param {string} key - Storage key
     * @param {*} fb - Fallback value if not found
     * @returns {*} Parsed data or fallback
     */
    loadFromStorage: function(key, fb) {
        try {
            var d = localStorage.getItem(key);
            return d ? JSON.parse(d) : (fb !== undefined ? fb : null);
        } catch (e) {
            return fb !== undefined ? fb : null;
        }
    },

    /**
     * Safely save JSON data to LocalStorage
     * Silently fails if storage is full or unavailable
     * 
     * @param {string} key - Storage key
     * @param {*} data - Data to store (will be JSON.stringified)
     */
    saveToStorage: function(key, data) {
        try {
            localStorage.setItem(key, JSON.stringify(data));
        } catch (e) {
            // Storage full or unavailable - silently fail
        }
    },

    /**
     * Remove an item from LocalStorage
     * @param {string} key - Storage key to remove
     */
    removeFromStorage: function(key) {
        try {
            localStorage.removeItem(key);
        } catch (e) {
            // Silently fail
        }
    },

    /**
     * Detect if the current device is a mobile device
     * Checks user agent string and touch capability
     * @returns {boolean} True if mobile device
     */
    isMobile: function() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
            (navigator.maxTouchPoints && navigator.maxTouchPoints > 2);
    },

    /**
     * Request fullscreen mode on an element
     * Handles vendor prefixes for cross-browser support
     * @param {HTMLElement} el - Element to make fullscreen
     */
    requestFullscreen: function(el) {
        if (el.requestFullscreen) el.requestFullscreen();
        else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen();
    },

    /**
     * Exit fullscreen mode
     * Handles vendor prefixes
     */
    exitFullscreen: function() {
        if (document.exitFullscreen) document.exitFullscreen();
        else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
    },

    /**
     * Check if currently in fullscreen mode
     * @returns {boolean} True if fullscreen
     */
    isFullscreen: function() {
        return !!(document.fullscreenElement || document.webkitFullscreenElement);
    },

    /**
     * Create a debounced version of a function
     * The function only executes after the specified delay
     * has passed since the last call. Useful for resize handlers.
     * 
     * @param {Function} fn - Function to debounce
     * @param {number} delay - Delay in milliseconds
     * @returns {Function} Debounced function
     */
    debounce: function(fn, delay) {
        var t;
        return function() {
            var a = arguments, s = this;
            clearTimeout(t);
            t = setTimeout(function() { fn.apply(s, a); }, delay);
        };
    },

    /**
     * Generate a unique ID string
     * Uses timestamp + random characters
     * @returns {string} Unique identifier
     */
    uid: function() {
        return Date.now().toString(36) + Math.random().toString(36).slice(2);
    }
};