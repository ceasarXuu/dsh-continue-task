import React from 'react';

type IconProps = {size?: number; color?: string; strokeWidth?: number};

const base = (size: number, color: string) => ({
  width: size,
  height: size,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: color,
  strokeWidth: 1.8,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
});

export const StarIcon: React.FC<IconProps> = ({size = 24, color = 'currentColor'}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
    <path d="M12 2.6l2.9 5.9 6.5.9-4.7 4.6 1.1 6.5L12 17.4 6.2 20.5l1.1-6.5L2.6 9.4l6.5-.9L12 2.6z" />
  </svg>
);

export const CheckIcon: React.FC<IconProps> = ({size = 24, color = 'currentColor', strokeWidth = 2.2}) => (
  <svg {...base(size, color)} strokeWidth={strokeWidth}><path d="M20 6L9 17l-5-5" /></svg>
);

export const ArrowRightIcon: React.FC<IconProps> = ({size = 24, color = 'currentColor'}) => (
  <svg {...base(size, color)}><path d="M5 12h14M13 6l6 6-6 6" /></svg>
);

export const ZapIcon: React.FC<IconProps> = ({size = 24, color = 'currentColor'}) => (
  <svg {...base(size, color)}><path d="M13 2L4 14h7l-1 8 9-12h-7l1-8z" /></svg>
);

export const WifiOffIcon: React.FC<IconProps> = ({size = 24, color = 'currentColor'}) => (
  <svg {...base(size, color)}>
    <path d="M2 8.5a16 16 0 0 1 5-2.8M14.5 5.8A16 16 0 0 1 22 8.5M5 12a11 11 0 0 1 4-1.7M15.5 10.4A11 11 0 0 1 19 12M8.5 15.2A6 6 0 0 1 12 14a6 6 0 0 1 3.5 1.2" />
    <path d="M12 19h.01M3 3l18 18" />
  </svg>
);

export const WifiIcon: React.FC<IconProps> = ({size = 24, color = 'currentColor'}) => (
  <svg {...base(size, color)}>
    <path d="M2 8.5a16 16 0 0 1 20 0M5 12a11 11 0 0 1 14 0M8.5 15.3a6 6 0 0 1 7 0M12 19h.01" />
  </svg>
);

export const BatteryIcon: React.FC<IconProps> = ({size = 24, color = 'currentColor'}) => (
  <svg {...base(size, color)}>
    <rect x="2.5" y="7" width="16" height="10" rx="2.5" />
    <path d="M21 10.5v3M6 11h1.5M9.5 11H11" />
  </svg>
);

export const RefreshIcon: React.FC<IconProps> = ({size = 24, color = 'currentColor'}) => (
  <svg {...base(size, color)}>
    <path d="M20 7v5h-5M4 17v-5h5" />
    <path d="M18.5 12a7 7 0 0 0-12-4.5L4 10M5.5 12a7 7 0 0 0 12 4.5L20 14" />
  </svg>
);

export const LayersIcon: React.FC<IconProps> = ({size = 24, color = 'currentColor'}) => (
  <svg {...base(size, color)}>
    <path d="M12 3l9 5-9 5-9-5 9-5zM3 12l9 5 9-5M3 16l9 5 9-5" />
  </svg>
);

export const GlobeIcon: React.FC<IconProps> = ({size = 24, color = 'currentColor'}) => (
  <svg {...base(size, color)}>
    <circle cx="12" cy="12" r="9" />
    <path d="M3 12h18M12 3a15 15 0 0 1 0 18M12 3a15 15 0 0 0 0 18" />
  </svg>
);

export const GitHubIcon: React.FC<IconProps> = ({size = 24, color = 'currentColor'}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
    <path d="M12 2C6.48 2 2 6.58 2 12.23c0 4.52 2.87 8.35 6.84 9.7.5.1.68-.22.68-.49 0-.24-.01-.87-.01-1.71-2.78.62-3.37-1.37-3.37-1.37-.45-1.18-1.11-1.49-1.11-1.49-.91-.64.07-.63.07-.63 1 .07 1.53 1.06 1.53 1.06.89 1.56 2.34 1.11 2.91.85.09-.66.35-1.11.63-1.36-2.22-.26-4.56-1.14-4.56-5.07 0-1.12.39-2.03 1.03-2.75-.1-.26-.45-1.3.1-2.71 0 0 .84-.27 2.75 1.05A9.4 9.4 0 0 1 12 6.84c.85 0 1.71.12 2.51.35 1.9-1.32 2.74-1.05 2.74-1.05.55 1.41.2 2.45.1 2.71.64.72 1.03 1.63 1.03 2.75 0 3.94-2.34 4.8-4.57 5.06.36.32.68.94.68 1.9 0 1.37-.01 2.47-.01 2.81 0 .27.18.6.69.49A10.24 10.24 0 0 0 22 12.23C22 6.58 17.52 2 12 2z" />
  </svg>
);

export const CopyIcon: React.FC<IconProps> = ({size = 24, color = 'currentColor'}) => (
  <svg {...base(size, color)}>
    <rect x="9" y="9" width="11" height="11" rx="2" />
    <path d="M5 15V5a2 2 0 0 1 2-2h10" />
  </svg>
);

export const ClockIcon: React.FC<IconProps> = ({size = 24, color = 'currentColor'}) => (
  <svg {...base(size, color)}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>
);

export const CursorIcon: React.FC<IconProps> = ({size = 24, color = 'currentColor'}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
    <path d="M5 3l14 9-6.2 1.2L9.5 20 5 3z" stroke="rgba(255,255,255,0.9)" strokeWidth="1.2" />
  </svg>
);
