import React from 'react';
import {AbsoluteFill, Audio, Sequence, staticFile} from 'remotion';
import {Background} from './components/Background';
import {Scene} from './components/Scene';
import {Hook} from './scenes/Hook';
import {Problems} from './scenes/Problems';
import {Pain} from './scenes/Pain';
import {Reveal} from './scenes/Reveal';
import {Modes} from './scenes/Modes';
import {Settings} from './scenes/Settings';
import {Proof} from './scenes/Proof';
import {End} from './scenes/End';

const GlobalStyle: React.FC = () => (
  <style>{`
    * { box-sizing: border-box; }
    body { margin: 0; background: #F7FAFF; }
  `}</style>
);

export const Promo: React.FC = () => {
  return (
    <AbsoluteFill style={{background: '#F7FAFF'}}>
      <GlobalStyle />
      <Background />
      <Audio src={staticFile('audio/music.mp3')} volume={0.65} />

      <Sequence from={0} durationInFrames={90} name="Hook">
        <Scene duration={90} enterY={24}><Hook /></Scene>
      </Sequence>
      <Sequence from={90} durationInFrames={120} name="Problems">
        <Scene duration={120} enterY={24}><Problems /></Scene>
      </Sequence>
      <Sequence from={210} durationInFrames={90} name="Pain">
        <Scene duration={90} enterY={24}><Pain /></Scene>
      </Sequence>
      <Sequence from={300} durationInFrames={120} name="Reveal">
        <Scene duration={120} enterY={18} fadeOut={false}><Reveal /></Scene>
      </Sequence>
      <Sequence from={420} durationInFrames={180} name="Modes">
        <Scene duration={180} enterY={24}><Modes /></Scene>
      </Sequence>
      <Sequence from={600} durationInFrames={90} name="Settings">
        <Scene duration={90} enterY={24}><Settings /></Scene>
      </Sequence>
      <Sequence from={690} durationInFrames={90} name="Proof">
        <Scene duration={90} enterY={24}><Proof /></Scene>
      </Sequence>
      <Sequence from={780} durationInFrames={120} name="End">
        <Scene duration={120} enterY={24} fadeOut={false}><End /></Scene>
      </Sequence>
    </AbsoluteFill>
  );
};
