'use client';

import { useEffect, useRef } from 'react';

interface WebVitals {
  cls: number;  // Cumulative Layout Shift
  fcp: number;  // First Contentful Paint
  lcp: number;  // Largest Contentful Paint
  fid: number;  // First Input Delay
  ttfb: number; // Time to First Byte
  inp: number;  // Interaction to Next Paint
}

export function usePerformanceMonitoring() {
  const vitalsRef = useRef<Partial<WebVitals>>({});

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Core Web Vitals
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        const json = entry.toJSON();

        switch (entry.entryType) {
          case 'web-vitals':
            if (entry.name === 'CLS') vitalsRef.current.cls = json.value;
            if (entry.name === 'LCP') vitalsRef.current.lcp = json.value;
            if (entry.name === 'FID') vitalsRef.current.fid = json.value;
            if (entry.name === 'INP') vitalsRef.current.inp = json.value;
            break;
          case 'paint':
            if (entry.name === 'first-contentful-paint') {
              vitalsRef.current.fcp = json.startTime;
            }
            break;
          case 'navigation':
            vitalsRef.current.ttfb = json.responseStart;
            break;
        }
      }
    });

    // Report to analytics endpoint every 10 seconds
    const interval = setInterval(() => {
      if (Object.keys(vitalsRef.current).length > 0) {
        fetch('/v1/analytics/vitals', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...vitalsRef.current,
            url: window.location.href,
            timestamp: Date.now(),
          }),
          keepalive: true,
        }).catch(() => {});
        vitalsRef.current = {};
      }
    }, 10000);

    return () => {
      clearInterval(interval);
      observer.disconnect();
    };
  }, []);

  return vitalsRef;
}

// Resource loading monitor
export function useResourceMonitor() {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const observer = new PerformanceObserver((list) => {
      const slowResources = list.getEntries().filter((entry: any) => {
        return entry.duration > 1000; // Resources taking > 1s
      });

      if (slowResources.length > 0) {
        console.warn('Slow resources detected:', slowResources.map((r: any) => ({
          name: r.name,
          duration: r.duration,
          size: r.transferSize,
        })));
      }
    });

    observer.observe({ entryTypes: ['resource'] });

    return () => observer.disconnect();
  }, []);
}
