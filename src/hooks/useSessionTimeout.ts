import { useEffect } from 'react';
import { isTokenExpired, logout, getTokenExpiry } from '../utils/security';
import { message } from 'antd';

export const useSessionTimeout = () => {
  useEffect(() => {
    const checkSession = () => {
      const token = localStorage.getItem('token');
      
      if (!token) return;
      
      if (isTokenExpired(token)) {
        message.error('Session expired. Please login again.');
        logout();
        return;
      }
      
      // Warning 5 minutes before expiry
      const expiry = getTokenExpiry(token);
      if (expiry) {
        const timeLeft = expiry - Date.now();
        const fiveMinutes = 5 * 60 * 1000;
        
        if (timeLeft <= fiveMinutes && timeLeft > 0) {
          message.warning('Session will expire in 5 minutes');
        }
      }
    };

    // Check immediately
    checkSession();
    
    // Check every minute
    const interval = setInterval(checkSession, 60000);
    
    return () => clearInterval(interval);
  }, []);
};