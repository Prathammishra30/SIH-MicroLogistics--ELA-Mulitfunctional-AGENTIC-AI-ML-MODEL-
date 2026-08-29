import React, { useEffect, useRef, useState } from 'react';
import { useInView, useReducedMotion } from 'framer-motion';

interface CountUpProps {
  value: string | number;
  duration?: number;
  className?: string;
}

export const CountUp: React.FC<CountUpProps> = ({
  value,
  duration = 0.8,
  className = '',
}) => {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-20px' });
  const shouldReduceMotion = useReducedMotion();
  const [displayValue, setDisplayValue] = useState<string>(() => {
    if (typeof value === 'number') return '0';
    return String(value);
  });

  useEffect(() => {
    const rawStr = String(value);
    
    let animationFrameId: number;

    // If reduced motion is enabled, show the final value immediately
    if (shouldReduceMotion) {
      animationFrameId = requestAnimationFrame(() => {
        setDisplayValue(rawStr);
      });
      return () => {
        if (animationFrameId) cancelAnimationFrame(animationFrameId);
      };
    }

    if (!isInView) {
      return;
    }

    // Parse the value into prefix, numeric part, and suffix
    // Matches e.g. "₹12,500", "500 kg", "1.5 MT", "24"
    const match = rawStr.match(/^([^\d.-]*)([\d,]+(?:\.\d+)?)(.*)$/);
    
    if (!match) {
      animationFrameId = requestAnimationFrame(() => {
        setDisplayValue(rawStr);
      });
      return () => {
        if (animationFrameId) cancelAnimationFrame(animationFrameId);
      };
    }

    const prefix = match[1] || '';
    const numericStr = match[2].replace(/,/g, '');
    const suffix = match[3] || '';
    const targetNumber = parseFloat(numericStr);

    if (isNaN(targetNumber) || targetNumber === 0) {
      animationFrameId = requestAnimationFrame(() => {
        setDisplayValue(rawStr);
      });
      return () => {
        if (animationFrameId) cancelAnimationFrame(animationFrameId);
      };
    }

    const hasDecimals = numericStr.includes('.');
    const decimalPlaces = hasDecimals ? numericStr.split('.')[1].length : 0;
    const isIndianFormat = prefix.includes('₹') || rawStr.includes(',');

    let startTime: number | null = null;

    const easeOutQuad = (t: number) => t * (2 - t);

    const updateCounter = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / (duration * 1000), 1);
      const easedProgress = easeOutQuad(progress);
      const currentVal = targetNumber * easedProgress;

      let formattedNumber: string;
      if (hasDecimals) {
        formattedNumber = currentVal.toFixed(decimalPlaces);
      } else {
        const rounded = Math.round(currentVal);
        if (isIndianFormat) {
          formattedNumber = rounded.toLocaleString('en-IN');
        } else {
          formattedNumber = rounded.toLocaleString();
        }
      }

      setDisplayValue(`${prefix}${formattedNumber}${suffix}`);

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(updateCounter);
      } else {
        setDisplayValue(rawStr);
      }
    };

    animationFrameId = requestAnimationFrame(updateCounter);

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [value, duration, isInView, shouldReduceMotion]);

  return (
    <span ref={ref} className={className}>
      {displayValue}
    </span>
  );
};
