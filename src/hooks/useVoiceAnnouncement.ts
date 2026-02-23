import { useCallback, useRef } from 'react';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export function useVoiceAnnouncement() {
  const isAnnouncingRef = useRef(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const speak = useCallback(async (
    text: string,
    language: 'telugu' | 'english'
  ): Promise<void> => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/tts/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, language }),
      });

      if (!response.ok) {
        throw new Error(`TTS API error: ${response.status}`);
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);

      return new Promise((resolve, reject) => {
        const audio = new Audio(audioUrl);
        audioRef.current = audio;

        audio.onended = () => {
          URL.revokeObjectURL(audioUrl);
          audioRef.current = null;
          resolve();
        };

        audio.onerror = (error) => {
          URL.revokeObjectURL(audioUrl);
          audioRef.current = null;
          reject(error);
        };

        audio.play().catch((error) => {
          URL.revokeObjectURL(audioUrl);
          audioRef.current = null;
          reject(error);
        });
      });
    } catch (error) {
      console.error('TTS error:', error);
      throw error;
    }
  }, []);

  const delay = (ms: number): Promise<void> => {
    return new Promise(resolve => setTimeout(resolve, ms));
  };

  const stopAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
      audioRef.current = null;
    }
    isAnnouncingRef.current = false;
  }, []);

  const announcePatientCall = useCallback(async (
    opNumber: string,
    patientName: string,
    roomNumber: string = '1'
  ): Promise<boolean> => {
    // Prevent concurrent announcements - REJECT so caller knows voice didn't play
    if (isAnnouncingRef.current) {
      console.log('[TTS] Announcement already in progress, skipping...');
      throw new Error('ANNOUNCEMENT_SKIPPED');
    }

    isAnnouncingRef.current = true;
    console.log('[TTS] Starting announcement for:', opNumber, patientName);

    const teluguText = `ఓపీ నంబర్ ${opNumber}, పేరు ${patientName}, దయచేసి రూమ్ నెంబర్ ${roomNumber} కి వెళ్లండి.`;
    const englishText = `OP number ${opNumber}, name ${patientName}, please proceed to room number ${roomNumber}.`;

    try {
      await speak(teluguText, 'telugu');
      await delay(2500);
      await speak(englishText, 'english');
      await delay(2500);
      await speak(teluguText, 'telugu');
      await delay(2500);
      await speak(englishText, 'english');
      console.log('[TTS] Announcement completed successfully');
      return true;  // Voice actually played
    } catch (error) {
      console.error('[TTS] Announcement error:', error);
      throw error;  // Re-throw so caller knows voice failed
    } finally {
      isAnnouncingRef.current = false;
    }
  }, [speak]);

  const announceLabCall = useCallback(async (
    opNumber: string,
    patientName: string
  ): Promise<void> => {
    if (isAnnouncingRef.current) {
      console.log('[TTS] Announcement already in progress, skipping...');
      return;
    }

    isAnnouncingRef.current = true;

    const teluguText = `ఓపీ నంబర్ ${opNumber}, పేరు ${patientName}, దయచేసి ల్యాబ్ కి వెళ్లండి.`;
    const englishText = `OP number ${opNumber}, name ${patientName}, please proceed to the lab.`;

    try {
      await speak(teluguText, 'telugu');
      await delay(2500);
      await speak(englishText, 'english');
      await delay(2500);
      await speak(teluguText, 'telugu');
      await delay(2500);
      await speak(englishText, 'english');
    } catch (error) {
      console.error('[TTS] Lab announcement error:', error);
    } finally {
      isAnnouncingRef.current = false;
    }
  }, [speak]);

  const announcePharmacyCall = useCallback(async (
    opNumber: string,
    patientName: string
  ): Promise<void> => {
    if (isAnnouncingRef.current) {
      console.log('[TTS] Announcement already in progress, skipping...');
      return;
    }

    isAnnouncingRef.current = true;

    const teluguText = `ఓపీ నంబర్ ${opNumber}, పేరు ${patientName}, దయచేసి ఫార్మసీ కి వెళ్లండి.`;
    const englishText = `OP number ${opNumber}, name ${patientName}, please proceed to the pharmacy.`;

    try {
      await speak(teluguText, 'telugu');
      await delay(2500);
      await speak(englishText, 'english');
      await delay(2500);
      await speak(teluguText, 'telugu');
      await delay(2500);
      await speak(englishText, 'english');
    } catch (error) {
      console.error('[TTS] Pharmacy announcement error:', error);
    } finally {
      isAnnouncingRef.current = false;
    }
  }, [speak]);

  return {
    speak,
    announcePatientCall,
    announceLabCall,
    announcePharmacyCall,
    stopAudio,
    isAnnouncing: isAnnouncingRef.current,
    teluguVoiceAvailable: true,
    englishVoiceAvailable: true,
    teluguVoiceName: 'Google Cloud TTS (te-IN)',
    englishVoiceName: 'Google Cloud TTS (en-IN)',
  };
}
