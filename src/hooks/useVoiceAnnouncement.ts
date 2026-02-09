import { useCallback, useRef } from 'react';

// Enhanced Telugu voice announcement hook with female voice preference
export function useVoiceAnnouncement() {
  const speakingRef = useRef(false);

  const getVoicesSafe = useCallback((): Promise<SpeechSynthesisVoice[]> => {
    if (!('speechSynthesis' in window)) return Promise.resolve([]);

    const existing = window.speechSynthesis.getVoices();
    if (existing.length > 0) return Promise.resolve(existing);

    // Some browsers populate voices asynchronously.
    return new Promise((resolve) => {
      const onVoicesChanged = () => {
        window.speechSynthesis.removeEventListener('voiceschanged', onVoicesChanged);
        resolve(window.speechSynthesis.getVoices());
      };

      window.speechSynthesis.addEventListener('voiceschanged', onVoicesChanged);

      // Fallback: resolve anyway after a short delay.
      setTimeout(() => {
        window.speechSynthesis.removeEventListener('voiceschanged', onVoicesChanged);
        resolve(window.speechSynthesis.getVoices());
      }, 800);
    });
  }, []);

  const speak = useCallback((text: string, lang: string = 'te-IN', preferFemale: boolean = true) => {
    if (!('speechSynthesis' in window)) {
      console.warn('Speech synthesis not supported');
      return Promise.resolve();
    }

    return new Promise<void>((resolve) => {
      // Cancel any ongoing speech
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = lang;
      utterance.rate = 0.85; // Slightly slower for clarity
      utterance.pitch = preferFemale ? 1.2 : 1; // Higher pitch for female voice
      utterance.volume = 1;

      // Select voice asynchronously (voices may load after first call)
      getVoicesSafe().then((voices) => {
        const teluguVoices = voices.filter((v) => v.lang?.toLowerCase().startsWith('te'));

        // Best-effort “female” preference; many browsers don't label gender.
        const femaleCandidate = teluguVoices.find((v) => {
          const name = (v.name || '').toLowerCase();
          return (
            name.includes('female') ||
            name.includes('woman') ||
            name.includes('siri') ||
            name.includes('google')
          );
        });

        if (preferFemale && femaleCandidate) {
          utterance.voice = femaleCandidate;
        } else if (teluguVoices.length > 0) {
          utterance.voice = teluguVoices[0];
        }

        speakingRef.current = true;
        window.speechSynthesis.speak(utterance);
      });

      utterance.onend = () => {
        speakingRef.current = false;
        resolve();
      };

      utterance.onerror = () => {
        speakingRef.current = false;
        resolve();
      };

    });
  }, [getVoicesSafe]);

  // Announce patient call with double announcement and pause
  const announcePatientCall = useCallback(async (
    tokenNumber: string, 
    patientName: string, 
    roomNumber: string = '1'
  ) => {
    // Telugu announcement: "ప్రస్తుతం సేవ [patient name] room no [room]"
    const teluguText = `ప్రస్తుతం సేవ ${patientName} room no ${roomNumber}`;
    
    // First announcement
    await speak(teluguText, 'te-IN', true);
    
    // Wait 2-3 seconds
    await new Promise(resolve => setTimeout(resolve, 2500));
    
    // Second announcement (repeat)
    await speak(teluguText, 'te-IN', true);
    
  }, [speak]);

  // Announce lab queue call with double announcement
  const announceLabCall = useCallback(async (tokenNumber: string, patientName: string) => {
    const teluguText = `ల్యాబ్ టోకెన్ ${tokenNumber}, ${patientName} గారు, ల్యాబ్ కి రావండి`;
    
    // First announcement
    await speak(teluguText, 'te-IN', true);
    
    // Wait 2-3 seconds
    await new Promise(resolve => setTimeout(resolve, 2500));
    
    // Second announcement
    await speak(teluguText, 'te-IN', true);
    
  }, [speak]);

  // Announce pharmacy queue call with double announcement
  const announcePharmacyCall = useCallback(async (tokenNumber: string, patientName: string) => {
    const teluguText = `ఫార్మసీ టోకెన్ ${tokenNumber}, ${patientName} గారు, ఫార్మసీ కి రావండి`;
    
    // First announcement
    await speak(teluguText, 'te-IN', true);
    
    // Wait 2-3 seconds
    await new Promise(resolve => setTimeout(resolve, 2500));
    
    // Second announcement
    await speak(teluguText, 'te-IN', true);
    
  }, [speak]);

  return {
    speak,
    announcePatientCall,
    announceLabCall,
    announcePharmacyCall,
    isSpeaking: speakingRef.current,
  };
}
