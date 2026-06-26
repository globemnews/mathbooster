/**
 * Math Blaster - Game Engine
 * 
 * ENDLESS MODE:
 * - HUD shows current wave number (not "level")
 * - XP rank system gives health bonuses
 * - Difficulty scales automatically with wave number
 * - Wave progress saved by Game class
 */

var GameEngine = (function() {

    function GameEngine(deps) {
        this.renderer = deps.renderer;
        this.particles = deps.particles;
        this.projectiles = deps.projectiles;
        this.waveManager = deps.waveManager;
        this.typingSystem = deps.typingSystem;
        this.powerups = deps.powerups;
        this.audio = deps.audio;
        this.settings = deps.settings;
        this.hud = deps.hud;

        this.state = GAME_STATES.MENU;

        this.gameData = {
            score: 0,
            health: GAME_CONSTANTS.MAX_HEALTH,
            maxHealth: GAME_CONSTANTS.MAX_HEALTH,
            xpLevel: 1,
            xp: 0,
            xpToLevel: GAME_CONSTANTS.BASE_XP_TO_LEVEL,
            enemies: []
        };

        this._lastTime = 0;
        this._rafId = null;
        this._running = false;
        this._boundLoop = this._loop.bind(this);
        this.onGameOver = null;
    }

    GameEngine.prototype.startLoop = function() {
        if (this._running) return;
        this._running = true;
        this._lastTime = performance.now();
        this._rafId = requestAnimationFrame(this._boundLoop);
    };

    GameEngine.prototype.stopLoop = function() {
        this._running = false;
        if (this._rafId) { cancelAnimationFrame(this._rafId); this._rafId = null; }
    };

    GameEngine.prototype._loop = function(now) {
        if (!this._running) return;
        var dt = now - this._lastTime;
        this._lastTime = now;
        if (dt > 50) dt = 50;
        if (this.state === GAME_STATES.PLAYING) this._update(dt);
        this._render();
        this._rafId = requestAnimationFrame(this._boundLoop);
    };

    /** Update game logic */
    GameEngine.prototype._update = function(dt) {
        var ac = 0;
        for (var i = 0; i < this.gameData.enemies.length; i++) {
            if (this.gameData.enemies[i].active) ac++;
        }

        this.waveManager.update(dt, ac);
        this.powerups.update();

        var slow = this.powerups.isActive('SLOW');
        var freeze = this.powerups.isActive('FREEZE');
        var shield = this.powerups.isActive('SHIELD');
        var dy = this.renderer.getDangerY();
        var cw = this.renderer.width;

        for (var j = this.gameData.enemies.length - 1; j >= 0; j--) {
            var e = this.gameData.enemies[j];
            if (!e.active) continue;
            if (e.update(cw, dy, slow, freeze)) {
                this._enemyBottom(e, shield);
                if (this.gameData.health <= 0) {
                    this.gameData.health = 0;
                    this._gameOver();
                    return;
                }
            }
        }

        var alive = [];
        for (var k = 0; k < this.gameData.enemies.length; k++) {
            if (this.gameData.enemies[k].active) alive.push(this.gameData.enemies[k]);
        }
        this.gameData.enemies = alive;

        this.typingSystem.setEnemies(this.gameData.enemies);
        this.particles.update();
        this.projectiles.update();
        this._updateHUD();
    };

    GameEngine.prototype._enemyBottom = function(enemy, shield) {
        enemy.destroy();
        if (!shield) {
            var dc = DIFFICULTY_CONFIG[this.waveManager.difficulty];
            this.gameData.health -= (dc ? dc.healthDamage : 15);
            this.audio.play('damage');
            if (this.settings.get('shake')) this.hud.triggerShake(false);
            this.hud.showScreenFlash('damage');
            if (this.settings.get('particles')) this.particles.createDamageEffect(this.renderer.getDangerY());
        }
        this.typingSystem.handleEnemyReachedBottom(enemy);
    };

    GameEngine.prototype._gameOver = function() {
        this.state = GAME_STATES.GAME_OVER;
        this.audio.play('gameover');
        this.audio.stopMusic();
        this.typingSystem.stop();
        if (this.onGameOver) this.onGameOver(this._stats());
    };

    /**
     * Handle problem completion
     * Boss: decrease HP, release target for re-solving
     * Normal: destroy immediately
     */
    GameEngine.prototype.handleWordComplete = function(enemy, combo) {
        var killed = enemy.hit();
        if (!killed) {
            this.audio.play('hit');
            this.hud.showFloatingText('+HIT', enemy.x, enemy.y, '#ff006e');
            this.hud.showFloatingText(enemy.hp + ' HP left', enemy.x, enemy.y - 25, '#ffbe0b');
            if (this.settings.get('particles')) this.particles.createHitBurst(enemy.x, enemy.y, enemy.color);
            this.typingSystem.handleBossHit(enemy);
            return;
        }

        this.audio.play('hit');
        
        // Score based on answer length (not problem length)
        var bs = enemy.answer.length * 10;
        var cm = Math.min(combo, GAME_CONSTANTS.MAX_COMBO_MULTIPLIER);
        var db = this.powerups.isActive('DOUBLE');
        var pts = Math.round(bs * cm * (db ? 2 : 1) * enemy.scoreMultiplier);
        this.gameData.score += pts;

        // XP based on answer complexity
        this.gameData.xp += enemy.answer.length * 5;
        if (this.gameData.xp >= this.gameData.xpToLevel) this._xpUp();

        if (this.settings.get('particles')) {
            this.particles.createExplosion(enemy.x, enemy.y, enemy.color, enemy.type === 'boss' ? 40 : 15);
        }

        this.hud.showFloatingText('+' + pts, enemy.x, enemy.y - 20, '#ffbe0b');
        if (combo >= GAME_CONSTANTS.COMBO_THRESHOLD) {
            this.hud.showFloatingText(combo + 'x COMBO!', enemy.x, enemy.y - 45, '#ff006e', { large: true });
        }

        if (this.settings.get('shake') && enemy.type === 'boss') this.hud.triggerShake(true);
        if (enemy.powerup) this.powerups.activate(enemy.powerup, enemy.x, enemy.y, this.gameData);
    };

    GameEngine.prototype.handleFireProjectile = function(enemy) {
        var s = this.renderer.getShipPosition();
        this.projectiles.fire(s.x, s.y - 20, enemy.x, enemy.y, enemy.color);
    };

    /** XP rank up */
    GameEngine.prototype._xpUp = function() {
        this.gameData.xpLevel++;
        this.gameData.xp -= this.gameData.xpToLevel;
        this.gameData.xpToLevel = Math.round(this.gameData.xpToLevel * GAME_CONSTANTS.XP_SCALING);
        this.audio.play('levelup');
        this.hud.showAchievement('Rank Up!', 'Reached Rank ' + this.gameData.xpLevel);
        this.hud.showScreenFlash('levelup');
        this.gameData.health = Math.min(this.gameData.maxHealth, this.gameData.health + GAME_CONSTANTS.LEVEL_HEALTH_BONUS);
    };

    GameEngine.prototype.spawnEnemy = function(d) {
        this.gameData.enemies.push(EnemyFactory.create({
            problemObj: d.problemObj,
            canvasWidth: this.renderer.width,
            type: d.type,
            baseSpeed: d.baseSpeed,
            wave: d.wave,
            difficulty: d.difficulty
        }));
    };

    /**
     * Update HUD
     * Shows wave number and XP rank
     */
    GameEngine.prototype._updateHUD = function() {
        var s = this.typingSystem.getStats();
        this.hud.updateAll({
            score: this.gameData.score,
            combo: s.combo,
            wave: this.waveManager.wave,
            level: this.gameData.xpLevel,
            health: this.gameData.health,
            maxHealth: this.gameData.maxHealth,
            xp: this.gameData.xp,
            xpToLevel: this.gameData.xpToLevel,
            wpm: s.wpm
        });
    };

    GameEngine.prototype._render = function() {
        if (this.state === GAME_STATES.PLAYING || this.state === GAME_STATES.PAUSED) {
            this.renderer.renderFrame({
                enemies: this.gameData.enemies, projectiles: this.projectiles,
                particles: this.particles, targetedEnemy: this.typingSystem.getTarget()
            });
        }
    };

    GameEngine.prototype.resetGameState = function() {
        this.gameData = {
            score: 0, health: GAME_CONSTANTS.MAX_HEALTH, maxHealth: GAME_CONSTANTS.MAX_HEALTH,
            xpLevel: 1, xp: 0, xpToLevel: GAME_CONSTANTS.BASE_XP_TO_LEVEL, enemies: []
        };
        this.particles.clear(); this.projectiles.clear(); this.powerups.clear();
        this.typingSystem.reset(); EnemyFactory.resetIds(); this.hud.resetCache();
    };

    GameEngine.prototype._stats = function() {
        var s = this.typingSystem.getStats();
        return {
            score: this.gameData.score, wave: this.waveManager.wave,
            level: this.gameData.xpLevel, wpm: s.wpm, accuracy: s.accuracy,
            maxCombo: s.maxCombo, wordsTyped: s.wordsTyped
        };
    };

    GameEngine.prototype.setState = function(s) { this.state = s; };
    GameEngine.prototype.pause = function() {
        if (this.state !== GAME_STATES.PLAYING) return;
        this.state = GAME_STATES.PAUSED; this.typingSystem.pause(); this.audio.stopMusic();
    };
    GameEngine.prototype.resume = function() {
        if (this.state !== GAME_STATES.PAUSED) return;
        this.state = GAME_STATES.PLAYING; this.typingSystem.resume();
        if (this.settings.get('music')) this.audio.startMusic();
    };
    GameEngine.prototype.isPlaying = function() { return this.state === GAME_STATES.PLAYING; };
    GameEngine.prototype.isPaused = function() { return this.state === GAME_STATES.PAUSED; };

    return GameEngine;
})();

window.GameEngine = GameEngine;