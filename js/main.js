/**
 * Math Blaster - Main Entry Point
 * Handles the loading screen, module verification,
 * DOM verification, and game initialization.
 * 
 * Uses CSS icons so no SVG files need to be preloaded.
 * Shows a loading screen with progress bar and rotating tips
 * while the game initializes.
 */

(function() {

    // ============================================
    // LOADING TIPS
    // Shown randomly during the loading screen
    // ============================================
    var TIPS = [
        'Tip: Solve faster to build combos!',
        'Tip: Combos multiply your score!',
        'Tip: Target the lowest problem first!',
        'Tip: Powerups drop from destroyed enemies!',
        'Tip: Boss enemies appear every 5 waves!',
        'Tip: Accuracy affects your performance!',
        'Tip: Use Backspace to correct mistakes!',
        'Tip: The Bomb powerup destroys all enemies!',
        'Tip: Higher waves have harder problems!',
        'Tip: Practice mental math for better speed!',
        'Tip: Adjust difficulty in the main menu!',
        'Tip: Toggle fullscreen in settings!'
    ];

    // ============================================
    // LOADING SCREEN DOM REFERENCES
    // ============================================
    var lsEl = document.getElementById('loadingScreen');
    var lBar = document.getElementById('loadingBar');
    var lStatus = document.getElementById('loadingStatus');
    var lTip = document.getElementById('loadingTip');
    var tipTimer = null;

    /**
     * Update loading bar progress and status text
     * @param {number} p - Progress percentage (0-100)
     * @param {string} m - Status message to display
     */
    function setP(p, m) {
        if (lBar) lBar.style.width = Math.min(100, p) + '%';
        if (m && lStatus) lStatus.textContent = m;
    }

    /**
     * Show a random loading tip with fade animation
     */
    function showTip() {
        if (!lTip) return;
        var t = TIPS[Math.floor(Math.random() * TIPS.length)];
        // Fade out, swap text, fade in
        lTip.style.opacity = '0';
        setTimeout(function() {
            lTip.textContent = t;
            lTip.style.opacity = '1';
        }, 250);
    }

    /**
     * Hide the loading screen with smooth transition
     * Returns a promise that resolves when fully hidden
     */
    function hideLS() {
        return new Promise(function(res) {
            // Stop tip rotation
            if (tipTimer) {
                clearInterval(tipTimer);
                tipTimer = null;
            }

            // Set to 100% and "Ready!"
            setP(100, 'Ready!');

            // Brief pause to show 100%
            setTimeout(function() {
                // Trigger CSS transition
                if (lsEl) lsEl.classList.add('loaded');

                // Wait for transition to complete, then remove element
                setTimeout(function() {
                    if (lsEl && lsEl.parentNode) {
                        lsEl.parentNode.removeChild(lsEl);
                    }
                    res();
                }, 700);
            }, 400);
        });
    }

    /**
     * Show an error screen with retry button
     * Replaces the game container with an error message
     * @param {string} m - Error message to display
     */
    function showErr(m) {
        var c = document.getElementById('gameContainer');
        if (!c) return;

        c.innerHTML =
            '<div style="display:flex;flex-direction:column;align-items:center;' +
            'justify-content:center;height:100vh;padding:20px;text-align:center;' +
            'font-family:Rajdhani,sans-serif;color:#fff;background:#0a0a1a;">' +
                '<div style="font-family:Orbitron,monospace;font-size:24px;' +
                'color:#ff006e;margin-bottom:16px;">Loading Error</div>' +
                '<div style="font-size:14px;color:rgba(255,255,255,0.6);' +
                'max-width:400px;line-height:1.6;margin-bottom:24px;">' +
                'The game failed to load. Please refresh the page.</div>' +
                '<button onclick="location.reload()" style="font-family:Orbitron,monospace;' +
                'font-size:14px;padding:12px 32px;border:2px solid #00d4ff;border-radius:8px;' +
                'background:transparent;color:#00d4ff;cursor:pointer;text-transform:uppercase;' +
                'letter-spacing:2px;">Retry</button>' +
                '<div style="margin-top:24px;font-size:11px;color:rgba(255,255,255,0.3);' +
                'max-width:400px;word-break:break-all;">Error: ' + m + '</div>' +
            '</div>';
    }

    // ============================================
    // BOOT SEQUENCE
    // ============================================

    function boot() {
        // Start showing random tips every 3 seconds
        showTip();
        tipTimer = setInterval(showTip, 3000);

        // Phase 1: Initialize
        setP(5, 'Initializing...');

        // --- Verify all required JavaScript modules exist ---
        var req = [
            'SettingsManager', 'AudioEngine', 'Renderer',
            'ParticleSystem', 'ProjectileSystem', 'WaveManager',
            'TypingSystem', 'PowerUpSystem', 'HUDManager',
            'GameEngine', 'ScreenManager', 'LeaderboardManager',
            'AdManager', 'MobileHandler', 'Game'
        ];

        var miss = [];
        for (var i = 0; i < req.length; i++) {
            if (typeof window[req[i]] === 'undefined') miss.push(req[i]);
        }

        // If any modules are missing, show error
        if (miss.length > 0) {
            hideLS().then(function() {
                showErr('Missing modules: ' + miss.join(', '));
            });
            return;
        }

        // --- Verify required DOM elements exist ---
        var rEls = ['gameCanvas', 'gameContainer', 'hiddenInput', 'typingDisplay'];
        var mEls = [];
        for (var j = 0; j < rEls.length; j++) {
            if (!document.getElementById(rEls[j])) mEls.push(rEls[j]);
        }

        if (mEls.length > 0) {
            hideLS().then(function() {
                showErr('Missing DOM elements: ' + mEls.join(', '));
            });
            return;
        }

        // Phase 2: Simulated asset loading
        // CSS icons don't need preloading, but we show progress
        // for a smoother loading experience
        setP(15, 'Loading assets...');

        var progress = 15;
        var loadInterval = setInterval(function() {
            // Increment progress randomly for natural feel
            progress += Math.random() * 15 + 5;

            if (progress >= 75) {
                // Phase 3: Create game
                clearInterval(loadInterval);
                setP(75, 'Starting engine...');

                setTimeout(function() {
                    try {
                        setP(85, 'Creating game...');

                        // Create the main game instance
                        var game = new window.Game();

                        setP(95, 'Almost ready...');

                        // Phase 4: Hide loading screen and start
                        setTimeout(function() {
                            hideLS().then(function() {
                                // Initialize the game (shows main menu)
                                game.init();

                                // Expose for debugging
                                window.__mathBlaster = game;

                                // Success message in console
                                console.log(
                                    '%c Math Blaster %c Ready! ',
                                    'background:#00d4ff;color:#0a0a1a;font-weight:bold;padding:2px 8px;border-radius:3px 0 0 3px;',
                                    'background:#1a1a3e;color:#00d4ff;padding:2px 8px;border-radius:0 3px 3px 0;'
                                );
                            });
                        }, 300);

                    } catch(e) {
                        // Game creation failed
                        console.error('Init failed:', e);
                        hideLS().then(function() {
                            showErr(e.message || 'Unknown error');
                        });
                    }
                }, 200);

            } else {
                // Update progress bar
                setP(progress, 'Loading assets...');
            }
        }, 150);
    }

    // ============================================
    // STARTUP
    // Wait for DOM to be ready, then boot
    // ============================================
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', boot);
    } else {
        // DOM already ready (script at end of body)
        boot();
    }

})();