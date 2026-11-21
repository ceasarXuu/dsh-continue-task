import React from 'react';
import {AbsoluteFill, Img, interpolate, interpolateColors, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {C, FONT, MONO} from '../theme';
import {CheckIcon, ClockIcon, CursorIcon, LayersIcon, RefreshIcon} from '../components/Icons';

const Toggle: React.FC<{on: number; color?: string}> = ({on, color = C.blue}) => (
  <div style={{width: 54, height: 30, borderRadius: 99, background: interpolateColors(on, [0, 1], ['#CBD5E1', color]), padding: 3, boxSizing: 'border-box'}}>
    <div style={{width: 24, height: 24, borderRadius: '50%', background: '#FFFFFF', boxShadow: '0 2px 6px rgba(15,23,42,0.22)', transform: `translateX(${on * 24}px)`}} />
  </div>
);

const Row: React.FC<{title: string; hint: string; on: number; last?: boolean}> = ({title, hint, on, last}) => (
  <div style={{display: 'flex', alignItems: 'center', gap: 16, padding: '15px 0', borderBottom: last ? 'none' : `1px solid ${C.lineSoft}`}}>
    <div style={{flex: 1}}>
      <div style={{fontFamily: FONT, fontSize: 20, fontWeight: 700, color: C.ink}}>{title}</div>
      <div style={{fontFamily: FONT, fontSize: 14, color: C.faint, marginTop: 3}}>{hint}</div>
    </div>
    <Toggle on={on} />
  </div>
);

export const Settings: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const inAnim = spring({frame, fps, config: {damping: 18, mass: 0.9}});
  const on = spring({frame: Math.max(0, frame - 22), fps, config: {damping: 14, mass: 0.7}});
  const toast = spring({frame: Math.max(0, frame - 40), fps, config: {damping: 15, mass: 0.7}});
  const move = interpolate(frame, [6, 22, 34, 50], [0, 1, 1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const cursorX = interpolate(move, [0, 1], [700, 812]);
  const cursorY = interpolate(move, [0, 1], [520, 300]);
  const click = frame >= 24 && frame <= 28 ? 0.86 : 1;
  const linkGlow = interpolate(frame, [56, 64, 72], [0, 1, 0.4], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

  return (
    <AbsoluteFill style={{padding: '96px 100px', display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 62}}>
      <div style={{width: 650, transform: `translateY(${(1 - inAnim) * 30}px)`, opacity: 1}}>
        <div style={{fontFamily: MONO, fontSize: 13, letterSpacing: 2, color: C.blue, fontWeight: 700, marginBottom: 18}}>
          SETTINGS · 任务续传
        </div>
        <div style={{fontFamily: FONT, fontSize: 58, fontWeight: 800, color: C.ink, letterSpacing: -1.8, lineHeight: 1.16}}>
          策略、上限、
          <br />
          备用模型
        </div>
        <div style={{fontFamily: FONT, fontSize: 62, fontWeight: 820, color: C.blue, letterSpacing: -2, marginTop: 2}}>都能调。</div>
        <div style={{marginTop: 26}}>
          {[
            {icon: ClockIcon, text: '启动回看 30 分钟 · 最多 2 个'},
            {icon: RefreshIcon, text: '重试次数 / 单次与总等待上限'},
            {icon: LayersIcon, text: '备用 provider / model'},
            {icon: CheckIcon, text: '改完自动保存，无需点保存'},
          ].map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.text} style={{display: 'flex', alignItems: 'center', gap: 12, marginBottom: 15}}>
                <div style={{width: 28, height: 28, borderRadius: 9, background: '#EFF6FF', color: C.blue, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                  <Icon size={16} />
                </div>
                <div style={{fontFamily: FONT, fontSize: 18, color: C.muted}}>{item.text}</div>
              </div>
            );
          })}
        </div>
      </div>

      <div
        style={{
          width: 900,
          height: 520,
          borderRadius: 30,
          background: 'rgba(255,255,255,0.95)',
          border: `1px solid ${C.line}`,
          boxShadow: '0 34px 90px rgba(15,23,42,0.13)',
          padding: 28,
          position: 'relative',
          transform: `translateY(${(1 - inAnim) * 40}px) scale(${0.97 + inAnim * 0.03})`,
          opacity: 1,
        }}
      >
        <div style={{display: 'flex', alignItems: 'center', gap: 12, paddingBottom: 18, borderBottom: `1px solid ${C.lineSoft}`}}>
          <div style={{width: 44, height: 44, borderRadius: 13, background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden'}}>
            <Img src={staticFile('icon.svg')} style={{width: 30, height: 30}} />
          </div>
          <div>
            <div style={{fontFamily: FONT, fontSize: 24, fontWeight: 800, color: C.ink}}>任务续传</div>
            <div style={{fontFamily: MONO, fontSize: 11, color: C.faint, marginTop: 2}}>dsh-continue-task</div>
          </div>
          <div style={{marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6, background: '#ECFDF5', border: '1px solid #A7F3D0', color: '#047857', borderRadius: 999, padding: '5px 10px', fontFamily: FONT, fontSize: 12, fontWeight: 650}}>
            <span style={{width: 6, height: 6, borderRadius: '50%', background: C.green}} /> 已启用
          </div>
        </div>

        <div style={{marginTop: 4}}>
          <Row title="启动后继续" hint="回看 30 分钟 · 最多恢复 2 个" on={1} />
          <Row title="网络中断自动重试" hint="指数退避 · 总等待上限 30 分钟" on={1} />
          <Row title="额度不足切换模型" hint="已配置 1 个备用模型" on={on} last />
        </div>

        <div style={{display: 'flex', gap: 12, marginTop: 16}}>
          {[
            {label: '回看时间', value: '30 min'},
            {label: '最多恢复', value: '2'},
            {label: '重试次数', value: '10'},
          ].map((box) => (
            <div key={box.label} style={{flex: 1, background: '#F8FAFC', border: `1px solid ${C.lineSoft}`, borderRadius: 12, padding: '10px 12px'}}>
              <div style={{fontFamily: FONT, fontSize: 11, color: C.faint}}>{box.label}</div>
              <div style={{fontFamily: MONO, fontSize: 18, color: C.ink, fontWeight: 700, marginTop: 3}}>{box.value}</div>
            </div>
          ))}
        </div>

        <div style={{marginTop: 14, marginBottom: 18, display: 'flex', alignItems: 'center', gap: 9, background: '#F5F3FF', border: '1px solid #DDD6FE', borderRadius: 12, padding: '9px 12px'}}>
          <div style={{fontFamily: MONO, fontSize: 10, color: C.faint}}>backup</div>
          <div style={{fontFamily: MONO, fontSize: 12, color: C.violet}}>provider-b / model-b</div>
          <div style={{marginLeft: 'auto', color: C.violet}}><CheckIcon size={14} /></div>
        </div>

        <div style={{position: 'absolute', right: 28, bottom: 18, display: 'flex', alignItems: 'center', gap: 8}}>
          <div style={{width: 7, height: 7, borderRadius: '50%', background: C.blue, opacity: linkGlow}} />
          <div style={{fontFamily: FONT, fontSize: 13, color: C.blue, opacity: 0.65 + linkGlow * 0.35}}>恢复默认设置</div>
        </div>

        <div
          style={{
            position: 'absolute',
            top: -16,
            right: 22,
            display: 'flex',
            alignItems: 'center',
            gap: 7,
            background: '#ECFDF5',
            border: '1px solid #A7F3D0',
            color: '#047857',
            borderRadius: 10,
            padding: '8px 11px',
            fontFamily: FONT,
            fontSize: 12,
            fontWeight: 650,
            transform: `translateY(${(1 - toast) * -12}px)`,
            opacity: toast,
          }}
        >
          <CheckIcon size={14} /> 已自动保存
        </div>

        <div style={{position: 'absolute', left: cursorX, top: cursorY, transform: `scale(${click})`, opacity: frame < 52 ? 1 : Math.max(0, 1 - (frame - 52) / 8)}}>
          <CursorIcon size={30} color={C.ink} />
        </div>
      </div>
    </AbsoluteFill>
  );
};
