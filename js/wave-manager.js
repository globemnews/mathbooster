/**
 * Math Blaster - Wave Manager
 * 
 * ENDLESS MODE:
 * - Waves get progressively harder
 * - Each wave has more enemies, faster speed, harder problems
 * - Boss appears every 5 waves
 * - Can start from any wave number (for continue feature)
 * 
 * DIFFICULTY SCALING PER WAVE:
 * - Problems per wave: increases by 2 each wave
 * - Enemy speed: increases by speedScaling each wave
 * - Spawn rate: decreases (faster) each wave
 * - Problem pool: mixes in harder problems at higher waves
 * - Enemy types: more types at higher difficulty settings
 * 
 * WAVE FLOW:
 * 1. Wave starts, enemies spawn one at a time
 * 2. Player must solve ALL problems
 * 3. When all destroyed, cooldown period starts
 * 4. Next wave begins after cooldown
 * 5. Repeat forever (or until player dies)
 */

var WaveManager = (function() {

    function WaveManager(deps) {
        /** Audio engine for sounds */
        this.audio = deps.audio;

        /** Current wave number */
        this.wave = 1;

        /** Level number (0 for endless) */
        this.level = 0;

        /** Whether in level mode */
        this.levelMode = false;

        /** Current difficulty */
        this.difficulty = 'easy';

        /** Whether wave is actively spawning */
        this.waveActive = false;

        /** Enemies spawned this wave */
        this.wordsSpawned = 0;

        /** Total enemies to spawn this wave */
        this.wordsToSpawn = 5;

        /** Timer until next spawn */
        this.spawnTimer = 0;

        /** Time between spawns */
        this.spawnInterval = 2500;

        /** Cooldown between waves */
        this.waveCooldown = 0;

        /** Whether this is a boss wave */
        this.isBossWave = false;

        /** Whether spawning has started */
        this._spawnStarted = false;

        /** Level config (not used in endless) */
        this._levelConfig = null;

        // Callbacks
        this.onWaveStart = null;
        this.onLevelComplete = null;
        this.onSpawnEnemy = null;
    }

    /**
     * Initialize endless mode
     * Can start from any wave number for continue feature
     * 
     * @param {string} diff - Difficulty key
     * @param {number} startWave - Wave to start from (default 1)
     */
    WaveManager.prototype.initEndless = function(diff, startWave) {
        this.levelMode = false;
        this.difficulty = diff;
        this.level = 0;

        // Start from specified wave (for continue feature)
        this.wave = (startWave && startWave >= 1) ? startWave : 1;

        // Reset state
        this.waveActive = false;
        this.wordsSpawned = 0;
        this.spawnTimer = 0;
        this.isBossWave = false;
        this._spawnStarted = false;

        // Calculate parameters for starting wave
        this._calcWaveParams();

        // Brief delay before first wave starts
        this.waveCooldown = 1500;
    };

    /**
     * Calculate wave parameters based on current wave number
     * Higher waves = more enemies, faster spawning, faster speed
     */
    WaveManager.prototype._calcWaveParams = function() {
        var dc = DIFFICULTY_CONFIG[this.difficulty] || DIFFICULTY_CONFIG.easy;

        // Problems per wave: starts at 5, increases by 2 each wave
        // Hard mode gets +3, insane gets +5
        this.wordsToSpawn = GAME_CONSTANTS.BASE_WORDS_PER_WAVE +
            this.wave * GAME_CONSTANTS.WORDS_PER_WAVE_INCREMENT;

        if (this.difficulty === 'hard') this.wordsToSpawn += 3;
        if (this.difficulty === 'insane') this.wordsToSpawn += 5;

        // Spawn interval decreases (faster) as waves progress
        // Minimum 40% of base rate to prevent impossible speeds
        this.spawnInterval = dc.baseSpawnRate *
            (1 - Math.min(0.6, this.wave * dc.spawnScaling));

        // Minimum spawn interval to keep game playable
        if (this.spawnInterval < 500) this.spawnInterval = 500;

        // Boss every 5 waves (not on easy)
        this.isBossWave = (this.wave % GAME_CONSTANTS.BOSS_WAVE_INTERVAL === 0) &&
            this.difficulty !== 'easy';

        // Reset spawn tracking
        this.wordsSpawned = 0;
        this.spawnTimer = 0;
        this._spawnStarted = false;
    };

    /**
     * Get the base speed for enemies this wave
     * Speed increases with each wave
     * @returns {number} Base speed value
     */
    WaveManager.prototype._getBaseSpeed = function() {
        var dc = DIFFICULTY_CONFIG[this.difficulty] || DIFFICULTY_CONFIG.easy;
        // Speed increases each wave
        return dc.baseSpeed * (1 + this.wave * dc.speedScaling);
    };

    /**
     * Main update - called every frame
     * Handles spawn timing and wave completion
     * 
     * @param {number} dt - Delta time in ms
     * @param {number} activeEnemyCount - Enemies alive on screen
     */
    WaveManager.prototype.update = function(dt, activeEnemyCount) {
        // --- Between-wave cooldown ---
        if (this.waveCooldown > 0) {
            this.waveCooldown -= dt;
            if (this.waveCooldown <= 0) {
                this.waveCooldown = 0;
                this.waveActive = true;
                this._spawnStarted = false;

                // Notify wave start
                if (this.onWaveStart) {
                    this.onWaveStart(this.wave, this.isBossWave);
                }

                // Play sound
                this.audio.play(this.isBossWave ? 'boss' : 'wave');
            }
            return;
        }

        // --- Not active ---
        if (!this.waveActive) return;

        // --- Spawn enemies ---
        this.spawnTimer -= dt;

        if (this.spawnTimer <= 0 && this.wordsSpawned < this.wordsToSpawn) {
            this._spawnStarted = true;

            if (this.onSpawnEnemy) {
                var dc = DIFFICULTY_CONFIG[this.difficulty] || DIFFICULTY_CONFIG.easy;

                // Get problem from appropriate pool
                // Higher waves mix in harder problems automatically
                var problemPool = Utils.getWordPool(this.difficulty, this.wave);
                var problemObj = Utils.randomFrom(problemPool);

                // Determine enemy type
                var type;
                if (this.isBossWave && this.wordsSpawned === 0) {
                    // First enemy of boss wave is a boss
                    type = 'boss';
                } else {
                    // Random from available types for this difficulty
                    type = Utils.randomFrom(dc.enemyTypes);
                }

                // Base speed with wave scaling
                var baseSpeed = this._getBaseSpeed();

                // Fire spawn with problem object
                this.onSpawnEnemy({
                    problemObj: problemObj,
                    type: type,
                    baseSpeed: baseSpeed,
                    wave: this.wave,
                    difficulty: this.difficulty
                });
            }

            this.wordsSpawned++;
            this.spawnTimer = this.spawnInterval;
        }

        // --- Check wave completion ---
        // ALL enemies must be spawned AND destroyed AND spawning must have started
        var allSpawned = (this.wordsSpawned >= this.wordsToSpawn);
        var noneAlive = (activeEnemyCount === 0);

        if (allSpawned && noneAlive && this._spawnStarted) {
            // Wave complete!
            this.waveActive = false;

            // Advance to next wave
            this.wave++;

            // Calculate new wave parameters (harder)
            this._calcWaveParams();

            // Cooldown before next wave
            this.waveCooldown = GAME_CONSTANTS.WAVE_COOLDOWN;
        }
    };

    /** Get level config (null for endless) */
    WaveManager.prototype.getLevelConfig = function() {
        return this._levelConfig;
    };

    /** Reset */
    WaveManager.prototype.reset = function() {
        this.wave = 1;
        this.level = 0;
        this.levelMode = false;
        this.waveActive = false;
        this.wordsSpawned = 0;
        this.spawnTimer = 0;
        this.waveCooldown = 0;
        this.isBossWave = false;
        this._spawnStarted = false;
        this._levelConfig = null;
    };

    /**
     * Generate wave milestone configs for level select screen
     * Shows every 5th wave as a "level" milestone
     */
    WaveManager.generateAllLevelConfigs = function(loaded) {
        var configs = [];
        var dummy = new WaveManager({ audio: { play: function() {} } });
        for (var i = 1; i <= GAME_CONSTANTS.TOTAL_LEVELS; i++) {
            if (loaded && loaded[i - 1]) {
                configs.push(loaded[i - 1]);
            } else {
                configs.push({
                    level: i,
                    wave: i,
                    description: 'Wave ' + i
                });
            }
        }
        return configs;
    };

    return WaveManager;
})();

window.WaveManager = WaveManager;