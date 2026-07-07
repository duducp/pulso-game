# 🤖 PULSO — Regras para Agentes de IA

## Stack

- **Build**: Vite + TypeScript
- **Render**: Canvas 2D
- **Audio**: Web Audio API (procedural)
- **Storage**: localStorage (prefixo `pulso:`)
- **Sem framework** — TypeScript modular vanilla

## Estrutura

```
src/
├── main.ts       # Entry point — orquestra sistemas
├── types.ts      # Interfaces, tipos, constantes
├── game.ts       # Classe Game — estado, lógica, loop
├── renderer.ts   # Classe Renderer — desenho Canvas 2D
├── particles.ts  # Sistema de partículas
├── audio.ts      # Web Audio API
├── storage.ts    # localStorage (ranking + perfil)
├── ui.ts         # DOM, leaderboard, compartilhar
├── input.ts      # Eventos touch / teclado
├── rng.ts        # RNG com seed (modo diário)
└── style.css     # Estilos
```

## Regras Obrigatórias

### 1. Arquitetura
- `renderer.ts` **nunca** modifica estado do jogo — usa `getState(): GameState` somente leitura
- `game.ts` **nunca** faz renderização — delega ao `Renderer`
- `audio.ts` **nunca** toca sons se `soundEnabled === false`
- `ui.ts` só depende de `types.ts` — sem dependências circulares

### 2. Game Loop
- **Fixed timestep**: `STEP = 1/120` — `update()` sempre chamado com este dt
- `update()` retorna imediatamente se `paused === true`
- Particles são atualizadas via `updateParticles()` em `particles.ts`

### 3. Pause Mode
- **Escape** alterna pause via `togglePause()`
- Overlay de pause usa classe `visible` com CSS transitions (opacity + scale)
- Canvas recebe `filter: blur(5px)` com `.paused` no `#wrap`
- Ao despausar: overlay sai com animação de 250ms, estado do jogo restaura após o delay
- Som de pause: `soundPause()` (descendente), som de unpause: `soundUnpause()` (ascendente)

### 4. DOM
- **Nunca** use `display: none` para elementos com transição CSS — use `opacity` + `visibility`
- Elementos com animação usam classe `.visible` + CSS transitions
- Overlays sem animação (start, game over) usam `.hidden` (`display: none`)

### 5. Áudio
- `soundEnabled` flag global em `audio.ts` — `setSoundEnabled(bool)`, `isSoundEnabled()`
- Toda função de som (`soundPulse`, `soundBreak`, etc.) passa por `playTone()` que checa flag
- Sons de pause/unpause: volume baixo (0.03–0.04), tons suaves

### 6. Persistência
- localStorage prefixo `pulso:`
- Chaves: `pulso:lb:daily:<YYYY-MM-DD>`, `pulso:lb:global`, `pulso:profile:name`, `pulso:profile:best:free`, `pulso:profile:best:daily:<YYYY-MM-DD>`
- Ranking ordenado por score decrescente, top 20

### 7. TypeScript
- Strict mode habilitado
- `npm run dev` para testar, `npx tsc --noEmit` para type-check
- Prefira interfaces a types para objetos
- Use `as const` para constantes

### 8. Padrões de Código
- DOM refs cacheadas no construtor via `getElementById()`
- Funções de som em `audio.ts`, partículas em `particles.ts`, render em `renderer.ts`
- Game mode: `'menu' | 'playing' | 'paused' | 'over'`
- Eventos de entrada tratados em `input.ts`, não espalhados pelo código

## Comandos Úteis

```bash
npm run dev           # servidor dev (localhost:5173)
npx tsc --noEmit      # type-check
npx vite build        # build produção → dist/
make lint             # type-check (alias)
make build            # type-check + build
```
