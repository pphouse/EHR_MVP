// Notification sound utility for EHR system
// Based on https://zenn.dev/milmed/articles/03f7f0c2c4e594

class NotificationSound {
  constructor() {
    this.audioContext = null;
    this.enabled = false;
    this.volume = 0.3;
    
    // Initialize audio context
    this.initAudioContext();
  }

  initAudioContext() {
    try {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    } catch (error) {
      console.warn('Audio Context not supported:', error);
      this.enabled = false;
    }
  }

  // Enable/disable notification sounds
  setEnabled(enabled) {
    this.enabled = enabled;
    localStorage.setItem('notificationSoundEnabled', enabled);
  }

  // Set volume level (0.0 to 1.0)
  setVolume(volume) {
    this.volume = Math.max(0, Math.min(1, volume));
    localStorage.setItem('notificationSoundVolume', this.volume);
  }

  // Load settings from localStorage
  loadSettings() {
    const enabled = localStorage.getItem('notificationSoundEnabled');
    const volume = localStorage.getItem('notificationSoundVolume');
    
    if (enabled !== null) {
      this.enabled = enabled === 'true';
    }
    if (volume !== null) {
      this.volume = parseFloat(volume);
    }
  }

  // Generate tone with frequency and duration
  playTone(frequency, duration, type = 'sine') {
    if (!this.enabled || !this.audioContext) return;

    try {
      // Resume audio context if suspended (required for user interaction)
      if (this.audioContext.state === 'suspended') {
        this.audioContext.resume();
      }

      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);

      oscillator.frequency.value = frequency;
      oscillator.type = type;

      gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(this.volume, this.audioContext.currentTime + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);

      oscillator.start(this.audioContext.currentTime);
      oscillator.stop(this.audioContext.currentTime + duration);
    } catch (error) {
      console.warn('Error playing notification sound:', error);
    }
  }

  // Success notification (pleasant ascending tone)
  success() {
    this.playTone(523.25, 0.2); // C5
    setTimeout(() => this.playTone(659.25, 0.2), 100); // E5
    setTimeout(() => this.playTone(783.99, 0.3), 200); // G5
  }

  // Error notification (warning tone)
  error() {
    this.playTone(349.23, 0.3); // F4
    setTimeout(() => this.playTone(293.66, 0.3), 150); // D4
    setTimeout(() => this.playTone(246.94, 0.4), 300); // B3
  }

  // Warning notification (attention tone)
  warning() {
    this.playTone(440, 0.2); // A4
    setTimeout(() => this.playTone(440, 0.2), 300); // A4 again
  }

  // Information notification (gentle tone)
  info() {
    this.playTone(523.25, 0.3); // C5
  }

  // Save notification (quick confirmation)
  save() {
    this.playTone(659.25, 0.15); // E5
    setTimeout(() => this.playTone(783.99, 0.15), 100); // G5
  }

  // Login notification (welcome tone)
  login() {
    this.playTone(440, 0.2); // A4
    setTimeout(() => this.playTone(523.25, 0.2), 100); // C5
    setTimeout(() => this.playTone(659.25, 0.3), 200); // E5
  }

  // Logout notification (goodbye tone)
  logout() {
    this.playTone(659.25, 0.2); // E5
    setTimeout(() => this.playTone(523.25, 0.2), 100); // C5
    setTimeout(() => this.playTone(440, 0.3), 200); // A4
  }

  // New patient registered notification
  newPatient() {
    this.playTone(523.25, 0.15); // C5
    setTimeout(() => this.playTone(659.25, 0.15), 80); // E5
    setTimeout(() => this.playTone(783.99, 0.15), 160); // G5
    setTimeout(() => this.playTone(1046.5, 0.2), 240); // C6
  }

  // New encounter created notification
  newEncounter() {
    this.playTone(440, 0.15); // A4
    setTimeout(() => this.playTone(554.37, 0.15), 80); // C#5
    setTimeout(() => this.playTone(659.25, 0.2), 160); // E5
  }

  // New prescription created notification
  newPrescription() {
    this.playTone(349.23, 0.15); // F4
    setTimeout(() => this.playTone(440, 0.15), 80); // A4
    setTimeout(() => this.playTone(523.25, 0.15), 160); // C5
    setTimeout(() => this.playTone(659.25, 0.2), 240); // E5
  }

  // Data load notification (soft chime)
  dataLoad() {
    this.playTone(523.25, 0.1); // C5
    setTimeout(() => this.playTone(659.25, 0.1), 50); // E5
  }

  // Simple beep (like terminal bell)
  beep() {
    this.playTone(800, 0.1);
  }
}

// Create singleton instance
const notificationSound = new NotificationSound();

// Load saved settings
notificationSound.loadSettings();

export default notificationSound;