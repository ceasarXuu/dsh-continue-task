import React from 'react';
import {AbsoluteFill, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {C, FONT, MONO} from '../theme';
import {ArrowRightIcon, CopyIcon, GitHubIcon, GlobeIcon, StarIcon} from '../components/Icons';

const confetti = [
  {x: 70, y: 120, r: 8, c: C.amber, d: 0},
  {x: 430, y: 80, r: 5, c: C.blue, d: 6},
  {x: 470, y: 300, r: 4, c: C.amber, d: 12},
  {x: 40, y: 380, r: 6, c: C.violet, d: 18},
  {x: 250, y: 40, r: 4, c: C.green, d: 22},
  {x: 500, y: 520, r: 5, c: C.blue, d: 28},
];

export const End: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const left = spring({frame, fps, config: {damping: 20, mass: 0.9}});
  const right = spring({frame: Math.max(0, frame - 8), fps, config: {damping: 17, mass: 0.9}});
  const avatarIn = spring({frame: Math.max(0, frame - 14), fps, config: {damping: 14, mass: 0.8}});
  const starPulse = 1 + Math.max(0, Math.sin((frame - 52) / 7)) * 0.025;

  return (
    <AbsoluteFill style={{padding: '76px 80px', overflow: 'hidden'}}>
      <div style={{position: 'absolute', width: 820, height: 820, right: -200, top: -120, borderRadius: '50%', }} />
      <div style={{position: 'absolute', width: 640, height: 640, right: 260, bottom: -320, borderRadius: '50%', }} />

      <div style={{display: 'flex', alignItems: 'center', gap: 56, height: '100%', position: 'relative'}}>
        <div style={{width: 1110, transform: `translateY(${(1 - left) * 30}px)`, opacity: 1}}>
          <div style={{fontFamily: MONO, fontSize: 13, letterSpacing: 2.2, color: C.blue, fontWeight: 700, marginBottom: 14}}>
            DSH CONTINUE TASK · OPEN SOURCE
          </div>
          <div style={{fontFamily: FONT, fontSize: 78, fontWeight: 820, color: C.ink, letterSpacing: -2.6, lineHeight: 1.1}}>
            别让中断，
            <br />
            变成<span style={{color: C.blue}}>重来</span>。
          </div>

          <div style={{marginTop: 28, display: 'flex', alignItems: 'center', gap: 12, background: '#0F172A', borderRadius: 18, padding: '19px 20px', boxShadow: '0 22px 55px rgba(15,23,42,0.20)'}}>
            <div style={{fontFamily: MONO, fontSize: 20, color: '#6EE7B7'}}>$</div>
            <div style={{fontFamily: MONO, fontSize: 20, color: '#E2E8F0', whiteSpace: 'nowrap', letterSpacing: -0.3}}>
              dsh plugin --profile web add @ceasarxuu/dsh-continue-task
            </div>
            <div style={{marginLeft: 'auto', color: '#94A3B8'}}><CopyIcon size={20} /></div>
          </div>

          <div style={{display: 'flex', gap: 18, marginTop: 20}}>
            <div style={{width: 522, height: 122, borderRadius: 18, background: '#EFF6FF', border: '1px solid #BFDBFE', padding: '16px 18px', display: 'flex', alignItems: 'center', gap: 14}}>
              <div style={{width: 42, height: 42, borderRadius: 12, background: '#FFFFFF', color: C.blue, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: C.shadowSoft}}>
                <GlobeIcon size={22} />
              </div>
              <div style={{minWidth: 0}}>
                <div style={{fontFamily: FONT, fontSize: 13, color: C.muted}}>收录页</div>
                <div style={{fontFamily: FONT, fontSize: 24, fontWeight: 800, color: C.ink, letterSpacing: -0.4}}>dsh-plugin.org</div>
                <div style={{fontFamily: MONO, fontSize: 11.5, color: C.faint, whiteSpace: 'nowrap'}}>plugins/ceasarxuu/dsh-continue-task</div>
              </div>
              <div style={{marginLeft: 'auto', color: C.blue}}><ArrowRightIcon size={20} /></div>
            </div>

            <div style={{width: 522, height: 122, borderRadius: 18, background: '#FFFFFF', border: `1px solid ${C.line}`, padding: '16px 18px', display: 'flex', alignItems: 'center', gap: 14, boxShadow: C.shadowSoft}}>
              <div style={{width: 42, height: 42, borderRadius: 12, background: '#F1F5F9', color: C.ink, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                <GitHubIcon size={24} />
              </div>
              <div style={{minWidth: 0}}>
                <div style={{fontFamily: FONT, fontSize: 13, color: C.muted}}>GitHub · 源码与 Star</div>
                <div style={{fontFamily: FONT, fontSize: 21, fontWeight: 800, color: C.ink, letterSpacing: -0.3}}>ceasarXuu/dsh-continue-task</div>
                <div style={{fontFamily: MONO, fontSize: 11.5, color: C.faint, whiteSpace: 'nowrap'}}>github.com/ceasarXuu/dsh-continue-task</div>
              </div>
              <div style={{marginLeft: 'auto', color: C.inkSoft}}><ArrowRightIcon size={20} /></div>
            </div>
          </div>

          <div style={{marginTop: 16, fontFamily: FONT, fontSize: 14, color: C.faint}}>
            主动停止 / 子会话 / 已归档：不会自动恢复
          </div>
        </div>

        <div
          style={{
            width: 570,
            height: 610,
            borderRadius: 34,
            background: 'rgba(255,255,255,0.95)',
            border: '1px solid rgba(251,191,36,0.35)',
            boxShadow: '0 40px 100px rgba(15,23,42,0.14)',
            padding: 28,
            position: 'relative',
            transform: `translateY(${(1 - right) * 34}px) scale(${0.96 + right * 0.04})`,
            opacity: 1,
          }}
        >
          <div style={{fontFamily: MONO, fontSize: 11, letterSpacing: 2, color: C.faint, marginBottom: 18}}>MAINTAINER</div>
          <div style={{display: 'flex', alignItems: 'center', gap: 20}}>
            <div style={{width: 206, height: 206, borderRadius: '50%', padding: 6, background: 'linear-gradient(135deg, #2563EB, #F59E0B)', transform: `scale(${0.93 + avatarIn * 0.07})`}}>
              <Img
                src={staticFile('avatar.png')}
                style={{
                  width: '100%',
                  height: '100%',
                  borderRadius: '50%',
                  objectFit: 'cover',
                  border: '5px solid #FFFFFF',
                  boxSizing: 'border-box',
                }}
              />
            </div>
            <div>
              <div style={{fontFamily: FONT, fontSize: 30, fontWeight: 800, color: C.ink}}>ceasarXuu</div>
              <div style={{fontFamily: FONT, fontSize: 16, color: C.muted, marginTop: 4}}>DSH plugin author</div>
              <div style={{display: 'flex', alignItems: 'center', gap: 6, marginTop: 12, fontFamily: MONO, fontSize: 11, color: C.blue}}>
                <GitHubIcon size={14} /> github.com/ceasarXuu
              </div>
            </div>
          </div>

          <div style={{height: 1, background: C.lineSoft, margin: '24px 0 20px'}} />

          <div style={{display: 'flex', alignItems: 'center', gap: 9}}>
            <StarIcon size={22} color={C.amber} />
            <div style={{fontFamily: FONT, fontSize: 15, color: C.muted}}>如果它帮你少一次重来</div>
          </div>
          <div style={{fontFamily: FONT, fontSize: 36, fontWeight: 820, color: C.ink, letterSpacing: -0.8, marginTop: 6}}>
            求个 GitHub Star。
          </div>
          <div style={{fontFamily: FONT, fontSize: 15, color: C.muted, lineHeight: 1.55, marginTop: 8}}>
            让更多被中断过的 DSH 用户找到它。
          </div>

          <div
            style={{
              marginTop: 20,
              height: 58,
              borderRadius: 14,
              background: 'linear-gradient(135deg, #F59E0B, #FBBF24)',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 9,
              fontFamily: FONT,
              fontSize: 19,
              fontWeight: 800,
              boxShadow: '0 12px 28px rgba(245,158,11,0.30)',
              transform: `scale(${starPulse})`,
            }}
          >
            <StarIcon size={20} color="#FFFFFF" /> Star on GitHub
          </div>
          <div style={{marginTop: 10, textAlign: 'center', fontFamily: MONO, fontSize: 10, color: C.faint}}>
            github.com/ceasarXuu/dsh-continue-task
          </div>
          <div style={{position: 'absolute', left: 28, right: 28, bottom: 16, textAlign: 'center', fontFamily: MONO, fontSize: 10, color: C.faint}}>
            MIT License · npm @ceasarxuu/dsh-continue-task
          </div>
        </div>
      </div>

      {confetti.map((p, i) => {
        const t = interpolate(frame, [18 + p.d, 70 + p.d], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              right: p.x,
              top: p.y,
              width: p.r,
              height: p.r,
              borderRadius: i % 2 ? '50%' : 2,
              background: p.c,
              opacity: t * 0.65,
              transform: `translateY(${t * 18}px) rotate(${t * 120}deg)`,
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};
