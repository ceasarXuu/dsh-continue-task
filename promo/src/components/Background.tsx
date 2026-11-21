import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {C} from '../theme';

export const Background: React.FC = () => {
  const frame = useCurrentFrame();
  const drift = Math.sin(frame / 95) * 18;
  const drift2 = Math.cos(frame / 120) * 22;
  return (
    <AbsoluteFill style={{background: 'linear-gradient(135deg, #FBFCFF 0%, #F3F8FF 46%, #FFF7F0 100%)', overflow: 'hidden'}}>
      <div
        style={{
          position: 'absolute',
          width: 980,
          height: 980,
          left: -260 + drift,
          top: -360,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(59,130,246,0.30) 0%, rgba(59,130,246,0.10) 42%, transparent 70%)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          width: 900,
          height: 900,
          right: -280 + drift2,
          top: -220,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(124,58,237,0.22) 0%, rgba(124,58,237,0.08) 45%, transparent 72%)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          width: 920,
          height: 720,
          left: '28%',
          bottom: -420 - drift,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(251,146,60,0.28) 0%, rgba(251,146,60,0.08) 45%, transparent 72%)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage:
            'linear-gradient(rgba(15,23,42,0.045) 1px, transparent 1px), linear-gradient(90deg, rgba(15,23,42,0.045) 1px, transparent 1px)',
          backgroundSize: '64px 64px',
          maskImage: 'radial-gradient(ellipse at 50% 42%, black 0%, transparent 72%)',
          WebkitMaskImage: 'radial-gradient(ellipse at 50% 42%, black 0%, transparent 72%)',
          opacity: 0.55,
        }}
      />
      {[
        {x: '9%', y: '18%', s: 10, o: 0.28},
        {x: '82%', y: '26%', s: 7, o: 0.24},
        {x: '16%', y: '78%', s: 8, o: 0.22},
        {x: '74%', y: '82%', s: 12, o: 0.18},
        {x: '90%', y: '62%', s: 5, o: 0.3},
      ].map((d, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: d.x,
            top: d.y,
            width: d.s,
            height: d.s,
            borderRadius: '50%',
            background: i % 2 ? C.blue : C.amber,
            opacity: d.o,
            transform: `translateY(${Math.sin(frame / 22 + i) * 10}px)`,
          }}
        />
      ))}
      <div style={{position: 'absolute', inset: 0, boxShadow: 'inset 0 0 180px rgba(255,255,255,0.9)'}} />
    </AbsoluteFill>
  );
};
