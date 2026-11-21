import React from 'react';
import {AbsoluteFill, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {C, FONT, MONO} from '../theme';
import {CheckIcon, LayersIcon, RefreshIcon, WifiIcon} from '../components/Icons';

const chips = [
  {text: '崩溃重启', icon: RefreshIcon, x: 150, y: 245, color: C.blue, delay: 30},
  {text: '网络恢复', icon: WifiIcon, x: 135, y: 760, color: C.amber, delay: 38},
  {text: '额度切换', icon: LayersIcon, x: 1490, y: 250, color: C.violet, delay: 46},
  {text: '自动保存', icon: CheckIcon, x: 1475, y: 755, color: C.green, delay: 54},
];

export const Reveal: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const flash = interpolate(frame, [0, 4, 12], [1, 0.72, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const iconIn = spring({frame: Math.max(0, frame - 2), fps, config: {damping: 13, mass: 0.7}});
  const titleIn = spring({frame: Math.max(0, frame - 9), fps, config: {damping: 20, mass: 0.9}});
  const tagIn = spring({frame: Math.max(0, frame - 20), fps, config: {damping: 200}});

  return (
    <AbsoluteFill>
      <AbsoluteFill
        style={{
          background:
            'conic-gradient(from 0deg, rgba(37,99,235,0.13), transparent 16%, rgba(251,146,60,0.12) 34%, transparent 52%, rgba(6,182,212,0.12) 70%, transparent 88%, rgba(37,99,235,0.13))',
          transform: `rotate(${frame * 0.18}deg) scale(1.25)`,
          WebkitMaskImage: 'radial-gradient(circle at 50% 50%, black 0%, transparent 62%)',
          maskImage: 'radial-gradient(circle at 50% 50%, black 0%, transparent 62%)',
          opacity: 0.9,
        }}
      />
      <AbsoluteFill style={{display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'}}>
        <div style={{display: 'flex', alignItems: 'center', gap: 9, background: 'rgba(255,255,255,0.8)', border: `1px solid ${C.line}`, borderRadius: 999, padding: '8px 16px', fontFamily: MONO, fontSize: 13, letterSpacing: 1.8, color: C.muted, boxShadow: C.shadowSoft, marginBottom: 28}}>
          <span style={{width: 7, height: 7, borderRadius: '50%', background: C.blue}} />
          DEEPSEEK HARNESS PLUGIN
        </div>

        <div
          style={{
            width: 156,
            height: 156,
            borderRadius: 44,
            background: '#FFFFFF',
            border: `1px solid ${C.line}`,
            boxShadow: '0 24px 70px rgba(37,99,235,0.22)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transform: `scale(${0.7 + iconIn * 0.3}) rotate(${(1 - iconIn) * -8}deg)`,
            opacity: Math.min(1, iconIn),
            marginBottom: 24,
          }}
        >
          <Img src={staticFile('icon.svg')} style={{width: 96, height: 96}} />
        </div>

        <div style={{overflow: 'hidden', paddingBottom: 4}}>
          <div
            style={{
              fontFamily: FONT,
              fontSize: 118,
              fontWeight: 820,
              letterSpacing: -4,
              color: C.ink,
              lineHeight: 1.05,
              clipPath: `inset(0 ${Math.max(0, (1 - titleIn) * 100)}% 0 0)`,
            }}
          >
            任务续传
          </div>
        </div>
        <div style={{fontFamily: MONO, fontSize: 26, color: C.blue, letterSpacing: 0.5, marginTop: 8, opacity: Math.min(1, titleIn)}}>
          dsh-continue-task
        </div>
        <div
          style={{
            fontFamily: FONT,
            fontSize: 46,
            fontWeight: 650,
            color: C.inkSoft,
            marginTop: 24,
            letterSpacing: -0.6,
            transform: `translateY(${(1 - tagIn) * 16}px)`,
            opacity: tagIn,
          }}
        >
          让中断的会话，<span style={{color: C.blue}}>自己接上。</span>
        </div>
      </AbsoluteFill>

      {chips.map((chip) => {
        const Icon = chip.icon;
        const s = spring({frame: Math.max(0, frame - chip.delay), fps, config: {damping: 15, mass: 0.8}});
        const float = Math.sin((frame + chip.delay) / 21) * 7;
        return (
          <div
            key={chip.text}
            style={{
              position: 'absolute',
              left: chip.x,
              top: chip.y,
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              background: 'rgba(255,255,255,0.92)',
              border: `1px solid ${C.line}`,
              borderRadius: 16,
              padding: '12px 16px',
              boxShadow: C.shadowSoft,
              transform: `translateY(${(1 - s) * 22 + float}px) scale(${0.9 + s * 0.1})`,
              opacity: Math.min(1, s),
            }}
          >
            <div style={{width: 34, height: 34, borderRadius: 10, background: `${chip.color}16`, color: chip.color, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
              <Icon size={18} />
            </div>
            <div style={{fontFamily: FONT, fontSize: 17, fontWeight: 650, color: C.inkSoft}}>{chip.text}</div>
          </div>
        );
      })}

      <AbsoluteFill style={{background: '#FFFFFF', opacity: flash, pointerEvents: 'none'}} />
    </AbsoluteFill>
  );
};
