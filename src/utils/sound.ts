class SoundManager {
    private ctx: AudioContext | null = null;
    private masterGain: GainNode | null = null;
    private isMuted: boolean = false;

    private init() {
        if (this.ctx) return;
        this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        this.masterGain = this.ctx.createGain();
        this.masterGain.connect(this.ctx.destination);
    }

    setMuted(muted: boolean) {
        this.isMuted = muted;
        if (this.masterGain) {
            this.masterGain.gain.setTargetAtTime(muted ? 0 : 1, this.ctx!.currentTime, 0.1);
        }
    }

    toggleMuted() {
        this.setMuted(!this.isMuted);
        return this.isMuted;
    }

    getMuted() {
        return this.isMuted;
    }

    private playTone(freq: number, type: OscillatorType, start: number, duration: number, volume: number = 0.1) {
        this.init();
        if (this.isMuted || !this.ctx || !this.masterGain) return;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = type;
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime + start);

        gain.gain.setValueAtTime(0, this.ctx.currentTime + start);
        gain.gain.linearRampToValueAtTime(volume, this.ctx.currentTime + start + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + start + duration);

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start(this.ctx.currentTime + start);
        osc.stop(this.ctx.currentTime + start + duration);
    }

    playChip() {
        // A layered sound for a more realistic "clack"
        this.playTone(800, 'sine', 0, 0.05, 0.05);
        this.playTone(1500, 'sine', 0.01, 0.03, 0.03);

        // Add a little snap/noise
        this.init();
        if (this.isMuted || !this.ctx || !this.masterGain) return;
        const bufferSize = this.ctx.sampleRate * 0.02;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;
        const noiseGain = this.ctx.createGain();
        noiseGain.gain.setValueAtTime(0.02, this.ctx.currentTime);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.02);
        noise.connect(noiseGain);
        noiseGain.connect(this.masterGain);
        noise.start();
    }

    playDeal() {
        this.playTone(150, 'triangle', 0, 0.2, 0.1);
        this.playTone(300, 'sine', 0.05, 0.1, 0.05);
    }

    playFlip() {
        this.playTone(400, 'sine', 0, 0.1, 0.05);
        this.playTone(200, 'sine', 0.05, 0.1, 0.05);
    }

    playWin() {
        const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
        notes.forEach((freq, i) => {
            this.playTone(freq, 'sine', i * 0.1, 0.4, 0.05);
        });
    }

    playLoss() {
        const notes = [300, 250, 200];
        notes.forEach((freq, i) => {
            this.playTone(freq, 'sawtooth', i * 0.15, 0.4, 0.03);
        });
    }

    playBlackjack() {
        const notes = [1046.50, 1318.51, 1567.98, 2093.00];
        notes.forEach((freq, i) => {
            this.playTone(freq, 'sine', i * 0.05, 0.5, 0.04);
            this.playTone(freq * 1.5, 'sine', i * 0.05 + 0.02, 0.3, 0.02);
        });
    }
}

export const soundManager = new SoundManager();
export const playSound = (type: 'chip' | 'deal' | 'flip' | 'win' | 'loss' | 'blackjack') => {
    switch (type) {
        case 'chip': soundManager.playChip(); break;
        case 'deal': soundManager.playDeal(); break;
        case 'flip': soundManager.playFlip(); break;
        case 'win': soundManager.playWin(); break;
        case 'loss': soundManager.playLoss(); break;
        case 'blackjack': soundManager.playBlackjack(); break;
    }
};
