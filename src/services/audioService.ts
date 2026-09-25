import type { VoiceGender, IndianLanguageCode } from '../types';

class AudioService {
  private synth: SpeechSynthesis | null = null;
  private recognition: any = null;
  private isSpeaking = false;
  private audioContext: AudioContext | null = null;
  
  // Ambient Sound nodes
  private ambientSource: AudioNode | null = null;
  private ambientGain: GainNode | null = null;
  private activeAmbientType: 'off' | 'lofi' | 'rain' | 'library' | 'binaural' = 'off';

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.synth = window.speechSynthesis;
      if (this.synth) {
        // Pre-warm voices
        this.synth.getVoices();
        if ('onvoiceschanged' in this.synth) {
          this.synth.onvoiceschanged = () => {
            this.getVoices();
          };
        }
      }
    }
    
    // Initialize Web Speech Recognition
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        this.recognition = new SpeechRecognition();
        this.recognition.continuous = false;
        this.recognition.interimResults = true;
        this.recognition.lang = 'hi-IN';
      }
    }
  }

  private getAudioContext(): AudioContext | null {
    if (!this.audioContext && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.audioContext = new AudioCtx();
      }
    }
    if (this.audioContext && this.audioContext.state === 'suspended') {
      this.audioContext.resume().catch(() => {});
    }
    return this.audioContext;
  }

  // Get available voices
  public getVoices(): SpeechSynthesisVoice[] {
    if (!this.synth) return [];
    return this.synth.getVoices();
  }

  // Format text so it sounds natural, conversational, and translates math into spoken words
  private preprocessNaturalSpeech(text: string): string {
    return text
      // Convert common math equations into spoken English/words
      .replace(/\^2\b/g, ' squared')
      .replace(/\^3\b/g, ' cubed')
      .replace(/(\d+)\s*\+\s*(\d+)/g, '$1 plus $2')
      .replace(/(\d+)\s*-\s*(\d+)/g, '$1 minus $2')
      .replace(/(\d+)\s*\*\s*(\d+)/g, '$1 times $2')
      .replace(/(\d+)\s*\/\s*(\d+)/g, '$1 divided by $2')
      .replace(/=/g, ' equals ')
      .replace(/!=/g, ' is not equal to ')
      .replace(/<=/g, ' is less than or equal to ')
      .replace(/>=/g, ' is greater than or equal to ')
      .replace(/%/g, ' percent ')
      .replace(/π/g, ' pi ')
      // Clean markdown tags, hashtags, asterisks
      .replace(/[*#_`~\[\]\(\)\{\}]/g, ' ')
      .replace(/https?:\/\/\S+/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  // Speak with human-like tone, gender selection, speed & pitch in all Indian languages & accents
  public speak(
    text: string, 
    gender: VoiceGender = 'female',
    speed: number = 1.0,
    pitch: number = 1.0,
    languageCode: IndianLanguageCode = 'hi-IN',
    onStart?: () => void,
    onEnd?: () => void
  ): Promise<void> {
    return new Promise((resolve) => {
      if (!this.synth) {
        onStart?.();
        setTimeout(() => {
          onEnd?.();
          resolve();
        }, Math.min(3000, text.length * 50));
        return;
      }

      this.stopSpeaking();

      const naturalText = this.preprocessNaturalSpeech(text);

      if (!naturalText) {
        resolve();
        return;
      }

      const utterance = new SpeechSynthesisUtterance(naturalText);
      // Natural cadence tuning
      utterance.rate = Math.max(0.8, Math.min(1.2, speed * 0.98));
      utterance.pitch = gender === 'female' ? Math.max(1.0, pitch * 1.04) : Math.max(0.85, pitch * 0.94);

      // Map Hinglish or dialect codes to standard BCP 47
      const effectiveLang = (languageCode as string) === 'hi-mix' || (languageCode as string) === 'hi-Latn' ? 'hi-IN' : languageCode;
      utterance.lang = effectiveLang;

      const voices = this.getVoices();
      const langPrefix = effectiveLang.split('-')[0].toLowerCase();

      // Language search terms for regional Indian languages
      const langNameKeywords: Record<string, string[]> = {
        'ta': ['tamil', 'தமிழ்'],
        'te': ['telugu', 'తెలుగు'],
        'bn': ['bengali', 'bangla', 'বাংলা'],
        'mr': ['marathi', 'मराठी'],
        'gu': ['gujarati', 'ગુજરાતી'],
        'kn': ['kannada', 'ಕನ್ನಡ'],
        'ml': ['malayalam', 'മലയാളം'],
        'pa': ['punjabi', 'ਪੰਜਾਬੀ'],
        'ur': ['urdu', 'اردو'],
        'hi': ['hindi', 'हिन्दी', 'devanagari'],
        'or': ['odia', 'oriya', 'ଓଡ଼ିଆ'],
      };

      const keywords = langNameKeywords[langPrefix] || [];

      // Priority 1: Match voice by language prefix or language keyword
      let matchedVoice = voices.find(v => {
        const vLang = v.lang.toLowerCase();
        const vName = v.name.toLowerCase();
        const matchesLang = vLang.startsWith(langPrefix) || vLang.replace('_', '-').startsWith(effectiveLang.toLowerCase());
        const matchesKeyword = keywords.some(k => vName.includes(k) || vLang.includes(k));
        
        if (matchesLang || matchesKeyword) {
          if (gender === 'female') {
            return !/male|rishi|david|george|mark/i.test(vName);
          } else {
            return !/female|samantha|zira|aditi|neerja|kavya|victoria/i.test(vName);
          }
        }
        return false;
      });

      // Priority 2: Any voice matching the specific Indian language
      if (!matchedVoice && langPrefix !== 'en') {
        matchedVoice = voices.find(v => {
          const vLang = v.lang.toLowerCase();
          const vName = v.name.toLowerCase();
          return vLang.startsWith(langPrefix) || keywords.some(k => vName.includes(k) || vLang.includes(k));
        });
      }

      // Priority 3: For English, match Indian English or preferred gender
      if (!matchedVoice && langPrefix === 'en') {
        matchedVoice = voices.find(v => 
          (v.lang.includes('IN') || /india|hindi|rishi|aditi|veena|neerja/i.test(v.name)) &&
          (gender === 'female' ? !/male|rishi/i.test(v.name) : !/female|aditi|neerja/i.test(v.name))
        ) || voices.find(v => 
          v.lang.startsWith('en') && 
          (gender === 'female' ? !/male|rishi/i.test(v.name) : !/female/i.test(v.name))
        );
      }

      // CRITICAL: Only assign matchedVoice if it actually belongs to the target language!
      // If no regional voice exists locally, leave utterance.voice unset so the browser/OS can use its default multilingual engine.
      if (matchedVoice) {
        utterance.voice = matchedVoice;
      }

      utterance.onstart = () => {
        this.isSpeaking = true;
        onStart?.();
      };

      utterance.onend = () => {
        this.isSpeaking = false;
        onEnd?.();
        resolve();
      };

      utterance.onerror = (e) => {
        console.warn('SpeechSynthesis notice:', e);
        this.isSpeaking = false;
        onEnd?.();
        resolve();
      };

      try {
        this.synth.speak(utterance);
      } catch (err) {
        console.warn('Speech synthesis speak error:', err);
        onEnd?.();
        resolve();
      }
    });
  }

  // Stop active speech
  public stopSpeaking() {
    if (this.synth) {
      this.synth.cancel();
      this.isSpeaking = false;
    }
  }

  public getSpeakingState(): boolean {
    return this.isSpeaking;
  }

  // Speech Recognition listener
  public startListening(
    onResult: (transcript: string, isFinal: boolean) => void,
    onError?: (error: any) => void,
    languageCode: IndianLanguageCode = 'hi-IN'
  ): boolean {
    if (!this.recognition) {
      onError?.(new Error('Speech recognition is not supported in this browser.'));
      return false;
    }

    try {
      const effectiveLang = (languageCode as string) === 'hi-mix' || (languageCode as string) === 'hi-Latn' ? 'hi-IN' : languageCode;
      this.recognition.lang = effectiveLang;
      this.recognition.onresult = (event: any) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }

        if (finalTranscript) {
          onResult(finalTranscript, true);
        } else if (interimTranscript) {
          onResult(interimTranscript, false);
        }
      };

      this.recognition.onerror = (event: any) => {
        onError?.(event.error);
      };

      this.recognition.start();
      return true;
    } catch (e) {
      onError?.(e);
      return false;
    }
  }

  public stopListening() {
    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch (e) {}
    }
  }

  // ================= AMBIENT FOCUS AUDIO ENGINE (Web Audio API) =================
  public playAmbientSound(type: 'lofi' | 'rain' | 'library' | 'binaural', volume = 0.25) {
    this.startAmbientSound(type, volume);
  }

  public startAmbientSound(type: 'lofi' | 'rain' | 'library' | 'binaural', volume = 0.25) {
    this.stopAmbientSound();
    const ctx = this.getAudioContext();
    if (!ctx) return;

    this.activeAmbientType = type;
    const gainNode = ctx.createGain();
    gainNode.gain.setValueAtTime(Math.max(0.01, Math.min(0.8, volume)), ctx.currentTime);
    gainNode.connect(ctx.destination);
    this.ambientGain = gainNode;

    if (type === 'rain' || type === 'library') {
      // Synthesize pink/brown noise for cozy rain or library murmur
      const bufferSize = 2 * ctx.sampleRate;
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      let lastOut = 0.0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        // Brown noise low-pass integration
        output[i] = (lastOut + 0.02 * white) / 1.02;
        lastOut = output[i];
        output[i] *= 2.5; // Gain compensation
      }

      const whiteNoise = ctx.createBufferSource();
      whiteNoise.buffer = noiseBuffer;
      whiteNoise.loop = true;

      // Filter to simulate rain or warm library room
      const filter = ctx.createBiquadFilter();
      filter.type = type === 'rain' ? 'lowpass' : 'bandpass';
      filter.frequency.setValueAtTime(type === 'rain' ? 650 : 400, ctx.currentTime);

      whiteNoise.connect(filter);
      filter.connect(gainNode);
      whiteNoise.start();
      this.ambientSource = whiteNoise;
    } else if (type === 'binaural') {
      // 40Hz Gamma Focus Binaural Wave: 200Hz in left ear, 240Hz in right ear
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(216, ctx.currentTime);

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(320, ctx.currentTime);

      osc.connect(filter);
      filter.connect(gainNode);
      osc.start();
      this.ambientSource = osc;
    } else if (type === 'lofi') {
      // Warm relaxing 432Hz ambient chord drone
      const osc1 = ctx.createOscillator();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(108, ctx.currentTime); // A2

      const osc2 = ctx.createOscillator();
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(162, ctx.currentTime); // E3

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(280, ctx.currentTime);

      osc1.connect(filter);
      osc2.connect(filter);
      filter.connect(gainNode);

      osc1.start();
      osc2.start();
      this.ambientSource = osc1;
    }
  }

  public stopAmbientSound() {
    if (this.ambientSource) {
      try {
        (this.ambientSource as any).stop?.();
        this.ambientSource.disconnect();
      } catch {}
      this.ambientSource = null;
    }
    if (this.ambientGain) {
      try {
        this.ambientGain.disconnect();
      } catch {}
      this.ambientGain = null;
    }
    this.activeAmbientType = 'off';
  }

  public setAmbientVolume(volume: number) {
    if (this.ambientGain && this.audioContext) {
      this.ambientGain.gain.setValueAtTime(Math.max(0.01, Math.min(0.8, volume)), this.audioContext.currentTime);
    }
  }

  public getActiveAmbientType() {
    return this.activeAmbientType;
  }

  // ================= UI & GAME SOUND EFFECTS (DISABLED PER USER INSTRUCTION) =================
  public playSound(_type?: 'success' | 'click' | 'levelup' | 'ring' | 'whoosh' | 'pop' | 'correct' | 'wrong' | 'fanfare' | 'cardFlip' | 'tick') {
    // Sound effects removed as requested
    return;
  }

  public playDing() {
    // Sound effects removed as requested
    return;
  }
}

export const audioService = new AudioService();
