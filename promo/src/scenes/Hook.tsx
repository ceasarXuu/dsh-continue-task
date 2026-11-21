import React from 'react';
import {AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {C, FONT, MONO} from '../theme';

const RING_R = 34;
const RING_C = 2 * Math.PI * RING_R;

const SessionCard: React.FC<{frame: number}> = ({frame}) => {
  const {fps} = useVideoConfig();
  const cardIn = spring({frame: Math.max(0, frame - 4), fps, config: {damping: 18, mass: 0.9}});
  const broken = frame >= 42;
  const shake = broken ? Math.sin((frame - 42) * 1.7) * 5 * Math.exp(-(frame - 42) / 9) : 0;
  const progress = frame < 42 ? 73 : interpolate(frame, [42, 48], [73, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const pct = Math.round(progress);

  return (
    <div
      style={{
        width: 700,
        borderRadius: 30,
        background: 'rgba(255,255,255,0.94)',
        border: `1px solid ${C.line}`,
        boxShadow: '0 36px 90px rgba(15,23,42,0.16)',
        padding: 26,
        transform: `translateY(${(1 - cardIn) * 46}px) rotate(${-2 + (1 - cardIn) * 7 + shake * 0.35}deg) scale(${0.96 + cardIn * 0.04})`,
        opacity: Math.min(1, cardIn),
        filter: broken ? 'saturate(0.78)' : 'none',
        overflow: 'hidden',
      }}
    >
      <div style={{display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18}}>
        {['#FF6B6B', '#F6C453', '#45D483'].map((c) => (
          <div key={c} style={{width: 10, height: 10, borderRadius: '50%', background: c}} />
        ))}
        <div style={{fontFamily: MONO, fontSize: 13, color: C.faint, marginLeft: 8}}>session / auth-refactor</div>
        <div style={{flex: 1}} />
        <div
          style={{
            fontFamily: MONO,
            fontSize: 12,
            color: broken ? C.red : C.green,
            background: broken ? '#FEF2F2' : '#ECFDF5',
            border: `1px solid ${broken ? '#FECACA' : '#A7F3D0'}`,
            borderRadius: 999,
            padding: '4px 9px',
          }}
        >
          {broken ? 'interrupted' : 'running'}
        </div>
      </div>

      <div style={{display: 'flex', justifyContent: 'flex-end', marginBottom: 14}}>
        <div
          style={{
            maxWidth: 450,
            background: '#EFF6FF',
            border: '1px solid #DBEAFE',
            borderRadius: '18px 18px 5px 18px',
            padding: '12px 16px',
            fontFamily: FONT,
            fontSize: 15,
            color: C.inkSoft,
            lineHeight: 1.5,
          }}
        >
          帮我重构 auth 模块，拆成独立服务，跑完测试再提交。
        </div>
      </div>

      <div style={{display: 'flex', gap: 10, marginBottom: 12}}>
        <div style={{width: 26, height: 26, borderRadius: 8, background: '#E0EAFF', color: C.blue, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: MONO, fontSize: 12, fontWeight: 700}}>A</div>
        <div style={{fontFamily: FONT, fontSize: 14, color: C.muted, lineHeight: 1.55}}>
          我先梳理依赖，再拆 session 和 token。
        </div>
      </div>

      <div style={{background: '#0F172A', borderRadius: 14, padding: '14px 16px', fontFamily: MONO, fontSize: 12.5, lineHeight: 1.75, color: '#CBD5E1', marginBottom: 14}}>
        <div><span style={{color: '#7DD3FC'}}>export</span> <span style={{color: '#C4B5FD'}}>function</span> <span style={{color: '#FDE68A'}}>createSession</span>() {'{'}</div>
        <div style={{paddingLeft: 18}}><span style={{color: '#7DD3FC'}}>const</span> token = <span style={{color: '#FDA4AF'}}>await</span> signToken(user);</div>
        <div style={{paddingLeft: 18}}><span style={{color: '#7DD3FC'}}>return</span> {'{ token, expiresAt }'};</div>
        <div>{'}'}</div>
      </div>

      <div style={{display: 'flex', alignItems: 'center', gap: 12, background: '#F8FAFC', border: `1px solid ${C.lineSoft}`, borderRadius: 14, padding: '12px 14px'}}>
        <svg width="76" height="76" viewBox="0 0 76 76">
          <circle cx="38" cy="38" r={RING_R} stroke="#E2E8F0" strokeWidth="7" fill="none" />
          <circle
            cx="38"
            cy="38"
            r={RING_R}
            stroke={broken ? C.red : C.blue}
            strokeWidth="7"
            fill="none"
            strokeLinecap="round"
            strokeDasharray={RING_C}
            strokeDashoffset={RING_C * (1 - progress / 100)}
            transform="rotate(-90 38 38)"
          />
        </svg>
        <div style={{flex: 1}}>
          <div style={{display: 'flex', justifyContent: 'space-between', fontFamily: FONT, fontSize: 14, color: C.inkSoft}}>
            <span style={{fontWeight: 700}}>running tests</span>
            <span style={{fontFamily: MONO, color: broken ? C.red : C.blue, fontWeight: 700}}>{pct}%</span>
          </div>
          <div style={{height: 6, background: '#E2E8F0', borderRadius: 99, marginTop: 9, overflow: 'hidden'}}>
            <div style={{width: `${pct}%`, height: '100%', background: broken ? C.red : C.blue, borderRadius: 99}} />
          </div>
          <div style={{fontFamily: MONO, fontSize: 11, color: broken ? C.red : C.faint, marginTop: 7}}>
            {broken ? 'connection lost · turn interrupted' : '42 assertions · 3 files'}
          </div>
        </div>
      </div>

    </div>
  );
};

export const Hook: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const textIn = spring({frame, fps, config: {damping: 18, mass: 0.8}});
  const lineIn = spring({frame: Math.max(0, frame - 7), fps, config: {damping: 18, mass: 0.8}});
  const flash = interpolate(frame, [42, 44, 52], [0, 0.45, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

  return (
    <AbsoluteFill style={{padding: '84px 120px'}}>
      <div style={{display: 'flex', alignItems: 'center', gap: 52, height: '100%'}}>
        <div style={{width: 720, transform: `translateY(${(1 - textIn) * 30}px)`, opacity: textIn}}>
          <div style={{display: 'flex', alignItems: 'center', gap: 10, marginBottom: 28}}>
            <div style={{width: 8, height: 8, borderRadius: '50%', background: C.blue}} />
            <div style={{fontFamily: MONO, fontSize: 13, letterSpacing: 2.4, color: C.muted}}>DEEPSEEK HARNESS · SESSION RECOVERY</div>
          </div>
          <div style={{fontFamily: FONT, fontWeight: 800, color: C.ink, fontSize: 86, lineHeight: 1.08, letterSpacing: -2.5}}>
            任务跑到一半
          </div>
          <div style={{fontFamily: FONT, fontWeight: 800, color: C.ink, fontSize: 96, lineHeight: 1.08, letterSpacing: -3, marginTop: 4}}>
            应用<span style={{color: C.red, position: 'relative'}}>没了</span>。
          </div>
          <div style={{fontFamily: FONT, fontSize: 28, color: C.muted, marginTop: 26, transform: `translateY(${(1 - lineIn) * 18}px)`, opacity: lineIn}}>
            会话中断，进度归零。
          </div>
          <div style={{display: 'flex', gap: 10, marginTop: 34, transform: `translateY(${(1 - lineIn) * 18}px)`, opacity: lineIn}}>
            {['崩溃退出', '网络断开', '额度耗尽'].map((t) => (
              <div key={t} style={{fontFamily: FONT, fontSize: 15, color: C.inkSoft, background: 'rgba(255,255,255,0.75)', border: `1px solid ${C.line}`, borderRadius: 999, padding: '8px 14px', boxShadow: C.shadowSoft}}>
                {t}
              </div>
            ))}
          </div>
        </div>
        <div style={{flex: 1, display: 'flex', justifyContent: 'center'}}>
          <SessionCard frame={frame} />
        </div>
      </div>
      <AbsoluteFill style={{background: C.red, opacity: flash, mixBlendMode: 'multiply', pointerEvents: 'none'}} />
    </AbsoluteFill>
  );
};
