import React from 'react';
import {AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {C, FONT, MONO} from '../theme';
import {CheckIcon} from '../components/Icons';

const lines = [
  {label: 'scan', value: '250 个会话', color: '#7DD3FC', start: 6},
  {label: 'check', value: '2 个候选', color: '#FDE68A', start: 12},
  {label: 'resume', value: '2 个会话', color: '#6EE7B7', start: 18},
  {label: 'done', value: '已请求继续（app-exit）', color: '#A7F3D0', start: 26},
];

export const Proof: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const cardIn = spring({frame, fps, config: {damping: 19, mass: 0.9}});
  const msgIn = spring({frame: Math.max(0, frame - 42), fps, config: {damping: 16, mass: 0.8}});
  const headline = spring({frame: Math.max(0, frame - 36), fps, config: {damping: 20, mass: 0.9}});

  return (
    <AbsoluteFill style={{padding: '0 120px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'}}>
      <div style={{display: 'flex', alignItems: 'center', gap: 9, marginBottom: 18, alignSelf: 'center'}}>
        <div style={{width: 7, height: 7, borderRadius: '50%', background: C.green}} />
        <div style={{fontFamily: MONO, fontSize: 13, letterSpacing: 2.2, color: C.muted}}>REAL RECOVERY LOG</div>
      </div>

      <div
        style={{
          width: 1180,
          borderRadius: 28,
          background: '#0F172A',
          boxShadow: '0 36px 90px rgba(15,23,42,0.24)',
          overflow: 'hidden',
          transform: `translateY(${(1 - cardIn) * 34}px) scale(${0.97 + cardIn * 0.03})`,
          opacity: 1,
          position: 'relative',
        }}
      >
        <div style={{height: 52, display: 'flex', alignItems: 'center', gap: 7, padding: '0 20px', borderBottom: '1px solid rgba(255,255,255,0.08)'}}>
          {['#FF6B6B', '#F6C453', '#45D483'].map((c) => <div key={c} style={{width: 9, height: 9, borderRadius: '50%', background: c}} />)}
          <div style={{fontFamily: MONO, fontSize: 12, color: '#94A3B8', marginLeft: 8}}>continue-task · recent actions</div>
          <div style={{marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6, color: '#6EE7B7', fontFamily: MONO, fontSize: 11}}>
            <span style={{width: 6, height: 6, borderRadius: '50%', background: '#6EE7B7'}} /> live
          </div>
        </div>

        <div style={{padding: '28px 32px 30px'}}>
          <div style={{position: 'absolute', top: 78, right: 28, width: 330, background: 'rgba(110,231,183,0.08)', border: '1px solid rgba(110,231,183,0.22)', borderRadius: 16, padding: 16, transform: `translateY(${(1 - msgIn) * 14}px)`, opacity: msgIn}}>
            <div style={{fontFamily: MONO, fontSize: 10, letterSpacing: 1.4, color: '#6EE7B7', marginBottom: 9}}>CONTINUATION MESSAGE</div>
            <div style={{fontFamily: FONT, fontSize: 16, lineHeight: 1.5, color: '#D1FAE5'}}>应用重启，继续未完成的任务。</div>
            <div style={{display: 'flex', alignItems: 'center', gap: 7, marginTop: 13, color: '#6EE7B7'}}>
              <CheckIcon size={13} />
              <div style={{fontFamily: MONO, fontSize: 11}}>turn #2 · started</div>
            </div>
          </div>
          {lines.map((line, i) => {
            const typed = Math.max(0, Math.min(1, (frame - line.start) / 8));
            const chars = Math.floor(line.value.length * typed);
            const visible = frame >= line.start;
            return (
              <div key={line.label} style={{display: 'flex', alignItems: 'baseline', gap: 18, height: 48, opacity: visible ? 1 : 0.25}}>
                <div style={{width: 86, fontFamily: MONO, fontSize: 16, color: line.color}}>{line.label}</div>
                <div style={{fontFamily: MONO, fontSize: 25, color: '#E2E8F0', whiteSpace: 'pre'}}>
                  {line.value.slice(0, chars)}
                  {visible && chars < line.value.length ? <span style={{background: '#6EE7B7', color: '#0F172A'}}> </span> : null}
                </div>
              </div>
            );
          })}
          <div style={{marginTop: 14, height: 1, background: 'rgba(255,255,255,0.10)'}} />
          <div style={{marginTop: 16, display: 'flex', alignItems: 'center', gap: 10, opacity: frame >= 46 ? 1 : 0.35}}>
            <div style={{width: 26, height: 26, borderRadius: 8, background: 'rgba(110,231,183,0.16)', color: '#6EE7B7', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
              <CheckIcon size={15} />
            </div>
            <div style={{fontFamily: MONO, fontSize: 15, color: '#A7F3D0'}}>turn started · continuation appended</div>
          </div>
        </div>

      </div>

      <div style={{textAlign: 'center', marginTop: 30, transform: `translateY(${(1 - headline) * 18}px)`, opacity: Math.min(1, headline)}}>
        <div style={{fontFamily: FONT, fontSize: 38, fontWeight: 800, color: C.ink, letterSpacing: -0.8}}>
          应用重启后，自动继续了 <span style={{color: C.green}}>2</span> 个会话。
        </div>
        <div style={{fontFamily: FONT, fontSize: 19, color: C.muted, marginTop: 8}}>
          不是演示，是开发过程中真实发生的一次重启。
        </div>
      </div>

    </AbsoluteFill>
  );
};
