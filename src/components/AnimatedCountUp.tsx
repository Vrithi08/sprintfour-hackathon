import React, { useEffect, useState } from 'react';

interface AnimatedCountUpProps {
  value: number;
  duration?: number;
  className?: string;
}

export const AnimatedCountUp: React.FC<AnimatedCountUpProps> = ({ value, duration = 1000, className }) => {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    let startTimestamp: number | null = null;
    const startValue = displayValue;
    const endValue = value;

    if (startValue === endValue) return;

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      
      // Easing out function
      const easeOutQuad = (x: number): number => {
        return x * (2 - x);
      };

      const current = Math.floor(startValue + easeOutQuad(progress) * (endValue - startValue));
      setDisplayValue(current);

      if (progress < 1) {
        window.requestAnimationFrame(step);
      } else {
        setDisplayValue(endValue);
      }
    };

    window.requestAnimationFrame(step);
  }, [value, duration]);

  return <span className={className}>{displayValue}</span>;
};
