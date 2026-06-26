/**
 * Math Blaster - Settings Manager
 * Handles all game settings with LocalStorage persistence
 * Provides get, set, toggle, and change listener functionality
 * Includes keyboard type preference for mobile devices
 */

var SettingsManager = (function() {

    /**
     * Constructor - initializes defaults and loads saved settings
     */
    function SettingsManager() {
        // Default values for all settings
        this.defaults = {
            sfx: true,              // Sound effects on/off
            music: true,            // Background music on/off
            shake: true,            // Screen shake effects on/off
            particles: true,        // Particle effects on/off
            darkWords: false,       // Make enemy words harder to read
            fullscreen: false,      // Fullscreen mode on/off
            difficulty: 'easy',     // Selected difficulty level
            keyboardType: 'none'    // 'none' = not chosen, 'builtin' = game keyboard, 'native' = phone keyboard
        };

        // Current active settings (merged from defaults + saved)
        this.current = {};

        // Event listeners for setting changes
        this._listeners = {};

        // Load saved settings from LocalStorage
        this._load();
    }

    /**
     * Load settings from LocalStorage, merging with defaults
     */
    SettingsManager.prototype._load = function() {
        var saved = Utils.loadFromStorage(STORAGE_KEYS.SETTINGS, null);

        if (saved && typeof saved === 'object') {
            this.current = {};
            for (var k in this.defaults) this.current[k] = this.defaults[k];
            for (var s in saved) {
                if (s in this.defaults) this.current[s] = saved[s];
            }
        } else {
            this.current = {};
            for (var d in this.defaults) this.current[d] = this.defaults[d];
        }
    };

    /** Save current settings to LocalStorage */
    SettingsManager.prototype._save = function() {
        Utils.saveToStorage(STORAGE_KEYS.SETTINGS, this.current);
    };

    /** Get a setting value by key */
    SettingsManager.prototype.get = function(key) {
        return this.current[key];
    };

    /** Set a setting value and save */
    SettingsManager.prototype.set = function(key, value) {
        if (!(key in this.defaults)) return;
        var old = this.current[key];
        this.current[key] = value;
        this._save();
        if (old !== value) this._notify(key, value, old);
    };

    /** Toggle a boolean setting, returns new value */
    SettingsManager.prototype.toggle = function(key) {
        if (!(key in this.defaults)) return false;
        var nv = !this.current[key];
        this.set(key, nv);
        return nv;
    };

    /** Reset all settings back to defaults */
    SettingsManager.prototype.resetAll = function() {
        this.current = {};
        for (var k in this.defaults) this.current[k] = this.defaults[k];
        this._save();
    };

    /** Reset game progress (scores, levels, leaderboard) */
    SettingsManager.prototype.resetProgress = function() {
        Utils.removeFromStorage(STORAGE_KEYS.PROGRESS);
        Utils.removeFromStorage(STORAGE_KEYS.LEVEL_SCORES);
        Utils.removeFromStorage(STORAGE_KEYS.LEADERBOARD);
    };

    /** Register a listener for setting changes */
    SettingsManager.prototype.onChange = function(key, cb) {
        if (!this._listeners[key]) this._listeners[key] = [];
        this._listeners[key].push(cb);
    };

    /** Notify all listeners of a setting change */
    SettingsManager.prototype._notify = function(key, nv, ov) {
        if (this._listeners[key]) {
            for (var i = 0; i < this._listeners[key].length; i++) {
                try { this._listeners[key][i](nv, ov, key); } catch(e) {}
            }
        }
        if (this._listeners['*']) {
            for (var j = 0; j < this._listeners['*'].length; j++) {
                try { this._listeners['*'][j](nv, ov, key); } catch(e) {}
            }
        }
    };

    /** Apply current settings to their DOM toggle elements */
    SettingsManager.prototype.applyToDOM = function() {
        // Update toggle switches
        for (var key in this.current) {
            var tid = 'toggle' + key.charAt(0).toUpperCase() + key.slice(1);
            var el = document.getElementById(tid);
            if (el && el.classList.contains('toggle-switch')) {
                el.classList.toggle('active', !!this.current[key]);
            }
        }

        // Update difficulty buttons
        var btns = document.querySelectorAll('.diff-btn');
        for (var i = 0; i < btns.length; i++) {
            btns[i].classList.toggle('active', btns[i].getAttribute('data-diff') === this.current.difficulty);
        }

        // Update keyboard type button text
        var kbBtn = document.getElementById('btnKeyboardType');
        if (kbBtn) {
            var t = this.current.keyboardType;
            kbBtn.textContent = t === 'builtin' ? 'Game' : t === 'native' ? 'Phone' : 'Choose';
        }
    };

    /** Handle fullscreen toggle */
    SettingsManager.prototype.handleFullscreen = function(enabled) {
        if (enabled) Utils.requestFullscreen(document.documentElement);
        else if (Utils.isFullscreen()) Utils.exitFullscreen();
    };

    /** Check if user has already chosen a keyboard type */
    SettingsManager.prototype.hasChosenKeyboard = function() {
        return this.current.keyboardType === 'builtin' || this.current.keyboardType === 'native';
    };

    /** Check if built-in keyboard is selected */
    SettingsManager.prototype.isBuiltInKeyboard = function() {
        return this.current.keyboardType === 'builtin';
    };

    return SettingsManager;
})();

window.SettingsManager = SettingsManager;