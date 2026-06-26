/**
 * Math Blaster - Audio Engine
 * Procedural sound effects using Web Audio API
 * Music system with volume control
 * Integrates with SettingsManager for mute state
 */

'use strict';

class AudioEngine {
    constructor() {
        /** @type {AudioContext|null} */
        this.ctx = null;

        /** Whether audio has been initialized (requires user gesture) */
        this.initialized = false;

        /** Master volume for sound effects (0.0 - 1.0) */
        this.sfxVolume = 0.15;

        /** Master volume for music (0.0 - 1.0) */
        this.musicVolume = 0.08;

        /** Whether sound effects are enabled */
        this.sfxEnabled = true;

        /** Whether music is enabled */
        this.musicEnabled = true;

        /** Current music oscillators (for stopping) */
        this._musicNodes = [];

        /** Music interval reference */
        this._musicInterval = null;

        /** Whether music is currently playing */
        this._musicPlaying = false;

        /** Sound effect pool to prevent overlapping identical sounds */
        this._lastPlayTime = {};
        this._minInterval = 30; // ms between identical sounds
    }

    /**
     * Initialize the AudioContext (must be called from user gesture)
     */
    init() {
        if (this.initialized) return;

        try {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
            this.initialized = true;
        } catch (e) {
            console.warn('AudioEngine: Web Audio API not available', e);
            this.sfxEnabled = false;
            this.musicEnabled = false;
        }
    }

    /**
     * Resume context if suspended (browsers require user gesture)
     */
    _ensureRunning() {
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    /**
     * Play a named sound effect
     * @param {string} type - Sound name
     */
    play(type) {
        if (!this.sfxEnabled || !this.ctx || !this.initialized) return;
        this._ensureRunning();

        // Throttle rapid identical sounds
        const now = performance.now();
        if (this._lastPlayTime[type] && (now - this._lastPlayTime[type]) < this._minInterval) {
            return;
        }
        this._lastPlayTime[type] = now;

        switch (type) {
            case 'type':
                this._playTone(800, 0.03, 'sine', this.sfxVolume * 0.6);
                break;
            case 'shoot':
                this._playShoot();
                break;
            case 'hit':
                this._playHit();
                break;
            case 'miss':
                this._playTone(200, 0.15, 'sawtooth', this.sfxVolume * 0.8);
                break;
            case 'powerup':
                this._playPowerup();
                break;
            case 'levelup':
                this._playLevelUp();
                break;
            case 'damage':
                this._playDamage();
                break;
            case 'gameover':
                this._playGameOver();
                break;
            case 'combo':
                this._playTone(1200, 0.08, 'sine', this.sfxVolume * 0.5);
                break;
            case 'wave':
                this._playWave();
                break;
            case 'click':
                this._playTone(600, 0.04, 'sine', this.sfxVolume * 0.4);
                break;
            case 'levelcomplete':
                this._playLevelComplete();
                break;
            case 'star':
                this._playStar();
                break;
            case 'boss':
                this._playBossAlert();
                break;
            default:
                break;
        }
    }

    /**
     * Play a single tone
     * @param {number} freq - Frequency in Hz
     * @param {number} duration - Duration in seconds
     * @param {string} type - Oscillator type (sine, square, sawtooth, triangle)
     * @param {number} volume - Volume (0.0 - 1.0)
     */
    _playTone(freq, duration, type, volume) {
        if (!this.ctx) return;

        try {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = type;
            osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

            gain.gain.setValueAtTime(volume, this.ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);

            osc.connect(gain);
            gain.connect(this.ctx.destination);

            osc.start(this.ctx.currentTime);
            osc.stop(this.ctx.currentTime + duration + 0.01);

            // Clean up
            osc.onended = () => {
                osc.disconnect();
                gain.disconnect();
            };
        } catch (e) {
            // Silently fail - audio is non-critical
        }
    }

    /**
     * Play a sequence of tones with delays
     * @param {Array} sequence - Array of {freq, duration, type, volume, delay}
     */
    _playSequence(sequence) {
        sequence.forEach(note => {
            setTimeout(() => {
                this._playTone(
                    note.freq,
                    note.duration || 0.15,
                    note.type || 'sine',
                    note.volume || this.sfxVolume
                );
            }, note.delay || 0);
        });
    }

    // ---- Sound Effect Definitions ----

    _playShoot() {
        this._playTone(600, 0.1, 'square', this.sfxVolume * 0.65);
        setTimeout(() => {
            this._playTone(400, 0.1, 'square', this.sfxVolume * 0.5);
        }, 30);
    }

    _playHit() {
        this._playSequence([
            { freq: 500, duration: 0.1, type: 'sine', volume: this.sfxVolume * 0.8, delay: 0 },
            { freq: 700, duration: 0.15, type: 'sine', volume: this.sfxVolume * 0.65, delay: 20 },
            { freq: 900, duration: 0.2, type: 'sine', volume: this.sfxVolume * 0.5, delay: 70 }
        ]);
    }

    _playPowerup() {
        const notes = [523, 659, 784, 1047];
        notes.forEach((freq, i) => {
            setTimeout(() => {
                this._playTone(freq, 0.15, 'sine', this.sfxVolume * 0.8);
            }, i * 80);
        });
    }

    _playLevelUp() {
        const notes = [440, 554, 659, 880];
        notes.forEach((freq, i) => {
            setTimeout(() => {
                this._playTone(freq, 0.2, 'triangle', this.sfxVolume);
            }, i * 100);
        });
    }

    _playDamage() {
        this._playTone(150, 0.3, 'sawtooth', this.sfxVolume * 1.2);
        this._playTone(100, 0.3, 'square', this.sfxVolume * 0.65);
    }

    _playGameOver() {
        const notes = [440, 370, 311, 261];
        notes.forEach((freq, i) => {
            setTimeout(() => {
                this._playTone(freq, 0.4, 'sawtooth', this.sfxVolume);
            }, i * 200);
        });
    }

    _playWave() {
        const notes = [523, 659, 784];
        notes.forEach((freq, i) => {
            setTimeout(() => {
                this._playTone(freq, 0.2, 'triangle', this.sfxVolume * 0.8);
            }, i * 120);
        });
    }

    _playLevelComplete() {
        const notes = [523, 659, 784, 1047, 784, 1047];
        notes.forEach((freq, i) => {
            setTimeout(() => {
                this._playTone(freq, 0.2, 'triangle', this.sfxVolume * 0.9);
            }, i * 100);
        });
    }

    _playStar() {
        this._playSequence([
            { freq: 880, duration: 0.1, type: 'sine', volume: this.sfxVolume * 0.7, delay: 0 },
            { freq: 1100, duration: 0.15, type: 'sine', volume: this.sfxVolume * 0.9, delay: 80 },
            { freq: 1320, duration: 0.2, type: 'sine', volume: this.sfxVolume * 0.6, delay: 160 }
        ]);
    }

    _playBossAlert() {
        this._playSequence([
            { freq: 200, duration: 0.3, type: 'sawtooth', volume: this.sfxVolume * 1.0, delay: 0 },
            { freq: 150, duration: 0.3, type: 'sawtooth', volume: this.sfxVolume * 1.0, delay: 300 },
            { freq: 200, duration: 0.3, type: 'sawtooth', volume: this.sfxVolume * 1.0, delay: 600 },
            { freq: 300, duration: 0.5, type: 'square', volume: this.sfxVolume * 0.8, delay: 900 }
        ]);
    }

    // ---- Background Music ----

    /**
     * Start ambient background music loop
     * Simple procedural music using arpeggiated tones
     */
    startMusic() {
        if (!this.musicEnabled || !this.ctx || !this.initialized) return;
        if (this._musicPlaying) return;

        this._ensureRunning();
        this._musicPlaying = true;

        const chords = [
            [261, 329, 392], // C major
            [220, 277, 329], // A minor
            [246, 311, 370], // B minor
            [196, 246, 294]  // G major
        ];

        let chordIndex = 0;
        let noteIndex = 0;

        const playNote = () => {
            if (!this._musicPlaying || !this.musicEnabled) {
                this._stopMusicLoop();
                return;
            }

            const chord = chords[chordIndex];
            const freq = chord[noteIndex];

            this._playTone(freq, 0.8, 'sine', this.musicVolume * 0.4);
            this._playTone(freq * 2, 0.6, 'triangle', this.musicVolume * 0.15);

            noteIndex++;
            if (noteIndex >= chord.length) {
                noteIndex = 0;
                chordIndex = (chordIndex + 1) % chords.length;
            }
        };

        // Play first note immediately
        playNote();

        // Continue loop
        this._musicInterval = setInterval(playNote, 800);
    }

    /**
     * Stop background music
     */
    stopMusic() {
        this._musicPlaying = false;
        this._stopMusicLoop();
    }

    /**
     * Internal: clear music interval
     */
    _stopMusicLoop() {
        if (this._musicInterval) {
            clearInterval(this._musicInterval);
            this._musicInterval = null;
        }
    }

    /**
     * Toggle music on/off
     * @param {boolean} enabled
     */
    setMusicEnabled(enabled) {
        this.musicEnabled = enabled;
        if (!enabled) {
            this.stopMusic();
        }
    }

    /**
     * Toggle SFX on/off
     * @param {boolean} enabled
     */
    setSfxEnabled(enabled) {
        this.sfxEnabled = enabled;
    }

    /**
     * Set master SFX volume
     * @param {number} volume - 0.0 to 1.0
     */
    setSfxVolume(volume) {
        this.sfxVolume = Utils.clamp(volume, 0, 1);
    }

    /**
     * Set master music volume
     * @param {number} volume - 0.0 to 1.0
     */
    setMusicVolume(volume) {
        this.musicVolume = Utils.clamp(volume, 0, 1);
    }

    /**
     * Clean up and release resources
     */
    destroy() {
        this.stopMusic();
        if (this.ctx) {
            this.ctx.close().catch(() => {});
            this.ctx = null;
        }
        this.initialized = false;
    }
}
window.AudioEngine = AudioEngine;