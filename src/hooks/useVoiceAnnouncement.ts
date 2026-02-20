import { useCallback, useRef, useEffect, useState } from 'react';

interface VoiceConfig {
  telugu: SpeechSynthesisVoice | null;
  english: SpeechSynthesisVoice | null;
}

// Bilingual female voice announcement hook
// Announces in Telugu and English with female voice preference
export function useVoiceAnnouncement() {
  const speakingRef = useRef(false);
  const [voices, setVoices] = useState<VoiceConfig>({ telugu: null, english: null });
  const [voicesLoaded, setVoicesLoaded] = useState(false);

  // Female voice indicators for voice selection
  const femaleIndicators = [
    'female',
    'woman',
    'zira',      // Microsoft English female
    'susan',     // English female
    'samantha',  // English female
    'victoria',  // English female
    'karen',     // English female (Australian)
    'moira',     // English female (Irish)
    'fiona',     // English female (Scottish)
    'shruti',    // Microsoft Telugu female
    'priya',
    'lakshmi',
    'anusha',
    'swathi',
    'kavitha',
    'divya',
    'anjali',
    'sunitha',
  ];

  // Initialize and find female voices for both languages
  useEffect(() => {
    if (!('speechSynthesis' in window)) {
      console.error('Speech synthesis not supported in this browser');
      return;
    }

    const findFemaleVoice = (
      voiceList: SpeechSynthesisVoice[],
      langPrefix: string,
      langIndicators: string[]
    ): SpeechSynthesisVoice | null => {
      // Filter voices by language
      const filteredVoices = voiceList.filter((v) => {
        const lang = (v.lang || '').toLowerCase();
        const name = (v.name || '').toLowerCase();
        return (
          lang.startsWith(langPrefix) ||
          langIndicators.some(ind => name.includes(ind) || lang.includes(ind))
        );
      });

      if (filteredVoices.length === 0) return null;

      // Priority 1: Explicit female voice
      let selected = filteredVoices.find((v) => {
        const name = (v.name || '').toLowerCase();
        return femaleIndicators.some(indicator => name.includes(indicator));
      });

      if (selected) return selected;

      // Priority 2: Google voice (usually natural/female-sounding)
      selected = filteredVoices.find((v) => {
        const name = (v.name || '').toLowerCase();
        return name.includes('google');
      });

      if (selected) return selected;

      // Priority 3: Microsoft voice
      selected = filteredVoices.find((v) => {
        const name = (v.name || '').toLowerCase();
        return name.includes('microsoft');
      });

      if (selected) return selected;

      // Fallback: First available voice
      return filteredVoices[0];
    };

    const loadVoices = () => {
      const availableVoices = window.speechSynthesis.getVoices();

      if (availableVoices.length === 0) return null;

      // Log all available voices for debugging
      console.log('=== ALL AVAILABLE VOICES ===');
      availableVoices.forEach((v, i) => {
        console.log(`${i}: ${v.name} | lang: ${v.lang} | local: ${v.localService}`);
      });

      // Find Telugu female voice
      const teluguVoice = findFemaleVoice(
        availableVoices,
        'te',
        ['telugu', 'తెలుగు']
      );

      // Find English female voice
      const englishVoice = findFemaleVoice(
        availableVoices,
        'en',
        ['english']
      );

      if (teluguVoice) {
        console.log('✓ Selected Telugu voice:', teluguVoice.name);
      } else {
        console.error('NO TELUGU VOICES AVAILABLE! Please install Telugu language pack.');
      }

      if (englishVoice) {
        console.log('✓ Selected English voice:', englishVoice.name);
      } else {
        console.error('NO ENGLISH VOICES AVAILABLE!');
      }

      return { telugu: teluguVoice, english: englishVoice };
    };

    // Try to get voices immediately
    const loadedVoices = loadVoices();
    if (loadedVoices) {
      setVoices(loadedVoices);
      setVoicesLoaded(true);
    }

    // Listen for voices changed event (Chrome loads voices async)
    const handleVoicesChanged = () => {
      const foundVoices = loadVoices();
      if (foundVoices) {
        setVoices(foundVoices);
        setVoicesLoaded(true);
      }
    };

    window.speechSynthesis.addEventListener('voiceschanged', handleVoicesChanged);

    // Retry a few times as voices may load late
    const retryIntervals = [100, 500, 1000, 2000];
    const timeouts: NodeJS.Timeout[] = [];

    retryIntervals.forEach((delay) => {
      const timeout = setTimeout(() => {
        if (!voicesLoaded) {
          const foundVoices = loadVoices();
          if (foundVoices) {
            setVoices(foundVoices);
            setVoicesLoaded(true);
          }
        }
      }, delay);
      timeouts.push(timeout);
    });

    return () => {
      window.speechSynthesis.removeEventListener('voiceschanged', handleVoicesChanged);
      timeouts.forEach(t => clearTimeout(t));
    };
  }, [voicesLoaded]);

  // Core speak function with language support
  const speak = useCallback((
    text: string,
    language: 'telugu' | 'english'
  ): Promise<void> => {
    return new Promise((resolve) => {
      if (!('speechSynthesis' in window)) {
        console.error('Speech synthesis not supported');
        resolve();
        return;
      }

      // Cancel any ongoing speech first
      window.speechSynthesis.cancel();

      // Small delay after cancel to ensure it's processed
      setTimeout(() => {
        const utterance = new SpeechSynthesisUtterance(text);

        // Set language and voice based on language parameter
        if (language === 'telugu') {
          utterance.lang = 'te-IN';
          if (voices.telugu) {
            utterance.voice = voices.telugu;
          }
        } else {
          utterance.lang = 'en-IN';
          if (voices.english) {
            utterance.voice = voices.english;
          }
        }

        // Female voice settings
        utterance.rate = 0.85;   // Slightly slower for clarity
        utterance.pitch = 1.1;   // Slightly higher for female voice
        utterance.volume = 1.0;

        utterance.onstart = () => {
          speakingRef.current = true;
          console.log(`Started speaking (${language}):`, text.substring(0, 50) + '...');
        };

        utterance.onend = () => {
          speakingRef.current = false;
          console.log(`Finished speaking (${language})`);
          resolve();
        };

        utterance.onerror = (event) => {
          console.error('Speech error:', event.error);
          speakingRef.current = false;
          resolve();
        };

        window.speechSynthesis.speak(utterance);
      }, 100);
    });
  }, [voices]);

  // Delay helper function
  const delay = (ms: number): Promise<void> => {
    return new Promise(resolve => setTimeout(resolve, ms));
  };

  // Announce patient call - Bilingual (Telugu and English)
  // Pattern: Telugu → English → Telugu → English (4 times total)
  // Delay: 2-3 seconds between each announcement
  const announcePatientCall = useCallback(async (
    opNumber: string,
    patientName: string,
    roomNumber: string = '1'
  ) => {
    // Telugu announcement text
    const teluguText = `ఓపీ నంబర్ ${opNumber}, పేరు ${patientName}, దయచేసి రూమ్ నెంబర్ ${roomNumber} కి వెళ్లండి.`;

    // English announcement text
    const englishText = `OP number ${opNumber}, name ${patientName}, please proceed to room number ${roomNumber}.`;

    console.log('Starting bilingual announcement...');
    console.log('Telugu:', teluguText);
    console.log('English:', englishText);

    // Announcement cycle: Telugu → English → Telugu → English
    // 1. First Telugu announcement
    await speak(teluguText, 'telugu');
    await delay(2500);

    // 2. First English announcement
    await speak(englishText, 'english');
    await delay(2500);

    // 3. Second Telugu announcement
    await speak(teluguText, 'telugu');
    await delay(2500);

    // 4. Second English announcement
    await speak(englishText, 'english');

    console.log('Bilingual announcement completed.');
  }, [speak]);

  // Announce lab call - Bilingual
  const announceLabCall = useCallback(async (
    opNumber: string,
    patientName: string
  ) => {
    const teluguText = `ఓపీ నంబర్ ${opNumber}, పేరు ${patientName}, దయచేసి ల్యాబ్ కి వెళ్లండి.`;
    const englishText = `OP number ${opNumber}, name ${patientName}, please proceed to the lab.`;

    console.log('Starting lab announcement...');

    // Telugu → English → Telugu → English
    await speak(teluguText, 'telugu');
    await delay(2500);
    await speak(englishText, 'english');
    await delay(2500);
    await speak(teluguText, 'telugu');
    await delay(2500);
    await speak(englishText, 'english');

    console.log('Lab announcement completed.');
  }, [speak]);

  // Announce pharmacy call - Bilingual
  const announcePharmacyCall = useCallback(async (
    opNumber: string,
    patientName: string
  ) => {
    const teluguText = `ఓపీ నంబర్ ${opNumber}, పేరు ${patientName}, దయచేసి ఫార్మసీ కి వెళ్లండి.`;
    const englishText = `OP number ${opNumber}, name ${patientName}, please proceed to the pharmacy.`;

    console.log('Starting pharmacy announcement...');

    // Telugu → English → Telugu → English
    await speak(teluguText, 'telugu');
    await delay(2500);
    await speak(englishText, 'english');
    await delay(2500);
    await speak(teluguText, 'telugu');
    await delay(2500);
    await speak(englishText, 'english');

    console.log('Pharmacy announcement completed.');
  }, [speak]);

  return {
    speak,
    announcePatientCall,
    announceLabCall,
    announcePharmacyCall,
    isSpeaking: speakingRef.current,
    teluguVoiceAvailable: !!voices.telugu,
    englishVoiceAvailable: !!voices.english,
    teluguVoiceName: voices.telugu?.name || 'Not loaded',
    englishVoiceName: voices.english?.name || 'Not loaded',
  };
}
