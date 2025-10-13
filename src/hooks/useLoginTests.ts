// src/hooks/useLoginTests.ts
import { useState, useEffect } from 'react';

interface BrowserInfo {
  name: string;
  version: string;
  isSupported: boolean;
}

interface LoginTestResults {
  browserInfo: BrowserInfo;
  performanceMetrics: {
    averageResponseTime: number;
    slowLogins: number;
    totalLogins: number;
  };
  concurrentLoginTest: () => Promise<boolean>;
}

export const useLoginTests = (): LoginTestResults => {
  const [performanceMetrics, setPerformanceMetrics] = useState({
    averageResponseTime: 0,
    slowLogins: 0,
    totalLogins: 0
  });

  // Browser detection
  const getBrowserInfo = (): BrowserInfo => {
    const userAgent = navigator.userAgent;
    let name = 'Unknown';
    let version = 'Unknown';
    let isSupported = true;

    if (userAgent.includes('Chrome')) {
      name = 'Chrome';
      const match = userAgent.match(/Chrome\/(\d+)/);
      version = match ? match[1] : 'Unknown';
      isSupported = parseInt(version) >= 90;
    } else if (userAgent.includes('Firefox')) {
      name = 'Firefox';
      const match = userAgent.match(/Firefox\/(\d+)/);
      version = match ? match[1] : 'Unknown';
      isSupported = parseInt(version) >= 88;
    } else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) {
      name = 'Safari';
      const match = userAgent.match(/Version\/(\d+)/);
      version = match ? match[1] : 'Unknown';
      isSupported = parseInt(version) >= 14;
    } else if (userAgent.includes('Edge')) {
      name = 'Edge';
      const match = userAgent.match(/Edg\/(\d+)/);
      version = match ? match[1] : 'Unknown';
      isSupported = parseInt(version) >= 90;
    } else {
      isSupported = false;
    }

    return { name, version, isSupported };
  };

  // Test concurrent logins
  const concurrentLoginTest = async (): Promise<boolean> => {
    try {
      const promises = Array(3).fill(null).map(() => 
        fetch('/api/auth/test-concurrent', { method: 'POST' })
      );
      
      const results = await Promise.allSettled(promises);
      return results.every(result => result.status === 'fulfilled');
    } catch {
      return false;
    }
  };

  // Track login performance
  const trackLoginPerformance = (responseTime: number) => {
    setPerformanceMetrics(prev => ({
      averageResponseTime: (prev.averageResponseTime * prev.totalLogins + responseTime) / (prev.totalLogins + 1),
      slowLogins: responseTime > 5000 ? prev.slowLogins + 1 : prev.slowLogins,
      totalLogins: prev.totalLogins + 1
    }));
  };

  useEffect(() => {
    // Listen for custom login performance events
    const handleLoginPerformance = (event: CustomEvent) => {
      trackLoginPerformance(event.detail.responseTime);
    };

    window.addEventListener('loginPerformance', handleLoginPerformance as EventListener);
    
    return () => {
      window.removeEventListener('loginPerformance', handleLoginPerformance as EventListener);
    };
  }, []);

  return {
    browserInfo: getBrowserInfo(),
    performanceMetrics,
    concurrentLoginTest
  };
};