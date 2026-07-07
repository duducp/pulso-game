# PULSO — Minimal Reflex Game

## Stack
- **Build**: Vite + TypeScript
- **Render**: Canvas 2D
- **Audio**: Web Audio API (procedural)
- **Storage**: localStorage
- **No framework** — vanilla TypeScript modular architecture

## Project Structure
```
src/
├── main.ts       # Entry point — wires systems together
├── types.ts      # Interfaces, constants, GameState
├── game.ts       # Game class — state, logic, fixed-timestep loop
├── renderer.ts   # Renderer class — Canvas 2D drawing
├── particles.ts  # Particle system (ring, dot, shard, text)
├── audio.ts      # Web Audio API helpers
├── storage.ts    # localStorage wrapper (leaderboard, profile)
├── ui.ts         # DOM manipulation, leaderboard rendering, share
├── input.ts      # Pointer + keyboard event handling
├── rng.ts        # Seeded PRNG (xmur3 + mulberry32)
└── style.css     # All CSS
```

## Key Conventions
- **Fixed timestep**: `STEP = 1/120` — physics/update always called with this dt
- **Game exports `getState(): GameState`** — renderer reads from snapshot, never mutates
- **DOM refs cached** in Game class constructor via `getElementById`
- **Constants** in `types.ts`: `COLORS`, `POWER_PASS`, `POWER_NEAR`, `BREAK_DURATION`, `STEP`
- **localStorage prefix**: `pulso:`
- **No circular dependencies** — `ui.ts` only imports from `types.ts`

## Game Mechanics
- **Pulse** (tap/space): player jumps upward
- **Score**: passing obstacles safely = +1, near-miss (clearance < 16px) = +1 + combo bonus
- **Combo**: consecutive near-misses stack; reset on safe pass
- **Power**: near-miss = +30, safe pass = +16. At 100 → Break Mode
- **Break Mode**: 3.2s — destroy obstacles for +3 each
- **Daily mode**: seeded RNG from date string — same obstacles for everyone
