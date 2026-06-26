/**
 * Math Blaster - Projectile System
 */

var Projectile = (function() {

    function Projectile() {
        this.active = false;
        this.x = 0; this.y = 0;
        this.targetX = 0; this.targetY = 0;
        this.vx = 0; this.vy = 0;
        this.color = '#00d4ff';
        this.speed = GAME_CONSTANTS.PROJECTILE_SPEED;
        this.trail = [];
    }

    Projectile.prototype.init = function(fx, fy, tx, ty, color) {
        this.x = fx; this.y = fy;
        this.targetX = tx; this.targetY = ty;
        this.color = color || '#00d4ff';
        this.active = true;
        this.trail = [];

        var dx = tx - fx;
        var dy = ty - fy;
        var dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > 0) {
            this.vx = (dx / dist) * this.speed;
            this.vy = (dy / dist) * this.speed;
        } else {
            this.vx = 0;
            this.vy = -this.speed;
        }
    };

    Projectile.prototype.update = function() {
        if (!this.active) return false;

        this.trail.push({ x: this.x, y: this.y });
        if (this.trail.length > 8) this.trail.shift();

        this.x += this.vx;
        this.y += this.vy;

        var dx = this.x - this.targetX;
        var dy = this.y - this.targetY;
        if (dx * dx + dy * dy < 400) {
            this.active = false;
            return false;
        }

        if (this.y < -50 || this.y > window.innerHeight + 50 ||
            this.x < -50 || this.x > window.innerWidth + 50) {
            this.active = false;
            return false;
        }
        return true;
    };

    Projectile.prototype.draw = function(ctx) {
        if (!this.active) return;
        ctx.save();

        // Trail
        for (var i = 0; i < this.trail.length; i++) {
            var alpha = (i / this.trail.length) * 0.5;
            var r = 3 * (i / this.trail.length);
            ctx.beginPath();
            ctx.arc(this.trail[i].x, this.trail[i].y, r, 0, Math.PI * 2);
            ctx.fillStyle = this.color;
            ctx.globalAlpha = alpha;
            ctx.fill();
        }

        // Bullet
        ctx.globalAlpha = 1;
        ctx.beginPath();
        ctx.arc(this.x, this.y, 4, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.shadowBlur = 15;
        ctx.shadowColor = this.color;
        ctx.fill();
        ctx.shadowBlur = 0;

        ctx.restore();
    };

    return Projectile;
})();

var ProjectileSystem = (function() {

    function ProjectileSystem(size) {
        this.pool = [];
        for (var i = 0; i < (size || 50); i++) {
            this.pool.push(new Projectile());
        }
    }

    ProjectileSystem.prototype.fire = function(fx, fy, tx, ty, color) {
        for (var i = 0; i < this.pool.length; i++) {
            if (!this.pool[i].active) {
                this.pool[i].init(fx, fy, tx, ty, color);
                return this.pool[i];
            }
        }
        // Pool full — create new
        var p = new Projectile();
        p.init(fx, fy, tx, ty, color);
        this.pool.push(p);
        return p;
    };

    ProjectileSystem.prototype.update = function() {
        for (var i = 0; i < this.pool.length; i++) {
            if (this.pool[i].active) this.pool[i].update();
        }
    };

    ProjectileSystem.prototype.draw = function(ctx) {
        for (var i = 0; i < this.pool.length; i++) {
            if (this.pool[i].active) this.pool[i].draw(ctx);
        }
    };

    ProjectileSystem.prototype.clear = function() {
        for (var i = 0; i < this.pool.length; i++) {
            this.pool[i].active = false;
            this.pool[i].trail = [];
        }
    };

    return ProjectileSystem;
})();

window.Projectile = Projectile;
window.ProjectileSystem = ProjectileSystem;