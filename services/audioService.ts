class AudioService {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private isInitialized = false;
  public isMuted = false;
  private sequenceInterval: number | null = null;
  private currentStep = 0;

  private async init() {
    if (this.isInitialized && this.ctx?.state === 'running') return;
    
    try {
      if (!this.ctx) {
        this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        this.masterGain = this.ctx.createGain();
        this.masterGain.connect(this.ctx.destination);
        this.isInitialized = true;
      }
      
      if (this.ctx.state === 'suspended') {
        await this.ctx.resume();
      }
      
      this.updateMasterVolume();
    } catch (e) {
      console.warn("AudioContext failed to initialize or resume", e);
    }
  }

  public toggleMute() {
    this.isMuted = !this.isMuted;
    this.updateMasterVolume();
    return this.isMuted;
  }

  private updateMasterVolume() {
    if (this.masterGain && this.ctx) {
      // Increased master volume from 0.45 to 0.85 for a more prominent soundscape
      this.masterGain.gain.setTargetAtTime(this.isMuted ? 0 : 0.85, this.ctx.currentTime, 0.1);
    }
  }

  public async playClick() {
    await this.init();
    if (this.isMuted || !this.ctx || !this.masterGain || this.ctx.state !== 'running') return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(400, this.ctx.currentTime + 0.04);
    gain.gain.setValueAtTime(0.05, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.04);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.04);
  }

  public async playShutter() {
    await this.init();
    if (this.isMuted || !this.ctx || !this.masterGain || this.ctx.state !== 'running') return;
    const now = this.ctx.currentTime;
    
    const createClick = (startTime: number, v: number) => {
      const bufferSize = this.ctx!.sampleRate * 0.05;
      const buffer = this.ctx!.createBuffer(1, bufferSize, this.ctx!.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
      const noise = this.ctx!.createBufferSource();
      noise.buffer = buffer;
      const noiseGain = this.ctx!.createGain();
      noiseGain.gain.setValueAtTime(v, startTime);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.04);
      const filter = this.ctx!.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(2000, startTime);
      noise.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(this.masterGain!);
      noise.start(startTime);
    };

    createClick(now, 0.5);
    createClick(now + 0.02, 0.3);

    const osc = this.ctx.createOscillator();
    const oscGain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1200, now);
    osc.frequency.exponentialRampToValueAtTime(100, now + 0.2);
    oscGain.gain.setValueAtTime(0.1, now);
    oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
    osc.connect(oscGain);
    oscGain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.2);
  }

  public async playSuccess() {
    await this.init();
    if (this.isMuted || !this.ctx || !this.masterGain || this.ctx.state !== 'running') return;
    const now = this.ctx.currentTime;
    [440, 880, 1760].forEach((freq, i) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + i * 0.05);
      gain.gain.setValueAtTime(0, now + i * 0.05);
      gain.gain.linearRampToValueAtTime(0.1, now + i * 0.05 + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.05 + 0.3);
      osc.connect(gain);
      gain.connect(this.masterGain!);
      osc.start(now + i * 0.05);
      osc.stop(now + i * 0.05 + 0.4);
    });
  }

  public async playError() {
    await this.init();
    if (this.isMuted || !this.ctx || !this.masterGain || this.ctx.state !== 'running') return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(120, now);
    osc.frequency.linearRampToValueAtTime(40, now + 0.4);
    gain.gain.setValueAtTime(0.15, now);
    gain.gain.linearRampToValueAtTime(0, now + 0.4);
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(300, now);
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    osc.start();
    osc.stop(now + 0.4);
  }

  public async playLevelUp() {
    await this.init();
    if (this.isMuted || !this.ctx || !this.masterGain || this.ctx.state !== 'running') return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(110, now);
    osc.frequency.exponentialRampToValueAtTime(880, now + 1.5);
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.2, now + 0.5);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 2.0);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start();
    osc.stop(now + 2.0);
  }

  private playBeat(time: number, step: number) {
    if (!this.ctx || !this.masterGain || this.ctx.state !== 'running') return;

    // 1. Kick - Heartbeat pulse (Increased from 0.15 to 0.25)
    if (step % 8 === 0 || step % 8 === 1) {
      const isGhost = step % 8 === 1;
      const kick = this.ctx.createOscillator();
      const kickGain = this.ctx.createGain();
      kick.frequency.setValueAtTime(60, time);
      kick.frequency.exponentialRampToValueAtTime(30, time + 0.15);
      kickGain.gain.setValueAtTime(isGhost ? 0.12 : 0.25, time);
      kickGain.gain.exponentialRampToValueAtTime(0.001, time + 0.15);
      
      const lp = this.ctx.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.setValueAtTime(100, time);
      
      kick.connect(lp);
      lp.connect(kickGain);
      kickGain.connect(this.masterGain);
      kick.start(time);
      kick.stop(time + 0.15);
    }

    // 2. High Pings (Increased from 0.02 to 0.06)
    const scale = [261.63, 311.13, 349.23, 392.00, 415.30, 523.25];
    if (step % 4 === 2 && Math.random() > 0.4) {
      const note = scale[Math.floor(Math.random() * scale.length)];
      const ping = this.ctx.createOscillator();
      const pingGain = this.ctx.createGain();
      ping.type = 'sine';
      ping.frequency.setValueAtTime(note * 2, time);
      
      pingGain.gain.setValueAtTime(0, time);
      pingGain.gain.linearRampToValueAtTime(0.06, time + 0.01);
      pingGain.gain.exponentialRampToValueAtTime(0.001, time + 0.8);
      
      ping.connect(pingGain);
      pingGain.connect(this.masterGain);
      ping.start(time);
      ping.stop(time + 0.8);
    }

    // 3. Low Drone (Increased from 0.04 to 0.12)
    const bassNotes = [65.41, 65.41, 61.74, 58.27];
    if (step % 16 === 0) {
      const note = bassNotes[Math.floor(step / 16) % bassNotes.length];
      const drone = this.ctx.createOscillator();
      const droneGain = this.ctx.createGain();
      drone.type = 'sawtooth';
      drone.frequency.setValueAtTime(note, time);
      
      droneGain.gain.setValueAtTime(0, time);
      droneGain.gain.linearRampToValueAtTime(0.12, time + 0.2);
      droneGain.gain.linearRampToValueAtTime(0.12, time + 1.8);
      droneGain.gain.linearRampToValueAtTime(0, time + 2.0);
      
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(150, time);
      filter.Q.setValueAtTime(5, time);
      
      drone.connect(filter);
      filter.connect(droneGain);
      droneGain.connect(this.masterGain);
      drone.start(time);
      drone.stop(time + 2.0);
    }

    // 4. Static texture (Increased from 0.005 to 0.012)
    if (step % 1 === 0) {
      const bufferSize = this.ctx.sampleRate * 0.05;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;
      
      const noiseGain = this.ctx.createGain();
      const noiseFilter = this.ctx.createBiquadFilter();
      noiseFilter.type = 'bandpass';
      noiseFilter.frequency.setValueAtTime(8000, time);
      noiseFilter.Q.setValueAtTime(1, time);
      
      const vol = 0.012 + (Math.sin(step * 0.5) * 0.006);
      noiseGain.gain.setValueAtTime(vol, time);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, time + 0.1);
      
      noise.connect(noiseFilter);
      noiseFilter.connect(noiseGain);
      noiseGain.connect(this.masterGain);
      noise.start(time);
    }
  }

  public async startAmbient() {
    await this.init();
    if (this.sequenceInterval) return;

    const lookAhead = 0.1;
    const stepDuration = 60 / 85 / 2;

    this.sequenceInterval = window.setInterval(async () => {
      if (!this.ctx) return;
      
      if (this.ctx.state === 'suspended') {
        try { await this.ctx.resume(); } catch(e) {}
      }

      if (this.ctx.state === 'running') {
        const now = this.ctx.currentTime;
        this.playBeat(now + lookAhead, this.currentStep);
        this.currentStep = (this.currentStep + 1) % 64;
      }
    }, stepDuration * 1000);
  }

  public stopAmbient() {
    if (this.sequenceInterval) {
      clearInterval(this.sequenceInterval);
      this.sequenceInterval = null;
    }
  }
}

export const sound = new AudioService();