export type ClassicSource = {
  slug: string;
  white: string;
  black: string;
  year: number;
  event: string;
  difficulty: 1 | 2 | 3;
  pgn: string;
  solution: string;
  title: { pt: string; en: string };
  story: { pt: string; en: string };
};

export const CLASSICS: ClassicSource[] = [
  {
    slug: "mate-do-louco",
    white: "—",
    black: "—",
    year: 1600,
    event: "Armadilha clássica",
    difficulty: 1,
    pgn: "f3 e5 g4",
    solution: "Qh4#",
    title: { pt: "Mate do Louco", en: "Fool's Mate" },
    story: {
      pt: "O mate mais rápido possível no xadrez: apenas dois lances das brancas. Abrir a diagonal do rei com f3 e g4 é um convite ao desastre.",
      en: "The fastest possible checkmate: White makes only two moves. Opening the king's diagonal with f3 and g4 invites disaster.",
    },
  },
  {
    slug: "mate-do-pastor",
    white: "—",
    black: "—",
    year: 1750,
    event: "Armadilha clássica",
    difficulty: 1,
    pgn: "e4 e5 Bc4 Nc6 Qh5 Nf6",
    solution: "Qxf7#",
    title: { pt: "Mate do Pastor", en: "Scholar's Mate" },
    story: {
      pt: "A dama e o bispo miram juntos o ponto f7, defendido apenas pelo rei. Todo iniciante cai nele pelo menos uma vez — e depois aprende a defender.",
      en: "Queen and bishop gang up on f7, defended only by the king. Every beginner falls for it once — and then learns to defend.",
    },
  },
  {
    slug: "mate-de-legal",
    white: "Kermur de Légal",
    black: "Saint Brie",
    year: 1750,
    event: "Café de la Régence, Paris",
    difficulty: 1,
    pgn: "e4 e5 Nf3 d6 Bc4 Bg4 Nc3 g6",
    solution: "Nxe5 Bxd1 Bxf7+ Ke7 Nd5#",
    title: { pt: "O Mate de Légal", en: "Légal's Mate" },
    story: {
      pt: "Légal, professor de Philidor, entrega a dama de propósito. Se as pretas aceitam, três peças menores dão mate em seguida.",
      en: "Légal, Philidor's teacher, gives away his queen on purpose. If Black takes it, three minor pieces deliver mate.",
    },
  },
  {
    slug: "partida-da-opera",
    white: "Paul Morphy",
    black: "Duque de Brunswick e Conde Isouard",
    year: 1858,
    event: "Ópera de Paris",
    difficulty: 2,
    pgn: "e4 e5 Nf3 d6 d4 Bg4 dxe5 Bxf3 Qxf3 dxe5 Bc4 Nf6 Qb3 Qe7 Nc3 c6 Bg5 b5 Nxb5 cxb5 Bxb5+ Nbd7 O-O-O Rd8 Rxd7 Rxd7 Rd1 Qe6 Bxd7+ Nxd7",
    solution: "Qb8+ Nxb8 Rd8#",
    title: { pt: "A Partida da Ópera", en: "The Opera Game" },
    story: {
      pt: "Morphy jogou contra dois nobres no camarote da Ópera de Paris, durante O Barbeiro de Sevilha. A partida é a aula perfeita de desenvolvimento rápido e ataque.",
      en: "Morphy played two noblemen in their box at the Paris Opera during The Barber of Seville. It is the perfect lesson in rapid development and attack.",
    },
  },
  {
    slug: "partida-imortal",
    white: "Adolf Anderssen",
    black: "Lionel Kieseritzky",
    year: 1851,
    event: "Londres (partida amistosa)",
    difficulty: 2,
    pgn: "e4 e5 f4 exf4 Bc4 Qh4+ Kf1 b5 Bxb5 Nf6 Nf3 Qh6 d3 Nh5 Nh4 Qg5 Nf5 c6 g4 Nf6 Rg1 cxb5 h4 Qg6 h5 Qg5 Qf3 Ng8 Bxf4 Qf6 Nc3 Bc5 Nd5 Qxb2 Bd6 Bxg1 e5 Qxa1+ Ke2 Na6",
    solution: "Nxg7+ Kd8 Qf6+ Nxf6 Be7#",
    title: { pt: "A Partida Imortal", en: "The Immortal Game" },
    story: {
      pt: "Anderssen sacrificou as duas torres, um bispo e a dama — e ainda assim deu mate com as peças menores que sobraram. O auge do xadrez romântico.",
      en: "Anderssen gave up both rooks, a bishop and his queen — and still mated with the minor pieces left. The peak of romantic chess.",
    },
  },
  {
    slug: "partida-sempre-viva",
    white: "Adolf Anderssen",
    black: "Jean Dufresne",
    year: 1852,
    event: "Berlim (partida amistosa)",
    difficulty: 3,
    pgn: "e4 e5 Nf3 Nc6 Bc4 Bc5 b4 Bxb4 c3 Ba5 d4 exd4 O-O d3 Qb3 Qf6 e5 Qg6 Re1 Nge7 Ba3 b5 Qxb5 Rb8 Qa4 Bb6 Nbd2 Bb7 Ne4 Qf5 Bxd3 Qh5 Nf6+ gxf6 exf6 Rg8 Rad1 Qxf3",
    solution: "Rxe7+ Nxe7 Qxd7+ Kxd7 Bf5+ Ke8 Bd7+ Kf8 Bxe7#",
    title: { pt: "A Sempre-Viva", en: "The Evergreen Game" },
    story: {
      pt: "As pretas ameaçam mate, mas Anderssen chega primeiro: sacrifica a torre e a dama e caça o rei com os bispos. Steinitz a chamou de 'sempre-viva no louro de Anderssen'.",
      en: "Black threatens mate, but Anderssen strikes first: rook and queen sacrifices, then the bishops hunt the king. Steinitz called it 'the evergreen in Anderssen's laurel wreath'.",
    },
  },
  {
    slug: "reti-tartakower",
    white: "Richard Réti",
    black: "Savielly Tartakower",
    year: 1910,
    event: "Viena (partida rápida)",
    difficulty: 2,
    pgn: "e4 c6 d4 d5 Nc3 dxe4 Nxe4 Nf6 Qd3 e5 dxe5 Qa5+ Bd2 Qxe5 O-O-O Nxe4",
    solution: "Qd8+ Kxd8 Bg5+ Kc7 Bd8#",
    title: { pt: "Réti contra Tartakower", en: "Réti vs. Tartakower" },
    story: {
      pt: "Com o rei preto ainda no centro, Réti oferece a dama em d8. O xeque duplo seguinte é imparável — um dos mates mais curtos e elegantes entre mestres.",
      en: "With Black's king stuck in the center, Réti offers his queen on d8. The double check that follows cannot be stopped — one of the shortest, most elegant mates between masters.",
    },
  },
  {
    slug: "lasker-thomas",
    white: "Edward Lasker",
    black: "George Thomas",
    year: 1912,
    event: "Londres (partida amistosa)",
    difficulty: 3,
    pgn: "d4 e6 Nf3 f5 Nc3 Nf6 Bg5 Be7 Bxf6 Bxf6 e4 fxe4 Nxe4 b6 Ne5 O-O Bd3 Bb7 Qh5 Qe7",
    solution: "Qxh7+ Kxh7 Nxf6+ Kh6 Neg4+ Kg5 h4+ Kf4 g3+ Kf3 Be2+ Kg2 Rh2+ Kg1 Kd2#",
    title: { pt: "A Caça ao Rei de Lasker", en: "Lasker's King Hunt" },
    story: {
      pt: "Depois de sacrificar a dama em h7, Lasker arrasta o rei preto de g8 até g1 — atravessando o tabuleiro inteiro — e dá mate com o próprio rei.",
      en: "After a queen sacrifice on h7, Lasker drags Black's king from g8 all the way to g1 — across the whole board — and mates with his own king.",
    },
  },
  {
    slug: "partida-do-seculo",
    white: "Donald Byrne",
    black: "Bobby Fischer",
    year: 1956,
    event: "Rosenwald Memorial, Nova York",
    difficulty: 3,
    pgn: "Nf3 Nf6 c4 g6 Nc3 Bg7 d4 O-O Bf4 d5 Qb3 dxc4 Qxc4 c6 e4 Nbd7 Rd1 Nb6 Qc5 Bg4 Bg5 Na4 Qa3 Nxc3 bxc3 Nxe4 Bxe7 Qb6 Bc4 Nxc3 Bc5 Rfe8+ Kf1",
    solution: "Be6 Bxb6 Bxc4+ Kg1 Ne2+ Kf1 Nxd4+",
    title: { pt: "A Partida do Século", en: "The Game of the Century" },
    story: {
      pt: "Fischer, com 13 anos, entrega a dama com 17...Be6!! Em troca, recebe um 'moinho' de xeques descobertos e material demais para as brancas resistirem.",
      en: "Thirteen-year-old Fischer gives up his queen with 17...Be6!! In return he gets a windmill of discovered checks and far too much material for White to survive.",
    },
  },
  {
    slug: "kasparov-topalov",
    white: "Garry Kasparov",
    black: "Veselin Topalov",
    year: 1999,
    event: "Wijk aan Zee",
    difficulty: 3,
    pgn: "e4 d6 d4 Nf6 Nc3 g6 Be3 Bg7 Qd2 c6 f3 b5 Nge2 Nbd7 Bh6 Bxh6 Qxh6 Bb7 a3 e5 O-O-O Qe7 Kb1 a6 Nc1 O-O-O Nb3 exd4 Rxd4 c5 Rd1 Nb6 g3 Kb8 Na5 Ba8 Bh3 d5 Qf4+ Ka7 Rhe1 d4 Nd5 Nbxd5 exd5 Qd6",
    solution: "Rxd4 cxd4 Re7+ Kb6 Qxd4+ Kxa5 b4+",
    title: { pt: "A Imortal de Kasparov", en: "Kasparov's Immortal" },
    story: {
      pt: "24.Rxd4!! inicia uma das combinações mais profundas já jogadas: Kasparov arrasta o rei preto até a3 e b4, calculando muitos lances à frente.",
      en: "24.Rxd4!! starts one of the deepest combinations ever played: Kasparov drags Black's king up the board, calculating many moves ahead.",
    },
  },
];
