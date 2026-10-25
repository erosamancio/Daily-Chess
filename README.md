# Daily Chess

Um desafio de xadrez por dia, o mesmo para todo mundo, com resultado para compartilhar.

**Acesse:** [daily-chess-taupe.vercel.app](https://daily-chess-taupe.vercel.app)

## Funcionalidades

- **Desafio do dia** em três níveis: fácil, normal e difícil. O normal fica mais difícil ao longo da semana, de segunda a domingo.
- **Sequência de dias** resolvidos, com calendário do histórico.
- **Compartilhamento** do resultado em quadradinhos coloridos, sem revelar a solução.
- **Treino por tema** com 19 padrões táticos, como garfo, cravada, mate do corredor e zugzwang. Os puzzles se ajustam ao nível do jogador.
- **Rush** de 3 ou 5 minutos, com três vidas e dificuldade crescente.
- **Clássicos**: posições de partidas históricas para encontrar os lances dos grandes mestres.
- **Revisão**: os puzzles errados voltam até serem resolvidos sem erro.
- **Arquivo** com todos os desafios anteriores.
- **Perfil** com nível, recordes, desempenho por tema e conquistas.
- **Dicas** em dois níveis e opção de ver a solução.
- **Backup** do progresso em arquivo, para levar a outro aparelho.
- Sem cadastro: o progresso fica salvo no navegador.
- Português e inglês, tema claro e escuro, quatro estilos de tabuleiro e sons.
- Instalável no celular e funciona offline.

## Tecnologias

- [Next.js 15](https://nextjs.org) (App Router) e [React 19](https://react.dev)
- [TypeScript](https://www.typescriptlang.org)
- [Tailwind CSS 4](https://tailwindcss.com)
- [chess.js](https://github.com/jhlywa/chess.js) para as regras do xadrez
- [Zustand](https://zustand.docs.pmnd.rs) para o estado e a persistência local
- [next-intl](https://next-intl.dev) para os idiomas
- [Lucide](https://lucide.dev) para os ícones
- Web Audio API para os sons e Service Worker para o modo offline
- [Vitest](https://vitest.dev) e [Playwright](https://playwright.dev) para os testes
- [Vercel](https://vercel.com) para a hospedagem
