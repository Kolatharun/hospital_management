import { useCallback, useRef, useEffect, useState } from 'react';

// Telugu female voice announcement hook
// Ensures announcements are ONLY in Telugu with female voice preference
export function useVoiceAnnouncement() {
  const speakingRef = useRef(false);
  const [teluguVoice, setTeluguVoice] = useState<SpeechSynthesisVoice | null>(null);
  const [voicesLoaded, setVoicesLoaded] = useState(false);

  // Initialize and find Telugu female voice on mount
  useEffect(() => {
    if (!('speechSynthesis' in window)) {
      console.error('Speech synthesis not supported in this browser');
      return;
    }

    const findTeluguFemaleVoice = () => {
      const voices = window.speechSynthesis.getVoices();

      if (voices.length === 0) {
        return null;
      }

      // Log ALL available voices for debugging
      console.log('=== ALL AVAILABLE VOICES ===');
      voices.forEach((v, i) => {
        console.log(`${i}: ${v.name} | lang: ${v.lang} | local: ${v.localService}`);
      });

      // Filter for Telugu voices only (te-IN, te, or contains "telugu")
      const teluguVoices = voices.filter((v) => {
        const lang = (v.lang || '').toLowerCase();
        const name = (v.name || '').toLowerCase();
        return (
          lang === 'te-in' ||
          lang === 'te' ||
          lang.startsWith('te-') ||
          name.includes('telugu') ||
          name.includes('తెలుగు')
        );
      });

      console.log('=== TELUGU VOICES FOUND ===');
      teluguVoices.forEach((v, i) => {
        console.log(`${i}: ${v.name} | lang: ${v.lang}`);
      });

      if (teluguVoices.length === 0) {
        console.error('NO TELUGU VOICES AVAILABLE! Please install Telugu language pack.');
        console.error('On Windows: Settings > Time & Language > Language > Add Telugu');
        console.error('On Chrome: Telugu Google voice should be available by default');
        return null;
      }

      // Female voice indicators - prioritized list
      const femaleIndicators = [
        'female',
        'woman',
        'shruti',    // Microsoft Telugu female voice
        'priya',
        'lakshmi',
        'anusha',
        'swathi',
        'kavitha',
        'divya',
        'anjali',
        'sunitha',
      ];

      // Priority 1: Explicit female Telugu voice
      let selected = teluguVoices.find((v) => {
        const name = (v.name || '').toLowerCase();
        return femaleIndicators.some(indicator => name.includes(indicator));
      });

      if (selected) {
        console.log('✓ Selected FEMALE Telugu voice:', selected.name);
        return selected;
      }

      // Priority 2: Google Telugu voice (usually female-sounding)
      selected = teluguVoices.find((v) => {
        const name = (v.name || '').toLowerCase();
        return name.includes('google');
      });

      if (selected) {
        console.log('✓ Selected Google Telugu voice:', selected.name);
        return selected;
      }

      // Priority 3: Microsoft Telugu voice (check for Shruti specifically)
      selected = teluguVoices.find((v) => {
        const name = (v.name || '').toLowerCase();
        return name.includes('microsoft') && name.includes('shruti');
      });

      if (selected) {
        console.log('✓ Selected Microsoft Shruti Telugu voice:', selected.name);
        return selected;
      }

      // Priority 4: Any Microsoft Telugu voice
      selected = teluguVoices.find((v) => {
        const name = (v.name || '').toLowerCase();
        return name.includes('microsoft');
      });

      if (selected) {
        console.log('✓ Selected Microsoft Telugu voice:', selected.name);
        return selected;
      }

      // Fallback: First available Telugu voice
      console.log('✓ Using first available Telugu voice:', teluguVoices[0].name);
      return teluguVoices[0];
    };

    // Try to get voices immediately
    let voice = findTeluguFemaleVoice();
    if (voice) {
      setTeluguVoice(voice);
      setVoicesLoaded(true);
    }

    // Also listen for voices changed event (Chrome loads voices async)
    const handleVoicesChanged = () => {
      const foundVoice = findTeluguFemaleVoice();
      if (foundVoice) {
        setTeluguVoice(foundVoice);
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
          const foundVoice = findTeluguFemaleVoice();
          if (foundVoice) {
            setTeluguVoice(foundVoice);
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

  // Core speak function - ONLY speaks in Telugu
  const speak = useCallback((text: string): Promise<void> => {
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

        // CRITICAL: Set Telugu language
        utterance.lang = 'te-IN';

        // Natural female voice settings
        utterance.rate = 0.85;   // Slightly slower for clarity
        utterance.pitch = 1.15;  // Slightly higher for female voice
        utterance.volume = 1.0;

        // Set the Telugu voice if available
        if (teluguVoice) {
          utterance.voice = teluguVoice;
          console.log('Speaking with voice:', teluguVoice.name);
        } else {
          // Try to find voice one more time
          const voices = window.speechSynthesis.getVoices();
          const fallbackVoice = voices.find(v => {
            const lang = (v.lang || '').toLowerCase();
            const name = (v.name || '').toLowerCase();
            return lang.startsWith('te') || name.includes('telugu') || name.includes('తెలుగు');
          });

          if (fallbackVoice) {
            utterance.voice = fallbackVoice;
            console.log('Speaking with fallback voice:', fallbackVoice.name);
          } else {
            console.error('WARNING: No Telugu voice found! Speech may be in English.');
            // Still attempt with te-IN lang setting
          }
        }

        utterance.onstart = () => {
          speakingRef.current = true;
          console.log('Started speaking:', text.substring(0, 50) + '...');
        };

        utterance.onend = () => {
          speakingRef.current = false;
          console.log('Finished speaking');
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
  }, [teluguVoice]);

  // Announce patient call - FULLY IN TELUGU
  // Format: "టోకెన్ నెంబర్ X, [పేరు] గారు, రూమ్ నెంబర్ Y కి వెళ్లండి"
  const announcePatientCall = useCallback(async (
    tokenNumber: string,
    patientName: string,
    roomNumber: string = '1'
  ) => {
    // Extract numeric part from token (e.g., "OP-5" -> "5")
    const tokenNum = tokenNumber.replace(/\D/g, '') || tokenNumber;

    // Fully Telugu announcement
    const teluguText = `టోకెన్ నెంబర్ ${tokenNum}, ${patientName} గారు, రూమ్ నెంబర్ ${roomNumber} కి వెళ్లండి`;

    console.log('Announcing (Telugu):', teluguText);

    // First announcement
    await speak(teluguText);

    // Pause between announcements
    await new Promise(resolve => setTimeout(resolve, 2500));

    // Repeat announcement
    await speak(teluguText);

  }, [speak]);

  // Announce lab call - FULLY IN TELUGU
  const announceLabCall = useCallback(async (tokenNumber: string, patientName: string) => {
    const tokenNum = tokenNumber.replace(/\D/g, '') || tokenNumber;
    const teluguText = `ల్యాబ్ టోకెన్ నెంబర్ ${tokenNum}, ${patientName} గారు, ల్యాబ్ కి వెళ్లండి`;

    console.log('Announcing Lab (Telugu):', teluguText);

    await speak(teluguText);
    await new Promise(resolve => setTimeout(resolve, 2500));
    await speak(teluguText);

  }, [speak]);

  // Announce pharmacy call - FULLY IN TELUGU
  const announcePharmacyCall = useCallback(async (tokenNumber: string, patientName: string) => {
    const tokenNum = tokenNumber.replace(/\D/g, '') || tokenNumber;
    const teluguText = `ఫార్మసీ టోకెన్ నెంబర్ ${tokenNum}, ${patientName} గారు, ఫార్మసీ కి వెళ్లండి`;

    console.log('Announcing Pharmacy (Telugu):', teluguText);

    await speak(teluguText);
    await new Promise(resolve => setTimeout(resolve, 2500));
    await speak(teluguText);

  }, [speak]);

  return {
    speak,
    announcePatientCall,
    announceLabCall,
    announcePharmacyCall,
    isSpeaking: speakingRef.current,
    teluguVoiceAvailable: !!teluguVoice,
    teluguVoiceName: teluguVoice?.name || 'Not loaded',
  };
}
