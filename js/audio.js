// Web Audio API Sound Synthesizer for Realistic Gun & Battle Effects

class SoundManager {
    constructor() {
        this.ctx = null;
        this.initialized = false;
    }

    init() {
        if (this.initialized) return;
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (AudioContext) {
            this.ctx = new AudioContext();
            this.initialized = true;
            this.startAmbience();
        }
    }

    // Play synthesized gunfire
    playGunshot(weaponType) {
        if (!this.ctx) return;
        const now = this.ctx.currentTime;

        // Noise buffer for blast
        const bufferSize = this.ctx.sampleRate * 0.3;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }

        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;

        const filter = this.ctx.createBiquadFilter();
        const gain = this.ctx.createGain();

        // Sub bass oscillator for punch
        const subOsc = this.ctx.createOscillator();
        const subGain = this.ctx.createGain();

        if (weaponType === 'awm') {
            // High-power .338 Lapua Magnum Cannon Blast
            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(800, now);
            filter.frequency.exponentialRampToValueAtTime(50, now + 0.45);

            gain.gain.setValueAtTime(1.8, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.45);

            subOsc.type = 'sawtooth';
            subOsc.frequency.setValueAtTime(120, now);
            subOsc.frequency.exponentialRampToValueAtTime(20, now + 0.35);

            subGain.gain.setValueAtTime(1.2, now);
            subGain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);
        } else if (weaponType === 'spas12') {
            // Heavy 12-Gauge Buckshot Blast
            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(1600, now);
            filter.frequency.exponentialRampToValueAtTime(80, now + 0.35);

            gain.gain.setValueAtTime(1.5, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);

            subOsc.type = 'square';
            subOsc.frequency.setValueAtTime(140, now);
            subOsc.frequency.exponentialRampToValueAtTime(25, now + 0.25);

            subGain.gain.setValueAtTime(1.0, now);
            subGain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
        } else if (weaponType === 'vector') {
            // Rapid-fire .45 ACP suppressed click pop
            filter.type = 'bandpass';
            filter.frequency.setValueAtTime(3000, now);
            filter.frequency.exponentialRampToValueAtTime(400, now + 0.1);

            gain.gain.setValueAtTime(0.85, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);

            subOsc.type = 'sine';
            subOsc.frequency.setValueAtTime(240, now);
            subOsc.frequency.exponentialRampToValueAtTime(60, now + 0.08);

            subGain.gain.setValueAtTime(0.4, now);
            subGain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
        } else if (weaponType === 'ak47') {
            // Heavy 7.62mm punch
            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(1400, now);
            filter.frequency.exponentialRampToValueAtTime(100, now + 0.25);

            gain.gain.setValueAtTime(1.2, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.28);

            subOsc.type = 'triangle';
            subOsc.frequency.setValueAtTime(150, now);
            subOsc.frequency.exponentialRampToValueAtTime(30, now + 0.2);

            subGain.gain.setValueAtTime(0.8, now);
            subGain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
        } else if (weaponType === 'm4') {
            // Crisp 5.56mm tactical pop
            filter.type = 'bandpass';
            filter.frequency.setValueAtTime(2200, now);
            filter.frequency.exponentialRampToValueAtTime(200, now + 0.2);

            gain.gain.setValueAtTime(1.0, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.22);

            subOsc.type = 'sine';
            subOsc.frequency.setValueAtTime(180, now);
            subOsc.frequency.exponentialRampToValueAtTime(40, now + 0.15);

            subGain.gain.setValueAtTime(0.6, now);
            subGain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
        } else { // famas
            // High rate burst pop
            filter.type = 'highpass';
            filter.frequency.setValueAtTime(1200, now);
            filter.frequency.exponentialRampToValueAtTime(300, now + 0.15);

            gain.gain.setValueAtTime(0.9, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.16);

            subOsc.type = 'sine';
            subOsc.frequency.setValueAtTime(220, now);
            subOsc.frequency.exponentialRampToValueAtTime(50, now + 0.12);

            subGain.gain.setValueAtTime(0.5, now);
            subGain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);
        }


        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);

        subOsc.connect(subGain);
        subGain.connect(this.ctx.destination);

        noise.start(now);
        subOsc.start(now);

        noise.stop(now + 0.3);
        subOsc.stop(now + 0.3);
    }

    // Play specific stages of reload sounds
    playReloadStage(stageName) {
        if (!this.ctx) return;
        const now = this.ctx.currentTime;

        if (stageName === 'mag_out') {
            // Click and slide out
            this.playMechanicalClick(1200, 0.05, 0.3);
            this.playFriction(0.15, 600, 200);
        } else if (stageName === 'mag_in') {
            // Solid snap in
            this.playMechanicalClick(800, 0.08, 0.5);
            this.playMechanicalClick(1600, 0.04, 0.4, 0.04);
        } else if (stageName === 'bolt_pull') {
            // Heavy metallic racking sound
            this.playFriction(0.2, 400, 1200);
            this.playMechanicalClick(500, 0.08, 0.6, 0.15);
        } else if (stageName === 'bolt_release') {
            // Clack forward
            this.playMechanicalClick(2200, 0.06, 0.6);
            this.playMechanicalClick(900, 0.08, 0.5, 0.02);
        }
    }

    playMechanicalClick(freq, duration, volume = 0.3, delay = 0) {
        const now = this.ctx.currentTime + delay;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'square';
        osc.frequency.setValueAtTime(freq, now);
        osc.frequency.exponentialRampToValueAtTime(freq * 0.2, now + duration);

        gain.gain.setValueAtTime(volume, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + duration + 0.01);
    }

    playFriction(duration, startFreq, endFreq) {
        const now = this.ctx.currentTime;
        const bufferSize = this.ctx.sampleRate * duration;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }

        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(startFreq, now);
        filter.frequency.linearRampToValueAtTime(endFreq, now + duration);

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.25, now);
        gain.gain.linearRampToValueAtTime(0.01, now + duration);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);

        noise.start(now);
    }

    playHitMarker() {
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(1800, now);
        osc.frequency.exponentialRampToValueAtTime(400, now + 0.05);

        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.06);
    }

    playEmptyClick() {
        if (!this.ctx) return;
        this.playMechanicalClick(2500, 0.03, 0.4);
    }

    startAmbience() {
        // Continuous subtle wind rumble
        const bufferSize = this.ctx.sampleRate * 2;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }

        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;
        noise.loop = true;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 150;

        const gain = this.ctx.createGain();
        gain.gain.value = 0.05;

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);

        noise.start();
    }

    playDashSound() {
        if (!this.ctx) return;
        const now = this.ctx.currentTime;

        // Rapid whoosh noise
        const bufferSize = this.ctx.sampleRate * 0.25;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(400, now);
        filter.frequency.exponentialRampToValueAtTime(2400, now + 0.08);
        filter.frequency.exponentialRampToValueAtTime(300, now + 0.25);
        filter.Q.value = 3.0;

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.7, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);

        // Low frequency air displacement whoosh
        const osc = this.ctx.createOscillator();
        const oscGain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(140, now);
        osc.frequency.exponentialRampToValueAtTime(60, now + 0.2);
        oscGain.gain.setValueAtTime(0.5, now);
        oscGain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);

        osc.connect(oscGain);
        oscGain.connect(this.ctx.destination);

        noise.start(now);
        osc.start(now);
        osc.stop(now + 0.25);
    }

    playScytheSlash() {
        if (!this.ctx) return;
        const now = this.ctx.currentTime;

        // Metallic blade whoosh
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(1800, now);
        osc.frequency.exponentialRampToValueAtTime(450, now + 0.18);

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(1400, now);
        filter.frequency.exponentialRampToValueAtTime(500, now + 0.18);
        filter.Q.value = 5.0;

        gain.gain.setValueAtTime(0.65, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.18);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.2);
    }

    playScytheHit() {
        if (!this.ctx) return;
        const now = this.ctx.currentTime;

        // Metallic slice clang
        const osc1 = this.ctx.createOscillator();
        const gain1 = this.ctx.createGain();
        osc1.type = 'square';
        osc1.frequency.setValueAtTime(950, now);
        osc1.frequency.exponentialRampToValueAtTime(220, now + 0.15);
        gain1.gain.setValueAtTime(0.8, now);
        gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.15);

        osc1.connect(gain1);
        gain1.connect(this.ctx.destination);
        osc1.start(now);
        osc1.stop(now + 0.16);

        // Low punch impact
        const osc2 = this.ctx.createOscillator();
        const gain2 = this.ctx.createGain();
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(200, now);
        osc2.frequency.exponentialRampToValueAtTime(40, now + 0.2);
        gain2.gain.setValueAtTime(0.9, now);
        gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.2);

        osc2.connect(gain2);
        gain2.connect(this.ctx.destination);
        osc2.start(now);
        osc2.stop(now + 0.22);
    }
}

const sounds = new SoundManager();
