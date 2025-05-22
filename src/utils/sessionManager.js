// utils/sessionManager.js

class SessionManager {
  constructor() {
    this.eventListeners = new Set();
    this.initCrossTabSync();
  }

  initCrossTabSync() {
    // Listen for storage events for cross-tab communication
    window.addEventListener('storage', this.handleStorageEvent.bind(this));
    
    // Request session data from other tabs when this tab loads
    this.requestSessionData();
  }

  handleStorageEvent(e) {
    if (e.key === 'requestSessionData') {
      // Another tab is requesting session data
      this.shareSessionData();
    } else if (e.key === 'shareSessionData' && e.newValue) {
      // Receiving session data from another tab
      this.receiveSessionData(e.newValue);
    } else if (e.key === 'sessionDataCleared') {
      // Another tab cleared session data (logout)
      this.clearLocalSessionData();
      this.notifySessionChange('logout');
    }
  }

  requestSessionData() {
    // Request session data from other tabs
    localStorage.setItem('requestSessionData', Date.now().toString());
    localStorage.removeItem('requestSessionData');
  }

  shareSessionData() {
    const token = sessionStorage.getItem('token');
    if (token) {
      const sessionData = {
        token: sessionStorage.getItem('token'),
        clientId: sessionStorage.getItem('clientId'),
        firstName: sessionStorage.getItem('firstName'),
        lastName: sessionStorage.getItem('lastName'),
        timestamp: Date.now()
      };
      
      localStorage.setItem('shareSessionData', JSON.stringify(sessionData));
      localStorage.removeItem('shareSessionData');
    }
  }

  receiveSessionData(dataString) {
    try {
      const sessionData = JSON.parse(dataString);
      if (sessionData.token && !sessionStorage.getItem('token')) {
        sessionStorage.setItem('token', sessionData.token);
        sessionStorage.setItem('clientId', sessionData.clientId);
        sessionStorage.setItem('firstName', sessionData.firstName);
        sessionStorage.setItem('lastName', sessionData.lastName);
        
        this.notifySessionChange('login');
      }
    } catch (error) {
      console.error('Error parsing session data:', error);
    }
  }

  // Session storage methods
  setItem(key, value) {
    sessionStorage.setItem(key, value);
  }

  getItem(key) {
    return sessionStorage.getItem(key);
  }

  removeItem(key) {
    sessionStorage.removeItem(key);
  }

  // Set session data (typically after login)
  setSessionData(data) {
    sessionStorage.setItem('token', data.token);
    sessionStorage.setItem('clientId', data.clientId);
    sessionStorage.setItem('firstName', data.firstName);
    sessionStorage.setItem('lastName', data.lastName);
  }

  // Get all session data
  getSessionData() {
    return {
      token: sessionStorage.getItem('token'),
      clientId: sessionStorage.getItem('clientId'),
      firstName: sessionStorage.getItem('firstName'),
      lastName: sessionStorage.getItem('lastName')
    };
  }

  // Check if user is logged in
  isLoggedIn() {
    return !!sessionStorage.getItem('token');
  }

  // Clear session data and notify other tabs
  clearSession() {
    this.clearLocalSessionData();
    
    // Notify other tabs that session was cleared
    localStorage.setItem('sessionDataCleared', Date.now().toString());
    localStorage.removeItem('sessionDataCleared');
    
    this.notifySessionChange('logout');
  }

  clearLocalSessionData() {
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('clientId');
    sessionStorage.removeItem('firstName');
    sessionStorage.removeItem('lastName');
  }

  // Event system for components to listen to session changes
  addEventListener(callback) {
    this.eventListeners.add(callback);
    return () => this.eventListeners.delete(callback);
  }

  notifySessionChange(type) {
    this.eventListeners.forEach(callback => {
      try {
        callback(type, this.getSessionData());
      } catch (error) {
        console.error('Error in session change callback:', error);
      }
    });
  }

  // Cleanup method
  destroy() {
    window.removeEventListener('storage', this.handleStorageEvent.bind(this));
    this.eventListeners.clear();
  }
}

// Create and export a singleton instance
const sessionManager = new SessionManager();
export default sessionManager;