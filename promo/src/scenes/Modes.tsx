import React from 'react';
import {AbsoluteFill, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {C, FONT, MONO} from '../theme';
import {CheckIcon, LayersIcon, RefreshIcon, WifiOffIcon} from '../components/Icons';

const cardData = [
  {
    icon: RefreshIcon,
    title: '启动续传',
    desc: '崩溃 / 退出后，下次启动自动接上。',
    color: C.blue,
    tint: '#EFF6FF',
    tag: 'app-exit',
  },
  {
    icon: WifiOffIcon,
    title: '网络重试',
    desc: '指数退避，网络恢复就继续。',
    color: C.amber,
    tint: '#FFFBEB',
    tag: 'backoff',
  },
  {
    icon: LayersIcon,
    title: '额度切换',
    desc: '切到备用模型，再续传。',
    color: C.violet,
    tint: '#F5F3FF',
    tag: 'failover',
  },
];

const MiniApp: React.FC = () => (
  <div style={{background: '#FFFFFF', border: `1px solid ${C.lineSoft}`, borderRadius: 14, padding: 12, height: 190}}>
    <div style={{display: 'flex', gap: 5, marginBottom: 10}}>
      {['#FF6B6B', '#F6C453', '#45D483'].map((c) => <div key={c} style={{width: 7, height: 7, borderRadius: '50%', background: c}} />)}
      <div style={{fontFamily: MONO, fontSize: 9, color: C.faint, marginLeft: 4}}>session / resumed</div>
    </div>
    <div style={{display: 'flex', justifyContent: 'flex-end'}}>
      <div style={{background: '#ECFDF5', border: '1px solid #A7F3D0', color: '#047857', borderRadius: '10px 10px 3px 10px', padding: '7px 9px', fontFamily: FONT, fontSize: 11, fontWeight: 650}}>
        应用重启，继续未完成的任务。
      </div>
    </div>
    <div style={{display: 'flex', alignItems: 'center', gap: 6, marginTop: 12, color: C.green}}>
      <div style={{width: 18, height: 18, borderRadius: 6, background: '#ECFDF5', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
        <CheckIcon size={12} />
      </div>
      <div style={{fontFamily: MONO, fontSize: 10, color: C.muted}}>turn started · tools running</div>
    </div>
    <div style={{marginTop: 10, height: 5, borderRadius: 99, background: '#E2E8F0', overflow: 'hidden'}}>
      <div style={{width: '64%', height: '100%', background: C.green, borderRadius: 99}} />
    </div>
  </div>
);

const MiniNetwork: React.FC = () => (
  <div style={{background: '#FFFFFF', border: `1px solid ${C.lineSoft}`, borderRadius: 14, padding: 14, height: 190}}>
    <div style={{display: 'flex', alignItems: 'flex-end', gap: 5, height: 44}}>
      {[14, 22, 30, 38].map((h, i) => (
        <div key={i} style={{width: 12, height: h, borderRadius: 4, background: i === 3 ? C.green : '#FCD34D'}} />
      ))}
      <div style={{marginLeft: 'auto', fontFamily: MONO, fontSize: 10, color: C.green}}>connected</div>
    </div>
    <div style={{display: 'flex', gap: 6, marginTop: 14}}>
      {['15s', '30s', '60s'].map((t, i) => (
        <div key={t} style={{flex: 1, textAlign: 'center', padding: '7px 0', borderRadius: 8, background: i === 2 ? '#ECFDF5' : '#F8FAFC', border: `1px solid ${i === 2 ? '#A7F3D0' : C.lineSoft}`, fontFamily: MONO, fontSize: 11, color: i === 2 ? C.green : C.muted}}>
          {t}
        </div>
      ))}
    </div>
    <div style={{marginTop: 14, position: 'relative', height: 3, background: '#E2E8F0', borderRadius: 99}}>
      <div style={{position: 'absolute', left: 0, top: 0, width: '100%', height: '100%', background: C.green, borderRadius: 99, opacity: 0.5}} />
      <div style={{position: 'absolute', right: 0, top: -4, width: 11, height: 11, borderRadius: '50%', background: C.green, border: '2px solid #fff'}} />
    </div>
    <div style={{marginTop: 9, fontFamily: MONO, fontSize: 10, color: C.faint}}>retry #4 · network back</div>
  </div>
);

const MiniFailover: React.FC = () => (
  <div style={{background: '#FFFFFF', border: `1px solid ${C.lineSoft}`, borderRadius: 14, padding: 12, height: 190}}>
    <div style={{display: 'flex', alignItems: 'center', gap: 7, padding: '8px 9px', borderRadius: 9, border: '1px solid #FECACA', background: '#FEF2F2', opacity: 0.8}}>
      <div style={{width: 7, height: 7, borderRadius: '50%', background: C.red}} />
      <div style={{fontFamily: MONO, fontSize: 10, color: C.muted, textDecoration: 'line-through'}}>primary / model-a</div>
      <div style={{marginLeft: 'auto', fontFamily: MONO, fontSize: 9, color: C.red}}>QUOTA</div>
    </div>
    <div style={{textAlign: 'center', color: C.faint, fontSize: 12, lineHeight: '16px'}}>↓</div>
    <div style={{display: 'flex', alignItems: 'center', gap: 7, padding: '8px 9px', borderRadius: 9, border: `1px solid ${C.violet}55`, background: '#F5F3FF'}}>
      <div style={{width: 7, height: 7, borderRadius: '50%', background: C.violet}} />
      <div style={{fontFamily: MONO, fontSize: 10, color: C.inkSoft}}>backup / model-b</div>
      <div style={{marginLeft: 'auto', color: C.violet}}><CheckIcon size={13} /></div>
    </div>
    <div style={{marginTop: 12, fontFamily: FONT, fontSize: 11, color: C.muted}}>只改当前会话的模型</div>
    <div style={{marginTop: 4, fontFamily: MONO, fontSize: 10, color: C.violet}}>session-local selection</div>
  </div>
);

const miniMap = [MiniApp, MiniNetwork, MiniFailover];

export const Modes: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const active = Math.min(2, Math.floor(frame / 60));

  return (
    <AbsoluteFill style={{padding: '90px 170px'}}>
      <div style={{textAlign: 'center'}}>
        <div style={{fontFamily: FONT, fontSize: 16, letterSpacing: 2, color: C.muted, fontWeight: 650, marginBottom: 12}}>
          按原因分类，按策略恢复
        </div>
        <div style={{fontFamily: FONT, fontSize: 60, fontWeight: 800, letterSpacing: -1.5, color: C.ink, lineHeight: 1.1}}>
          三种中断，一种接法。
        </div>
      </div>

      <div style={{display: 'flex', justifyContent: 'center', gap: 38, marginTop: 44}}>
        {cardData.map((card, i) => {
          const s = spring({frame: Math.max(0, frame - i * 7), fps, config: {damping: 16, mass: 0.9}});
          const isActive = i === active;
          const Mini = miniMap[i];
          const Icon = card.icon;
          return (
            <div
              key={card.title}
              style={{
                width: 500,
                height: 500,
                borderRadius: 28,
                background: 'rgba(255,255,255,0.94)',
                border: `1.5px solid ${isActive ? card.color : C.lineSoft}`,
                boxShadow: isActive ? `0 30px 80px ${card.color}22` : '0 20px 55px rgba(15,23,42,0.08)',
                padding: 26,
                display: 'flex',
                flexDirection: 'column',
                position: 'relative',
                overflow: 'hidden',
                opacity: isActive ? 1 : 0.78,
                transform: `translateY(${(1 - s) * 36 - (isActive ? 9 : 0)}px) scale(${0.965 + s * 0.035 + (isActive ? 0.035 : 0)})`,
                transition: 'none',
              }}
            >
              <div style={{position: 'absolute', top: 0, left: 0, right: 0, height: 6, background: card.color}} />
              <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start'}}>
                <div style={{width: 62, height: 62, borderRadius: 18, background: card.tint, color: card.color, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                  <Icon size={30} />
                </div>
                <div style={{fontFamily: MONO, fontSize: 11, color: card.color, background: card.tint, borderRadius: 999, padding: '5px 9px'}}>{card.tag}</div>
              </div>
              <div style={{fontFamily: FONT, fontSize: 32, fontWeight: 800, color: C.ink, marginTop: 18, letterSpacing: -0.6}}>{card.title}</div>
              <div style={{fontFamily: FONT, fontSize: 19, color: C.muted, marginTop: 8, lineHeight: 1.45, height: 56}}>{card.desc}</div>
              <div style={{marginTop: 14}}><Mini /></div>
              <div style={{marginTop: 'auto', paddingTop: 12, display: 'flex', alignItems: 'center', gap: 6, borderTop: `1px solid ${C.lineSoft}`}}>
                <CheckIcon size={13} color={card.color} />
                <div style={{fontFamily: FONT, fontSize: 12, color: C.muted}}>
                  {['启动后自动执行', '只重试可重试错误', '不修改全局默认模型'][i]}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div style={{textAlign: 'center', marginTop: 30, fontFamily: FONT, fontSize: 17, color: C.muted}}>
        默认回看 30 分钟 · 每次最多 2 个 · 次数和等待上限都可调
      </div>
    </AbsoluteFill>
  );
};
