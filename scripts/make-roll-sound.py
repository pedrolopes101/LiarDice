"""Synthesizes assets/sounds/dice-roll.mp3: dice rattling and settling on a table.

Run with:  python3 scripts/make-roll-sound.py   (needs numpy and ffmpeg)
"""
import subprocess
import wave
from pathlib import Path

import numpy as np

RATE = 44100
LENGTH = 0.7  # seconds; the roll animation lasts 600 ms
rng = np.random.default_rng(7)  # fixed seed so the sound is reproducible


def clack(amplitude: float) -> np.ndarray:
    """One hard plastic-on-wood hit: a few damped resonances plus a noise click."""
    dur = 0.06
    t = np.arange(int(RATE * dur)) / RATE
    hit = np.zeros_like(t)
    for _ in range(3):
        freq = rng.uniform(1800, 4800)
        decay = rng.uniform(60, 140)
        hit += np.sin(2 * np.pi * freq * t + rng.uniform(0, 2 * np.pi)) * np.exp(-decay * t)
    hit += rng.normal(0, 1.2, t.size) * np.exp(-400 * t)  # the initial "tick"
    hit += 0.8 * np.sin(2 * np.pi * rng.uniform(180, 260) * t) * np.exp(-90 * t)  # table thud
    return amplitude * hit / np.max(np.abs(hit))


out = np.zeros(int(RATE * LENGTH))


def add(at: float, amplitude: float) -> None:
    sound = clack(amplitude)
    start = int(at * RATE)
    end = min(start + sound.size, out.size)
    out[start:end] += sound[: end - start]


# Rattle: dense, irregular hits.
t = 0.0
while t < 0.45:
    add(t, rng.uniform(0.35, 1.0))
    t += rng.uniform(0.012, 0.045)

# Settle: a few sparser, quieter hits as the dice come to rest.
for at, amp in [(0.49, 0.6), (0.54, 0.45), (0.58, 0.3), (0.61, 0.18)]:
    add(at + rng.uniform(-0.005, 0.005), amp)

out *= np.minimum(1, np.linspace(0, 40, out.size))  # avoid a click at the very start
out = out / np.max(np.abs(out)) * 0.8

root = Path(__file__).resolve().parent.parent
wav = root / "assets/sounds/dice-roll.wav"
mp3 = root / "assets/sounds/dice-roll.mp3"
with wave.open(str(wav), "wb") as f:
    f.setnchannels(1)
    f.setsampwidth(2)
    f.setframerate(RATE)
    f.writeframes((out * 32767).astype("<i2").tobytes())
subprocess.run(
    ["ffmpeg", "-y", "-loglevel", "error", "-i", str(wav), "-codec:a", "libmp3lame", "-b:a", "128k", str(mp3)],
    check=True,
)
wav.unlink()
print(f"wrote {mp3}")
