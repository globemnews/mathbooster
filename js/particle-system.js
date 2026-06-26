/**
 * Math Blaster - Particle System
 * Object-pooled particle system for explosions, trails, and effects
 * Renders circles, sparks, and rings on the canvas
 */

'use strict';

// ============================================
// PARTICLE CLASS
// ============================================

class Particle {
    constructor() {
        /** Whether this particle is currently in use */
        this.active = false;
        this.reset();
    }

    /**
     * Reset all properties to defaults (for pool reuse)
     */
    reset() {
        this.x = 0;
        this.y = 0;
        this.color = '#ffffff';
        this.size = 2;
        this.speedX = 0;
        this.speedY = 0;
        this.life = 1;
        this.decay = 0.02;
        this.gravity = 0.05;
        this.type = 'circle'; // 'circle', 'spark', 'ring'
        this.active = false;
        this.initialSize = 2;
        this.shrinkRate = 0.98;
        this.friction = 0.99;
    }

    /**
     * Initialize particle with specific properties
     * @param {number} x
     * @param {number} y
     * @param {string} color
     * @param {Object} opts - Optional overrides
     */
    init(x, y, color, opts = {}) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.size = opts.size || (Math.random() * 4 + 1);
        this.initialSize = this.size;
        this.speedX = opts.speedX || (Math.random() - 0.5) * 8;
        this.speedY = opts.speedY || (Math.random() - 0.5) * 8;
        this.life = opts.life || 1;
        this.decay = opts.decay || (Math.random() * 0.02 + 0.01);
        this.gravity = opts.gravity !== undefined ? opts.gravity : 0.05;
        this.type = opts.type || 'circle';
        this.shrinkRate = opts.shrinkRate || 0.98;
        this.friction = opts.friction || 0.99;
        this.active = true;
    }

    /**
     * Update particle physics
     * @returns {boolean} True if particle is still alive
     */
    update() {
        if (!this.active) return false;

        this.x += this.speedX;
        this.y += this.speedY;
        this.speedY += this.gravity;
        this.speedX *= this.friction;
        this.life -= this.decay;
        this.size *= this.shrinkRate;

        if (this.life <= 0 || this.size < 0.1) {
            this.active = false;
            return false;
        }

        return true;
    }

    /**
     * Draw particle on canvas
     * @param {CanvasRenderingContext2D} ctx
     */
    draw(ctx) {
        if (!this.active || this.life <= 0) return;

        ctx.save();
        ctx.globalAlpha = Math.max(0, this.life);

        switch (this.type) {
            case 'circle':
                this._drawCircle(ctx);
                break;
            case 'spark':
                this._drawSpark(ctx);
                break;
            case 'ring':
                this._drawRing(ctx);
                break;
            default:
                this._drawCircle(ctx);
        }

        ctx.restore();
    }

    /**
     * Draw filled circle particle
     */
    _drawCircle(ctx) {
        ctx.beginPath();
        ctx.arc(this.x, this.y, Math.max(0.5, this.size), 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();

        // Glow effect
        ctx.shadowBlur = 10;
        ctx.shadowColor = this.color;
        ctx.fill();
        ctx.shadowBlur = 0;
    }

    /**
     * Draw spark/trail particle
     */
    _drawSpark(ctx) {
        ctx.strokeStyle = this.color;
        ctx.lineWidth = Math.max(0.5, this.size * 0.5);
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(this.x, this.y);
        ctx.lineTo(
            this.x - this.speedX * 3,
            this.y - this.speedY * 3
        );
        ctx.stroke();
    }

    /**
     * Draw expanding ring particle
     */
    _drawRing(ctx) {
        ctx.beginPath();
        ctx.arc(this.x, this.y, Math.max(0.5, this.size), 0, Math.PI * 2);
        ctx.strokeStyle = this.color;
        ctx.lineWidth = Math.max(0.5, 2 * this.life);
        ctx.stroke();
    }
}


// ============================================
// PARTICLE SYSTEM (Object Pool Manager)
// ============================================

class ParticleSystem {
    /**
     * @param {number} poolSize - Maximum number of particles
     */
    constructor(poolSize = 500) {
        /** Maximum pool size */
        this.poolSize = poolSize;

        /** Pre-allocated particle pool */
        this.pool = [];

        /** Whether particle effects are enabled */
        this.enabled = true;

        // Pre-allocate pool
        for (let i = 0; i < this.poolSize; i++) {
            this.pool.push(new Particle());
        }

        /** Count of active particles (for performance monitoring) */
        this.activeCount = 0;
    }

    /**
     * Get an inactive particle from the pool
     * @returns {Particle|null} Available particle or null if pool exhausted
     */
    _getParticle() {
        for (let i = 0; i < this.pool.length; i++) {
            if (!this.pool[i].active) {
                return this.pool[i];
            }
        }
        // Pool exhausted - return null (skip this particle)
        return null;
    }

    /**
     * Emit a single particle
     * @param {number} x
     * @param {number} y
     * @param {string} color
     * @param {Object} opts
     * @returns {Particle|null}
     */
    emit(x, y, color, opts = {}) {
        if (!this.enabled) return null;

        const particle = this._getParticle();
        if (!particle) return null;

        particle.init(x, y, color, opts);
        return particle;
    }

    /**
     * Create an explosion effect at a position
     * @param {number} x - Center X
     * @param {number} y - Center Y
     * @param {string} color - Particle color
     * @param {number} count - Number of particles
     */
    createExplosion(x, y, color, count = 15) {
        if (!this.enabled) return;

        for (let i = 0; i < count; i++) {
            const angle = (Math.PI * 2 / count) * i;
            const speed = Math.random() * 5 + 2;

            this.emit(x, y, color, {
                speedX: Math.cos(angle) * speed,
                speedY: Math.sin(angle) * speed,
                size: Math.random() * 4 + 2,
                decay: Math.random() * 0.02 + 0.01,
                type: Math.random() > 0.5 ? 'spark' : 'circle'
            });
        }

        // Add a ring effect
        this.emit(x, y, color, {
            speedX: 0,
            speedY: 0,
            size: 5,
            decay: 0.04,
            type: 'ring',
            gravity: 0,
            shrinkRate: 1.05 // Ring expands
        });
    }

    /**
     * Create a smaller hit burst effect
     * @param {number} x
     * @param {number} y
     * @param {string} color
     */
    createHitBurst(x, y, color) {
        if (!this.enabled) return;

        for (let i = 0; i < 8; i++) {
            const angle = (Math.PI * 2 / 8) * i + Math.random() * 0.3;
            const speed = Math.random() * 3 + 1;

            this.emit(x, y, color, {
                speedX: Math.cos(angle) * speed,
                speedY: Math.sin(angle) * speed,
                size: Math.random() * 3 + 1,
                decay: Math.random() * 0.03 + 0.02,
                type: 'circle'
            });
        }
    }

    /**
     * Create a trail effect (for projectiles)
     * @param {number} x
     * @param {number} y
     * @param {string} color
     */
    createTrail(x, y, color) {
        if (!this.enabled) return;

        this.emit(x, y, color, {
            speedX: (Math.random() - 0.5) * 1,
            speedY: (Math.random() - 0.5) * 1,
            size: Math.random() * 2 + 0.5,
            decay: 0.05,
            gravity: 0,
            type: 'circle',
            friction: 0.95
        });
    }

    /**
     * Create a damage impact effect
     * @param {number} x
     * @param {number} y
     */
    createDamageEffect(x, y) {
        if (!this.enabled) return;

        const width = window.innerWidth;
        for (let i = 0; i < 12; i++) {
            this.emit(
                Math.random() * width,
                y + Math.random() * 20 - 10,
                '#ff006e',
                {
                    speedX: (Math.random() - 0.5) * 4,
                    speedY: -Math.random() * 3 - 1,
                    size: Math.random() * 3 + 1,
                    decay: 0.02,
                    type: 'spark'
                }
            );
        }
    }

    /**
     * Create powerup collection sparkle effect
     * @param {number} x
     * @param {number} y
     * @param {string} color
     */
    createSparkle(x, y, color) {
        if (!this.enabled) return;

        for (let i = 0; i < 20; i++) {
            const angle = (Math.PI * 2 / 20) * i;
            const speed = Math.random() * 6 + 3;

            this.emit(x, y, color, {
                speedX: Math.cos(angle) * speed,
                speedY: Math.sin(angle) * speed,
                size: Math.random() * 3 + 1,
                decay: 0.015,
                type: i % 3 === 0 ? 'spark' : 'circle',
                gravity: 0.02
            });
        }

        // Multiple expanding rings
        for (let r = 0; r < 3; r++) {
            setTimeout(() => {
                this.emit(x, y, color, {
                    speedX: 0,
                    speedY: 0,
                    size: 3 + r * 4,
                    decay: 0.03,
                    type: 'ring',
                    gravity: 0,
                    shrinkRate: 1.06
                });
            }, r * 100);
        }
    }

    /**
     * Create a bomb wave effect (radial pulse)
     * @param {number} x
     * @param {number} y
     */
    createBombWave(x, y) {
        if (!this.enabled) return;

        for (let i = 0; i < 30; i++) {
            const angle = (Math.PI * 2 / 30) * i;
            const speed = Math.random() * 8 + 4;

            this.emit(x, y, '#ff006e', {
                speedX: Math.cos(angle) * speed,
                speedY: Math.sin(angle) * speed,
                size: Math.random() * 5 + 2,
                decay: 0.01,
                type: Math.random() > 0.3 ? 'spark' : 'circle',
                gravity: 0
            });
        }

        // Large ring
        this.emit(x, y, '#ff006e', {
            speedX: 0,
            speedY: 0,
            size: 10,
            decay: 0.015,
            type: 'ring',
            gravity: 0,
            shrinkRate: 1.08
        });
    }

    /**
     * Update all active particles
     */
    update() {
        this.activeCount = 0;

        for (let i = 0; i < this.pool.length; i++) {
            if (this.pool[i].active) {
                this.pool[i].update();
                if (this.pool[i].active) {
                    this.activeCount++;
                }
            }
        }
    }

    /**
     * Draw all active particles
     * @param {CanvasRenderingContext2D} ctx
     */
    draw(ctx) {
        for (let i = 0; i < this.pool.length; i++) {
            if (this.pool[i].active) {
                this.pool[i].draw(ctx);
            }
        }
    }

    /**
     * Clear all active particles
     */
    clear() {
        for (let i = 0; i < this.pool.length; i++) {
            if (this.pool[i].active) {
                this.pool[i].reset();
            }
        }
        this.activeCount = 0;
    }

    /**
     * Set enabled state
     * @param {boolean} enabled
     */
    setEnabled(enabled) {
        this.enabled = enabled;
        if (!enabled) {
            this.clear();
        }
    }

    /**
     * Get active particle count (for performance monitoring)
     * @returns {number}
     */
    getActiveCount() {
        return this.activeCount;
    }
}
window.Particle = Particle;
window.ParticleSystem = ParticleSystem;