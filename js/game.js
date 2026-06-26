/**
 * Math Blaster - Game Orchestrator
 * 
 * SAVE SYSTEM:
 * - Full game state saved: wave, score, health, rank, XP, difficulty
 * - "Continue" only shows if saved difficulty matches current difficulty
 * - Changing difficulty hides Continue (different mode = fresh start)
 * - Save happens: on wave start, on pause, on quit, on game over
 * - "New Game" always clears save and starts fresh
 * - "Play Again" always starts fresh from wave 1
 * 
 * DIFFICULTY RULE:
 * If player was playing on Easy and switches to Hard,
 * the Continue button disappears because the save was
 * for Easy mode. They must start a New Game on Hard.
 * If they switch back to Easy, Continue reappears.
 */

var Game = (function() {

    /** LocalStorage key for game save */
    var SAVE_KEY = 'mathblaster_game_save';

    function Game() {
        // Create all systems
        this.settings = new SettingsManager();
        this.audio = new AudioEngine();
        this.audio.setSfxEnabled(this.settings.get('sfx'));
        this.audio.setMusicEnabled(this.settings.get('music'));
        this.canvas = document.getElementById('gameCanvas');
        this.renderer = new Renderer(this.canvas, { settings: this.settings });
        this.particles = new ParticleSystem(500);
        this.particles.setEnabled(this.settings.get('particles'));
        this.projectiles = new ProjectileSystem(50);
        this.waveManager = new WaveManager({ audio: this.audio });
        this.typingSystem = new TypingSystem({ audio: this.audio });
        this.powerups = new PowerUpSystem({ audio: this.audio, particles: this.particles });
        this.hud = new HUDManager();
        this.engine = new GameEngine({
            renderer: this.renderer, particles: this.particles, projectiles: this.projectiles,
            waveManager: this.waveManager, typingSystem: this.typingSystem, powerups: this.powerups,
            audio: this.audio, settings: this.settings, hud: this.hud
        });
        this.screenManager = new ScreenManager({ settings: this.settings, audio: this.audio });
        this.leaderboard = new LeaderboardManager();
        this.screenManager.setLeaderboard(this.leaderboard);
        this.adManager = new AdManager();
        this.mobile = new MobileHandler({ renderer: this.renderer });

        /** Pending action after keyboard choice */
        this._pendingStartAction = null;

        // Wire everything
        this._wireCallbacks();
        this._wireSettings();
        this._wireKeyboardChoice();
        this._wireBuiltInKeyboard();
        this._generateStars();
    }

    // ============================================
    // SAVE / LOAD GAME STATE
    // ============================================

    /**
     * Save the complete game state to LocalStorage
     * Includes the difficulty so we can check if it matches
     * the current selected difficulty when showing Continue
     */
    Game.prototype._saveGameState = function() {
        var state = {
            wave: this.waveManager.wave,
            score: this.engine.gameData.score,
            health: this.engine.gameData.health,
            xpLevel: this.engine.gameData.xpLevel,
            xp: this.engine.gameData.xp,
            xpToLevel: this.engine.gameData.xpToLevel,
            difficulty: this.waveManager.difficulty
        };
        Utils.saveToStorage(SAVE_KEY, state);
    };

    /**
     * Load saved game state from LocalStorage
     * Returns null if no save or save is invalid
     * @returns {Object|null} Saved state object or null
     */
    Game.prototype._loadGameState = function() {
        var state = Utils.loadFromStorage(SAVE_KEY, null);

        // Validate all required fields exist
        if (!state || typeof state !== 'object') return null;
        if (typeof state.wave !== 'number' || state.wave < 1) return null;
        if (typeof state.score !== 'number') return null;
        if (typeof state.health !== 'number') return null;
        if (typeof state.difficulty !== 'string') return null;

        return state;
    };

    /**
     * Check if a valid save exists for the CURRENT difficulty
     * Continue only shows if the save matches the selected difficulty
     * 
     * @returns {boolean} True if valid matching save exists
     */
    Game.prototype._hasSave = function() {
        var state = this._loadGameState();
        if (!state) return false;

        // Must be past wave 1
        if (state.wave <= 1) return false;

        // Must match current difficulty
        var currentDiff = this.settings.get('difficulty');
        if (state.difficulty !== currentDiff) return false;

        return true;
    };

    /** Delete saved game state */
    Game.prototype._clearSave = function() {
        Utils.removeFromStorage(SAVE_KEY);
    };

    /**
     * Update main menu Continue button visibility
     * Shows Continue only if:
     * 1. A valid save exists
     * 2. Save is past wave 1
     * 3. Save difficulty matches current difficulty
     * 
     * Also shows save info (wave, score, rank)
     */
    Game.prototype._updateMainMenu = function() {
        var btnContinue = document.getElementById('btnContinue');
        var hint = document.getElementById('savedWaveHint');
        var state = this._loadGameState();
        var currentDiff = this.settings.get('difficulty');

        // Check if save exists AND matches current difficulty
        var canContinue = (
            state !== null &&
            state.wave > 1 &&
            state.difficulty === currentDiff
        );

        if (canContinue) {
            // Show Continue button with save details
            if (btnContinue) btnContinue.style.display = '';
            if (hint) {
                hint.textContent = 'Continue: Wave ' + state.wave +
                    ' | Score: ' + Utils.formatNumber(state.score) +
                    ' | Rank: ' + (state.xpLevel || 1) +
                    ' (' + state.difficulty + ')';
            }
        } else {
            // Hide Continue button
            if (btnContinue) btnContinue.style.display = 'none';

            // Show appropriate hint
            if (hint) {
                if (state && state.difficulty && state.difficulty !== currentDiff) {
                    // Save exists but for a different difficulty
                    hint.textContent = 'Save exists for ' + state.difficulty + ' mode. Switch back to continue.';
                } else {
                    hint.textContent = 'Solve the problems to shoot them down!';
                }
            }
        }
    };

    // ============================================
    // KEYBOARD CHOICE
    // ============================================

    Game.prototype._wireKeyboardChoice = function() {
        var self = this;
        var btnBI = document.getElementById('btnChooseBuiltIn');
        if (btnBI) btnBI.addEventListener('click', function() {
            self.audio.play('click');
            self._selectKeyboard('builtin');
        });
        var btnNat = document.getElementById('btnChooseNative');
        if (btnNat) btnNat.addEventListener('click', function() {
            self.audio.play('click');
            self._selectKeyboard('native');
        });
        var btnKbType = document.getElementById('btnKeyboardType');
        if (btnKbType) {
            btnKbType.addEventListener('click', function() {
                if (self.engine.isPlaying() || self.engine.isPaused()) return;
                self.audio.play('click');
                var cur = self.settings.get('keyboardType');
                var next = (cur === 'builtin') ? 'native' : 'builtin';
                self.settings.set('keyboardType', next);
                self.mobile.setKeyboardType(next);
                btnKbType.textContent = (next === 'builtin') ? 'Game' : 'Phone';
            });
        }
        var kbRow = document.getElementById('keyboardTypeRow');
        if (kbRow && Utils.isMobile()) kbRow.style.display = 'flex';
        this.screenManager._screenIds.push('keyboardChoiceScreen');
    };

    Game.prototype._selectKeyboard = function(type) {
        this.settings.set('keyboardType', type);
        this.mobile.setKeyboardType(type);
        var btn = document.getElementById('btnKeyboardType');
        if (btn) btn.textContent = (type === 'builtin') ? 'Game' : 'Phone';
        var cs = document.getElementById('keyboardChoiceScreen');
        if (cs) cs.classList.add('hidden');
        if (this._pendingStartAction) {
            var action = this._pendingStartAction;
            this._pendingStartAction = null;
            action();
        }
    };

    Game.prototype._showKeyboardChoice = function(onComplete) {
        this._pendingStartAction = onComplete;
        var cs = document.getElementById('keyboardChoiceScreen');
        if (cs) cs.classList.remove('hidden');
    };

    Game.prototype._needsKeyboardChoice = function() {
        return Utils.isMobile() && !this.settings.hasChosenKeyboard();
    };

    Game.prototype._toggleKeyboardSettingVisibility = function(show) {
        var kbRow = document.getElementById('keyboardTypeRow');
        if (kbRow && Utils.isMobile()) kbRow.style.display = show ? 'flex' : 'none';
    };

    // ============================================
    // BUILT-IN KEYBOARD
    // ============================================

    Game.prototype._wireBuiltInKeyboard = function() {
        var self = this;
        this.mobile.onBuiltInKey = function(key) {
            if (!self.engine.isPlaying() || !self.typingSystem.isActive()) return;
            if (key === 'backspace') {
                self.typingSystem._handleKeyDown({ key: 'Backspace', preventDefault: function() {} });
                return;
            }
            // Process the numeric key
            self.typingSystem._processChar(key);
            var target = self.typingSystem.getTarget();
            if (target) self.mobile.flashKey(key, true);
        };
        var savedType = this.settings.get('keyboardType');
        if (savedType === 'builtin' || savedType === 'native') {
            this.mobile.setKeyboardType(savedType);
        }
    };

    // ============================================
    // CALLBACKS
    // ============================================

    Game.prototype._wireCallbacks = function() {
        var self = this;

        /** "New Game" - always fresh start from wave 1 */
        this.screenManager.onStartGame = function() {
            // Clear any existing save for this difficulty
            self._clearSave();
            self._startFresh();
        };

        /** "Continue" - load saved state and resume */
        this.screenManager.onContinue = function() {
            self._continueGame();
        };

        /** "Play Again" after game over - fresh start */
        this.screenManager.onPlayAgain = function() {
            self._clearSave();
            self._startFresh();
        };

        this.screenManager.onResume = function() { self.resumeGame(); };
        this.screenManager.onQuit = function() { self.quitGame(); };

        /**
         * Difficulty change handler
         * When player changes difficulty, update the Continue button
         * because the save might not match the new difficulty
         */
        this.screenManager.onDifficultyChange = function(diff) {
            self.settings.set('difficulty', diff);
            // Immediately update Continue button visibility
            // If save was for 'easy' and player switched to 'hard',
            // Continue disappears
            self._updateMainMenu();
        };

        /** Reset progress - clear everything */
        this.screenManager.onProgressReset = function() {
            self.leaderboard.clear();
            self.adManager.resetLevelCounter();
            self._clearSave();
            self._updateMainMenu();
        };

        this.screenManager.onSettingChange = function() {};

        // Number input system
        this.typingSystem.onCorrectChar = function(e) { self.engine.handleFireProjectile(e); };
        this.typingSystem.onWordComplete = function(e, c) { self.engine.handleWordComplete(e, c); };
        this.typingSystem.onComboChange = function(c) { self.hud.updateCombo(c); };

        // Waves - auto-save on each new wave
        this.waveManager.onSpawnEnemy = function(d) { self.engine.spawnEnemy(d); };
        this.waveManager.onWaveStart = function(w, b) {
            self.hud.showWaveBanner(w, b);
            // Auto-save progress every wave
            self._saveGameState();
        };
        this.waveManager.onLevelComplete = null;

        // Game over
        this.engine.onGameOver = function(s) { self._handleGameOver(s); };

        // Powerups
        this.powerups.onActivate('BOMB', function() {
            self.hud.showScreenFlash('bomb');
            for (var i = 0; i < self.engine.gameData.enemies.length; i++)
                self.typingSystem.handleEnemyDestroyed(self.engine.gameData.enemies[i]);
        });
        this.powerups.onActivate('HEAL', function() { self.hud.showScreenFlash('heal'); });
        this.powerups.onActivate('FREEZE', function(dur) {
            for (var i = 0; i < self.engine.gameData.enemies.length; i++)
                if (self.engine.gameData.enemies[i].active) self.engine.gameData.enemies[i].freeze(dur);
        });

        // Pause button
        var pb = document.getElementById('pauseBtn');
        if (pb) pb.addEventListener('click', function() { self.audio.play('click'); self.togglePause(); });

        // Escape key
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') {
                if (self.engine.isPlaying()) self.togglePause();
                else if (self.engine.isPaused()) self.resumeGame();
            }
        });

        // Keyboard button
        var kb = document.getElementById('keyboardBtn');
        if (kb) kb.addEventListener('click', function(e) {
            e.preventDefault();
            if (self.engine.isPlaying()) self.mobile.showKeyboard();
            self.audio.init();
        });

        // Answer input display tap
        var td = document.getElementById('typingDisplay');
        if (td) td.addEventListener('click', function(e) {
            e.preventDefault();
            if (self.engine.isPlaying() && !self.mobile.isBuiltInKeyboard()) {
                self.typingSystem.focusInput();
            }
        });
    };

    // ============================================
    // SETTINGS
    // ============================================

    Game.prototype._wireSettings = function() {
        var self = this;
        this.settings.onChange('sfx', function(v) { self.audio.setSfxEnabled(v); });
        this.settings.onChange('music', function(v) {
            self.audio.setMusicEnabled(v);
            if (v && self.engine.isPlaying()) self.audio.startMusic();
            else self.audio.stopMusic();
        });
        this.settings.onChange('particles', function(v) { self.particles.setEnabled(v); });
        this.settings.onChange('fullscreen', function(v) { self.settings.handleFullscreen(v); });
        this.settings.onChange('keyboardType', function(v) {
            if (!self.engine.isPlaying() && !self.engine.isPaused()) self.mobile.setKeyboardType(v);
        });
    };

    // ============================================
    // GAME FLOW
    // ============================================

    /** Initialize the app */
    Game.prototype.init = function() {
        this.settings.applyToDOM();
        this.leaderboard.render();
        this.engine.setState(GAME_STATES.MENU);
        this.engine.startLoop();
        this._toggleKeyboardSettingVisibility(true);
        this._updateMainMenu();
        this.screenManager.showScreen(SCREENS.MAIN_MENU);
        this.adManager.showGameStartAd();
    };

    /**
     * Start a fresh new game from wave 1
     * Everything is reset to defaults
     */
    Game.prototype._startFresh = function() {
        var self = this;
        var diff = this.settings.get('difficulty');

        var begin = function() {
            self.audio.init();

            // Reset to clean state
            self.engine.resetGameState();
            self.engine.setState(GAME_STATES.PLAYING);

            // Start from wave 1
            self.waveManager.initEndless(diff, 1);

            // Show game
            self._showGameUI();
        };

        // Mobile keyboard choice
        if (this._needsKeyboardChoice()) {
            this._showKeyboardChoice(function() {
                var shown = self.adManager.showGameStartAd(begin);
                if (!shown) begin();
            });
            return;
        }

        var shown = this.adManager.showGameStartAd(begin);
        if (!shown) begin();
    };

    /**
     * Continue from saved game state
     * Restores wave, score, health, rank, XP exactly
     */
    Game.prototype._continueGame = function() {
        var self = this;
        var state = this._loadGameState();

        // If no valid save or wrong difficulty, start fresh
        if (!state || state.difficulty !== this.settings.get('difficulty')) {
            this._clearSave();
            this._startFresh();
            return;
        }

        var begin = function() {
            self.audio.init();

            // Reset engine to clear old enemies/particles
            self.engine.resetGameState();

            // RESTORE saved values
            self.engine.gameData.score = state.score || 0;
            self.engine.gameData.health = state.health || GAME_CONSTANTS.MAX_HEALTH;
            self.engine.gameData.xpLevel = state.xpLevel || 1;
            self.engine.gameData.xp = state.xp || 0;
            self.engine.gameData.xpToLevel = state.xpToLevel || GAME_CONSTANTS.BASE_XP_TO_LEVEL;

            // Set playing state
            self.engine.setState(GAME_STATES.PLAYING);

            // Start from saved wave with saved difficulty
            self.waveManager.initEndless(state.difficulty, state.wave);

            // Show game
            self._showGameUI();
        };

        // Mobile keyboard choice
        if (this._needsKeyboardChoice()) {
            this._showKeyboardChoice(begin);
            return;
        }

        begin();
    };

    /**
     * Show game UI elements (shared by _startFresh and _continueGame)
     * Sets up HUD, input system, keyboard, music
     */
    Game.prototype._showGameUI = function() {
        this._toggleKeyboardSettingVisibility(false);
        this.hud.show();
        this.hud.resetCache();
        this.screenManager.hideAllScreens();
        this.typingSystem.start();
        this.typingSystem.setEnemies(this.engine.gameData.enemies);
        this.hud.showWaveBanner(this.waveManager.wave, this.waveManager.isBossWave);
        this.mobile.showKeyboard();
        if (this.settings.get('music')) this.audio.startMusic();
        this.engine.startLoop();
        this.mobile.requestWakeLock();
    };

    /** Toggle pause */
    Game.prototype.togglePause = function() {
        if (this.engine.isPlaying()) this.pauseGame();
        else if (this.engine.isPaused()) this.resumeGame();
    };

    /** Pause - saves state in case app is killed */
    Game.prototype.pauseGame = function() {
        this.engine.pause();
        this.hud.updatePauseButton(true);
        this.mobile.hideKeyboard();
        this._toggleKeyboardSettingVisibility(false);
        this._saveGameState();
        this.screenManager.showScreen(SCREENS.PAUSE);
    };

    /** Resume from pause */
    Game.prototype.resumeGame = function() {
        this.screenManager.hideAllScreens();
        this.engine.resume();
        this.hud.updatePauseButton(false);
        if (this.mobile.isBuiltInKeyboard()) this.mobile.showBuiltIn();
    };

    /**
     * Quit - saves full state and returns to menu
     * Continue button will appear if save is valid
     */
    Game.prototype.quitGame = function() {
        this._saveGameState();
        this.engine.setState(GAME_STATES.MENU);
        this.typingSystem.stop();
        this.audio.stopMusic();
        this.hud.hide();
        this.mobile.hideKeyboard();
        this._toggleKeyboardSettingVisibility(true);
        this._updateMainMenu();
        this.screenManager.showScreen(SCREENS.MAIN_MENU);
        this.mobile.releaseWakeLock();
    };

    // ============================================
    // GAME EVENTS
    // ============================================

    /** Handle game over */
    Game.prototype._handleGameOver = function(stats) {
        var self = this;
        this._saveGameState();
        this.typingSystem.stop();
        this.audio.stopMusic();
        this.hud.hide();
        this.mobile.hideKeyboard();
        this.mobile.releaseWakeLock();
        this._toggleKeyboardSettingVisibility(true);

        var hs = this.leaderboard.addEntry({
            score: stats.score, wave: stats.wave, wpm: stats.wpm,
            accuracy: stats.accuracy, difficulty: this.settings.get('difficulty'), level: 0
        });
        stats.isHighScore = hs;

        var show = function() { self.screenManager.showGameOver(stats); };
        var shown = this.adManager.showGameOverAd(show);
        if (!shown) show();
    };

    // ============================================
    // UTILITIES
    // ============================================

    Game.prototype._generateStars = function() {
        var c = document.getElementById('starsContainer');
        if (!c) return;
        c.innerHTML = '';
        var f = document.createDocumentFragment();
        for (var i = 0; i < GAME_CONSTANTS.STAR_COUNT; i++) {
            var s = document.createElement('div');
            s.className = 'star';
            s.style.left = Math.random() * 100 + '%';
            s.style.top = Math.random() * 100 + '%';
            var sz = Math.random() * 2 + 1;
            s.style.width = sz + 'px';
            s.style.height = sz + 'px';
            s.style.setProperty('--duration', (Math.random() * 3 + 2) + 's');
            s.style.animationDelay = (Math.random() * 3) + 's';
            f.appendChild(s);
        }
        c.appendChild(f);
    };

    return Game;
})();

window.Game = Game;