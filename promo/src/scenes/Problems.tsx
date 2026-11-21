import React from 'react';
import {AbsoluteFill, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {C, FONT} from '../theme';
import {BatteryIcon, WifiOffIcon, ZapIcon} from '../components/Icons';

const items = [
  {
    icon: ZapIcon,
    title: '应用崩溃',
    desc: '代码还在，会话没了。',
    color: C.red,
    tint: '#FEF2F2',
    border: '#FECACA',
  },
  {
    icon: WifiOffIcon,
    title: '网络断开',
    desc: '重连回来，上下文断了。',
    color: C.amber,
    tint: '#FFFBEB',
    border: '#FDE68A',
  },
  {
    icon: BatteryIcon,
    title: '额度耗尽',
    desc: '任务做到一半，被迫停下。',
    color: C.violet,
    tint: '#F5F3FF',
    border: '#DDD6FE',
  },
];

export const Problems: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  return (
    <AbsoluteFill style={{padding: '0 170px', display: 'flex', flexDirection: 'column', justifyContent: 'center'}}>
      <div style={{textAlign: 'center'}}>
        <div style={{fontFamily: FONT, fontSize: 16, letterSpacing: 2, color: C.muted, fontWeight: 600, marginBottom: 18}}>
          中断，随时会发生
        </div>
        <div style={{fontFamily: FONT, fontSize: 62, fontWeight: 800, letterSpacing: -1.5, color: C.ink, lineHeight: 1.2}}>
          每一次中断，都像从头再来。
        </div>
      </div>

      <div style={{display: 'flex', justifyContent: 'center', gap: 40, marginTop: 64}}>
        {items.map((item, i) => {
          const s = spring({frame: Math.max(0, frame - i * 8), fps, config: {damping: 15, mass: 0.8}});
          const Icon = item.icon;
          const float = Math.sin(frame / 26 + i * 1.2) * 5;
          return (
            <div
              key={item.title}
              style={{
                width: 480,
                height: 330,
                borderRadius: 30,
                background: 'rgba(255,255,255,0.92)',
                border: '1px solid rgba(15,23,42,0.08)',
                boxShadow: '0 26px 70px rgba(15,23,42,0.10)',
                padding: 30,
                position: 'relative',
                overflow: 'hidden',
                transform: `translateY(${(1 - s) * 42 + float}px) scale(${0.95 + s * 0.05})`,
                opacity: 1,
              }}
            >
              <div style={{position: 'absolute', top: 0, left: 0, right: 0, height: 6, background: item.color, opacity: 0.9}} />
              <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start'}}>
                <div style={{width: 76, height: 76, borderRadius: 22, background: item.tint, border: `1px solid ${item.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: item.color}}>
                  <Icon size={34} />
                </div>
                <div style={{fontFamily: FONT, fontSize: 13, fontWeight: 700, color: C.faint}}>0{i + 1}</div>
              </div>
              <div style={{fontFamily: FONT, fontSize: 34, fontWeight: 800, color: C.ink, marginTop: 28, letterSpacing: -0.8}}>{item.title}</div>
              <div style={{fontFamily: FONT, fontSize: 21, color: C.muted, marginTop: 10, lineHeight: 1.55}}>{item.desc}</div>
              <div style={{position: 'absolute', left: 30, right: 30, bottom: 28, height: 1, background: C.lineSoft}} />
            </div>
          );
        })}
      </div>

      <div style={{textAlign: 'center', marginTop: 38, fontFamily: FONT, fontSize: 21, color: C.muted}}>
        任意一种，都足以让任务停在这里。
      </div>
      <div style={{position: 'absolute', left: 0, right: 0, bottom: 64, textAlign: 'center'}}>
        <div style={{fontFamily: FONT, fontSize: 30, fontWeight: 650, color: C.inkSoft, opacity: 0.85}}>
          任务可以断，进度不该归零。
        </div>
        <div style={{width: 64, height: 3, borderRadius: 99, background: C.red, margin: '14px auto 0', opacity: 0.7}} />
      </div>
    </AbsoluteFill>
  );
};
