/**
 * FlashLearn HTML - Audio Manager
 * Synthesizes procedural Web Audio SFX & ambient procedural BGM
 * 100% offline, zero external file dependencies, ultra lightweight (< 8KB)
 */
const AudioManager = {
    audioCtx: null,
    bgmOscillators: [],
    bgmGainNode: null,
    bgmInterval: null,
    isBgmPlaying: false,

    // Settings state
    bgmEnabled: true,
    sfxEnabled: true,

    init() {
        // Load user audio preferences
        this.bgmEnabled = localStorage.getItem('flashlearn_bgm_enabled') !== 'false';
        this.sfxEnabled = localStorage.getItem('flashlearn_sfx_enabled') !== 'false';

        // Setup BGM element
        if (!this.bgmAudio) {
            this.bgmAudio = new Audio('assets/bgm.wav?v=3');
            this.bgmAudio.loop = true;
            this.bgmAudio.preload = 'auto';
        }

        // Start pre-decoding Web Audio buffer for hardware-accurate gapless loop
        this.loadBgmBuffer();

        // Attempt playback immediately upon app load
        if (this.bgmEnabled) {
            this.startBGM(true);
        }

        // Resilient unlock fallback: only real user activation gestures, and only detach once playing
        const unlockEvents = ['pointerdown', 'touchstart', 'click', 'keydown'];
        const unlockAudio = () => {
            const ctx = this.ensureAudioContext(true);
            if (this.bgmArrayBuffer && !this.bgmBuffer && ctx) {
                this.decodeBgmBuffer();
            }
            if (this.bgmEnabled && (!this.bgmAudio || this.bgmAudio.paused) && !this.bgmSourceNode) {
                this.startBGM(true);
            }
            if (this.isBgmPlaying || (this.bgmAudio && !this.bgmAudio.paused)) {
                unlockEvents.forEach(evt => document.removeEventListener(evt, unlockAudio, true));
            }
        };

        unlockEvents.forEach(evt => {
            document.addEventListener(evt, unlockAudio, { capture: true });
        });

        // Global SFX delegation for ALL buttons and interactive elements
        document.addEventListener('click', (e) => {
            const target = e.target.closest('button, [role="button"], .btn, .nav-item, .topic-card, .quiz-option, input[type="checkbox"], input[type="radio"]');
            if (!target) return;
            if (target.disabled || target.getAttribute('aria-disabled') === 'true') return;

            // Jangan dobel jika target adalah card container atau tombol panah navigasi kartu (agar murni hanya suara kartu)
            if (target.id === 'fc-container' || target.closest('.flashcard') || target.closest('.flashcard-nav-btn')) return;

            this.play('button');
        }, true);

        // Clean visibility handling (zero stacking guarantee)
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                if (this.isBgmPlaying) {
                    this.wasPlayingBeforeHidden = true;
                    if (this.audioCtx && this.audioCtx.state === 'running') {
                        this.audioCtx.suspend().catch(() => {});
                    }
                    if (this.bgmAudio && !this.bgmAudio.paused) {
                        this.bgmAudio.pause();
                    }
                }
            } else {
                if (this.wasPlayingBeforeHidden && this.bgmEnabled) {
                    this.wasPlayingBeforeHidden = false;
                    if (this.bgmSourceNode && this.audioCtx && this.audioCtx.state === 'suspended') {
                        this.audioCtx.resume().catch(() => {});
                    } else if (this.bgmAudio && this.bgmAudio.paused) {
                        this.bgmAudio.play().catch(() => {});
                    } else if (!this.isBgmPlaying) {
                        this.startBGM(false);
                    }
                }
            }
        });
    },

    ensureAudioContext(forceResume = false) {
        if (!this.audioCtx) {
            const AudioContextClass = window.AudioContext || window.webkitAudioContext;
            if (AudioContextClass) {
                this.audioCtx = new AudioContextClass();
            }
        }
        if (forceResume && this.audioCtx && this.audioCtx.state === 'suspended') {
            this.audioCtx.resume().catch(() => {});
        }
        return this.audioCtx;
    },

    // ── Toggle Controls ──
    setBgmEnabled(enabled) {
        this.bgmEnabled = !!enabled;
        localStorage.setItem('flashlearn_bgm_enabled', this.bgmEnabled ? 'true' : 'false');
        if (this.bgmEnabled) {
            this.startBGM();
        } else {
            this.stopBGM();
        }
    },

    setSfxEnabled(enabled) {
        this.sfxEnabled = !!enabled;
        localStorage.setItem('flashlearn_sfx_enabled', this.sfxEnabled ? 'true' : 'false');
    },

    // ── Sound Effects (SFX) ──
    play(soundName) {
        if (!this.sfxEnabled) return;

        const ctx = this.ensureAudioContext(true);
        if (!ctx) return;

        if (this.bgmArrayBuffer && !this.bgmBuffer) {
            this.decodeBgmBuffer();
        }

        // In case BGM was blocked by browser autoplay on load, wake BGM on any user action
        if (this.bgmEnabled && !this.isBgmPlaying && (!this.bgmAudio || this.bgmAudio.paused)) {
            this.startBGM(true);
        }

        try {
            switch (soundName) {
                case 'button':
                case 'click':
                    this.sfxClick(ctx);
                    break;
                case 'flip':
                    this.sfxFlip(ctx);
                    break;
                case 'swipe':
                    this.sfxSwipe(ctx);
                    break;
                case 'drag':
                    this.sfxDrag(ctx);
                    break;
                case 'drop':
                    this.sfxDrop(ctx);
                    break;
                case 'correct':
                    this.sfxCorrect(ctx);
                    break;
                case 'wrong':
                    this.sfxWrong(ctx);
                    break;
                case 'result':
                case 'victory':
                    this.sfxVictory(ctx);
                    break;
                case 'toast':
                    this.sfxToast(ctx);
                    break;
                case 'denied':
                    this.sfxDenied(ctx);
                    break;
                default:
                    this.sfxClick(ctx);
            }
        } catch (e) {
            // Audio context failure gracefully swallowed
        }
    },

    // 1. Soft Button Click: Crisp micro-bubble pop
    sfxClick(ctx) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const now = ctx.currentTime;

        osc.type = 'sine';
        osc.frequency.setValueAtTime(480, now);
        osc.frequency.exponentialRampToValueAtTime(780, now + 0.05);

        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 0.07);
    },

    // 2. Flip Card: Suara kartu dibalik asli dari rekaman playing cards
    flipAudio: null,
    sfxFlip(ctx) {
        try {
            if (!this.flipAudio) {
                this.flipAudio = new Audio('assets/card-flip.wav');
                this.flipAudio.volume = 0.85;
            }
            const sound = this.flipAudio.cloneNode();
            sound.volume = 0.85;
            sound.play().catch(() => {});
        } catch (e) {}
    },

    // 3. Swipe Card: Suara kartu digeser/diluncurkan asli dari rekaman playing cards
    swipeAudio: null,
    sfxSwipe(ctx) {
        try {
            if (!this.swipeAudio) {
                this.swipeAudio = new Audio('assets/card-swipe.wav');
                this.swipeAudio.volume = 0.85;
            }
            const sound = this.swipeAudio.cloneNode();
            sound.volume = 0.85;
            sound.play().catch(() => {});
        } catch (e) {}
    },

    // 4. Drag Block (Lift/Pick up): Soft low plop
    sfxDrag(ctx) {
        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(260, now);
        osc.frequency.exponentialRampToValueAtTime(420, now + 0.06);

        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 0.08);
    },

    // 5. Drop Block (Snap/Reorder): Satisfying snap lock
    sfxDrop(ctx) {
        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(360, now);
        osc.frequency.exponentialRampToValueAtTime(200, now + 0.07);

        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 0.08);
    },

    // 6. Correct Answer: Bright cheerful double chime (C6 - G6)
    sfxCorrect(ctx) {
        const now = ctx.currentTime;
        const notes = [1046.50, 1567.98]; // C6, G6
        notes.forEach((freq, idx) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            const start = now + (idx * 0.1);

            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, start);

            gain.gain.setValueAtTime(0.15, start);
            gain.gain.exponentialRampToValueAtTime(0.001, start + 0.28);

            osc.connect(gain);
            gain.connect(ctx.destination);

            osc.start(start);
            osc.stop(start + 0.28);
        });
    },

    // 7. Wrong Answer: Gentle warm buzz (soft and encouraging)
    sfxWrong(ctx) {
        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(150, now);
        osc.frequency.exponentialRampToValueAtTime(95, now + 0.22);

        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 0.22);
    },

    // 8. Result Victory: Grand uplifting fanfare (C5 -> E5 -> G5 -> C6)
    sfxVictory(ctx) {
        const now = ctx.currentTime;
        const notes = [
            { f: 523.25, t: 0.00, d: 0.18 }, // C5
            { f: 659.25, t: 0.14, d: 0.18 }, // E5
            { f: 783.99, t: 0.28, d: 0.24 }, // G5
            { f: 1046.50, t: 0.44, d: 0.65 } // C6 (long ring)
        ];

        notes.forEach(note => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            const start = now + note.t;

            osc.type = 'sine';
            osc.frequency.setValueAtTime(note.f, start);

            gain.gain.setValueAtTime(0.16, start);
            gain.gain.exponentialRampToValueAtTime(0.001, start + note.d);

            osc.connect(gain);
            gain.connect(ctx.destination);

            osc.start(start);
            osc.stop(start + note.d);
        });
    },

    // 9. Toast Notification: Soft pleasant ping
    sfxToast(ctx) {
        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, now); // A5
        osc.frequency.exponentialRampToValueAtTime(1174.66, now + 0.06); // D6

        gain.gain.setValueAtTime(0.09, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 0.22);
    },

    // 10. Denied / Action Locked: Blunt double low buzz (clear, tactile, polite)
    sfxDenied(ctx) {
        const now = ctx.currentTime;
        [0, 0.1].forEach(delay => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            const start = now + delay;

            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(140, start);
            osc.frequency.exponentialRampToValueAtTime(80, start + 0.08);

            gain.gain.setValueAtTime(0.14, start);
            gain.gain.exponentialRampToValueAtTime(0.001, start + 0.08);

            osc.connect(gain);
            gain.connect(ctx.destination);

            osc.start(start);
            osc.stop(start + 0.08);
        });
    },

    // ── Background Music (BGM): Hardware Gapless Loop (Web Audio + HTML5 Instant Fallback) ──
    bgmAudio: null,
    bgmBuffer: null,
    bgmArrayBuffer: null,
    bgmSourceNode: null,
    bgmGainNode: null,
    isBgmPlaying: false,
    isLoadingBuffer: false,
    bgmFadeInterval: null,

    loadBgmBuffer() {
        if (this.bgmBuffer || this.bgmArrayBuffer || this.isLoadingBuffer) return;
        this.isLoadingBuffer = true;

        // Pre-fetch raw arrayBuffer over network/cache without touching AudioContext
        fetch('assets/bgm.wav?v=3')
            .then(res => res.arrayBuffer())
            .then(buf => {
                this.bgmArrayBuffer = buf;
                this.isLoadingBuffer = false;
                // If audio context is already running (after user interaction), decode now
                if (this.audioCtx && this.audioCtx.state === 'running') {
                    this.decodeBgmBuffer();
                }
            })
            .catch(() => {
                this.isLoadingBuffer = false;
            });
    },

    decodeBgmBuffer() {
        if (this.bgmBuffer || !this.bgmArrayBuffer || !this.audioCtx) return;
        this.audioCtx.decodeAudioData(this.bgmArrayBuffer.slice(0))
            .then(decoded => {
                this.bgmBuffer = decoded;
                // If HTML5 audio is currently playing, seamlessly hand over to gapless Web Audio buffer
                if (this.isBgmPlaying && this.bgmAudio && !this.bgmAudio.paused) {
                    const currentPos = this.bgmAudio.currentTime % decoded.duration;
                    this.bgmAudio.pause();
                    this.playBufferBGM(false, 0.32, currentPos);
                }
            })
            .catch(() => {});
    },

    startBGM(fadeIn = true) {
        if (!this.bgmEnabled) return Promise.resolve();
        const targetVolume = 0.32; // Comfortable cheerful level

        // If Web Audio buffer is ready and context is running, use hardware-accurate gapless loop
        if (this.audioCtx && this.audioCtx.state === 'running' && this.bgmBuffer) {
            return this.playBufferBGM(fadeIn, targetVolume);
        }

        // Fallback / instant start via HTML5 Audio while buffer decodes
        if (!this.bgmAudio) {
            this.bgmAudio = new Audio('assets/bgm.wav?v=3');
            this.bgmAudio.loop = true;
            this.bgmAudio.preload = 'auto';
        }

        if (this.bgmFadeInterval) {
            clearInterval(this.bgmFadeInterval);
            this.bgmFadeInterval = null;
        }

        if (fadeIn) {
            this.bgmAudio.volume = 0.02;
        } else {
            this.bgmAudio.volume = targetVolume;
        }

        // Ensure binary buffer is loaded
        this.loadBgmBuffer();

        const playPromise = this.bgmAudio.play();
        if (playPromise !== undefined) {
            playPromise.then(() => {
                this.isBgmPlaying = true;
                if (fadeIn && this.bgmAudio) {
                    const stepMs = 50;
                    const totalDurationMs = 1200;
                    const steps = totalDurationMs / stepMs;
                    const volumeIncrement = (targetVolume - 0.02) / steps;

                    this.bgmFadeInterval = setInterval(() => {
                        if (!this.bgmAudio || this.bgmAudio.paused) {
                            clearInterval(this.bgmFadeInterval);
                            return;
                        }
                        if (this.bgmAudio.volume + volumeIncrement >= targetVolume) {
                            this.bgmAudio.volume = targetVolume;
                            clearInterval(this.bgmFadeInterval);
                            this.bgmFadeInterval = null;
                        } else {
                            this.bgmAudio.volume += volumeIncrement;
                        }
                    }, stepMs);
                }
            }).catch(() => {
                // Autoplay blocked by browser policy; silently wait for user gesture unlock
                if (this.bgmAudio) {
                    this.bgmAudio.volume = targetVolume;
                }
                this.isBgmPlaying = false;
            });
        }
        return Promise.resolve();
    },

    playBufferBGM(fadeIn = true, targetVolume = 0.32, startOffset = 0) {
        const ctx = this.ensureAudioContext(true);
        if (!ctx || !this.bgmBuffer || !this.bgmEnabled) return Promise.resolve();

        this.stopBufferBGM();

        if (ctx.state === 'suspended') {
            ctx.resume().catch(() => {});
        }

        this.bgmSourceNode = ctx.createBufferSource();
        this.bgmSourceNode.buffer = this.bgmBuffer;
        this.bgmSourceNode.loop = true;
        this.bgmSourceNode.loopStart = 0;
        this.bgmSourceNode.loopEnd = this.bgmBuffer.duration;

        this.bgmGainNode = ctx.createGain();
        const now = ctx.currentTime;

        if (fadeIn) {
            this.bgmGainNode.gain.setValueAtTime(0.001, now);
            this.bgmGainNode.gain.linearRampToValueAtTime(targetVolume, now + 1.2);
        } else {
            this.bgmGainNode.gain.setValueAtTime(targetVolume, now);
        }

        this.bgmSourceNode.connect(this.bgmGainNode);
        this.bgmGainNode.connect(ctx.destination);

        const safeOffset = (startOffset >= 0 && startOffset < this.bgmBuffer.duration) ? startOffset : 0;
        this.bgmSourceNode.start(0, safeOffset);
        this.isBgmPlaying = true;

        return Promise.resolve();
    },

    stopBufferBGM() {
        if (this.bgmSourceNode) {
            try {
                this.bgmSourceNode.stop();
                this.bgmSourceNode.disconnect();
            } catch (e) {}
            this.bgmSourceNode = null;
        }
        if (this.bgmGainNode) {
            try {
                this.bgmGainNode.disconnect();
            } catch (e) {}
            this.bgmGainNode = null;
        }
    },

    stopBGM() {
        if (this.bgmFadeInterval) {
            clearInterval(this.bgmFadeInterval);
            this.bgmFadeInterval = null;
        }
        this.stopBufferBGM();
        if (this.bgmAudio) {
            this.bgmAudio.pause();
            this.bgmAudio.currentTime = 0;
            this.bgmAudio.volume = 0;
        }
        this.isBgmPlaying = false;
    }
};
