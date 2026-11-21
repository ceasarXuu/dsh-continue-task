import React from 'react';
import {AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {C, FONT} from '../theme';

const R = 74;
const CIRC = 2 * Math.PI * R;

export const Pain: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const head = spring({frame, fps, config: {damping: 16, mass: 0.85}});
  const panel = spring({frame: Math.max(0, frame - 5), fps, config: {damping: 20, mass: 0.9}});
  const progress = interpolate(frame, [8, 56], [73, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const pct = Math.round(progress);
  const rows = ['重开会话', '翻记录', '重新解释一遍'];

  return (
    <AbsoluteFill style={{padding: '0 120px', display: 'flex', flexDirection: 'column', justifyContent: 'center'}}>
      <div style={{textAlign: 'center'}}>
        <div style={{fontFamily: FONT, fontSize: 16, letterSpacing: 2, color: C.red, fontWeight: 700, marginBottom: 10}}>
          然后呢？
        </div>
        <div
          style={{
            fontFamily: FONT,
            fontSize: 104,
            fontWeight: 800,
            letterSpacing: -3,
            color: C.ink,
            lineHeight: 1.05,
            transform: `scale(${0.92 + head * 0.08})`,
            opacity: 1,
          }}
        >
          太<span style={{color: C.red}}>慢</span>了。
        </div>
        <div style={{fontFamily: FONT, fontSize: 24, color: C.muted, marginTop: 12}}>
          这些动作，本来不该你来做。
        </div>
      </div>

      <div
        style={{
          width: 1000,
          height: 400,
          margin: '42px auto 0',
          borderRadius: 32,
          background: 'rgba(255,255,255,0.94)',
          border: `1px solid ${C.line}`,
          boxShadow: '0 34px 80px rgba(15,23,42,0.12)',
          display: 'flex',
          alignItems: 'center',
          padding: '0 44px',
          gap: 32,
          transform: `translateY(${(1 - panel) * 34}px)`,
          opacity: 1,
        }}
      >
        <div style={{flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center'}}>
          {rows.map((row, i) => {
            const start = 18 + i * 9;
            const done = frame >= start;
            const strike = interpolate(frame, [start, start + 12], [0, 100], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
            return (
              <div key={row} style={{display: 'flex', alignItems: 'center', gap: 18, marginBottom: 20, position: 'relative'}}>
                <div
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 12,
                    border: `2px solid ${done ? C.red : '#CBD5E1'}`,
                    background: done ? '#FEF2F2' : '#FFFFFF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: C.red,
                    fontFamily: FONT,
                    fontSize: 20,
                    fontWeight: 700,
                  }}
                >
                  {done ? '×' : ''}
                </div>
                <div style={{position: 'relative', fontFamily: FONT, fontSize: 31, fontWeight: 650, color: done ? C.faint : C.inkSoft}}>
                  {row}
                  <div style={{position: 'absolute', left: 0, top: '54%', height: 2.5, width: `${strike}%`, background: C.red, borderRadius: 99}} />
                </div>
              </div>
            );
          })}
        </div>

        <div style={{width: 300, display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
          <div style={{position: 'relative', width: 200, height: 200}}>
            <svg width="200" height="200" viewBox="0 0 200 200">
              <circle cx="100" cy="100" r={R} stroke="#E2E8F0" strokeWidth="13" fill="none" />
              <circle
                cx="100"
                cy="100"
                r={R}
                stroke={C.red}
                strokeWidth="13"
                fill="none"
                strokeLinecap="round"
                strokeDasharray={CIRC}
                strokeDashoffset={CIRC * (1 - progress / 100)}
                transform="rotate(-90 100 100)"
              />
            </svg>
            <div style={{position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'}}>
              <div style={{fontFamily: FONT, fontSize: 58, fontWeight: 800, color: C.ink, letterSpacing: -2}}>{pct}%</div>
              <div style={{fontFamily: FONT, fontSize: 14, color: C.faint, marginTop: 2}}>进度</div>
            </div>
          </div>
          <div style={{marginTop: 8, fontFamily: FONT, fontSize: 15, color: C.red, fontWeight: 650}}>回到起点</div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
