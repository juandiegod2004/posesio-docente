'use client';

import React from 'react';

export interface StatusRingSegment {
  value: number;
  color: string;
  label: string;
}

interface StatusRingProps {
  segments: StatusRingSegment[];
  size?: number;
  strokeWidth?: number;
  trackColor?: string;
  children?: React.ReactNode;
}

export function StatusRing({
  segments,
  size = 168,
  strokeWidth = 20,
  trackColor = '#EEF1F5',
  children,
}: StatusRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const total = segments.reduce((sum, s) => sum + s.value, 0) || 1;

  let cumulativeLength = 0;

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={trackColor} strokeWidth={strokeWidth} />
        {segments.map((seg, i) => {
          if (seg.value <= 0) return null;
          const dash = (seg.value / total) * circumference;
          const circleEl = (
            <circle
              key={i}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={seg.color}
              strokeWidth={strokeWidth}
              strokeDasharray={`${dash} ${circumference - dash}`}
              strokeDashoffset={-cumulativeLength}
              strokeLinecap="butt"
            />
          );
          cumulativeLength += dash;
          return circleEl;
        })}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">{children}</div>
    </div>
  );
}
