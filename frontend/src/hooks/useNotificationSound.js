import { useCallback } from 'react';
import notificationSound from '../utils/notificationSound';

// Custom hook for notification sounds
export const useNotificationSound = () => {
  const playSuccess = useCallback(() => {
    notificationSound.success();
  }, []);

  const playError = useCallback(() => {
    notificationSound.error();
  }, []);

  const playWarning = useCallback(() => {
    notificationSound.warning();
  }, []);

  const playInfo = useCallback(() => {
    notificationSound.info();
  }, []);

  const playSave = useCallback(() => {
    notificationSound.save();
  }, []);

  const playLogin = useCallback(() => {
    notificationSound.login();
  }, []);

  const playLogout = useCallback(() => {
    notificationSound.logout();
  }, []);

  const playNewPatient = useCallback(() => {
    notificationSound.newPatient();
  }, []);

  const playNewEncounter = useCallback(() => {
    notificationSound.newEncounter();
  }, []);

  const playNewPrescription = useCallback(() => {
    notificationSound.newPrescription();
  }, []);

  const playDataLoad = useCallback(() => {
    notificationSound.dataLoad();
  }, []);

  const playBeep = useCallback(() => {
    notificationSound.beep();
  }, []);

  const setEnabled = useCallback((enabled) => {
    notificationSound.setEnabled(enabled);
  }, []);

  const setVolume = useCallback((volume) => {
    notificationSound.setVolume(volume);
  }, []);

  return {
    playSuccess,
    playError,
    playWarning,
    playInfo,
    playSave,
    playLogin,
    playLogout,
    playNewPatient,
    playNewEncounter,
    playNewPrescription,
    playDataLoad,
    playBeep,
    setEnabled,
    setVolume,
  };
};