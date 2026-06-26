var LeaderboardManager = (function() {

    function LeaderboardManager() {
        this.maxEntries = GAME_CONSTANTS.MAX_LEADERBOARD_ENTRIES;
        this.entries = [];
        this._listEl = null;
        this._load();
    }

    LeaderboardManager.prototype._getListEl = function() {
        if (!this._listEl) {
            this._listEl = document.getElementById('leaderboardList');
        }
        return this._listEl;
    };

    LeaderboardManager.prototype._load = function() {
        var raw = Utils.loadFromStorage(STORAGE_KEYS.LEADERBOARD, []);
        this.entries = [];

        if (Array.isArray(raw)) {
            for (var i = 0; i < raw.length; i++) {
                var entry = raw[i];
                if (entry && typeof entry.score === 'number' && typeof entry.wave === 'number') {
                    this.entries.push(entry);
                }
            }
        }

        // Sort descending by score
        this.entries.sort(function(a, b) { return b.score - a.score; });

        // Trim to max
        if (this.entries.length > this.maxEntries) {
            this.entries = this.entries.slice(0, this.maxEntries);
        }
    };

    LeaderboardManager.prototype._save = function() {
        Utils.saveToStorage(STORAGE_KEYS.LEADERBOARD, this.entries);
    };

    LeaderboardManager.prototype.addEntry = function(data) {
        var entry = {
            score: data.score || 0,
            wave: data.wave || 0,
            wpm: data.wpm || 0,
            accuracy: data.accuracy || 0,
            difficulty: data.difficulty || 'easy',
            level: data.level || 0,
            date: Date.now()
        };

        this.entries.push(entry);

        // Sort descending
        this.entries.sort(function(a, b) { return b.score - a.score; });

        // Trim
        if (this.entries.length > this.maxEntries) {
            this.entries = this.entries.slice(0, this.maxEntries);
        }

        this._save();

        // Return true if this is the new #1
        return this.entries.length > 0 && this.entries[0].date === entry.date;
    };

    LeaderboardManager.prototype.getHighScore = function() {
        return this.entries.length > 0 ? this.entries[0].score : 0;
    };

    LeaderboardManager.prototype.getEntries = function() {
        return this.entries.slice();
    };

    LeaderboardManager.prototype.render = function() {
        var listEl = this._getListEl();
        if (!listEl) return;

        // Always reload from storage to get the latest data
        this._load();

        // Empty state
        if (this.entries.length === 0) {
            listEl.innerHTML =
                '<div class="leaderboard-empty">' +
                    '<div style="font-size:32px;margin-bottom:16px;opacity:0.2;">&#9734;</div>' +
                    '<div style="font-size:15px;color:rgba(255,255,255,0.5);margin-bottom:8px;">No scores yet</div>' +
                    '<div style="font-size:12px;color:rgba(255,255,255,0.3);">Play a game to see your scores here!</div>' +
                '</div>';
            return;
        }

        // Build entries HTML
        var html = '';

        for (var i = 0; i < this.entries.length; i++) {
            var e = this.entries[i];

            // Rank styling
            var rankClass = '';
            if (i === 0) rankClass = 'gold';
            else if (i === 1) rankClass = 'silver';
            else if (i === 2) rankClass = 'bronze';

            // Details line
            var details = [];
            if (e.wave) details.push('Wave ' + e.wave);
            if (e.wpm) details.push(e.wpm + ' WPM');
            if (e.difficulty) details.push(e.difficulty);
            if (e.accuracy) details.push(e.accuracy + '%');

            // Date
            var dateStr = this._formatDate(e.date);

            html +=
                '<div class="lb-entry">' +
                    '<span class="lb-rank ' + rankClass + '">#' + (i + 1) + '</span>' +
                    '<div class="lb-info">' +
                        '<div class="lb-score">' + Utils.formatNumber(e.score) + '</div>' +
                        '<div class="lb-details">' + details.join(' \u00B7 ') + '</div>' +
                        (dateStr ? '<div class="lb-details" style="font-size:9px;margin-top:2px;opacity:0.5;">' + dateStr + '</div>' : '') +
                    '</div>' +
                '</div>';
        }

        listEl.innerHTML = html;
    };

    LeaderboardManager.prototype._formatDate = function(timestamp) {
        if (!timestamp) return '';
        try {
            var date = new Date(timestamp);
            var now = new Date();
            var diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));

            if (diffDays === 0) return 'Today';
            if (diffDays === 1) return 'Yesterday';
            if (diffDays < 7) return diffDays + ' days ago';
            if (diffDays < 30) return Math.floor(diffDays / 7) + ' weeks ago';

            return date.toLocaleDateString();
        } catch (e) {
            return '';
        }
    };

    LeaderboardManager.prototype.clear = function() {
        this.entries = [];
        this._save();
        this.render();
    };

    LeaderboardManager.prototype.getCount = function() {
        return this.entries.length;
    };

    return LeaderboardManager;
})();

window.LeaderboardManager = LeaderboardManager;