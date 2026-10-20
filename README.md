# Daily Chess

Um desafio de xadrez por dia, o mesmo para todo mundo, com resultado compartilhável no estilo Wordle. Também tem treino por tema, modo Rush e partidas clássicas. Next.js 15, mobile-first, PT-BR e EN.

## Rodando

```bash
npm install
npm run dev            # http://localhost:3000
npm test               # unitários + integridade dos dados (Vitest)
npm run test:e2e       # Playwright (celular e desktop); instale antes: npx playwright install chromium
npm run build && npm start
```

## Como funciona

- **Puzzle do dia** (`/`): escolhido no servidor a partir de `data/daily-schedule.json`. O dia vira à meia-noite de Brasília (`lib/daily.ts`). O cliente só recebe o puzzle de hoje. A dificuldade sobe ao longo da semana: segunda 800–1100, domingo 2000–2400.
- **Treino** (`/treino/[tema]`): 11 temas, com puzzles perto do nível do jogador, servidos por `app/api/puzzles`.
- **Rush** (`/rush`): 3 minutos, 3 vidas, dificuldade crescente.
- **Clássicos** (`/classicos`): partidas históricas em `data/classics.source.ts`, escritas em SAN e convertidas e validadas com chess.js.
- **Arquivo** e **Perfil**: o progresso fica no `localStorage` (Zustand persist em `lib/store.ts`).
- **Motor**: `lib/puzzle-engine.ts` é lógica pura e testada. Aceita mate alternativo, trata promoção, dicas em 2 níveis e "ver solução".

## Dados

Os puzzles vêm da [base aberta do Lichess](https://database.lichess.org/#puzzles) (CC0). Para regenerar:

```bash
curl -LO https://database.lichess.org/lichess_db_puzzle.csv.zst   # ~300 MB, requer zstd
npm run build:puzzles -- lichess_db_puzzle.csv.zst
```

O script filtra por qualidade (popularidade, número de partidas, desvio de rating) e valida cada linha com chess.js. Ele separa os puzzles do diário dos de treino, para que um não estrague o outro, e gera 730 dias de calendário.

## Próximas fases

- Fase 2: contas com Supabase, ranking diário e streak sincronizado.
- Fase 3: análise com Stockfish WASM e trilhas de aprendizado.
