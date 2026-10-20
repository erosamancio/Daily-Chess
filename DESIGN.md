# Daily Chess — Design

**Ideia:** o tabuleiro é o produto. A interface é discreta, tirada do próprio tabuleiro (verdes e neutros levemente esverdeados), e um âmbar marca o que é recompensa: sequência, dica, recorde.

## Cor (tokens em `app/globals.css`)
| Token | Claro | Escuro | Uso |
|---|---|---|---|
| `--bg` | #eef1ea | #0c1310 | Fundo (neutro esverdeado, não creme) |
| `--surface` / `--surface-2` | #fff / #e4e9df | #141d18 / #1b2620 | Cartões / controles |
| `--ink` / `--ink-2` | #132019 / #4a5a50 | #e6eee8 / #9fb0a5 | Texto |
| `--brand` | #1e5a42 | #5cbd8b | Ação principal, navegação ativa |
| `--accent` | #d98e2a | #f0b14f | Sequência, dicas, Rush |
| `--good` / `--bad` | #2b8a56 / #c2463b | #4cc07f / #ec6c5f | Acerto / erro |

Tabuleiros (`components/board/boardThemes.ts`): verde (padrão), madeira, azul, ardósia.

## Tipografia
- **Bricolage Grotesque** (títulos, números de destaque): extrabold, tracking apertado.
- **Geist** (interface) e **Geist Mono** (notação, tempos, ratings; números tabulares).

## Layout
- Mobile-first: tabuleiro com largura total, controles ao alcance do polegar, navegação inferior.
- Desktop (≥1024 px): navegação lateral; tabuleiro de até 600 px à esquerda e painel de contexto à direita.

## Movimento (um momento de cada tipo)
- Lance certo: a casa pisca em verde e toca um "toc" de madeira mais um tom.
- Lance errado: a casa pisca em vermelho, o tabuleiro treme, o celular vibra e a peça volta.
- Resolvido: uma onda verde se espalha pelas casas a partir do lance final, com um acorde.
- Respeita `prefers-reduced-motion`.

## Componentes-chave
`PuzzleBoard` (tabuleiro interativo, carregado depois da hidratação, com `MiniBoard` estático no lugar), `ResultCard`, `WeekStrip` (barras cuja altura mostra a curva de dificuldade da semana), `ArchiveCalendar`, `Profile` (heatmap).

## Regras de interface
- **A instrução do puzzle é o título do momento:** quebra em até duas linhas e nunca é truncada. A cor de quem joga fica num chip à direita, não num rótulo acima.
- **Sem rótulos pequenos acima de títulos.** Número do dia, evento e ano vão na linha de metadados abaixo do título.
- **Números sempre com rótulo:** rating do puzzle ("Puzzle 1171", "Fácil · 1195" com título acessível), dicas restantes num contador no próprio botão.
- **Controles do tabuleiro numa linha só,** em qualquer largura a partir de 360 px. Abaixo de `sm`, os rótulos ficam curtos ("Solução").
- **Rush:** o herói é um relógio de xadrez (corpo escuro nos dois temas, visor âmbar), não um bloco de ícone.
