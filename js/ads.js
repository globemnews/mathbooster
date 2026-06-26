var AdManager = (function() {

    function AdManager() {
        this._overlay = document.getElementById('adOverlay');
        this._container = document.getElementById('adContainer');
        this._content = document.getElementById('adContent');
        this._closeBtn = document.getElementById('adCloseBtn');
        this._timerEl = document.getElementById('adTimer');

        this._enabled = false;
        this._lastAdTime = 0;
        this._countdownTimer = null;
        this._countdown = 0;
        this._onCloseCallback = null;
        this._levelsCompleted = 0;
        this._showing = false;

        this._init();
    }

    AdManager.prototype._init = function() {
        if (typeof ADS_CONFIG !== 'undefined' && ADS_CONFIG && ADS_CONFIG.enabled === true) {
            this._enabled = true;
        }

        var self = this;

        if (this._closeBtn) {
            this._closeBtn.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                if (!self._closeBtn.classList.contains('disabled')) {
                    self.hide();
                }
            });
        }

        if (this._overlay) {
            this._overlay.addEventListener('click', function(e) {
                if (e.target === self._overlay) {
                    if (self._closeBtn && !self._closeBtn.classList.contains('disabled')) {
                        self.hide();
                    }
                }
            });
        }
    };

    AdManager.prototype._canShowAd = function() {
        if (!this._enabled) return false;
        // First ad is always allowed
        if (this._lastAdTime === 0) return true;
        var minInterval = 30000;
        if (ADS_CONFIG && typeof ADS_CONFIG.minTimeBetweenAds === 'number') {
            minInterval = ADS_CONFIG.minTimeBetweenAds;
        }
        return (Date.now() - this._lastAdTime) >= minInterval;
    };

    AdManager.prototype._getPlacementConfig = function(placement) {
        if (!ADS_CONFIG) return null;
        if (!ADS_CONFIG.placements) return null;
        if (!ADS_CONFIG.placements[placement]) return null;
        return ADS_CONFIG.placements[placement];
    };

    AdManager.prototype._getCloseDelay = function(config) {
        if (config && typeof config.closeDelay === 'number') return config.closeDelay;
        if (ADS_CONFIG && typeof ADS_CONFIG.closeDelay === 'number') return ADS_CONFIG.closeDelay;
        return 0;
    };

    AdManager.prototype._getSizeClass = function(config) {
        if (config && config.sizeClass) return config.sizeClass;
        if (ADS_CONFIG && ADS_CONFIG.defaultSizeClass) return ADS_CONFIG.defaultSizeClass;
        return '';
    };

    AdManager.prototype.show = function(placement, onClose) {
        // If ads completely disabled, fire callback immediately
        if (!this._enabled) {
            if (typeof onClose === 'function') setTimeout(onClose, 0);
            return false;
        }

        var config = this._getPlacementConfig(placement);

        // If this specific placement is disabled or doesn't exist
        if (!config || config.enabled !== true) {
            if (typeof onClose === 'function') setTimeout(onClose, 0);
            return false;
        }

        // Level complete frequency check
        if (placement === 'levelComplete' && config.frequency && config.frequency > 0) {
            this._levelsCompleted++;
            if (this._levelsCompleted % config.frequency !== 0) {
                if (typeof onClose === 'function') setTimeout(onClose, 0);
                return false;
            }
        }

        // Minimum time between ads check
        if (!this._canShowAd()) {
            if (typeof onClose === 'function') setTimeout(onClose, 0);
            return false;
        }

        // Store the callback
        this._onCloseCallback = (typeof onClose === 'function') ? onClose : null;

        // Set ad content
        if (this._content) {
            if (config.adCode && config.adCode.length > 0) {
                this._content.innerHTML = config.adCode;
                this._executeInlineScripts(this._content);
            } else {
                this._content.innerHTML = '<div class="ad-placeholder"><p>Ad Space</p></div>';
            }
        }

        // Apply size class to overlay
        if (this._overlay) {
            // Reset classes
            this._overlay.className = 'ad-overlay';
            var sizeClass = this._getSizeClass(config);
            if (sizeClass) {
                this._overlay.classList.add(sizeClass);
            }
            // Show the overlay
            this._overlay.classList.remove('hidden');
        }

        this._showing = true;

        // Start close button countdown
        var closeDelay = this._getCloseDelay(config);
        this._startCountdown(closeDelay);

        // Record the time
        this._lastAdTime = Date.now();

        return true;
    };

    AdManager.prototype._executeInlineScripts = function(container) {
        if (!container) return;
        var scripts = container.querySelectorAll('script');
        for (var i = 0; i < scripts.length; i++) {
            var oldScript = scripts[i];
            var newScript = document.createElement('script');
            // Copy attributes
            for (var j = 0; j < oldScript.attributes.length; j++) {
                newScript.setAttribute(
                    oldScript.attributes[j].name,
                    oldScript.attributes[j].value
                );
            }
            // Copy content
            if (oldScript.textContent) {
                newScript.textContent = oldScript.textContent;
            }
            oldScript.parentNode.replaceChild(newScript, oldScript);
        }
    };

    AdManager.prototype._startCountdown = function(seconds) {
        this._clearCountdown();

        // If no delay, enable close immediately
        if (!seconds || seconds <= 0) {
            this._enableCloseButton();
            return;
        }

        // Disable close button during countdown
        if (this._closeBtn) {
            this._closeBtn.classList.add('disabled');
        }

        this._countdown = Math.ceil(seconds);
        this._updateTimerDisplay();

        var self = this;
        this._countdownTimer = setInterval(function() {
            self._countdown--;
            if (self._countdown <= 0) {
                self._clearCountdown();
                self._enableCloseButton();
            } else {
                self._updateTimerDisplay();
            }
        }, 1000);
    };

    AdManager.prototype._updateTimerDisplay = function() {
        if (!this._timerEl) return;
        if (this._countdown > 0) {
            this._timerEl.innerHTML = 'Close in <span class="timer-count">' + this._countdown + '</span>s';
        } else {
            this._timerEl.innerHTML = '';
        }
    };

    AdManager.prototype._enableCloseButton = function() {
        if (this._closeBtn) {
            this._closeBtn.classList.remove('disabled');
        }
        if (this._timerEl) {
            this._timerEl.innerHTML = 'Click X to close';
        }
    };

    AdManager.prototype._clearCountdown = function() {
        if (this._countdownTimer) {
            clearInterval(this._countdownTimer);
            this._countdownTimer = null;
        }
        this._countdown = 0;
    };

    AdManager.prototype.hide = function() {
        this._clearCountdown();
        this._showing = false;

        if (this._overlay) {
            this._overlay.classList.add('hidden');
        }

        // Clear content to stop any running scripts/videos
        if (this._content) {
            this._content.innerHTML = '';
        }

        if (this._timerEl) {
            this._timerEl.innerHTML = '';
        }

        // Fire the stored callback
        if (this._onCloseCallback) {
            var callback = this._onCloseCallback;
            this._onCloseCallback = null;
            // Use setTimeout to avoid synchronous issues
            setTimeout(callback, 50);
        }
    };

    AdManager.prototype.isShowing = function() {
        return this._showing;
    };

    AdManager.prototype.showGameStartAd = function(onClose) {
        return this.show('gameStart', onClose);
    };

    AdManager.prototype.showGameOverAd = function(onClose) {
        return this.show('gameOver', onClose);
    };

    AdManager.prototype.showLevelCompleteAd = function(onClose) {
        return this.show('levelComplete', onClose);
    };

    AdManager.prototype.showPauseAd = function(onClose) {
        return this.show('pauseMenu', onClose);
    };

    AdManager.prototype.resetLevelCounter = function() {
        this._levelsCompleted = 0;
    };

    AdManager.prototype.setEnabled = function(enabled) {
        this._enabled = enabled;
        if (!enabled) this.hide();
    };

    AdManager.prototype.isEnabled = function() {
        return this._enabled;
    };

    AdManager.prototype.destroy = function() {
        this._clearCountdown();
        this.hide();
        this._onCloseCallback = null;
    };

    return AdManager;
})();

window.AdManager = AdManager;