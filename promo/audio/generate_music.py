"""Generate a 30 s bright launch track for the promo (120 BPM, C major)."""
import numpy as np
import wave

SR = 44100
DUR = 30.0
BPM = 120.0
BEAT = 60.0 / BPM
BAR = 4 * BEAT
N = int(SR * DUR)
t = np.arange(N) / SR
rng = np.random.default_rng(7)

mix = np.zeros((N, 2), dtype=np.float64)

def place(sig, start, gain=1.0, pan=0.0):
    """Add a mono signal at start seconds with constant-power pan."""
    i = int(start * SR)
    if i >= N:
        return
    sig = sig[: N - i]
    left = np.sqrt((1 - pan) / 2)
    right = np.sqrt((1 + pan) / 2)
    mix[i:i + len(sig), 0] += sig * gain * left
    mix[i:i + len(sig), 1] += sig * gain * right

def place_stereo(sig, start, gain=1.0):
    i = int(start * SR)
    if i >= N:
        return
    sig = sig[: N - i]
    mix[i:i + len(sig)] += sig * gain

def env_ar(n, attack, release):
    e = np.ones(n)
    a = min(int(attack * SR), n)
    r = min(int(release * SR), n)
    if a:
        e[:a] = np.linspace(0, 1, a)
    if r:
        e[-r:] *= np.linspace(1, 0, r)
    return e

def pad(freqs, dur):
    n = int(dur * SR)
    lt = np.arange(n) / SR
    out = np.zeros((n, 2))
    e = env_ar(n, 0.22, 0.5)
    for f in freqs:
        for side, detune in ((0, 0.9985), (1, 1.0015)):
            w = (np.sin(2 * np.pi * f * detune * lt)
                 + 0.18 * np.sin(2 * np.pi * f * 2 * detune * lt + 0.7)
                 + 0.08 * np.sin(2 * np.pi * f * 3 * detune * lt + 1.3))
            out[:, side] += w * e
    out *= 0.055 / max(1, len(freqs))
    return out

def pluck(freq, dur=0.32):
    n = int(dur * SR)
    lt = np.arange(n) / SR
    e = (1 - np.exp(-lt * 180)) * np.exp(-lt * 16)
    w = (np.sin(2 * np.pi * freq * lt)
         + 0.35 * np.sin(2 * np.pi * freq * 2 * lt + 0.4)
         + 0.14 * np.sin(2 * np.pi * freq * 3 * lt + 0.9))
    return w * e * 0.11

def bass(freq, dur=0.44):
    n = int(dur * SR)
    lt = np.arange(n) / SR
    e = env_ar(n, 0.008, 0.06) * np.exp(-lt * 1.5)
    return (np.sin(2 * np.pi * freq * lt) + 0.12 * np.sin(2 * np.pi * freq * 2 * lt)) * e * 0.15

def kick():
    n = int(0.5 * SR)
    lt = np.arange(n) / SR
    f = 46 + 95 * np.exp(-lt * 42)
    phase = 2 * np.pi * np.cumsum(f) / SR
    e = np.exp(-lt * 13)
    click = rng.normal(0, 1, n) * np.exp(-lt * 220) * 0.06
    return (np.sin(phase) * e * 0.42 + click)

def hat(open_=False):
    n = int((0.12 if open_ else 0.045) * SR)
    lt = np.arange(n) / SR
    noise = rng.normal(0, 1, n)
    noise = np.diff(noise, prepend=0)  # cheap high-pass
    e = np.exp(-lt * (28 if open_ else 90))
    return noise * e * (0.05 if open_ else 0.032)

def clap():
    n = int(0.18 * SR)
    lt = np.arange(n) / SR
    noise = rng.normal(0, 1, n)
    # three quick bursts + tail
    e = np.exp(-lt * 18)
    for d in (0.0, 0.012, 0.026):
        k = int(d * SR)
        e[k:] += 0.6 * np.exp(-(lt[: n - k]) * 55)
    return noise * (e / (np.max(np.abs(e)) + 1e-9)) * 0.12

def riser(dur=2.0):
    n = int(dur * SR)
    lt = np.arange(n) / SR
    noise = rng.normal(0, 1, n)
    # one-pole low-pass opening upward
    alpha = np.linspace(0.02, 0.4, n)
    out = np.zeros(n)
    for i in range(1, n):
        out[i] = out[i - 1] + alpha[i] * (noise[i] - out[i - 1])
    sweep = np.sin(2 * np.pi * np.cumsum(np.linspace(220, 1200, n)) / SR)
    e = (lt / dur) ** 2
    return (out * 0.9 + sweep * 0.12) * e * 0.16

def impact():
    n = int(0.7 * SR)
    lt = np.arange(n) / SR
    f = 34 + 80 * np.exp(-lt * 22)
    phase = 2 * np.pi * np.cumsum(f) / SR
    e = np.exp(-lt * 5)
    noise = rng.normal(0, 1, n) * np.exp(-lt * 20) * 0.18
    return np.sin(phase) * e * 0.45 + noise

# 15 bars, C major progression, last bar resolves to C.
PROG = [
    ("C",  [261.63, 329.63, 392.00], 130.81),
    ("G",  [196.00, 246.94, 293.66], 98.00),
    ("Am", [220.00, 261.63, 329.63], 110.00),
    ("F",  [174.61, 220.00, 261.63], 87.31),
]

for bar in range(15):
    start = bar * BAR
    name, freqs, root = PROG[bar % 4]
    if bar == 14:
        name, freqs, root = PROG[0]
    pad_sig = pad(freqs + [root * 2], BAR + 0.15)
    # sidechain the pad after the drums enter
    if start >= 4.0:
        phase = (np.arange(pad_sig.shape[0]) / SR) % BEAT
        pad_sig *= (1 - 0.22 * np.exp(-phase / 0.075))[:, None]
    # place pad as a stereo pair directly
    i = int(start * SR)
    j = min(N, i + pad_sig.shape[0])
    mix[i:j] += pad_sig[: j - i]

    # root bass on each beat from 4 s
    if start >= 4.0:
        for b in range(4):
            place(bass(root, 0.44), start + b * BEAT, 0.9)

    # pluck arpeggio, light in the intro
    notes = [f * 2 for f in freqs] + [root * 4]
    pattern = [0, 1, 2, 1, 3, 2, 1, 2]
    for step, idx in enumerate(pattern):
        when = start + step * (BEAT / 2)
        if when >= 27.0:
            continue
        pan = 0.25 if step % 2 == 0 else -0.25
        place(pluck(notes[idx % len(notes)]), when, 0.92 if start < 4.0 else 0.62, pan)
        if when >= 10.0:
            # ping-pong delay
            d = int(0.25 * SR)
            sig = pluck(notes[idx % len(notes)])[: max(0, N - int(when * SR) - d)]
            if len(sig):
                k = int(when * SR) + d
                m = min(N, k + len(sig))
                mix[k:m, 0] += sig[: m - k] * 0.11 * (-pan + 0.05)
                mix[k:m, 1] += sig[: m - k] * 0.11 * (pan + 0.05)

# drums
for beat_i in range(int(27.0 / BEAT)):
    when = beat_i * BEAT
    if when >= 4.0:
        place(kick(), when, 0.85)
    if when >= 4.0:
        place(hat(open_=(beat_i % 4 == 3)), when + BEAT / 2, 0.9)
    if when >= 8.0 and when < 27.0 and (beat_i % 4 in (1, 3)):
        place(clap(), when, 0.85)

# build and release
place(riser(2.0), 8.0, 0.9)
place(impact(), 10.0, 1.0)

# sparkle after the reveal and in the outro
sparkle_notes = [1046.50, 1318.51, 1567.98, 2093.00]
for i, when in enumerate(np.arange(10.25, 14.0, 0.25)):
    place(pluck(sparkle_notes[i % 4], 0.5), when, 0.32, 0.35 if i % 2 else -0.35)
for i, when in enumerate(np.arange(26.25, 29.3, 0.3)):
    place(pluck(sparkle_notes[i % 4], 0.7), when, 0.3, 0.4 if i % 2 else -0.4)

# final resolving chord at 27.0, with a soft low root
place_stereo(pad([261.63, 329.63, 392.00, 523.25], 3.0), 27.0, 1.0)
place(bass(65.41, 2.6), 27.0, 0.8)

# gentle stereo width + short feedback delay on the whole mix
delay = int(0.18 * SR)
wet = np.zeros_like(mix)
wet[delay:, 0] = mix[:-delay, 1] * 0.10
wet[delay:, 1] = mix[:-delay, 0] * 0.10
mix += wet

# soft clip, normalize, fades
mix = np.tanh(mix * 1.15) * 0.92
peak = np.max(np.abs(mix))
if peak > 0:
    mix = mix / peak * 0.95
fade_in = int(0.15 * SR)
fade_out = int(1.6 * SR)
mix[:fade_in] *= np.linspace(0, 1, fade_in)[:, None]
mix[-fade_out:] *= np.linspace(1, 0, fade_out)[:, None]

# 16-bit PCM WAV
pcm = np.clip(mix, -1, 1)
pcm = (pcm * 32767).astype(np.int16)
with wave.open("public/audio/music.wav", "wb") as f:
    f.setnchannels(2)
    f.setsampwidth(2)
    f.setframerate(SR)
    f.writeframes(pcm.tobytes())

print("wrote public/audio/music.wav", pcm.shape, "peak", np.max(np.abs(mix)))
