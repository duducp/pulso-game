# 💓 PULSO

[![GitHub Pages](https://img.shields.io/github/deployments/duducp/pulso-game/github-pages?style=flat-square&label=deploy&logo=github&color=4DF0E0)](https://duducp.github.io/pulso-game)
[![PWA](https://img.shields.io/badge/PWA-instal%C3%A1vel-4DF0E0?style=flat-square&logo=pwa)](https://duducp.github.io/pulso-game)

**PULSO** é um jogo de reflexo minimalista. Toque para pulsar e desviar das barreiras. Quanto mais perto você passa, mais pontos ganha.

→ [jogue agora](https://pulso.game)

---

## ⚡ Como jogar

- **Toque / Espaço** — pulsa (seu personagem sobe)
- Passe **no meio das barreiras** para marcar pontos
- Passe **bem pertinho** para ganhar **pontos extras** e **energia** (combo)
- Energia cheia → **Modo Ruptura**: atravesse paredes e ganhe 3 pontos cada!
- **Modo Livre**: jogue sem limites
- **Desafio Diário**: mesma seed para todo mundo — quem faz mais pontos?

## 🚀 Comandos

```bash
npm install     # instalar dependências
npm run dev     # servidor de desenvolvimento (localhost:5173)
npm run build   # build de produção → dist/
npm run preview # preview do build
```

ou via Make:

```bash
make install
make dev
make build
make preview
```

## 📁 Estrutura

```
├── index.html              # HTML principal
├── public/
│   ├── manifest.json       # PWA manifest
│   ├── sw.js               # service worker (offline)
│   ├── icon-192.svg        # PWA ícone 192x192
│   └── icon-512.svg        # PWA ícone 512x512
├── src/
│   ├── main.ts             # entry point — orquestra sistemas
│   ├── types.ts            # interfaces e tipos
│   ├── constants.ts        # constantes do jogo
│   ├── modes.ts            # dados dos modos (labels, descrições, cores)
│   ├── game.ts             # lógica do jogo (classe Game)
│   ├── physics.ts          # helpers de física (gravidade, movimento)
│   ├── hud.ts              # gerenciamento DOM do HUD
│   ├── renderer.ts         # renderização Canvas (classe Renderer)
│   ├── particles.ts        # sistema de partículas
│   ├── audio.ts            # sons via Web Audio API
│   ├── storage.ts          # localStorage (ranking + progresso)
│   ├── ui.ts               # leaderboard DOM, share text
│   ├── input.ts            # eventos touch / teclado + helper onSwipe
│   ├── rng.ts              # RNG com seed (modo diário)
│   ├── score.ts            # ScoreManager — recordes e persistência
│   ├── powerups.ts         # dados e constantes de power-ups
│   ├── startScreen.ts      # tela inicial (carrossel + stats)
│   ├── carousel.ts         # carrossel de seleção de modo
│   ├── puModal.ts          # modal de detalhes dos power-ups
│   ├── pauseScreen.ts      # tela de pausa
│   ├── gameOverScreen.ts   # tela de fim de jogo + stats
│   └── style.css           # estilos
├── package.json
├── tsconfig.json
├── vite.config.ts
├── Makefile
└── README.md
```

## 🛠 Tecnologias

- [Vite](https://vitejs.dev) — bundler e dev server
- [TypeScript](https://www.typescriptlang.org) — tipos estáticos
- [Web Audio API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API) — sons procedurais
- Canvas 2D — renderização

## 📄 Licença

MIT
