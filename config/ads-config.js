/**
 * Math Blaster - Advertisement Configuration
 * ============================================
 * 
 * This file controls all advertisement settings.
 * Buyers can easily customize when and what ads appear
 * by modifying the settings below.
 * 
 * SUPPORTED AD NETWORKS:
 * - Google AdSense
 * - Adsterra
 * - Custom HTML banners
 * - Any ad network that provides HTML/JS code
 * 
 * HOW TO ADD YOUR AD CODE:
 * 1. Find the placement you want (gameStart, gameOver, etc.)
 * 2. Set enabled: true
 * 3. Replace the adCode value with your actual ad code
 * 4. Adjust closeDelay if needed (seconds before X button works)
 * 
 * AD PLACEMENTS:
 * - gameStart:     Shows when the game page first loads
 * - gameOver:      Shows when the player dies
 * - levelComplete: Shows after completing a level
 * - pauseMenu:     Shows when the player pauses the game
 * 
 * EXAMPLE: Google AdSense code would look like:
 * adCode: '<ins class="adsbygoogle" style="display:block" ' +
 *         'data-ad-client="ca-pub-XXXX" data-ad-slot="XXXX" ' +
 *         'data-ad-format="auto"></ins>' +
 *         '<script>(adsbygoogle=window.adsbygoogle||[]).push({});</script>'
 * 
 * ============================================
 */

var ADS_CONFIG = {

    /**
     * Master switch for all ads
     * Set to false to disable ALL ads globally
     */
    enabled: false,

    /**
     * Minimum time between ads in milliseconds
     * Prevents spamming ads too frequently
     * 30000 = 30 seconds, 60000 = 1 minute
     */
    minTimeBetweenAds: 30000,

    /**
     * Default seconds before the close (X) button becomes active
     * Forces player to view the ad for this many seconds
     */
    closeDelay: 3,

    /**
     * Default CSS class for ad container size
     * Options: 'ad-size-300x250', 'ad-size-320x50', 'ad-size-728x90'
     */
    defaultSizeClass: 'ad-size-300x250',

    /**
     * Individual ad placement configurations
     * Each placement can be enabled/disabled independently
     */
    placements: {

        /**
         * GAME START AD
         * Shown when the game page first loads
         * Good for welcome/interstitial ads
         */
        gameStart: {
            enabled: false,                    // Whether this placement is active
            closeDelay: 3,                    // Seconds before X button works
            sizeClass: 'ad-size-300x250',     // CSS size class for the container

            // Replace the HTML below with your actual ad network code
            adCode: '<div class="ad-placeholder">' +
                '<p style="font-size:16px;color:#00d4ff;font-family:Orbitron,monospace;margin-bottom:12px;">Welcome to Math Blaster!</p>' +
                '<p style="font-size:12px;color:rgba(255,255,255,0.5);line-height:1.6;">' +
                'This is a demo ad placement.<br>' +
                'Replace this HTML in<br>' +
                '<strong style="color:#ffbe0b;">config/ads-config.js</strong><br>' +
                'with your Google AdSense, Adsterra,<br>' +
                'or custom banner code.</p></div>'
        },

        /**
         * GAME OVER AD
         * Shown when the player loses/dies
         * High-visibility placement (player must see it)
         */
        gameOver: {
            enabled: false,
            closeDelay: 2,
            sizeClass: 'ad-size-300x250',

            adCode: '<div class="ad-placeholder">' +
                '<p style="font-size:16px;color:#ff006e;font-family:Orbitron,monospace;margin-bottom:12px;">Game Over!</p>' +
                '<p style="font-size:12px;color:rgba(255,255,255,0.5);line-height:1.6;">' +
                'Your ad appears here.<br>' +
                'Paste your ad network code in<br>' +
                '<strong style="color:#ffbe0b;">config/ads-config.js</strong></p></div>'
        },

        /**
         * LEVEL COMPLETE AD
         * Shown after successfully completing a level
         * Uses 'frequency' to control how often it appears
         * frequency: 2 means show every 2nd level completion
         */
        levelComplete: {
            enabled: false,
            closeDelay: 2,
            sizeClass: 'ad-size-300x250',
            frequency: 2,                      // Show every Nth level (2 = every other level)

            adCode: '<div class="ad-placeholder">' +
                '<p style="font-size:16px;color:#00ff87;font-family:Orbitron,monospace;margin-bottom:12px;">Level Complete!</p>' +
                '<p style="font-size:12px;color:rgba(255,255,255,0.5);line-height:1.6;">' +
                'Ad placement for level completion.<br>' +
                'Configure in <strong style="color:#ffbe0b;">config/ads-config.js</strong></p></div>'
        },

        /**
         * PAUSE MENU AD
         * Shown when the player pauses the game
         * Uses smaller banner format by default
         * Disabled by default (can be intrusive)
         */
        pauseMenu: {
            enabled: false,                    // Disabled by default
            closeDelay: 0,                     // Instant close allowed
            sizeClass: 'ad-size-320x50',       // Smaller banner format

            adCode: '<div class="ad-placeholder">' +
                '<p style="font-size:11px;color:rgba(255,255,255,0.4);">Pause menu banner ad</p></div>'
        }
    }
};

// Make config available globally
window.ADS_CONFIG = ADS_CONFIG;
