import React from 'react';
import {AbsoluteFill, spring, useCurrentFrame, useVideoConfig} from 'remotion';

type Props = {
  duration: number;
  children: React.ReactNode;
  enterY?: number;
  enterX?: number;
  fadeOut?: boolean;
};

export const Scene: React.FC<Props> = ({children, enterY = 26, enterX = 0}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const enter = spring({frame, fps, config: {damping: 200, mass: 0.9}});
  return (
    <AbsoluteFill
      style={{
        transform: `translate3d(${(1 - enter) * enterX}px, ${(1 - enter) * enterY}px, 0)`,
      }}
    >
      {children}
    </AbsoluteFill>
  );
};
