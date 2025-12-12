import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

export const useVoiceAssistant = (language: 'en' | 'hi' | 'kn') => {
  const [isListening, setIsListening] = useState(false);
  const [lastTranscript, setLastTranscript] = useState<string>('');
  const [lastMatchedRoute, setLastMatchedRoute] = useState<string | null>(null);
  const [lastMatchedKeyword, setLastMatchedKeyword] = useState<string | null>(null);
  const [voicesList, setVoicesList] = useState<Array<{name: string; lang: string}>>([]);
  const [hasKnVoice, setHasKnVoice] = useState(false);
  const recognitionRef = useRef<any | null>(null);
  const fallbackTriedRef = useRef<boolean>(false);
  const navigate = useNavigate();

  const langMap: Record<string, string> = {
    en: 'en-US',
    hi: 'hi-IN',
    kn: 'kn-IN'
  };

  // normalize strings for matching: lower-case, remove punctuation, collapse spaces
  const normalize = (s: string) => s
    .toLowerCase()
    .normalize('NFD') // split accents
    .replace(/\p{Diacritic}/gu, '') // remove diacritics
    .replace(/[.,!?;:/\\()\[\]"'`]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  // computed normalized keywords map
  const normalizedKeywordsForRoute = useRef<Map<number, string[]>>();

  const createRecognition = (lang: string) => {
    try {
      if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
        return null;
      }

      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      const instance = new SpeechRecognition();
      instance.continuous = false;
      instance.interimResults = false;
      instance.maxAlternatives = 1;
      instance.lang = lang;

      instance.onstart = () => {
        console.debug('[voice] recognition started');
        setIsListening(true);
      };

      instance.onresult = (event: any) => {
        const transcriptRaw = String(event.results[0][0].transcript || '').trim();
        const transcript = transcriptRaw.toLowerCase();
        console.debug('[voice] result:', transcriptRaw);
        setLastTranscript(transcriptRaw);
        handleVoiceCommand(transcript);
      };

      instance.onend = () => {
        console.debug('[voice] recognition ended');
        setIsListening(false);
      };

      instance.onerror = (event: any) => {
        console.error('[voice] error', event);
        setIsListening(false);
        toast.error('Voice recognition error. Please try again.');
      };

      return instance;
    } catch (err) {
      console.error('Failed to create SpeechRecognition', err);
      return null;
    }
  };

  useEffect(() => {
    // initialize recognizer for the selected language
    const inst = createRecognition(langMap[language] || 'en-US');
    recognitionRef.current = inst;

    return () => {
      try {
        recognitionRef.current && recognitionRef.current.stop && recognitionRef.current.stop();
      } catch (e) {
        // ignore
      }
      recognitionRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [language]);

  const speak = (text: string, lang: 'en' | 'hi' | 'kn') => {
    if (!('speechSynthesis' in window)) return;
    const utterance = new SpeechSynthesisUtterance(text);
    const desiredLangPrefix = (langMap[lang] || 'en-US').split('-')[0].toLowerCase(); // en, hi, kn

    const pickAndSpeak = () => {
      const voices = window.speechSynthesis.getVoices() || [];
      // update voicesList state for UI/debug
      try { setVoicesList(voices.map(v => ({ name: v.name, lang: v.lang }))); } catch (e) {}
      setHasKnVoice(voices.some(v => v.lang && v.lang.toLowerCase().startsWith('kn')));
      // prefer an exact full match (e.g., 'kn-IN'), then prefix match (e.g., 'kn'), then en fallback
      const exactMatch = voices.find(v => v.lang && v.lang.toLowerCase() === (langMap[lang] || 'en-us').toLowerCase());
      const prefixMatch = voices.find(v => v.lang && v.lang.toLowerCase().startsWith(desiredLangPrefix));
      let voice = exactMatch || prefixMatch;

      // If no voice found for requested lang, prefer an English voice as fallback
      if (!voice) {
        voice = voices.find(v => v.lang && v.lang.toLowerCase().startsWith('en')) || voices[0];
      }
      if (voice) utterance.voice = voice;
      utterance.lang = langMap[lang] || 'en-US';
      console.debug('[voice] speaking with voice', voice?.name, voice?.lang, 'text:', text);
      window.speechSynthesis.cancel(); // stop any current speech
      try {
        window.speechSynthesis.speak(utterance);
      } catch (err) {
        console.warn('speechSynthesis.speak failed', err);
      }
    };

    const voices = window.speechSynthesis.getVoices();
    if (voices.length > 0) {
      pickAndSpeak();
    } else {
      // Some browsers load voices asynchronously
      window.speechSynthesis.onvoiceschanged = () => {
        pickAndSpeak();
        window.speechSynthesis.onvoiceschanged = null;
      };
      // Fallback after a short delay
      setTimeout(() => {
        pickAndSpeak();
      }, 300);
    }
  };

  // helper to dump voices (for debug/console)
  const dumpVoicesToConsole = () => {
    if (!('speechSynthesis' in window)) return;
    const voices = window.speechSynthesis.getVoices() || [];
    console.info('[voice] available voices:', voices.map(v => ({ name: v.name, lang: v.lang }))); 
  };

  const routes = [
    {
      path: '/transactions',
      keywords: [
        'transaction', 'transactions', 'recent', 'last',
        // Hindi (native + romanized)
        'लेन-देन', 'ट्रांजैक्शन', 'len den', 'len-den', 'len', 'len den',
        // Kannada (native + romanized)
        'ವಹಿವಾಟು', 'ಟ್ರಾನ್ಸಾಕ್ಷನ್', 'vahivatu', 'vahivaatu'
      ],
      message: { en: 'Showing your transactions', hi: 'आपके लेन-देन दिखा रहे हैं', kn: 'ನಿಮ್ಮ ವಹಿವಾಟುಗಳನ್ನು ತೋರಲಾಗುತ್ತಿದೆ', knRoman: 'nimma vahivaatugalu torisalaaguttide' }
    },
    {
      path: '/auth',
      keywords: ['auth', 'login', 'log in', 'sign in', 'signin', 'sign up', 'signup', 'register', 'logout', 'log out'],
      message: { en: 'Opening authentication', hi: 'लॉगिन पेज खोल रहे हैं', kn: 'ಲಾಗಿನ್ ಪುಟ ತೆರೆಯಲಾಗುತ್ತಿದೆ', knRoman: 'login puga tereye hoguttide' }
    },
    {
      path: '/',
      keywords: [
        'balance', 'account', 'home', 'dashboard', 'index', 'dashboard page',
        // Hindi
        'बैलेंस', 'खाता', 'घर', 'मुख्य', 'मुख्य पृष्ठ', 'mera balance', 'mera khata', 'mera balance kya hai', 'ghar',
        // Kannada
        'ಬ್ಯಾಲೆನ್ಸ್', 'ಖಾತೆ', 'ಮುಖಪುಟ', 'home page', 'nanna balance', 'nanna khate', 'nanna account', 'mukha puta', 'mukhya'
      ],
      message: { en: 'Showing your account balance', hi: 'आपका खाता शेष दिखा रहे हैं', kn: 'ನಿಮ್ಮ ಖಾತೆ ಬ್ಯಾಲೆನ್ಸ್ ತೋರಲಾಗುತ್ತಿದೆ', knRoman: 'nimma khaate balance torisalaaguttide' }
    },
    {
      path: '/send-money',
      keywords: [
        'send', 'transfer', 'pay', 'send money', 'pay money',
        // Hindi
        'भेजें', 'पैसे', 'paise bhejo', 'paise bheje', 'paisa bhejo', 'bhejo', 'bhejna',
        // Kannada
        'ಕಳುಹಿಸಿ', 'ಹಣ', 'kaluhisi', 'kaluhisu', 'hannu', 'hana'
      ],
      message: { en: 'Opening send money', hi: 'पैसे भेजना खोल रहे हैं', kn: 'ಹಣ ಕಳುಹಿಸುವುದನ್ನು ತೆರೆಯಲಾಗುತ್ತಿದೆ', knRoman: 'hana kaluhisuvudannu tereyalaaguttide' }
    },
    {
      path: '/deposit',
      keywords: ['deposit', 'जमा', 'डिपॉजिट', 'jama', 'jama karo', 'jama karna'],
      message: { en: 'Opening deposit', hi: 'जमा खोल रहे हैं', kn: 'ಠೇವಣಿ ತೆರೆಯಲಾಗುತ್ತಿದೆ', knRoman: 'thevani tereyalaaguttide' }
    },
    {
      path: '/withdraw',
      keywords: ['withdraw', 'withdrawal', 'निकाल', 'निकासी', 'nikal', 'nikalo', 'nikalna'],
      message: { en: 'Opening withdrawal', hi: 'निकासी खोल रहे हैं', kn: 'ಹಿಂಪಡೆಯುವಿಕೆ ತೆರೆಯಲಾಗುತ್ತಿದೆ', knRoman: 'hinpadeyuvike tereyalaaguttide' }
    },
    {
      path: '/cheque',
      keywords: ['cheque', 'check', 'चेक', 'चेक जमा', 'cheque jama', 'chek', 'ಚೆಕ್'],
      message: { en: 'Opening cheque deposit', hi: 'चेक जमा खोल रहे हैं', kn: 'ಚೆಕ್ ನ್ನು ತೆರೆಯಲಾಗುತ್ತಿದೆ', knRoman: 'checkannu tereyalaaguttide' }
    },
    {
      path: '/',
      keywords: ['loan', 'loans', 'loan eligibility', 'loan amount', 'loan ki yogita', 'loan yogya', 'loan ki yogyata'],
      message: { en: 'Showing eligible loans', hi: 'लोन की योग्यता दिखा रहे हैं', kn: 'ಲೋನ್ ಯೋಗ್ಯತೆ ತೋರಿಸಲಾಗುತ್ತಿದೆ', knRoman: 'loan yogyate torisalaaguttide' }
    }
  ];

  // prepare normalized keywords once
  useEffect(() => {
    const map = new Map<number, string[]>();
    routes.forEach((r, idx) => {
      map.set(idx, (r.keywords || []).map(k => normalize(String(k))));
    });
    normalizedKeywordsForRoute.current = map;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const findRouteForCommand = (command: string) => {
    const norm = normalize(command);
    if (!normalizedKeywordsForRoute.current) return null;
    for (let i = 0; i < routes.length; i++) {
      const kws = normalizedKeywordsForRoute.current.get(i) || [];
      for (const kw of kws) {
        if (!kw) continue;
        // match whole words or substrings
        const wordBoundaryRegex = new RegExp('\\\b' + kw.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&') + '\\b');
        if (wordBoundaryRegex.test(norm) || norm.includes(kw)) {
          setLastMatchedRoute(routes[i].path);
          setLastMatchedKeyword(kw);
          return routes[i];
        }
      }
    }
    setLastMatchedRoute(null);
    setLastMatchedKeyword(null);
    return null;
  };

  // Parse a spoken transfer command to extract amount, recipient name and account number when possible
  const parseSendCommand = (command: string) => {
    const result: { amount?: number; amountRaw?: string; recipientName?: string; recipientAccount?: string } = {};
    const raw = command;

    // amount: look for digits with optional decimal and optional rupees/rs/₹
    const amountMatch = raw.match(/(\d{1,3}(?:[,\s\d]*\d)?(?:[\.\,]\d+)?)(?=\s*(?:rupees|rs|₹|dollar|usd|₹)?)/i);
    if (amountMatch) {
      const a = amountMatch[1].replace(/[,\s]/g, '').replace(',', '.');
      const parsed = parseFloat(a);
      if (!isNaN(parsed)) {
        result.amount = parsed;
        result.amountRaw = amountMatch[1];
      }
    }

    // account: look for 'account' followed by digits
    const accMatch = raw.match(/account(?: number| no\.?| no)?\s*(\d{4,})/i);
    if (accMatch) {
      result.recipientAccount = accMatch[1];
    } else {
      // try to find a long digit sequence
      const longDigits = raw.match(/\b(\d{6,})\b/);
      if (longDigits) result.recipientAccount = longDigits[1];
    }

    // recipient name: 'to NAME' until account/number or end
    const toMatch = raw.match(/(?:to|for|pay to|bhejo|kaluhisi)\s+([\p{L}\s.'-]{2,100})(?=\s*(?:account|\d|$))/iu);
    if (toMatch) {
      result.recipientName = toMatch[1].trim();
    } else {
      // fallback: words after 'to' simpler
      const toSimple = raw.match(/(?:to|for)\s+([A-Za-z\s]{2,50})/i);
      if (toSimple) result.recipientName = toSimple[1].trim();
    }

    return result;
  };

  const handleVoiceCommand = (command: string) => {
    if (!command || typeof command !== 'string') return;
    console.log('Voice command:', command);

    const normalized = command.toLowerCase();

    // handle common verbs like "go to" or "open" by removing them
    const stripped = normalized.replace(/^(please |could you |can you )/i, '').replace(/\b(go to|open|show|show me|take me to|dikhao|dikhavel|dikhai)\b/i, '').trim();

    // try to match stripped text first, then full text
    let route = findRouteForCommand(stripped) || findRouteForCommand(normalized);

    if (route) {
      try {
        // cancel any speaking in progress and navigate
        window.speechSynthesis && window.speechSynthesis.cancel && window.speechSynthesis.cancel();
        // special-case: if this is the send-money route, attempt to parse details and emit an event
        if (route.path === '/send-money') {
          const parsed = parseSendCommand(command);
          // dispatch custom event with parsed details so the page can populate fields and open PIN dialog
          try {
            const ev = new CustomEvent('voice-send-money', { detail: parsed });
            window.dispatchEvent(ev);
          } catch (e) { console.warn('could not dispatch voice-send-money event', e); }
        }
        navigate(route.path);
        // choose message and TTS language carefully for Kannada
        let msgToSpeak = route.message[language] || route.message.en || 'Opening';
        let ttsLang: 'en' | 'hi' | 'kn' = language;
        if (language === 'kn') {
          if (!hasKnVoice) {
            // if no Kannada TTS voice, speak romanized Kannada (if provided) using English TTS for better pronunciation
            msgToSpeak = (route.message as any).knRoman || route.message.en || 'Opening';
            ttsLang = 'en';
          } else {
            msgToSpeak = route.message.kn || route.message.en || 'Opening';
            ttsLang = 'kn';
          }
        }
        // speak after a very short delay so navigation doesn't cutoff the utterance
        setTimeout(() => speak(msgToSpeak, ttsLang), 150);
        // reset matched debug values after acting
        setLastMatchedRoute(route.path);
        setLastMatchedKeyword(null);
      } catch (e) {
        console.error('Navigation error', e);
        toast.error('Unable to navigate.');
      }
    } else {
      // No direct match found. If current language is Kannada, try a quick fallback recognition
      if (language === 'kn' && !fallbackTriedRef.current) {
        // try a one-shot recognition using hi-IN which sometimes better captures romanized Kannada
        fallbackTriedRef.current = true;
        try {
          const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
          if (SpeechRecognition) {
            const temp = new SpeechRecognition();
            temp.continuous = false;
            temp.interimResults = false;
            temp.maxAlternatives = 1;
            temp.lang = 'hi-IN';
            temp.onresult = (ev: any) => {
              const transcript = String(ev.results[0][0].transcript || '').toLowerCase().trim();
              console.debug('[voice] kn-fallback result:', transcript);
              setLastTranscript(transcript);
              const route2 = findRouteForCommand(transcript);
              if (route2) {
                navigate(route2.path);
                // for fallback route speak similarly (if no kn voice, speak romanized via English)
                let msg2 = route2.message[language] || route2.message.en || 'Opening';
                let tts2: 'en' | 'hi' | 'kn' = language;
                if (language === 'kn' && !hasKnVoice) {
                  msg2 = (route2.message as any).knRoman || route2.message.en || 'Opening';
                  tts2 = 'en';
                }
                setTimeout(() => speak(msg2, tts2), 150);
                setLastMatchedRoute(route2.path);
                setLastMatchedKeyword(null);
              } else {
                // speak not recognized (in Kannada)
                if (hasKnVoice) {
                  speak('ಆಜ್ಞೆಯನ್ನು ಗುರುತಿಸಲಾಗಲಿಲ್ಲ. ದಯವಿಟ್ಟು ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ.', 'kn');
                } else {
                  // speak romanized Kannada fallback in English TTS
                  speak('aagnyeyannu gurutisalagilla. dayavittu matte prayatnisiri', 'en');
                }
              }
              try { temp.stop(); } catch (e) {}
            };
            temp.onerror = (e: any) => { console.warn('kn-fallback error', e); try { temp.stop(); } catch (er) {} };
            temp.onend = () => { try { temp.stop(); } catch (e) {} };
            temp.start();
            return; // return so we don't also speak the generic not-recognized text below
          }
        } catch (e) {
          console.warn('kn fallback creation failed', e);
        }
      }
      // localized not-recognized message
      if (language === 'hi') {
        speak('आदेश पहचाना नहीं गया। कृपया फिर से कहें।', language);
      } else if (language === 'kn') {
        speak('ಆಜ್ಞೆಯನ್ನು ಗುರುತಿಸಲಾಗಲಿಲ್ಲ. ದಯವಿಟ್ಟು ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ.', language);
      } else {
        speak('Command not recognized. Please try again.', language);
      }
    }
  };

  const startListening = async () => {
    try {
      // Always create a fresh recognizer with the current language to avoid stale lang settings
      try {
        recognitionRef.current && recognitionRef.current.stop && recognitionRef.current.stop();
      } catch (e) {}
      recognitionRef.current = createRecognition(langMap[language] || 'en-US');

      if (!recognitionRef.current) {
        toast.error('Voice recognition not supported in this browser');
        setIsListening(false);
        return;
      }

      // start recognizer
      setIsListening(true);
      recognitionRef.current.start();
    } catch (err) {
      console.error('startListening error', err);
      toast.error('Could not start voice recognition');
      setIsListening(false);
    }
  };

  const stopListening = () => {
    try {
      recognitionRef.current && recognitionRef.current.stop && recognitionRef.current.stop();
    } catch (e) {
      console.warn('stop error', e);
    }
    setIsListening(false);
  };

  return { isListening, startListening, stopListening, lastTranscript, lastMatchedRoute, lastMatchedKeyword, voicesList, hasKnVoice, dumpVoicesToConsole };
};

