import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

export default function VoiceBot({ currentPlan = 'Starter', onBlockTrigger }) {
  const { t, i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [messages, setMessages] = useState([
    { role: 'assistant', content: t('voicebot.placeholder') || "Hello! I am Agni, your Vastu and interior design assistant. Ask me to rearrange rooms or suggest layouts!" }
  ]);
  
  const chatRef = useRef(null);
  const recognitionRef = useRef(null);

  // Auto-scroll chat
  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

  const startListening = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert(t('voicebot.notSupported') || "Speech recognition is not supported in your browser.");
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      
      const langMap = { 'en': 'en-IN', 'hi': 'hi-IN', 'ta': 'ta-IN', 'te': 'te-IN' };
      recognition.lang = langMap[i18n.language] || 'en-IN';

      recognition.onresult = (event) => {
        let currentTranscript = '';
        for (let i = 0; i < event.results.length; i++) {
          currentTranscript += event.results[i][0].transcript;
        }
        setTranscript(currentTranscript);
      };

      recognition.onerror = (event) => {
        console.error("Speech recognition error:", event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
        setTranscript(prevTranscript => {
          if (prevTranscript.trim()) {
            sendMessage(prevTranscript.trim());
          }
          return '';
        });
      };

      recognition.start();
      recognitionRef.current = recognition;
      setIsListening(true);
      setTranscript('');
    } catch (e) {
      console.error("Microphone access error:", e);
      setIsListening(false);
      alert("Error accessing microphone. Please check browser permissions.");
    }
  };

  const toggleListening = () => {
    if (isListening) {
      if (recognitionRef.current) recognitionRef.current.stop();
      setIsListening(false);
      // onend will automatically handle the send
    } else {
      startListening();
    }
  };

  const sendMessage = async (text) => {
    if (!text.trim()) return;
    
    const newMsgs = [...messages, { role: 'user', content: text }];
    setMessages(newMsgs);
    setIsThinking(true);
    
    try {
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/chat/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: text,
          language: i18n.language
        })
      });
      const data = await res.json();
      
      if (data.success) {
        setMessages([...newMsgs, { role: 'assistant', content: data.response }]);
        speakText(data.response);
      }
    } catch (err) {
      console.error(err);
      setMessages([...newMsgs, { role: 'assistant', content: t('common.error') || "I couldn't process that command. Please try again." }]);
    } finally {
      setIsThinking(false);
    }
  };

  const speakText = (text) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      const langMap = { 'en': 'en-IN', 'hi': 'hi-IN', 'ta': 'ta-IN', 'te': 'te-IN' };
      utterance.lang = langMap[i18n.language] || 'en-IN';
      window.speechSynthesis.speak(utterance);
    }
  };

  if (!isOpen) {
    return (
      /* Circular Glowing Green Floating Button matching screenshots */
      <button 
        onClick={() => {
          if (currentPlan !== 'Enterprise') {
            if (onBlockTrigger) onBlockTrigger();
          } else {
            setIsOpen(true);
          }
        }}
        className="animate-fade-in"
        style={{
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #00b894, #00a870)',
          border: 'none',
          boxShadow: '0 8px 24px rgba(0, 168, 112, 0.4), 0 0 15px rgba(0, 168, 112, 0.6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
          zIndex: 999
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'scale(1.08) translateY(-2px)';
          e.currentTarget.style.boxShadow = '0 12px 30px rgba(0, 168, 112, 0.5), 0 0 22px rgba(0, 168, 112, 0.8)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1) translateY(0)';
          e.currentTarget.style.boxShadow = '0 8px 24px rgba(0, 168, 112, 0.4), 0 0 15px rgba(0, 168, 112, 0.6)';
        }}
        title="Open Chatbot"
      >
        {/* Sleek White Chat Bubble SVG Icon */}
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
        </svg>
      </button>
    );
  }

  return (
    /* Floating Glassmorphic Chat Panel */
    <div className="card flex flex-col animate-fade-in" 
         style={{ 
           width: '320px', 
           height: '380px', 
           minHeight: '380px', 
           background: 'rgba(10, 11, 18, 0.9)', 
           backdropFilter: 'blur(20px)',
           border: '1px solid rgba(236, 72, 153, 0.25)', 
           boxShadow: '0 12px 40px rgba(0,0,0,0.8), 0 0 15px rgba(236, 72, 153, 0.1)',
           padding: '1.25rem',
           zIndex: 999
         }}>
      
      {/* Header */}
      <div className="flex justify-between items-center pb-2 border-bottom" style={{ borderBottom: '1px solid var(--color-border-subtle)', marginBottom: '0.75rem' }}>
        <h3 className="font-bold text-sm flex items-center gap-1.5 text-white">
          <span className="text-fire">🎙️</span> Agni Assistant
        </h3>
        <button 
          onClick={() => setIsOpen(false)}
          className="btn btn-ghost btn-sm"
          style={{ padding: '0.15rem 0.45rem', fontSize: '0.7rem', borderRadius: '4px' }}
        >
          ✕
        </button>
      </div>
      
      {/* Messages */}
      <div 
        ref={chatRef}
        className="flex-1 scroll-panel flex flex-col gap-2 mb-3" 
        style={{ overflowY: 'auto', paddingRight: '4px' }}
      >
        {messages.map((msg, i) => (
          <div 
            key={i} 
            className={`p-2.5 rounded-lg text-xs max-w-[85%]`}
            style={{ 
              background: msg.role === 'user' ? 'rgba(255,107,53,0.15)' : 'var(--color-surface-2)',
              color: 'white',
              alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
              border: msg.role === 'user' ? '1px solid rgba(255,107,53,0.3)' : '1px solid var(--color-border-subtle)'
            }}
          >
            {msg.content}
          </div>
        ))}
        {transcript && (
          <div className="p-2.5 rounded-lg text-xs max-w-[85%] self-end opacity-70" 
               style={{ background: 'rgba(255,107,53,0.1)', alignSelf: 'flex-end', color: 'white' }}>
            {transcript} <span className="animate-pulse">...</span>
          </div>
        )}
      </div>
      
      {/* Voice Controls & Input */}
      <div className="mt-auto pt-2 flex flex-col items-center gap-2" style={{ borderTop: '1px solid var(--color-border-subtle)' }}>
        <button 
          className={`btn ${isListening ? 'btn-primary animate-pulse' : 'btn-secondary'}`}
          onClick={toggleListening}
          style={{
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            padding: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1rem',
            background: isListening ? '#ff5252' : 'rgba(255,107,53,0.1)',
            border: '1px solid rgba(255,107,53,0.3)',
            boxShadow: isListening ? '0 0 10px #ff5252' : 'none'
          }}
        >
          {isListening ? '🛑' : '🎤'}
        </button>
        <span className="text-[10px] text-secondary font-medium">
          {isListening ? t('voicebot.speaking') || "Listening..." : t('voicebot.tapToSpeak') || "Tap to speak design instructions"}
        </span>
      </div>
    </div>
  );
}
