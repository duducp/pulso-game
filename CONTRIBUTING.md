# 🤝 Contribuindo para o PULSO

Obrigado pelo interesse em contribuir! PULSO é um jogo de reflexo minimalista feito com Vite + TypeScript + Canvas 2D.

## 📋 Índice

- [Código de Conduta](#código-de-conduta)
- [Começando](#começando)
- [Estrutura do Projeto](#estrutura-do-projeto)
- [Como Contribuir](#como-contribuir)
- [Padrões de Código](#padrões-de-código)
- [Testes](#testes)
- [Pull Requests](#pull-requests)

## Código de Conduta

Seja respeitoso e construtivo. Este projeto acolhe contribuidores de todos os níveis.

## Começando

```bash
# Clone o repositório
git clone https://github.com/seu-usuario/pulso.git
cd pulso

# Instale as dependências
npm install

# Inicie o servidor de desenvolvimento
npm run dev
```

**Pré-requisitos:** Node.js 18+ e npm.

## Estrutura do Projeto

```
├── index.html              # HTML principal
├── src/
│   ├── main.ts             # Entry point
│   ├── types.ts            # Interfaces, tipos e constantes
│   ├── game.ts             # Classe Game (estado e lógica)
│   ├── renderer.ts         # Renderização Canvas 2D
│   ├── particles.ts        # Sistema de partículas
│   ├── audio.ts            # Sons via Web Audio API
│   ├── storage.ts          # localStorage wrapper
│   ├── ui.ts               # DOM e leaderboard
│   ├── input.ts            # Eventos de entrada
│   └── rng.ts              # RNG com seed
├── .agents/                # Configuração para Codebuff/OpenCode
├── AGENTS.md               # Regras para agentes de IA
├── Makefile                # Comandos de atalho
└── package.json
```

## Como Contribuir

### 1. Issues

- Verifique se já não existe uma issue sobre o assunto
- Use templates disponíveis ao abrir uma nova issue
- Seja claro sobre o problema ou sugestão

### 2. Branches

```bash
# Crie uma branch a partir da main
git checkout -b feat/nome-da-feature
# ou
git checkout -b fix/nome-do-bug
```

### 3. Desenvolvimento

Faça suas alterações seguindo os padrões de código abaixo.

### 4. Commit

```bash
git add .
git commit -m "tipo: descrição concisa"
```

**Tipos de commit:**
- `feat:` — nova funcionalidade
- `fix:` — correção de bug
- `refactor:` — refatoração sem mudança de comportamento
- `style:` — formatação, CSS
- `docs:` — documentação
- `chore:` — tarefas de build/config

### 5. Pull Request

- Abra um PR para a branch `main`
- Descreva as mudanças de forma clara
- Referencie issues relacionadas
- Mantenha o escopo focado em uma única mudança

## Padrões de Código

### TypeScript

- Strict mode — o projeto compila com `strict: true`
- Prefira `interface` para objetos, `type` para uniões
- Use `as const` para constantes e configurações
- Evite `any` — prefira `unknown` se necessário

### Arquitetura

| Arquivo | Responsabilidade | Proibido |
|---------|-----------------|----------|
| `game.ts` | Estado e lógica do jogo | Renderizar, manipular som |
| `renderer.ts` | Desenho Canvas 2D | Modificar estado do jogo |
| `audio.ts` | Sons | Chamar renderização |
| `ui.ts` | DOM, leaderboard | Importar de game.ts |
| `input.ts` | Eventos de entrada | Qualquer lógica de jogo |

### Game Loop

- **Fixed timestep**: `STEP = 1/120` — `update()` sempre chamado com este dt
- `update()` retorna imediatamente se `paused === true`
- `Renderer.render()` recebe snapshot via `game.getState()` — **nunca** modifica o estado

### DOM

- Elementos com animação CSS usam `opacity` + `visibility` + classes `.visible`
- Elementos sem animação usam `.hidden` (`display: none`)
- Cacheie refs DOM no construtor via `getElementById()`

### Áudio

- Cada som tem sua própria função exportada (`soundPulse`, `soundBreak`, etc.)
- Todo som passa por `playTone()` que verifica `soundEnabled`
- Volume de sons novos: mantenha entre 0.03 e 0.15

### Persistência

- localStorage prefixo `pulso:`
- Chaves de perfil: `pulso:profile:*`
- Chaves de ranking: `pulso:lb:*`
- Chaves de recorde: `pulso:profile:best:*`

## Testes

```bash
# Type-check
npx tsc --noEmit

# Build de produção
npm run build
```

Testes unitários (quando disponíveis):
```bash
npx vitest run
```

## Commands Úteis

```bash
make dev       # Servidor de desenvolvimento
make build     # Type-check + build
make lint      # Type-check apenas
make preview   # Preview do build
make clean     # Remove dist e node_modules
```

## Dúvidas?

Abra uma [discussion](https://github.com/seu-usuario/pulso/discussions) ou uma issue. Respondemos assim que possível.

---

Feito com 💓 por contribuidores como você.
