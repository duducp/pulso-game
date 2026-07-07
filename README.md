# 💓 PULSO

[![GitHub Pages](https://img.shields.io/github/deployments/duducp/pulso-game/github-pages?style=flat-square&label=deploy&logo=github&color=4DF0E0)](https://duducp.github.io/pulso-game)

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
├── src/
│   ├── main.ts             # entry point — orquestra sistemas
│   ├── types.ts            # interfaces, tipos, constantes
│   ├── game.ts             # lógica do jogo (classe Game)
│   ├── renderer.ts         # renderização Canvas (classe Renderer)
│   ├── particles.ts        # sistema de partículas
│   ├── audio.ts            # sons via Web Audio API
│   ├── storage.ts          # localStorage (ranking + progresso)
│   ├── ui.ts               # manipulação DOM, leaderboard, share
│   ├── input.ts            # eventos touch / teclado
│   ├── rng.ts              # RNG com seed (modo diário)
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
