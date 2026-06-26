/**
 * Math Blaster - Screen Manager
 * 
 * SCREENS:
 * - Main Menu: New Game, Continue, Leaderboard, Settings
 * - Game Over: stats, Play Again, Main Menu
 * - Pause: Resume, Settings, Quit
 * - Leaderboard: high scores
 * - Settings: toggles and reset
 * - Keyboard Choice: mobile only
 * 
 * DIFFICULTY CHANGE:
 * When player changes difficulty on main menu,
 * the onDifficultyChange callback fires.
 * Game.js uses this to update the Continue button
 * visibility (save must match current difficulty).
 */

var ScreenManager = (function() {

    function ScreenManager(deps) {
        this.settings = deps.settings;
        this.audio = deps.audio;

        /** All screen IDs */
        this._screenIds = [
            SCREENS.MAIN_MENU, SCREENS.GAME_OVER,
            SCREENS.PAUSE, SCREENS.LEADERBOARD, SCREENS.SETTINGS
        ];

        this._currentScreen = SCREENS.MAIN_MENU;
        this._previousScreen = null;
        this._leaderboardRef = null;

        // Callbacks set by Game.js
        this.onStartGame = null;
        this.onContinue = null;
        this.onPlayAgain = null;
        this.onResume = null;
        this.onQuit = null;
        this.onDifficultyChange = null;
        this.onSettingChange = null;
        this.onProgressReset = null;

        this._bindEvents();
    }

    ScreenManager.prototype.setLeaderboard = function(lb) { this._leaderboardRef = lb; };

    /** Bind click helper */
    ScreenManager.prototype._bc = function(id, fn) {
        var el = document.getElementById(id);
        if (el) el.addEventListener('click', fn);
    };

    /** Bind all UI events */
    ScreenManager.prototype._bindEvents = function() {
        var self = this;

        // --- Main Menu ---

        /** New Game - fresh start */
        this._bc('btnStartGame', function() {
            self.audio.play('click');
            if (self.onStartGame) self.onStartGame();
        });

        /** Continue - resume saved game */
        this._bc('btnContinue', function() {
            self.audio.play('click');
            if (self.onContinue) self.onContinue();
        });

        /** Leaderboard */
        this._bc('btnLeaderboard', function() {
            self.audio.play('click');
            self.showScreen(SCREENS.LEADERBOARD);
        });

        /** Settings */
        this._bc('btnSettings', function() {
            self.audio.play('click');
            self.showScreen(SCREENS.SETTINGS);
        });

        // --- Game Over ---

        /** Play Again - fresh start */
        this._bc('btnPlayAgain', function() {
            self.audio.play('click');
            if (self.onPlayAgain) self.onPlayAgain();
        });

        /** Main Menu from game over */
        this._bc('btnGameOverMenu', function() {
            self.audio.play('click');
            self.showScreen(SCREENS.MAIN_MENU);
        });

        // --- Pause ---

        /** Resume */
        this._bc('btnResume', function() {
            self.audio.play('click');
            if (self.onResume) self.onResume();
        });

        /** Settings from pause */
        this._bc('btnPauseSettings', function() {
            self.audio.play('click');
            self._previousScreen = SCREENS.PAUSE;
            self.showScreen(SCREENS.SETTINGS);
        });

        /** Quit to menu */
        this._bc('btnQuit', function() {
            self.audio.play('click');
            if (self.onQuit) self.onQuit();
        });

        // --- Back buttons ---
        this._bc('btnLeaderboardBack', function() {
            self.audio.play('click');
            self.showScreen(self._previousScreen || SCREENS.MAIN_MENU);
        });
        this._bc('btnSettingsBack', function() {
            self.audio.play('click');
            self.showScreen(self._previousScreen || SCREENS.MAIN_MENU);
        });

        // --- Reset ---
        this._bc('btnResetProgress', function() {
            self.audio.play('click');
            self._showConfirm('Reset Progress', 'Erase all scores and saved game?', function() {
                self.settings.resetProgress();
                if (self.onProgressReset) self.onProgressReset();
                self.audio.play('hit');
            });
        });

        // --- Difficulty buttons ---
        // When difficulty changes, Game.js updates the Continue button
        var diffs = document.querySelectorAll('.diff-btn');
        for (var i = 0; i < diffs.length; i++) {
            (function(btn) {
                btn.addEventListener('click', function() {
                    self.audio.play('click');
                    var d = btn.getAttribute('data-diff');

                    // Update button styles
                    var allBtns = document.querySelectorAll('.diff-btn');
                    for (var x = 0; x < allBtns.length; x++) {
                        allBtns[x].classList.toggle('active', allBtns[x].getAttribute('data-diff') === d);
                    }

                    // Save setting and notify Game.js
                    self.settings.set('difficulty', d);
                    if (self.onDifficultyChange) self.onDifficultyChange(d);
                });
            })(diffs[i]);
        }

        // --- Toggle switches ---
        var toggles = document.querySelectorAll('.toggle-switch[data-setting]');
        for (var j = 0; j < toggles.length; j++) {
            (function(tog) {
                tog.addEventListener('click', function() {
                    self.audio.play('click');
                    var k = tog.getAttribute('data-setting');
                    if (k === 'fullscreen') {
                        var nv = self.settings.toggle(k);
                        tog.classList.toggle('active', nv);
                        self.settings.handleFullscreen(nv);
                    } else {
                        var nv2 = self.settings.toggle(k);
                        tog.classList.toggle('active', nv2);
                        if (self.onSettingChange) self.onSettingChange(k, nv2);
                    }
                });
            })(toggles[j]);
        }
    };

    // ============================================
    // SCREEN TRANSITIONS
    // ============================================

    /** Show a screen, hide all others */
    ScreenManager.prototype.showScreen = function(id) {
        if (id !== this._currentScreen) this._previousScreen = this._currentScreen;

        // Hide all screens
        for (var i = 0; i < this._screenIds.length; i++) {
            var el = document.getElementById(this._screenIds[i]);
            if (el) el.classList.add('hidden');
        }
        var kcs = document.getElementById('keyboardChoiceScreen');
        if (kcs) kcs.classList.add('hidden');

        // Show target
        var target = document.getElementById(id);
        if (target) target.classList.remove('hidden');
        this._currentScreen = id;

        // Screen-specific actions
        if (id === SCREENS.SETTINGS) this.settings.applyToDOM();
        else if (id === SCREENS.LEADERBOARD && this._leaderboardRef) this._leaderboardRef.render();
    };

    /** Hide all screens */
    ScreenManager.prototype.hideAllScreens = function() {
        for (var i = 0; i < this._screenIds.length; i++) {
            var el = document.getElementById(this._screenIds[i]);
            if (el) el.classList.add('hidden');
        }
        var kcs = document.getElementById('keyboardChoiceScreen');
        if (kcs) kcs.classList.add('hidden');
    };

    // ============================================
    // GAME OVER SCREEN
    // ============================================

    /** Show game over with stats */
    ScreenManager.prototype.showGameOver = function(stats) {
        document.getElementById('finalScore').textContent = Utils.formatNumber(stats.score);
        document.getElementById('finalWave').textContent = stats.wave;
        document.getElementById('finalAccuracy').textContent = stats.accuracy + '%';
        document.getElementById('finalWPM').textContent = stats.wpm;
        document.getElementById('finalCombo').textContent = 'x' + stats.maxCombo;
        document.getElementById('finalWords').textContent = stats.wordsTyped;
        var hs = document.getElementById('newHighScore');
        if (stats.isHighScore) hs.classList.remove('hidden'); else hs.classList.add('hidden');
        this.showScreen(SCREENS.GAME_OVER);
    };

    // ============================================
    // CONFIRM DIALOG
    // ============================================

    ScreenManager.prototype._showConfirm = function(title, msg, onYes) {
        var ex = document.querySelector('.confirm-dialog');
        if (ex) ex.remove();
        var d = document.createElement('div');
        d.className = 'confirm-dialog';
        d.innerHTML = '<div class="confirm-box"><div class="confirm-title">' + title +
            '</div><div class="confirm-message">' + msg +
            '</div><div class="confirm-actions"><button class="confirm-no">Cancel</button>' +
            '<button class="confirm-yes">Confirm</button></div></div>';
        var self = this;
        d.querySelector('.confirm-no').addEventListener('click', function() { self.audio.play('click'); d.remove(); });
        d.querySelector('.confirm-yes').addEventListener('click', function() { self.audio.play('click'); d.remove(); if (onYes) onYes(); });
        d.addEventListener('click', function(e) { if (e.target === d) { self.audio.play('click'); d.remove(); } });
        document.body.appendChild(d);
    };

    ScreenManager.prototype.getCurrentScreen = function() { return this._currentScreen; };

    return ScreenManager;
})();

window.ScreenManager = ScreenManager;