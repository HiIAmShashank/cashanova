'use client';

import { useEffect } from 'react';
import { useReportWebVitals } from 'next/web-vitals';

/**
 * Web Vitals Reporter Component
 * 
 * Reports Core Web Vitals metrics for performance monitoring.
 * Only logs in development mode to avoid production overhead.
 * 
 * Metrics tracked:
 * - LCP (Largest Contentful Paint) - Target: < 2.5s
 * - FID (First Input Delay) - Target: < 100ms
 * - CLS (Cumulative Layout Shift) - Target: < 0.1
 * - FCP (First Contentful Paint) - Target: < 1.8s
 * - TTFB (Time to First Byte) - Target: < 600ms
 * - INP (Interaction to Next Paint) - Target: < 200ms
 */
export function WebVitals() {
    useReportWebVitals((metric) => {
        // Only log in development
        if (process.env.NODE_ENV === 'development') {
            const { name, value, rating, id } = metric;

            // Color code based on rating
            const colors = {
                good: '\x1b[32m',      // Green
                'needs-improvement': '\x1b[33m', // Yellow
                poor: '\x1b[31m',       // Red
            };
            const reset = '\x1b[0m';
            const color = colors[rating as keyof typeof colors] || reset;

            console.log(
                `${color}[Web Vitals] ${name}: ${Math.round(value)}ms (${rating})${reset}`,
                { id, value, rating }
            );

            // Warn if metrics exceed thresholds
            const thresholds = {
                LCP: 2500,  // 2.5s
                FID: 100,   // 100ms
                CLS: 0.1,   // 0.1
                FCP: 1800,  // 1.8s
                TTFB: 600,  // 600ms
                INP: 200,   // 200ms
            };

            const threshold = thresholds[name as keyof typeof thresholds];
            if (threshold && value > threshold) {
                console.warn(
                    `⚠️  ${name} exceeds recommended threshold (${threshold}): ${Math.round(value)}`
                );
            }
        }

        // In production, you could send to analytics service
        // Example: sendToAnalytics(metric);
    });

    // Log performance marks in development
    useEffect(() => {
        if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
            // Monitor navigation timing
            window.addEventListener('load', () => {
                const perfData = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;

                if (perfData) {
                    console.log('[Performance] Page Load Metrics:', {
                        'DNS Lookup': Math.round(perfData.domainLookupEnd - perfData.domainLookupStart),
                        'TCP Connection': Math.round(perfData.connectEnd - perfData.connectStart),
                        'Request Time': Math.round(perfData.responseStart - perfData.requestStart),
                        'Response Time': Math.round(perfData.responseEnd - perfData.responseStart),
                        'DOM Processing': Math.round(perfData.domComplete - perfData.domInteractive),
                        'Total Load Time': Math.round(perfData.loadEventEnd - perfData.fetchStart),
                    });
                }
            });
        }
    }, []);

    return null;
}

/**
 * Send metrics to analytics service (placeholder)
 * Implement this to send metrics to your analytics provider
 */
// function sendToAnalytics(metric: { name: string; value: number; rating: string; id: string }) {
//     // Example: Google Analytics
//     // window.gtag?.('event', metric.name, {
//     //     value: Math.round(metric.value),
//     //     metric_id: metric.id,
//     //     metric_value: metric.value,
//     //     metric_rating: metric.rating,
//     // });
//
//     // Example: Custom endpoint
//     // fetch('/api/analytics', {
//     //     method: 'POST',
//     //     headers: { 'Content-Type': 'application/json' },
//     //     body: JSON.stringify(metric),
//     // });
// }
