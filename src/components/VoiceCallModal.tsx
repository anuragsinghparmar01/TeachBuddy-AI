import React, { useState, useEffect, useRef } from 'react';
import { 
  PhoneOff, 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  Send, 
  Sparkles, 
  Globe, 
  Bot, 
  User as UserIcon,
  MessageSquare,
  RefreshCw,
  Zap,
  HelpCircle,
  Radio,
  ChevronDown
} from 'lucide-react';
import type { UserProfile, VoiceGender, VoiceCallMessage, IndianLanguageCode } from '../types';
import { INDIAN_LANGUAGES } from '../types';
import { audioService } from '../services/audioService';
import { aiService } from '../services/aiService';

interface VoiceCallModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile;
  onUpdateUser: (updated: Partial<UserProfile>) => void;
  onOpenPremiumModal: () => void;
  initialTopic?: string;
}

export const VoiceCallModal: React.FC<VoiceCallModalProps> = ({
  isOpen,
  onClose,
  user,
  onUpdateUser,
  initialTopic,
}) => {
  const [callDuration, setCallDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [voiceGender, setVoiceGender] = useState<VoiceGender>(user.selectedVoice || 'female');
  const [selectedLanguage, setSelectedLanguage] = useState<IndianLanguageCode>(user.preferredLanguage || 'hi-IN');
  const [isAiSpeaking, setIsAiSpeaking] = useState(false);
  const [isListeningMic, setIsListeningMic] = useState(false);
  const [inputText, setInputText] = useState('');
  const [showTranscript, setShowTranscript] = useState(true);
  const [messages, setMessages] = useState<VoiceCallMessage[]>([]);
  const [isThinking, setIsThinking] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState('');
  const [showLangDropdown, setShowLangDropdown] = useState(false);
  const transcriptEndRef = useRef<HTMLDivElement>(null);

  const currentLangObj = INDIAN_LANGUAGES.find(l => l.code === selectedLanguage) || INDIAN_LANGUAGES[0];

  // Quick Indian academic prompts with icons
  const quickPrompts = [
    { label: "Explain simply", prompt: "Explain this topic simply with a daily life example" },
    { label: "Ask me a question", prompt: "Ask me a tricky question to test my understanding" },
    { label: "Core Formulas", prompt: "What are the most important formulas and rules for this?" },
    { label: "Exam Strategy", prompt: "How do I solve questions on this in exam without making mistakes?" },
  ];

  // Call duration timer
  useEffect(() => {
    let interval: any;
    if (isOpen) {
      audioService.playSound('ring');
      interval = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    } else {
      setCallDuration(0);
      audioService.stopSpeaking();
      audioService.stopListening();
      setIsListeningMic(false);
    }
    return () => clearInterval(interval);
  }, [isOpen]);

  // Initial welcome greeting when call connects
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const buddyName = voiceGender === 'female' ? 'Aditi' : 'Rishi';
      
      let welcomeText = '';
      const name = user.name || 'दोस्त';
      const engName = user.name || 'Scholar';

      switch (selectedLanguage) {
        case 'hi-IN':
          welcomeText = initialTopic
            ? `नमस्ते ${name}! मैं ${buddyName} हूँ, आपकी TeachBuddy AI। चलिए "${initialTopic}" समझना शुरू करते हैं! आपका पहला सवाल क्या है?`
            : `नमस्ते ${name}! मैं ${buddyName} हूँ, आपकी TeachBuddy AI मेंटर। आज हम कौन सा विषय या पाठ पढ़ना शुरू करें?`;
          break;
        case 'hi-mix':
        case 'hi-Latn':
          welcomeText = initialTopic
            ? `Hello ${engName}! Main ${buddyName} hoon, aapka TeachBuddy AI mentor. Chaliye "${initialTopic}" seekhna shuru karte hain! Aapka pehla question kya hai?`
            : `Hello ${engName}! Main ${buddyName} hoon, aapka TeachBuddy AI mentor. Aaj hum kaun sa chapter ya topic revise karein?`;
          break;
        case 'bn-IN':
          welcomeText = initialTopic
            ? `নমস্কার ${engName}! আমি ${buddyName}, আপনার TeachBuddy AI শিক্ষক। চলুন "${initialTopic}" শেখা শুরু করি! আপনার প্রথম প্রশ্ন কী?`
            : `নমস্কার ${engName}! আমি ${buddyName}, আপনার TeachBuddy AI শিক্ষক। আজ আমরা কোন বিষয়টি শিখবো?`;
          break;
        case 'te-IN':
          welcomeText = initialTopic
            ? `నమస్కారం ${engName}! నేను ${buddyName}, మీ TeachBuddy AI గురువుని. మనం "${initialTopic}" నేర్చుకుందాం! మీ మొదటి ప్రశ్న ఏమిటి?`
            : `నమస్కారం ${engName}! నేను ${buddyName}, మీ TeachBuddy AI గురువుని. ఈరోజు మనం ఏ అంశం నేర్చుకుందాం?`;
          break;
        case 'mr-IN':
          welcomeText = initialTopic
            ? `नमस्कार ${engName}! मी ${buddyName}, तुमचा TeachBuddy AI शिक्षक. चला "${initialTopic}" शिकूया! तुमचा पहिला प्रश्न काय आहे?`
            : `नमस्कार ${engName}! मी ${buddyName}, तुमचा TeachBuddy AI शिक्षक. आज आपण कोणता धडा शिकूया?`;
          break;
        case 'ta-IN':
          welcomeText = initialTopic
            ? `வணக்கம் ${engName}! நான் ${buddyName}, உங்கள் TeachBuddy AI ஆசிரியர். "${initialTopic}" பற்றி படிக்க தயாரா? உங்கள் முதல் கேள்வி என்ன?`
            : `வணக்கம் ${engName}! நான் ${buddyName}, உங்கள் TeachBuddy நேரலை AI ஆசிரியர். இன்று நாம் எந்த பாடத்தைப் படிக்கலாம்?`;
          break;
        case 'gu-IN':
          welcomeText = initialTopic
            ? `નમસ્તે ${engName}! હું ${buddyName} છું, તમારો TeachBuddy AI શિક્ષક. ચાલો "${initialTopic}" શીખવાનું શરૂ કરીએ! તમારો પહેલો પ્રશ્ન શું છે?`
            : `નમસ્તે ${engName}! હું ${buddyName} છું, તમારો TeachBuddy AI શિક્ષક. આજે આપણે કયો વિષય શીખીશું?`;
          break;
        case 'kn-IN':
          welcomeText = initialTopic
            ? `ನಮಸ್ಕಾರ ${engName}! ನಾನು ${buddyName}, ನಿಮ್ಮ TeachBuddy AI ಶಿಕ್ಷಕ. ಬನ್ನಿ "${initialTopic}" ಕಲಿಯೋಣ! ನಿಮ್ಮ ಮೊದಲ ಪ್ರಶ್ನೆ ಏನು?`
            : `ನಮಸ್ಕಾರ ${engName}! ನಾನು ${buddyName}, ನಿಮ್ಮ TeachBuddy ಲೈವ್ AI ಶಿಕ್ಷಕ. ಇಂದು ನಾವು ಯಾವ ವಿಷಯವನ್ನು ಕಲಿಯೋಣ?`;
          break;
        case 'ml-IN':
          welcomeText = initialTopic
            ? `നമസ്കാരം ${engName}! ഞാൻ ${buddyName}, നിങ്ങളുടെ TeachBuddy AI അധ്യാപകൻ. "${initialTopic}" പഠിക്കാൻ തയ്യാറാണോ? ആദ്യത്തെ ചോദ്യം എന്താണ്?`
            : `നമസ്കാരം ${engName}! ഞാൻ ${buddyName}, നിങ്ങളുടെ TeachBuddy ലൈവ് AI അധ്യാപകൻ. ഇന്ന് നമുക്ക് എന്താണ് പഠിക്കേണ്ടത്?`;
          break;
        case 'pa-IN':
          welcomeText = initialTopic
            ? `ਸਤਿ ਸ਼੍ਰੀ ਅਕਾਲ ${engName}! ਮੈਂ ${buddyName} ਹਾਂ, ਤੁਹਾਡਾ TeachBuddy AI ਗੁਰੂ। ਆਓ "${initialTopic}" ਸਿੱਖੀਏ! ਤੁਹਾਡਾ ਪਹਿਲਾ ਸਵਾਲ ਕੀ ਹੈ?`
            : `ਸਤਿ ਸ਼੍ਰੀ ਅਕਾਲ ${engName}! ਮੈਂ ${buddyName} ਹਾਂ, ਤੁਹਾਡਾ TeachBuddy ਲਾਈਵ AI ਗੁਰੂ। ਅੱਜ ਅਸੀਂ ਕਿਹੜਾ ਵਿਸ਼ਾ ਪੜ੍ਹਾਂਗੇ?`;
          break;
        case 'or-IN':
          welcomeText = initialTopic
            ? `ନମସ୍କାର ${engName}! ମୁଁ ${buddyName}, ଆପଣଙ୍କର TeachBuddy AI ଶିକ୍ଷକ। ଚାଲନ୍ତୁ "${initialTopic}" ପଢିବା! ପ୍ରଥମ ପ୍ରଶ୍ନ କଣ?`
            : `ନମସ୍କାର ${engName}! ମୁଁ ${buddyName}, ଆପଣଙ୍କର TeachBuddy ଲାଇଭ୍ AI ଶିକ୍ଷକ। ଆଜି ଆମେ କେଉଁ ବିଷୟ ପଢିବା?`;
          break;
        case 'ur-IN':
          welcomeText = initialTopic
            ? `السلام علیکم ${engName}! میں ${buddyName} ہوں، آپ کا TeachBuddy AI استاد۔ آئیے "${initialTopic}" پڑھنا شروع کریں۔ آپ کا پہلا سوال کیا ہے؟`
            : `السلام علیکم ${engName}! میں ${buddyName} ہوں، آپ کا TeachBuddy لائیو AI استاد۔ آج ہم کس موضوع پر بات کریں گے؟`;
          break;
        default:
          welcomeText = initialTopic
            ? `Namaste ${engName}! I am ${buddyName}, your TeachBuddy AI study tutor. Ready to master "${initialTopic}" together? What's your first question?`
            : `Namaste ${engName}! I am ${buddyName}, your 24/7 AI tutor. I'm live on the line to explain any topic, solve problems, and quiz you. What shall we learn today?`;
      }

      const welcomeMsg: VoiceCallMessage = {
        id: `msg_${Date.now()}`,
        sender: 'buddy',
        text: welcomeText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages([welcomeMsg]);

      // Speak greeting in Indian language & accent
      if (isSpeakerOn) {
        audioService.speak(
          welcomeText,
          voiceGender,
          user.voiceSpeed || 1.0,
          user.voicePitch || 1.0,
          selectedLanguage,
          () => setIsAiSpeaking(true),
          () => {
            setIsAiSpeaking(false);
            // Automatically start listening after speaking if not muted
            if (!isMuted) {
              startListeningLoop();
            }
          }
        );
      }
    }
  }, [isOpen, voiceGender, initialTopic, selectedLanguage]);

  // Auto scroll transcript
  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isThinking, interimTranscript]);

  // Format seconds to mm:ss
  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Start continuous mic listening loop
  const startListeningLoop = () => {
    if (isMuted) return;

    audioService.stopListening();
    setIsListeningMic(true);

    const started = audioService.startListening(
      (transcript, isFinal) => {
        setInterimTranscript(transcript);
        if (isFinal && transcript.trim().length > 1) {
          setIsListeningMic(false);
          setInterimTranscript('');
          handleSendStudentMessage(transcript);
        }
      },
      (error) => {
        console.warn('Speech recognition warning:', error);
        setIsListeningMic(false);
      },
      selectedLanguage
    );

    if (!started) {
      setIsListeningMic(false);
    }
  };

  const handleToggleMic = () => {
    if (isListeningMic) {
      audioService.stopListening();
      setIsListeningMic(false);
    } else {
      audioService.stopSpeaking();
      setIsAiSpeaking(false);
      startListeningLoop();
    }
  };

  // Send student message and generate accurate response + follow-up question
  const handleSendStudentMessage = async (textToSend: string) => {
    const query = textToSend.trim();
    if (!query) return;

    audioService.stopSpeaking();
    setIsAiSpeaking(false);

    const userMsg: VoiceCallMessage = {
      id: `msg_u_${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const updatedHistory = [...messages, userMsg];
    setMessages(updatedHistory);
    setInputText('');
    setIsThinking(true);
    audioService.playSound('pop');

    try {
      const response = await aiService.voiceCallResponse(
        query,
        updatedHistory,
        voiceGender,
        user.ageGroup,
        user.name,
        selectedLanguage
      );

      const aiMsg: VoiceCallMessage = {
        id: `msg_ai_${Date.now()}`,
        sender: 'buddy',
        text: response,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, aiMsg]);
      setIsThinking(false);

      if (isSpeakerOn) {
        audioService.speak(
          response,
          voiceGender,
          user.voiceSpeed || 1.0,
          user.voicePitch || 1.0,
          selectedLanguage,
          () => setIsAiSpeaking(true),
          () => {
            setIsAiSpeaking(false);
            // Re-open mic for natural conversational turn-taking
            if (!isMuted) {
              setTimeout(() => {
                startListeningLoop();
              }, 400);
            }
          }
        );
      }
    } catch (e) {
      setIsThinking(false);
    }
  };

  const handleLanguageSelect = (langCode: IndianLanguageCode) => {
    setSelectedLanguage(langCode);
    setShowLangDropdown(false);
    onUpdateUser({ preferredLanguage: langCode });
    audioService.playSound('click');
    audioService.stopSpeaking();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-xl animate-fadeIn font-outfit">
      <div className="w-full max-w-4xl h-[92vh] max-h-[850px] bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden text-white relative">
        
        {/* Top Header Bar */}
        <div className="px-4 sm:px-6 py-3.5 bg-slate-950/70 border-b border-slate-800 flex items-center justify-between gap-2 z-20">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="relative">
              <div className={`w-3 h-3 rounded-full ${isAiSpeaking ? 'bg-emerald-400 animate-ping' : 'bg-indigo-400'}`} />
              <div className="absolute inset-0 w-3 h-3 rounded-full bg-emerald-500" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-sm sm:text-base tracking-tight text-white flex items-center gap-1.5">
                  <Bot className="w-4 h-4 text-indigo-400" />
                  TeachBuddy Live • {voiceGender === 'female' ? 'Aditi (Mentor)' : 'Rishi (Mentor)'}
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                  {formatTime(callDuration)}
                </span>
              </div>
              <p className="text-[10px] text-slate-400 hidden sm:block">
                Indian Accent AI Tutor • Gemini Voice Mode
              </p>
            </div>
          </div>

          {/* Controls: Indian Language & Accent Selector */}
          <div className="flex items-center gap-2">
            {/* Language Switcher Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowLangDropdown(!showLangDropdown)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-bold text-white transition"
              >
                <span>{currentLangObj.flag}</span>
                <span className="hidden sm:inline">{currentLangObj.name}</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {showLangDropdown && (
                <div className="absolute right-0 mt-2 w-56 max-h-64 overflow-y-auto bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-1.5 z-50">
                  <div className="px-2 py-1 text-[10px] uppercase font-bold text-slate-400">
                    Indian Languages
                  </div>
                  {INDIAN_LANGUAGES.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => handleLanguageSelect(lang.code)}
                      className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition ${
                        selectedLanguage === lang.code
                          ? 'bg-indigo-600 text-white font-bold'
                          : 'text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span>{lang.flag}</span>
                        <span>{lang.name}</span>
                      </div>
                      <span className="text-[11px] opacity-75">{lang.nativeName}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Gender Switch */}
            <div className="flex bg-slate-800/80 p-0.5 rounded-xl border border-slate-700">
              <button
                onClick={() => setVoiceGender('female')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition ${
                  voiceGender === 'female' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400'
                }`}
              >
                👩 Aditi
              </button>
              <button
                onClick={() => setVoiceGender('male')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition ${
                  voiceGender === 'male' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400'
                }`}
              >
                👨 Rishi
              </button>
            </div>

            {/* End Call Button */}
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white shadow-md shadow-rose-600/30 transition active:scale-95"
              title="End Voice Call"
            >
              <PhoneOff className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Main Body: Dual-Pane Gemini Orb + Live Transcript */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-12 overflow-hidden relative">
          
          {/* Left / Center: Gemini Fluid Audio Visualizer Aura */}
          <div className="md:col-span-5 flex flex-col items-center justify-center p-6 border-b md:border-b-0 md:border-r border-slate-800 bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900 relative">
            
            {/* Pulsing Gemini Aura */}
            <div className="relative flex items-center justify-center w-64 h-64 sm:w-72 sm:h-72">
              {/* Outer Radiant Waves */}
              <div className={`absolute inset-0 rounded-full bg-gradient-to-tr from-indigo-500/20 via-purple-500/20 to-teal-400/20 blur-2xl transition-all duration-700 ${
                isAiSpeaking ? 'scale-125 opacity-100 animate-pulse' : isListeningMic ? 'scale-110 opacity-75' : 'scale-90 opacity-40'
              }`} />

              {/* Orbital Light Rings */}
              <div 
                className="absolute w-56 h-56 rounded-full border border-indigo-500/30 animate-spin" 
                style={{ animationDuration: isAiSpeaking ? '4s' : '12s' }}
              />
              <div 
                className="absolute w-44 h-44 rounded-full border border-teal-400/30 animate-spin" 
                style={{ animationDuration: isAiSpeaking ? '3s' : '9s', animationDirection: 'reverse' }}
              />

              {/* Center Fluid Orb */}
              <div className={`w-32 h-32 sm:w-36 sm:h-36 rounded-full p-1 bg-gradient-to-tr from-indigo-500 via-purple-500 to-emerald-400 shadow-2xl transition-transform duration-500 ${
                isAiSpeaking ? 'scale-110 shadow-indigo-500/60' : isListeningMic ? 'scale-105 shadow-emerald-500/50' : 'scale-95 shadow-indigo-500/30'
              }`}>
                <div className="w-full h-full rounded-full bg-slate-950 flex flex-col items-center justify-center relative overflow-hidden">
                  {/* Dynamic Sound Wave Bars */}
                  <div className="flex items-center gap-1">
                    {[12, 24, 38, 50, 32, 20, 14].map((h, i) => (
                      <span
                        key={i}
                        className={`w-1.5 rounded-full transition-all duration-150 ${
                          isAiSpeaking
                            ? 'bg-gradient-to-t from-indigo-400 to-teal-300'
                            : isListeningMic
                            ? 'bg-gradient-to-t from-emerald-400 to-teal-200'
                            : 'bg-slate-700'
                        }`}
                        style={{
                          height: isAiSpeaking
                            ? `${Math.max(10, (h * (0.8 + Math.random() * 0.7)))}px`
                            : isListeningMic
                            ? `${Math.max(8, (h * 0.6 * (0.8 + Math.random() * 0.5)))}px`
                            : '8px',
                        }}
                      />
                    ))}
                  </div>

                  <span className="text-[10px] font-bold text-slate-400 mt-2 uppercase tracking-wider">
                    {isAiSpeaking ? 'Speaking' : isListeningMic ? 'Listening...' : isThinking ? 'Thinking...' : 'Ready'}
                  </span>
                </div>
              </div>
            </div>

            {/* Status & Live Mic Feedback */}
            <div className="mt-4 text-center space-y-1 z-10">
              <div className="flex items-center justify-center gap-2 text-xs font-semibold text-slate-300">
                {isListeningMic ? (
                  <span className="flex items-center gap-1.5 text-emerald-400">
                    <Radio className="w-4 h-4 animate-ping" />
                    Listening in {currentLangObj.name} ({currentLangObj.nativeName})
                  </span>
                ) : isAiSpeaking ? (
                  <span className="flex items-center gap-1.5 text-indigo-400">
                    <Volume2 className="w-4 h-4 animate-bounce" />
                    Answering with Active Check Question
                  </span>
                ) : isThinking ? (
                  <span className="flex items-center gap-1.5 text-amber-400">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Formulating accurate answer...
                  </span>
                ) : (
                  <span className="text-slate-400">
                    Tap mic below or speak freely
                  </span>
                )}
              </div>

              {interimTranscript && (
                <div className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-xs font-medium text-slate-200 animate-fadeIn max-w-xs">
                  "{interimTranscript}"
                </div>
              )}
            </div>

            {/* Quick Action Pills */}
            <div className="mt-4 flex flex-wrap justify-center gap-1.5 max-w-sm">
              {quickPrompts.map((qp, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendStudentMessage(qp.prompt)}
                  className="px-2.5 py-1 rounded-full bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-[11px] font-medium text-slate-300 hover:text-white transition active:scale-95"
                >
                  ⚡ {qp.label}
                </button>
              ))}
            </div>
          </div>

          {/* Right: Real-time Transcript & Chat Interaction */}
          <div className="md:col-span-7 flex flex-col bg-slate-900/60 overflow-hidden">
            {/* Transcript Top Bar */}
            <div className="px-4 py-2.5 bg-slate-950/40 border-b border-slate-800/80 flex items-center justify-between text-xs">
              <span className="font-bold text-slate-400 flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-indigo-400" />
                Live Conversation Log
              </span>
              <span className="text-[10px] text-emerald-400 font-medium">
                Accurate Gemini 2.5 Flash Reasoning
              </span>
            </div>

            {/* Transcript Messages List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`flex items-start gap-2.5 ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {m.sender === 'buddy' && (
                    <div className="w-7 h-7 rounded-xl bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center shrink-0 text-indigo-300 text-xs mt-0.5">
                      <Bot className="w-3.5 h-3.5" />
                    </div>
                  )}

                  <div className={`max-w-[85%] rounded-2xl p-3.5 text-xs sm:text-sm leading-relaxed shadow-sm ${
                    m.sender === 'user'
                      ? 'bg-indigo-600 text-white rounded-tr-none'
                      : 'bg-slate-800/90 border border-slate-700/80 text-slate-100 rounded-tl-none'
                  }`}>
                    <p className="font-medium whitespace-pre-wrap">{m.text}</p>
                    <span className="text-[9px] opacity-60 mt-1 block text-right">
                      {m.timestamp}
                    </span>
                  </div>

                  {m.sender === 'user' && (
                    <div className="w-7 h-7 rounded-xl bg-slate-700 flex items-center justify-center shrink-0 text-slate-300 text-xs mt-0.5">
                      <UserIcon className="w-3.5 h-3.5" />
                    </div>
                  )}
                </div>
              ))}

              {isThinking && (
                <div className="flex items-start gap-2.5">
                  <div className="w-7 h-7 rounded-xl bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center shrink-0 text-indigo-300 text-xs">
                    <Sparkles className="w-3.5 h-3.5 animate-spin" />
                  </div>
                  <div className="p-3 rounded-2xl rounded-tl-none bg-slate-800/60 border border-slate-700 text-xs text-slate-400 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce" />
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce delay-100" />
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce delay-200" />
                    <span>Preparing accurate explanation & active test question...</span>
                  </div>
                </div>
              )}

              <div ref={transcriptEndRef} />
            </div>

            {/* Bottom Input Area */}
            <div className="p-3 sm:p-4 bg-slate-950/70 border-t border-slate-800 space-y-2">
              <div className="flex items-center gap-2">
                {/* Voice Mic Toggle */}
                <button
                  onClick={handleToggleMic}
                  className={`p-3 rounded-2xl transition flex items-center justify-center shrink-0 shadow-md ${
                    isListeningMic
                      ? 'bg-emerald-500 hover:bg-emerald-400 text-white animate-pulse'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                  }`}
                  title={isListeningMic ? 'Stop listening' : 'Start speaking'}
                >
                  {isListeningMic ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5 text-slate-400" />}
                </button>

                {/* Text input for quiet study */}
                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSendStudentMessage(inputText);
                    }}
                    placeholder={`Ask in ${currentLangObj.name} (${currentLangObj.nativeName})...`}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs sm:text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* Send Button */}
                <button
                  onClick={() => handleSendStudentMessage(inputText)}
                  disabled={!inputText.trim()}
                  className="p-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white shadow-md shadow-indigo-600/30 transition shrink-0 cursor-pointer"
                  title="Send message"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-500 px-1">
                <span className="flex items-center gap-1">
                  <Zap className="w-3 h-3 text-amber-400" />
                  Hands-free Indian voice conversation enabled
                </span>
                <span>Language: {currentLangObj.name}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
