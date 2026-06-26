/**
 * Math Blaster - Canvas Renderer
 */

var Renderer = (function() {

    function Renderer(canvas, deps) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.settings = deps.settings;
        this.shipX = 0;
        this.shipY = 0;
        this.width = 0;
        this.height = 0;
        this.dangerY = 0;
        this._enginePhase = 0;
        this.resize();
    }

    Renderer.prototype.resize = function() {
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        this.canvas.width = this.width;
        this.canvas.height = this.height;
        this.shipX = this.width / 2;
        this.shipY = this.height - 90;
        this.dangerY = this.shipY - 30;
    };

    Renderer.prototype.clear = function() {
        this.ctx.clearRect(0, 0, this.width, this.height);
    };

    Renderer.prototype.drawGrid = function() {
        var ctx = this.ctx;
        ctx.strokeStyle = 'rgba(0,212,255,0.03)';
        ctx.lineWidth = 1;
        var gs = GAME_CONSTANTS.GRID_SIZE;
        for (var x = 0; x < this.width; x += gs) {
            ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, this.height); ctx.stroke();
        }
        for (var y = 0; y < this.height; y += gs) {
            ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(this.width, y); ctx.stroke();
        }
    };

    Renderer.prototype.drawDangerLine = function() {
        var ctx = this.ctx;
        ctx.strokeStyle = 'rgba(255,0,110,0.2)';
        ctx.lineWidth = 1;
        ctx.setLineDash([5, 10]);
        ctx.beginPath();
        ctx.moveTo(0, this.dangerY);
        ctx.lineTo(this.width, this.dangerY);
        ctx.stroke();
        ctx.setLineDash([]);
    };

    Renderer.prototype.drawShip = function() {
        var ctx = this.ctx;
        var x = this.shipX;
        var y = this.shipY;
        ctx.save();

        this._enginePhase += 0.05;
        var glowI = 0.4 + Math.sin(this._enginePhase) * 0.2;
        var grad = ctx.createRadialGradient(x, y + 15, 0, x, y + 15, 25);
        grad.addColorStop(0, 'rgba(0,212,255,' + glowI + ')');
        grad.addColorStop(1, 'transparent');
        ctx.fillStyle = grad;
        ctx.fillRect(x - 25, y + 5, 50, 30);

        ctx.fillStyle = '#1a1a3e';
        ctx.strokeStyle = '#00d4ff';
        ctx.lineWidth = 2;
        ctx.shadowBlur = 15;
        ctx.shadowColor = '#00d4ff';
        ctx.beginPath();
        ctx.moveTo(x, y - 20);
        ctx.lineTo(x + 20, y + 10);
        ctx.lineTo(x + 10, y + 15);
        ctx.lineTo(x - 10, y + 15);
        ctx.lineTo(x - 20, y + 10);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#00d4ff';
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, Math.PI * 2);
        ctx.fill();

        ctx.shadowBlur = 0;
        ctx.strokeStyle = 'rgba(0,212,255,0.5)';
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(x - 18, y + 8); ctx.lineTo(x - 30, y + 18); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(x + 18, y + 8); ctx.lineTo(x + 30, y + 18); ctx.stroke();

        ctx.restore();
    };

    /**
     * Draw math problem enemy
     * Shows ONLY the PROBLEM (e.g., "5+3")
     * The answer is hidden - player must solve it mentally
     */
    Renderer.prototype.drawEnemy = function(enemy) {
        if (!enemy.active) return;
        var ctx = this.ctx;
        var darkWords = this.settings.get('darkWords');

        ctx.save();
        ctx.globalAlpha = enemy.opacity;

        // Font size
        var problemFontSize = enemy.type === 'boss' ? 20 : 16;

        // Measure problem text
        ctx.font = 'bold ' + problemFontSize + "px 'Orbitron', monospace";
        var problemText = enemy.word; // The math problem (e.g., "5+3")
        var problemWidth = ctx.measureText(problemText).width;

        // Box width based on problem text
        enemy.width = problemWidth + 30;

        var bx = enemy.x - enemy.width / 2;
        var by = enemy.y - enemy.height / 2;
        var r = 8;

        // Background box
        ctx.fillStyle = enemy.flash > 0 ? 'rgba(255,255,255,' + (enemy.flash * 0.5) + ')' : 'rgba(0,0,0,0.7)';
        ctx.strokeStyle = enemy.targeted ? '#fff' : enemy.color;
        ctx.lineWidth = enemy.targeted ? 2.5 : 1.5;
        ctx.shadowBlur = enemy.targeted ? 20 : 10;
        ctx.shadowColor = enemy.color;

        ctx.beginPath();
        ctx.moveTo(bx + r, by);
        ctx.lineTo(bx + enemy.width - r, by);
        ctx.quadraticCurveTo(bx + enemy.width, by, bx + enemy.width, by + r);
        ctx.lineTo(bx + enemy.width, by + enemy.height - r);
        ctx.quadraticCurveTo(bx + enemy.width, by + enemy.height, bx + enemy.width - r, by + enemy.height);
        ctx.lineTo(bx + r, by + enemy.height);
        ctx.quadraticCurveTo(bx, by + enemy.height, bx, by + enemy.height - r);
        ctx.lineTo(bx, by + r);
        ctx.quadraticCurveTo(bx, by, bx + r, by);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Boss HP bar
        if (enemy.type === 'boss' && enemy.maxHp > 1) {
            ctx.fillStyle = 'rgba(255,0,110,0.5)';
            ctx.fillRect(bx + 4, by + enemy.height - 6, (enemy.width - 8) * (enemy.hp / enemy.maxHp), 3);
        }

        // Draw PROBLEM ONLY (answer is hidden)
        ctx.font = 'bold ' + problemFontSize + "px 'Orbitron', monospace";
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = darkWords ? 'rgba(255,255,255,0.4)' : '#fff';
        ctx.fillText(problemText, enemy.x, enemy.y);

        // Type indicators (top-left corner)
        if (enemy.type !== 'normal') {
            var indicator = '';
            switch(enemy.type) {
                case 'fast': indicator = 'F'; break;
                case 'boss': indicator = 'B'; break;
                case 'zigzag': indicator = 'Z'; break;
                case 'stealth': indicator = 'S'; break;
            }
            ctx.font = "bold 9px 'Orbitron', monospace";
            ctx.textAlign = 'left';
            ctx.fillStyle = enemy.color;
            ctx.globalAlpha = enemy.opacity * 0.7;
            ctx.fillText(indicator, bx + 3, by - 4);
        }

        // Powerup indicator (top-right corner)
        if (enemy.powerup && POWERUP_TYPES[enemy.powerup]) {
            ctx.font = "bold 9px 'Orbitron', monospace";
            ctx.textAlign = 'right';
            ctx.fillStyle = POWERUP_TYPES[enemy.powerup].color;
            ctx.globalAlpha = enemy.opacity * 0.8;
            ctx.fillText('P', bx + enemy.width - 3, by - 4);
        }

        ctx.restore();
    };

    /**
     * Draw laser pointer targeting line
     * Shows a bright, animated line from ship to targeted enemy
     * Helps player know which problem they're solving
     */
    Renderer.prototype.drawTargetingLine = function(enemy) {
        if (!enemy || !enemy.active) return;
        var ctx = this.ctx;
        
        ctx.save();
        
        // Animated laser effect with pulse
        var time = Date.now() * 0.003;
        var pulseIntensity = 0.6 + Math.sin(time * 3) * 0.4;
        
        // Draw outer glow
        ctx.strokeStyle = 'rgba(255, 0, 110, ' + (pulseIntensity * 0.2) + ')';
        ctx.lineWidth = 8;
        ctx.beginPath();
        ctx.moveTo(this.shipX, this.shipY - 20);
        ctx.lineTo(enemy.x, enemy.y);
        ctx.stroke();
        
        // Draw middle layer
        ctx.strokeStyle = 'rgba(255, 0, 110, ' + (pulseIntensity * 0.5) + ')';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(this.shipX, this.shipY - 20);
        ctx.lineTo(enemy.x, enemy.y);
        ctx.stroke();
        
        // Draw bright core line
        ctx.strokeStyle = 'rgba(255, 50, 130, ' + pulseIntensity + ')';
        ctx.lineWidth = 2;
        ctx.shadowBlur = 15;
        ctx.shadowColor = '#ff006e';
        ctx.beginPath();
        ctx.moveTo(this.shipX, this.shipY - 20);
        ctx.lineTo(enemy.x, enemy.y);
        ctx.stroke();
        
        // Draw laser origin point (on ship)
        ctx.shadowBlur = 20;
        ctx.fillStyle = '#ff006e';
        ctx.beginPath();
        ctx.arc(this.shipX, this.shipY - 20, 5 * pulseIntensity, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw laser target point (on enemy)
        ctx.beginPath();
        ctx.arc(enemy.x, enemy.y, 6 * pulseIntensity, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw crosshair on target
        ctx.strokeStyle = 'rgba(255, 255, 255, ' + pulseIntensity + ')';
        ctx.lineWidth = 2;
        ctx.shadowBlur = 10;
        var crossSize = 12;
        ctx.beginPath();
        ctx.moveTo(enemy.x - crossSize, enemy.y);
        ctx.lineTo(enemy.x + crossSize, enemy.y);
        ctx.moveTo(enemy.x, enemy.y - crossSize);
        ctx.lineTo(enemy.x, enemy.y + crossSize);
        ctx.stroke();
        
        // Draw circle around target
        ctx.strokeStyle = 'rgba(255, 50, 130, ' + (pulseIntensity * 0.8) + ')';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(enemy.x, enemy.y, 20 + Math.sin(time * 4) * 3, 0, Math.PI * 2);
        ctx.stroke();
        
        ctx.restore();
    };

    Renderer.prototype.renderFrame = function(state) {
        this.clear();
        this.drawGrid();
        this.drawDangerLine();

        // Draw targeting line BEFORE projectiles and enemies
        // This makes it appear behind everything
        if (state.targetedEnemy) this.drawTargetingLine(state.targetedEnemy);

        if (state.projectiles) state.projectiles.draw(this.ctx);

        if (state.enemies) {
            for (var i = 0; i < state.enemies.length; i++) {
                if (state.enemies[i].active) this.drawEnemy(state.enemies[i]);
            }
        }

        if (state.particles) state.particles.draw(this.ctx);

        this.drawShip();
    };

    Renderer.prototype.renderIdleFrame = function() {
        this.clear();
        this.drawGrid();
        this.drawShip();
    };

    Renderer.prototype.getShipPosition = function() { return { x: this.shipX, y: this.shipY }; };
    Renderer.prototype.getDangerY = function() { return this.dangerY; };
    Renderer.prototype.getDimensions = function() { return { width: this.width, height: this.height }; };

    return Renderer;
})();

window.Renderer = Renderer;