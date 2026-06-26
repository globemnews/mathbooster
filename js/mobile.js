/**
 * Math Blaster - Mobile Handler
 * Manages mobile-specific features including:
 * - Built-in game keyboard (Number pad layout)
 * - Native phone keyboard integration
 * - Keyboard type switching
 * - Visual keyboard detection and UI adjustment
 * - Screen orientation and resize handling
 * - Wake lock for preventing screen dimming
 * - Touch event optimization
 * 
 * The keyboard toggle button is hidden when the
 * built-in keyboard is active to prevent overlapping.
 * Native keyboard never auto-shows on resume.
 */

var MobileHandler = (function() {

    /**
     * Constructor
     * @param {Object} deps
     * @param {Renderer} deps.renderer - Canvas renderer for resize handling
     */
    function MobileHandler(deps) {
        /** Renderer reference for resize */
        this.renderer = deps.renderer;

        /** Whether device is mobile */
        this.isMobile = Utils.isMobile();

        /** Hidden input for native keyboard */
        this._hiddenInput = document.getElementById('hiddenInput');

        /** Keyboard toggle button */
        this._keyboardBtn = document.getElementById('keyboardBtn');

        /** Input area container */
        this._inputArea = document.getElementById('inputArea');

        /** Built-in game keyboard element */
        this._gameKeyboard = document.getElementById('gameKeyboard');

        /** Wake lock reference */
        this._wakeLock = null;

        /** Whether keyboard is visible */
        this._keyboardVisible = false;

        /** Native keyboard height */
        this._keyboardHeight = 0;

        /** Whether using built-in keyboard */
        this._useBuiltIn = false;

        /** Initial window height for fallback detection */
        this._initialHeight = window.innerHeight;

        /** Callback for built-in key presses */
        this.onBuiltInKey = null;

        var self = this;

        // --- Debounced resize handler ---
        window.addEventListener('resize', Utils.debounce(function() {
            if (self.renderer) self.renderer.resize();
            // Only detect native keyboard if not using built-in
            if (!self._useBuiltIn) self._fallbackDetect();
        }, 150));

        // --- Orientation change ---
        window.addEventListener('orientationchange', function() {
            setTimeout(function() {
                if (self.renderer) self.renderer.resize();
            }, 300);
        });

        // --- Visual Viewport API for native keyboard detection ---
        if (window.visualViewport) {
            window.visualViewport.addEventListener('resize', function() {
                if (!self._useBuiltIn) self._vpResize();
            });
        }

        // --- Prevent overscroll on touch ---
        document.addEventListener('touchmove', function(e) {
            if (!e.target.closest('.level-grid, .leaderboard, .settings-panel')) {
                e.preventDefault();
            }
        }, { passive: false });

        // --- Prevent context menu ---
        document.addEventListener('contextmenu', function(e) {
            if (e.target.closest('#gameContainer')) e.preventDefault();
        });

        // --- Track native keyboard via input focus/blur ---
        if (this._hiddenInput) {
            this._hiddenInput.addEventListener('focus', function() {
                if (!self._useBuiltIn) {
                    setTimeout(function() { self._checkNative(); }, 300);
                }
            });
            this._hiddenInput.addEventListener('blur', function() {
                if (!self._useBuiltIn) {
                    setTimeout(function() { self._nativeClosed(); }, 200);
                }
            });
        }

        // --- Initialize built-in keyboard touch handlers ---
        this._initBuiltIn();
    }

    // ============================================
    // BUILT-IN KEYBOARD
    // ============================================

    /**
     * Set up touch/click handlers for all built-in keyboard keys
     * Each key gets touchstart/touchend and mouse fallback events
     */
    MobileHandler.prototype._initBuiltIn = function() {
        if (!this._gameKeyboard) return;

        var self = this;
        var keys = this._gameKeyboard.querySelectorAll('.gk-key');

        for (var i = 0; i < keys.length; i++) {
            (function(el) {
                // Touch start: highlight and fire key
                el.addEventListener('touchstart', function(e) {
                    e.preventDefault();
                    el.classList.add('pressed');
                    self._builtInPress(el);
                }, { passive: false });

                // Touch end: remove highlight
                el.addEventListener('touchend', function(e) {
                    e.preventDefault();
                    el.classList.remove('pressed');
                    setTimeout(function() { el.classList.remove('correct', 'wrong'); }, 150);
                }, { passive: false });

                // Mouse fallback for desktop testing
                el.addEventListener('mousedown', function(e) {
                    e.preventDefault();
                    el.classList.add('pressed');
                    self._builtInPress(el);
                });

                el.addEventListener('mouseup', function(e) {
                    e.preventDefault();
                    el.classList.remove('pressed');
                    setTimeout(function() { el.classList.remove('correct', 'wrong'); }, 150);
                });

                // Prevent key from stealing focus
                el.addEventListener('focus', function() { el.blur(); });
            })(keys[i]);
        }
    };

    /**
     * Handle a key press on the built-in keyboard
     * Reads data-key attribute and fires callback
     */
    MobileHandler.prototype._builtInPress = function(el) {
        var key = el.getAttribute('data-key');
        if (!key) return;

        if (this.onBuiltInKey) {
            this.onBuiltInKey(key === 'backspace' ? 'backspace' : key);
        }
    };

    /**
     * Flash a key green (correct) or red (wrong)
     * @param {string} key - The key to flash
     * @param {boolean} ok - True for correct, false for wrong
     */
    MobileHandler.prototype.flashKey = function(key, ok) {
        if (!this._gameKeyboard || !this._useBuiltIn) return;

        var el = this._gameKeyboard.querySelector('[data-key="' + key + '"]');
        if (!el) return;

        // Remove old state, force reflow, add new state
        el.classList.remove('correct', 'wrong');
        void el.offsetWidth;
        el.classList.add(ok ? 'correct' : 'wrong');

        // Auto clear after 200ms
        setTimeout(function() { el.classList.remove('correct', 'wrong'); }, 200);
    };

    // ============================================
    // KEYBOARD MODE SWITCHING
    // ============================================

    /**
     * Set which keyboard type to use
     * Only takes effect when not in gameplay
     * @param {string} type - 'builtin' or 'native'
     */
    MobileHandler.prototype.setKeyboardType = function(type) {
        this._useBuiltIn = (type === 'builtin');
    };

    /** Check if using built-in keyboard */
    MobileHandler.prototype.isBuiltInKeyboard = function() {
        return this._useBuiltIn;
    };

    // ============================================
    // SHOW / HIDE KEYBOARDS
    // ============================================

    /**
     * Show the correct keyboard based on user preference
     * Ensures the other keyboard type is dismissed first
     */
    MobileHandler.prototype.showKeyboard = function() {
        if (this._useBuiltIn) {
            // Dismiss native keyboard first
            if (this._hiddenInput) this._hiddenInput.blur();
            this._nativeClosed();
            // Show built-in keyboard
            this.showBuiltIn();
        } else {
            // Hide built-in keyboard first
            this.hideBuiltIn();
            // Show native keyboard
            this.showNative();
        }
    };

    /**
     * Hide all keyboards completely
     * Used when pausing, quitting, game over, etc.
     */
    MobileHandler.prototype.hideKeyboard = function() {
        // Hide built-in keyboard
        this.hideBuiltIn();
        // Dismiss native keyboard
        if (this._hiddenInput) this._hiddenInput.blur();
        // Reset native keyboard positioning
        this._nativeClosed();
    };

    /**
     * Show the built-in game keyboard
     * Hides the keyboard toggle button to prevent
     * it from overlapping the keyboard keys
     * Adjusts input area position upward
     */
    MobileHandler.prototype.showBuiltIn = function() {
        if (!this._gameKeyboard) return;

        // Show the game keyboard
        this._gameKeyboard.style.display = 'flex';
        this._keyboardVisible = true;

        // Move input area up above the keyboard
        if (this._inputArea) this._inputArea.classList.add('gk-active');

        // HIDE the keyboard toggle button so it doesn't
        // overlap or block any keyboard keys
        if (this._keyboardBtn) this._keyboardBtn.style.display = 'none';
    };

    /**
     * Hide the built-in game keyboard
     * Resets input area position
     * Does NOT auto-show keyboard toggle button
     * (HUD manager controls button visibility)
     */
    MobileHandler.prototype.hideBuiltIn = function() {
        if (!this._gameKeyboard) return;

        // Hide the game keyboard
        this._gameKeyboard.style.display = 'none';

        // Reset input area position
        if (this._inputArea) this._inputArea.classList.remove('gk-active');

        // Mark keyboard as not visible
        if (this._useBuiltIn) this._keyboardVisible = false;
    };

    /**
     * Alias for hideBuiltIn
     * Used by external code for clarity
     */
    MobileHandler.prototype.hideBuiltInKeyboard = function() {
        this.hideBuiltIn();
    };

    /**
     * Show the native phone keyboard
     * Focuses the hidden input to trigger the OS keyboard
     */
    MobileHandler.prototype.showNative = function() {
        if (!this._hiddenInput) return;
        this._hiddenInput.value = '';
        this._hiddenInput.focus({ preventScroll: true });
    };

    // ============================================
    // NATIVE KEYBOARD DETECTION
    // Detects when the phone keyboard appears/disappears
    // using Visual Viewport API or window resize fallback
    // ============================================

    /**
     * Detect keyboard using Visual Viewport API
     * Most accurate method available
     */
    MobileHandler.prototype._vpResize = function() {
        if (!window.visualViewport || this._useBuiltIn) return;

        var vh = window.visualViewport.height;
        var wh = window.innerHeight;
        var diff = wh - vh;

        // If viewport shrunk by 100+ pixels, keyboard is open
        if (diff > 100) {
            this._keyboardHeight = diff;
            this._nativeOpen(diff);
        } else {
            this._nativeClosed();
        }
    };

    /**
     * Fallback keyboard detection
     * Compares current window height to initial height
     */
    MobileHandler.prototype._fallbackDetect = function() {
        if (window.visualViewport || this._useBuiltIn) return;

        var diff = this._initialHeight - window.innerHeight;
        if (diff > 100) {
            this._keyboardHeight = diff;
            this._nativeOpen(diff);
        } else {
            this._nativeClosed();
        }
    };

    /** Check native keyboard state using best method */
    MobileHandler.prototype._checkNative = function() {
        if (this._useBuiltIn) return;
        if (window.visualViewport) this._vpResize();
        else this._fallbackDetect();
    };

    /**
     * Apply native keyboard open positioning
     * Sets CSS variable and adds positioning classes
     * @param {number} h - Keyboard height in pixels
     */
    MobileHandler.prototype._nativeOpen = function(h) {
        if (this._keyboardVisible && !this._useBuiltIn) return;

        this._keyboardVisible = true;
        this._keyboardHeight = h;

        // Set CSS variable for positioning
        document.documentElement.style.setProperty('--keyboard-height', h + 'px');

        // Add positioning classes
        if (this._keyboardBtn) this._keyboardBtn.classList.add('keyboard-open');
        if (this._inputArea) this._inputArea.classList.add('keyboard-open');
    };

    /**
     * Remove native keyboard positioning
     * Resets everything back to default positions
     */
    MobileHandler.prototype._nativeClosed = function() {
        if (!this._keyboardVisible) return;

        this._keyboardVisible = false;
        this._keyboardHeight = 0;

        // Reset CSS variable
        document.documentElement.style.setProperty('--keyboard-height', '0px');

        // Remove positioning classes
        if (this._keyboardBtn) this._keyboardBtn.classList.remove('keyboard-open');
        if (this._inputArea) this._inputArea.classList.remove('keyboard-open');
    };

    // ============================================
    // UTILITY METHODS
    // ============================================

    /** Check if any keyboard is currently visible */
    MobileHandler.prototype.isKeyboardVisible = function() {
        return this._keyboardVisible;
    };

    /** Get current keyboard height in pixels */
    MobileHandler.prototype.getKeyboardHeight = function() {
        return this._keyboardHeight;
    };

    /**
     * Request wake lock to keep screen on during gameplay
     * Uses Screen Wake Lock API (not all browsers support this)
     */
    MobileHandler.prototype.requestWakeLock = function() {
        var self = this;
        try {
            if ('wakeLock' in navigator) {
                navigator.wakeLock.request('screen').then(function(w) {
                    self._wakeLock = w;
                }).catch(function() {});
            }
        } catch (e) {}
    };

    /** Release wake lock when gameplay stops */
    MobileHandler.prototype.releaseWakeLock = function() {
        if (this._wakeLock) {
            this._wakeLock.release().catch(function() {});
            this._wakeLock = null;
        }
    };

    /** Clean up all resources */
    MobileHandler.prototype.destroy = function() {
        this.releaseWakeLock();
        this.hideKeyboard();
    };

    return MobileHandler;
})();

window.MobileHandler = MobileHandler;