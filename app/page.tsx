"use client";

import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import catalog from "./data/catalog.json";
import wantedData from "./data/wanted.json";

type MarketObservation = {
  source: string;
  display: string;
  numeric: number | null;
  url?: string;
  checkedAt?: string;
  status?: string;
  edition?: string;
  condition?: string;
  shipping?: string;
  note?: string;
};

type CatalogRecord = {
  id: string;
  sourceRow: number;
  lot: number | null;
  artist: string;
  title: string;
  year: number | null;
  years?: number[];
  auctionPrice: number | null;
  auctionPrices?: number[];
  auctionPriceStatus?: "unverified-copy";
  marketMin: number | null;
  market: MarketObservation[];
  tags: string[];
  adornosPrice?: number | null;
  adornosPrices?: number[];
};

type CatalogEdit = {
  id: string;
  status: "upserted" | "deleted";
  record: CatalogRecord | null;
};

type EditorSession = {
  signedIn: boolean;
  canEdit: boolean;
  email: string | null;
};

type CatalogDraft = {
  id: string;
  artist: string;
  title: string;
  year: string;
  mercadoLivre: string;
  olx: string;
  shopee: string;
  leilao: string;
  vinylSocialClub: string;
  adornos: string;
};

type EditableCatalogField = Exclude<keyof CatalogDraft, "id">;

type EditingCell = {
  recordId: string;
  field: EditableCatalogField;
};

type AuctionWatch = {
  lot: number;
  artist: string;
  title: string;
  date: string;
  condition: string;
  currentBid: number;
  nextBid: number;
  bidLabel?: string;
  ceiling: number;
  priority: string;
  tone: "high" | "medium" | "careful";
  note: string;
  url: string;
};

type AuctionEvent = {
  id: string;
  house: string;
  title: string;
  dates: string;
  expiresAt: string;
  costs: string;
  catalogUrl: string;
  updatedAt: string;
  items: AuctionWatch[];
};

type WantedPriority = "A+" | "A" | "B";

type WantedItem = {
  id: string;
  artist: string;
  title: string;
  priority: WantedPriority;
};

type SiteView = "catalogo" | "marcio";

const baseRecords = catalog.records as CatalogRecord[];
const wantedItems = wantedData as WantedItem[];
const preparedWanted = wantedItems.map((item) => ({
  item,
  artistKey: lookupText(item.artist),
  titleKey: lookupText(item.title),
}));

const auctionWatch: AuctionWatch[] = [
  {
    lot: 134,
    artist: "Creedence Clearwater Revival",
    title: "Willy and the Poor Boys",
    date: "24 ago · 15h",
    condition: "Disco e capa em bom estado",
    currentBid: 60,
    nextBid: 70,
    ceiling: 100,
    priority: "Procura Márcio · A",
    tone: "high",
    note: "Boa oportunidade no lance atual; confirmar selo e contracapa. Teto de R$ 100 sem confirmação da primeira edição brasileira Liberty FLP-35080.",
    url: "https://www.bruceangeirasleiloeiro.com.br/peca.asp?ID=31542976",
  },  {
    lot: 136,
    artist: "Creedence Clearwater Revival",
    title: "Cosmo's Factory",
    date: "24 ago · 15h",
    condition: "Disco e capa em bom estado",
    currentBid: 20,
    nextBid: 30,
    ceiling: 60,
    priority: "Prioridade alta",
    tone: "high",
    note: "Lance inicial muito baixo; confirmar prensagem antes de ampliar o teto.",
    url: "https://www.bruceangeirasleiloeiro.com.br/peca.asp?ID=31542996",
  },
  {
    lot: 52,
    artist: "INXS",
    title: "Kick",
    date: "24 ago · 15h",
    condition: "Disco e capa em bom estado",
    currentBid: 40,
    nextBid: 50,
    ceiling: 75,
    priority: "Prioridade alta",
    tone: "high",
    note: "Confirmar prensagem e encarte.",
    url: "https://www.bruceangeirasleiloeiro.com.br/peca.asp?ID=31531012",
  },
  {
    lot: 687,
    artist: "The Beatles",
    title: "Love Songs (2LP)",
    date: "26 ago · 15h",
    condition: "Discos em bons estados; capa com leves desgastes",
    currentBid: 30,
    nextBid: 40,
    ceiling: 60,
    priority: "Prioridade alta",
    tone: "high",
    note: "LP duplo; referência Adornos da lista: R$ 109. Edição não confirmada.",
    url: "https://www.bruceangeirasleiloeiro.com.br/peca.asp?ID=31729609",
  },
  {
    lot: 604,
    artist: "Grand Funk",
    title: "Phoenix",
    date: "25 ago · 15h",
    condition: "Leves riscos; capa com desgaste nas extremidades",
    currentBid: 40,
    nextBid: 50,
    ceiling: 50,
    priority: "Cautela",
    tone: "careful",
    note: "Não disputar acima do próximo lance sem rever o mercado.",
    url: "https://www.bruceangeirasleiloeiro.com.br/peca.asp?ID=31719579",
  },
  {
    lot: 608,
    artist: "Queen",
    title: "The Game",
    date: "25 ago · 15h",
    condition: "Leves arranhados; capa com desgastes",
    currentBid: 20,
    nextBid: 30,
    ceiling: 50,
    priority: "Boa aposta",
    tone: "medium",
    note: "Estado segura o teto; referência Adornos da lista: R$ 109.",
    url: "https://www.bruceangeirasleiloeiro.com.br/peca.asp?ID=31720761",
  },
  {
    lot: 643,
    artist: "Grand Funk Railroad",
    title: "Survival",
    date: "26 ago · 15h",
    condition: "Disco e capa em ótimo estado",
    currentBid: 60,
    nextBid: 70,
    ceiling: 110,
    priority: "1ª prioridade",
    tone: "high",
    note: "Melhor relação entre estado, lance e referências atuais.",
    url: "https://www.bruceangeirasleiloeiro.com.br/peca.asp?ID=31726396",
  },
  {
    lot: 644,
    artist: "Grand Funk Railroad",
    title: "E Pluribus Funk",
    date: "26 ago · 15h",
    condition: "Disco bom; capa com leves desgastes",
    currentBid: 70,
    nextBid: 80,
    ceiling: 110,
    priority: "Prioridade alta",
    tone: "medium",
    note: "Piso ativo visto: R$ 185. Confirmar encarte/moeda.",
    url: "https://www.bruceangeirasleiloeiro.com.br/peca.asp?ID=31726422",
  },
  {
    lot: 616,
    artist: "Supertramp",
    title: "Free As A Bird",
    date: "25 ago · 15h",
    condition: "Disco em bom estado; capa com leves desgastes; encarte não confirmado",
    currentBid: 10,
    nextBid: 20,
    ceiling: 35,
    priority: "Melhor Supertramp",
    tone: "high",
    note: "Ativos equivalentes começam em R$ 50; várias cópias completas aparecem entre R$ 60 e R$ 80. Não ampliar sem confirmar o encarte.",
    url: "https://www.bruceangeirasleiloeiro.com.br/peca.asp?ID=31721801",
  },
  {
    lot: 418,
    artist: "Supertramp",
    title: "The Autobiography Of Supertramp",
    date: "25 ago · 15h",
    condition: "Disco bom; capa com leves desgastes; encarte não confirmado",
    currentBid: 30,
    nextBid: 40,
    ceiling: 50,
    priority: "Boa compra",
    tone: "medium",
    note: "Mercado ativo muito espalhado: piso isolado perto de R$ 39 e faixa recorrente de R$ 79–115. Encarte muda o teto.",
    url: "https://www.bruceangeirasleiloeiro.com.br/peca.asp?ID=31690009",
  },
  {
    lot: 442,
    artist: "Supertramp",
    title: "Breakfast In America",
    date: "25 ago · 15h",
    condition: "Disco com riscos; capa com desgastes nas extremidades",
    currentBid: 30,
    nextBid: 40,
    ceiling: 40,
    priority: "Estado limita",
    tone: "careful",
    note: "Cópia VG+/VG+ localizada por R$ 95. O título é procurado, mas os riscos eliminam boa parte da margem.",
    url: "https://www.bruceangeirasleiloeiro.com.br/peca.asp?ID=31695055",
  },
];

const rtAuctionWatch: AuctionWatch[] = [
  {
    lot: 235,
    artist: "Sinéad O’Connor",
    title: "I Do Not Want What I Haven’t Got",
    date: "25 ago · 18h",
    condition: "Com encarte; capa e disco em bom estado",
    currentBid: 25,
    nextBid: 30,
    ceiling: 55,
    priority: "Melhor achado novo",
    tone: "high",
    note: "Comparáveis ativos diretamente equivalentes começam em R$ 62,90–67 e passam de R$ 80. A R$ 25, ainda há margem mesmo com 5%; frete não informado.",
    url: "https://www.rtleiloes.com.br/peca.asp?ID=32152965",
  },
  {
    lot: 338,
    artist: "Blues Etílicos",
    title: "IV",
    date: "25 ago · 18h",
    condition: "Com encarte; capa com desgaste leve; risco superficial no disco",
    currentBid: 40,
    nextBid: 40,
    bidLabel: "Abertura",
    ceiling: 70,
    priority: "Garimpo forte",
    tone: "high",
    note: "Cópias ativas com encarte aparecem por R$ 92–110; o risco superficial impede tratar como cópia de loja.",
    url: "https://www.rtleiloes.com.br/peca.asp?ID=32153073",
  },
  {
    lot: 347,
    artist: "Picassos Falsos",
    title: "Picassos Falsos",
    date: "25 ago · 18h",
    condition: "Com encarte; capa boa; risco leve no disco",
    currentBid: 55,
    nextBid: 60,
    ceiling: 85,
    priority: "Boa oportunidade",
    tone: "high",
    note: "Primeiro LP, RCA 1987. Comparáveis ativos ficam perto de R$ 101–130; conferir se o risco é apenas visual.",
    url: "https://www.rtleiloes.com.br/peca.asp?ID=32152953",
  },
  {
    lot: 99,
    artist: "Raça Negra",
    title: "Banda Raça Negra",
    date: "24 ago · 18h",
    condition: "Capa com desgaste leve; disco com alguns riscos superficiais",
    currentBid: 15,
    nextBid: 20,
    ceiling: 30,
    priority: "Barato com cautela",
    tone: "medium",
    note: "Há anúncios ativos desde R$ 35 e cópias de loja por R$ 60. Bom só com lance baixo porque o estado aproxima a cópia do piso.",
    url: "https://www.rtleiloes.com.br/peca.asp?ID=32152850",
  },
  {
    lot: 333,
    artist: "Supertramp",
    title: "Breakfast In America",
    date: "25 ago · 18h",
    condition: "Com encarte; capa com pequenos desgastes; risco superficial no disco",
    currentBid: 30,
    nextBid: 35,
    ceiling: 50,
    priority: "Preço bom · estado limita",
    tone: "medium",
    note: "O catálogo registra referência de R$ 79 e há cópias VG+/VG+ por R$ 95–120. Não perseguir: o risco e a capa tiram a margem acima de R$ 50.",
    url: "https://www.rtleiloes.com.br/peca.asp?ID=32153081",
  },
  {
    lot: 485,
    artist: "The Rolling Stones",
    title: "Steel Wheels",
    date: "26 ago · 18h",
    condition: "Com encarte; capa com desgaste leve; disco em bom estado",
    currentBid: 45,
    nextBid: 50,
    ceiling: 60,
    priority: "Só até o teto",
    tone: "medium",
    note: "O piso ativo diretamente comparável está perto de R$ 70. É interessante, mas a vantagem some rápido com comissão e frete.",
    url: "https://www.rtleiloes.com.br/peca.asp?ID=32152932",
  },
  {
    lot: 198,
    artist: "R.E.M.",
    title: "Out Of Time",
    date: "25 ago · 18h",
    condition: "Com encarte; capa com pequenos desgastes; disco com riscos sutis",
    currentBid: 50,
    nextBid: 55,
    ceiling: 110,
    priority: "Melhor do catálogo",
    tone: "high",
    note: "Nacional de 1991. Anúncios ativos comparáveis começam em R$ 139; testar os riscos antes de subir o teto.",
    url: "https://www.rtleiloes.com.br/peca.asp?ID=32153082",
  },
  {
    lot: 200,
    artist: "Gal Costa",
    title: "Plural",
    date: "25 ago · 18h",
    condition: "Com encarte; capa com pequenos desgastes; risco superficial no disco",
    currentBid: 33,
    nextBid: 38,
    ceiling: 40,
    priority: "Só até o teto",
    tone: "medium",
    note: "Edição de 1990. O lance já está em R$ 33; com 5%, vira R$ 34,65 antes do frete. Piso ativo visto em R$ 44–49.",
    url: "https://www.rtleiloes.com.br/peca.asp?ID=32152815",
  },
  {
    lot: 64,
    artist: "Finis Africae",
    title: "Finis Africae",
    date: "24 ago · 18h",
    condition: "Com encarte; capa com desgastes; risco bem sutil no disco",
    currentBid: 20,
    nextBid: 25,
    ceiling: 40,
    priority: "Garimpo forte",
    tone: "high",
    note: "Edição EMI de 1987. Comparáveis ativos aparecem de R$ 50 a R$ 89; não confundir com o mini-LP.",
    url: "https://www.rtleiloes.com.br/peca.asp?ID=32152978",
  },
  {
    lot: 363,
    artist: "Killing Joke",
    title: "Brighter Than A Thousand Suns",
    date: "26 ago · 18h",
    condition: "Capa dupla e encarte; desgaste leve; risco superficial sem afetar a reprodução",
    currentBid: 50,
    nextBid: 55,
    ceiling: 90,
    priority: "Boa oportunidade",
    tone: "high",
    note: "Comparável brasileiro localizado a R$ 185,55; confiança média porque a amostra ainda é pequena.",
    url: "https://www.rtleiloes.com.br/peca.asp?ID=32152948",
  },
  {
    lot: 211,
    artist: "Cazuza",
    title: "Burguesia (2LP)",
    date: "25 ago · 18h",
    condition: "Com encarte; capa e os dois discos em bom estado",
    currentBid: 40,
    nextBid: 45,
    ceiling: 55,
    priority: "Só até o teto",
    tone: "high",
    note: "Original duplo de 1989. Piso comparável ativo em torno de R$ 65–79; cópias completas aparecem acima disso.",
    url: "https://www.rtleiloes.com.br/peca.asp?ID=32152967",
  },
  {
    lot: 118,
    artist: "Zero",
    title: "Passos no Escuro",
    date: "24 ago · 18h",
    condition: "Com encarte; capa e disco em bom estado",
    currentBid: 25,
    nextBid: 30,
    ceiling: 30,
    priority: "No teto",
    tone: "high",
    note: "Comparáveis ativos começam perto de R$ 35–40, com várias cópias entre R$ 58 e R$ 85.",
    url: "https://www.rtleiloes.com.br/peca.asp?ID=32152951",
  },
  {
    lot: 8,
    artist: "The Alan Parsons Project",
    title: "The Turn Of A Friendly Card",
    date: "24 ago · 18h",
    condition: "Capa com pequenos desgastes; risco superficial em uma faixa",
    currentBid: 20,
    nextBid: 20,
    bidLabel: "Abertura",
    ceiling: 45,
    priority: "Você marcou",
    tone: "high",
    note: "Comparáveis ativos aparecem por R$ 73–80; o risco em uma faixa segura o teto.",
    url: "https://www.rtleiloes.com.br/peca.asp?ID=32153078",
  },
  {
    lot: 356,
    artist: "Pink Floyd",
    title: "Animals",
    date: "26 ago · 18h",
    condition: "Capa dupla e encarte; capa gasta; muitos riscos, com raros estalos",
    currentBid: 75,
    nextBid: 80,
    ceiling: 65,
    priority: "Teto ultrapassado · passar",
    tone: "careful",
    note: "O lance já passou do teto de R$ 65. Esta é uma cópia de audição arriscada, com muitos riscos; não pagar preço de VG.",
    url: "https://www.rtleiloes.com.br/peca.asp?ID=32152847",
  },
  {
    lot: 442,
    artist: "O Têrço",
    title: "Mudança de Tempo",
    date: "26 ago · 18h",
    condition: "Reedição de 1991; capa dupla e encarte; capa e disco em bom estado",
    currentBid: 65,
    nextBid: 70,
    ceiling: 65,
    priority: "No teto · passar se subir",
    tone: "medium",
    note: "Há anúncios da mesma reedição por R$ 80–89; a margem desaparece rapidamente com comissão e frete.",
    url: "https://www.rtleiloes.com.br/peca.asp?ID=32152952",
  },
  {
    lot: 1,
    artist: "Jorge Ben",
    title: "Sonsual",
    date: "24 ago · 18h",
    condition: "Com encarte; capa com pequenos desgastes; disco em bom estado",
    currentBid: 121,
    nextBid: 126,
    ceiling: 60,
    priority: "Teto estourado · passar",
    tone: "careful",
    note: "Já existe cópia equivalente anunciada por R$ 50. O lance foi a R$ 121 e vira R$ 127,05 com a comissão, antes do frete.",
    url: "https://www.rtleiloes.com.br/peca.asp?ID=32152938",
  },
];

const cataventoAuctionWatch: AuctionWatch[] = [
  {
    lot: 276,
    artist: "Midge Ure",
    title: "Pure",
    date: "21 ago · 20h",
    condition: "Edição de 1991, com encarte; capa boa; disco não testado",
    currentBid: 18,
    nextBid: 18,
    bidLabel: "Abertura",
    ceiling: 50,
    priority: "Aposta especulativa · 6,5/10",
    tone: "medium",
    note: "Sem comparável brasileiro localizado; referências estrangeiras variam bastante. Não subir sem confirmar a prensagem.",
    url: "https://leiloes.cataventodiscos.com.br/peca.asp?ID=32015448",
  },
  {
    lot: 310,
    artist: "Enigma",
    title: "MCMXC a.D.",
    date: "21 ago · 20h",
    condition: "Virgin, 1991; capa regular, sem encarte mencionado; disco não testado",
    currentBid: 28,
    nextBid: 28,
    bidLabel: "Abertura",
    ceiling: 28,
    priority: "Só no valor inicial · 5/10",
    tone: "careful",
    note: "Há anúncios ativos desde R$ 40–70; sem encarte e com frete separado, a margem desaparece rapidamente.",
    url: "https://leiloes.cataventodiscos.com.br/peca.asp?ID=32019505",
  },
  {
    lot: 316,
    artist: "Dead Or Alive",
    title: "Nude",
    date: "21 ago · 20h",
    condition: "Epic; capa regular, sem encarte mencionado; disco não testado",
    currentBid: 31,
    nextBid: 41,
    ceiling: 31,
    priority: "Não aumentar · 4,5/10",
    tone: "careful",
    note: "Existe anúncio ativo com encarte por R$ 49 e frete grátis; só compensa no lance atual e com envio combinado.",
    url: "https://leiloes.cataventodiscos.com.br/peca.asp?ID=32019537",
  },
  {
    lot: 321,
    artist: "Faith No More",
    title: "The Real Thing",
    date: "21 ago · 20h",
    condition: "London, 1990; capa regular com rasuras; disco não testado",
    currentBid: 89,
    nextBid: 99,
    ceiling: 69,
    priority: "Teto ultrapassado · passar",
    tone: "careful",
    note: "O lance já vira R$ 93,45 com comissão antes do frete; há anúncios ativos entre R$ 60 e R$ 100.",
    url: "https://leiloes.cataventodiscos.com.br/peca.asp?ID=32025535",
  },
  {
    lot: 327,
    artist: "Madonna",
    title: "Like a Prayer",
    date: "21 ago · 20h",
    condition: "Sire, 1989, com encarte; capa boa com anotações; disco não testado",
    currentBid: 69,
    nextBid: 79,
    ceiling: 85,
    priority: "Prioridade alta · 8/10",
    tone: "high",
    note: "Pedidos ativos vistos entre R$ 120 e R$ 266; manter o teto por causa do estado e da falta de teste.",
    url: "https://leiloes.cataventodiscos.com.br/peca.asp?ID=32025576",
  },
  {
    lot: 328,
    artist: "English Dogs",
    title: "Where Legend Began",
    date: "21 ago · 20h",
    condition: "Woodstock, 1987; capa gatefold boa, com encarte; disco não testado",
    currentBid: 59,
    nextBid: 69,
    ceiling: 80,
    priority: "Boa compra controlada · 6,5/10",
    tone: "medium",
    note: "Comparáveis ativos começam em R$ 78–99, com várias cópias entre R$ 140 e R$ 190; não entrar em guerra.",
    url: "https://leiloes.cataventodiscos.com.br/peca.asp?ID=32025578",
  },
  {
    lot: 329,
    artist: "Vulcano",
    title: "Anthropophagy",
    date: "21 ago · 20h",
    condition: "Rock Brigade, 1987, com encarte; capa boa; disco não testado",
    currentBid: 119,
    nextBid: 139,
    ceiling: 250,
    priority: "Garimpo principal · 8,5/10",
    tone: "high",
    note: "Originais com encarte aparecem pedidos a R$ 560–570. Confirmar matriz RBR-140/87; não comparar com reedições.",
    url: "https://leiloes.cataventodiscos.com.br/peca.asp?ID=32025580",
  },
  {
    lot: 387,
    artist: "Força Rap do Litoral",
    title: "Força Rap do Litoral",
    date: "21 ago · 20h",
    condition: "Edição original; capa regular; disco não testado",
    currentBid: 29,
    nextBid: 39,
    bidLabel: "Abertura",
    ceiling: 50,
    priority: "Lote mistério · 6,5/10",
    tone: "medium",
    note: "Pouco documentado e sem comparáveis suficientes; escassez ainda não prova valor.",
    url: "https://leiloes.cataventodiscos.com.br/peca.asp?ID=32056203",
  },
  {
    lot: 396,
    artist: "Manassas / Stephen Stills",
    title: "The Raven · álbum duplo de 1972",
    date: "21 ago · 20h",
    condition: "Atlantic, 1972, LP duplo; capa regular; discos não testados",
    currentBid: 69,
    nextBid: 79,
    ceiling: 100,
    priority: "Prioridade alta · 8/10",
    tone: "high",
    note: "Pedidos vistos entre R$ 200 e R$ 300; confirmar nas fotos qual é a edição, pois o título do lote parece impreciso.",
    url: "https://leiloes.cataventodiscos.com.br/peca.asp?ID=32056359",
  },
  {
    lot: 397,
    artist: "Lord Finesse & DJ Mike Smooth",
    title: "Funky Technician",
    date: "21 ago · 20h",
    condition: "Wild Pitch WPL 2003, 1990; capa regular; disco não testado",
    currentBid: 79,
    nextBid: 79,
    bidLabel: "Abertura",
    ceiling: 180,
    priority: "Garimpo principal · 8/10",
    tone: "high",
    note: "A capa dourada é compatível com o original americano; confirmar endereço e matriz DCHARLES HuB antes de ampliar o lance.",
    url: "https://leiloes.cataventodiscos.com.br/peca.asp?ID=32056372",
  },
  {
    lot: 405,
    artist: "Legião Urbana",
    title: "Legião Urbana",
    date: "21 ago · 20h",
    condition: "EMI, com encarte; capa regular; disco não testado",
    currentBid: 69,
    nextBid: 79,
    ceiling: 90,
    priority: "Boa oportunidade · 7,5/10",
    tone: "high",
    note: "O lote informa 1984, embora o álbum seja de 1985; conferir selo e edição antes de disputar.",
    url: "https://leiloes.cataventodiscos.com.br/peca.asp?ID=32056448",
  },
  {
    lot: 419,
    artist: "Vários artistas",
    title: "Rap Brasil 2",
    date: "21 ago · 20h",
    condition: "Som Livre, 1995; capa regular; disco não testado",
    currentBid: 58,
    nextBid: 68,
    ceiling: 120,
    priority: "Garimpo forte · 8/10",
    tone: "high",
    note: "Comparáveis ativos aparecem a R$ 179 no Mercado Livre e R$ 200 na OLX; o risco é a falta de teste.",
    url: "https://leiloes.cataventodiscos.com.br/peca.asp?ID=32056508",
  },
  {
    lot: 438,
    artist: "Língua de Trapo",
    title: "Língua de Trapo",
    date: "21 ago · 20h",
    condition: "Lira Paulistana, 1982; capa regular; disco não testado",
    currentBid: 18,
    nextBid: 28,
    ceiling: 40,
    priority: "Bom complemento · 7/10",
    tone: "high",
    note: "Comparáveis ativos começam em R$ 60–75; fica melhor se o frete puder ser combinado com outro lote.",
    url: "https://leiloes.cataventodiscos.com.br/peca.asp?ID=32056601",
  },
  {
    lot: 490,
    artist: "Fausto Fawcett e os Robôs Efêmeros",
    title: "Fausto Fawcett e os Robôs Efêmeros",
    date: "21 ago · 20h",
    condition: "Original WEA de 1987, com encarte; capa regular; disco não testado",
    currentBid: 39,
    nextBid: 49,
    ceiling: 90,
    priority: "Melhor garimpo · 8,5/10",
    tone: "high",
    note: "Pedidos ativos vistos entre R$ 160 e R$ 299; o risco principal é o disco não testado.",
    url: "https://leiloes.cataventodiscos.com.br/peca.asp?ID=32060268",
  },
];

const credanAuctionWatch: AuctionWatch[] = [
  {
    lot: 126,
    artist: "Live",
    title: "Mental Jewelry",
    date: "27 ago · 18h",
    condition: "Brasil 1992; capa EX+, encarte NM e disco EX",
    currentBid: 60,
    nextBid: 70,
    ceiling: 140,
    priority: "Melhor oportunidade",
    tone: "high",
    note: "Mesmo catálogo com encarte aparece ativo a partir de R$ 230; há venda internacional concluída por € 89. Teto já considera a incerteza do mercado local.",
    url: "https://www.credanceleiloes.com.br/peca.asp?ID=32122211",
  },
  {
    lot: 237,
    artist: "Temple of the Dog",
    title: "Temple of the Dog",
    date: "27 ago · 18h",
    condition: "Brasil 1992; capa VG+, encarte EX e disco M",
    currentBid: 160,
    nextBid: 170,
    ceiling: 300,
    priority: "Prioridade alta",
    tone: "high",
    note: "Pedidos ativos da primeira brasileira com encarte estão em R$ 800–850. A venda concluída encontrada é antiga; não perseguir acima do teto.",
    url: "https://www.credanceleiloes.com.br/peca.asp?ID=32122322",
  },
  {
    lot: 245,
    artist: "U2",
    title: "Achtung Baby",
    date: "27 ago · 18h",
    condition: "Brasil 1991; capa VG+; confirmar disco e encarte",
    currentBid: 30,
    nextBid: 40,
    ceiling: 90,
    priority: "Garimpo forte",
    tone: "high",
    note: "Anúncios brasileiros usados começam perto de R$ 130. Confirmar o encarte antes de ampliar o teto.",
    url: "https://www.credanceleiloes.com.br/peca.asp?ID=32122330",
  },
  {
    lot: 9,
    artist: "Art Popular",
    title: "Nova Era",
    date: "27 ago · 18h",
    condition: "Brasil 1995; capa VG+; confirmar mídia",
    currentBid: 15,
    nextBid: 20,
    ceiling: 50,
    priority: "Boa oportunidade",
    tone: "high",
    note: "Pedidos ativos vistos de R$ 80 a R$ 200, mas a liquidez é incerta. Comprar pelo preço, não pelo topo dos anúncios.",
    url: "https://www.credanceleiloes.com.br/peca.asp?ID=32122094",
  },
  {
    lot: 8,
    artist: "Art Popular",
    title: "O Canto da Razão",
    date: "27 ago · 18h",
    condition: "Brasil 1993; capa VG; confirmar mídia",
    currentBid: 15,
    nextBid: 20,
    ceiling: 40,
    priority: "Boa oportunidade",
    tone: "medium",
    note: "Comparáveis ativos aparecem por R$ 60–80. O estado VG e a amostra pequena seguram o teto.",
    url: "https://www.credanceleiloes.com.br/peca.asp?ID=32122093",
  },
  {
    lot: 14,
    artist: "The Beatles",
    title: "Os Reis do Iê Iê Iê",
    date: "27 ago · 18h",
    condition: "Brasil 1964 mono; capa VG+, disco VG e sem encarte",
    currentBid: 30,
    nextBid: 40,
    ceiling: 60,
    priority: "Boa oportunidade",
    tone: "medium",
    note: "Mesmo número de catálogo está anunciado por R$ 100 e R$ 180; houve oferta esgotada perto de R$ 60. Estado impede nota maior.",
    url: "https://www.credanceleiloes.com.br/peca.asp?ID=32122099",
  },
  {
    lot: 239,
    artist: "Titãs",
    title: "Go Back",
    date: "27 ago · 18h",
    condition: "Brasil 1988; capa M, encarte NM e disco M",
    currentBid: 30,
    nextBid: 40,
    ceiling: 65,
    priority: "Boa oportunidade",
    tone: "medium",
    note: "Conservação muito acima da média. Referência local ativa vista em R$ 80; o catálogo também guarda lance antigo de R$ 29.",
    url: "https://www.credanceleiloes.com.br/peca.asp?ID=32122324",
  },
  {
    lot: 25,
    artist: "The Bolshoi",
    title: "Friends",
    date: "27 ago · 18h",
    condition: "Brasil 1987; capa VG+; confirmar encarte e mídia",
    currentBid: 20,
    nextBid: 30,
    ceiling: 40,
    priority: "Preço interessante",
    tone: "medium",
    note: "Há cópia sem encarte por R$ 30 e várias entre R$ 50 e R$ 80. Só elevar o teto se estiver completo.",
    url: "https://www.credanceleiloes.com.br/peca.asp?ID=32122110",
  },
  {
    lot: 246,
    artist: "Ugly Kid Joe",
    title: "America's Least Wanted",
    date: "27 ago · 18h",
    condition: "Brasil 1992; capa NM, disco VG e sem encarte",
    currentBid: 80,
    nextBid: 90,
    ceiling: 110,
    priority: "Cautela",
    tone: "careful",
    note: "Pedidos ativos começam em R$ 150, mas disco VG e ausência de encarte eliminam boa parte da margem.",
    url: "https://www.credanceleiloes.com.br/peca.asp?ID=32122331",
  },
  {
    lot: 180,
    artist: "Red Hot Chili Peppers",
    title: "Blood Sugar Sex Magik (2LP)",
    date: "27 ago · 18h",
    condition: "Brasil 1991; capa e internos NM; discos NM/M",
    currentBid: 240,
    nextBid: 260,
    ceiling: 300,
    priority: "Monitorar sem perseguir",
    tone: "careful",
    note: "Pedidos ativos equivalentes começam perto de R$ 349, mas existe referência de loja bem menor sem disponibilidade confirmada.",
    url: "https://www.credanceleiloes.com.br/peca.asp?ID=32122265",
  },
  {
    lot: 3,
    artist: "The Alan Parsons Project",
    title: "Vulture Culture",
    date: "27 ago · 18h",
    condition: "Brasil 1985; capa e disco VG+; sem encarte; precisa limpeza",
    currentBid: 20,
    nextBid: 20,
    bidLabel: "Abertura",
    ceiling: 40,
    priority: "Boa oportunidade",
    tone: "high",
    note: "Ativos equivalentes começam em R$ 65; existe referência esgotada a R$ 20. Bom somente enquanto permanecer baixo.",
    url: "https://www.credanceleiloes.com.br/peca.asp?ID=32122088",
  },
  {
    lot: 231,
    artist: "Supertramp",
    title: "Even In The Quietest Moments",
    date: "27 ago · 18h",
    condition: "Brasil 1977; capa VG+, contracapa EX e disco NM; precisa limpeza",
    currentBid: 25,
    nextBid: 30,
    ceiling: 45,
    priority: "Monitorar",
    tone: "medium",
    note: "Há oferta ativa sem estado detalhado por R$ 37 e cópias completas entre R$ 65 e R$ 135. O disco NM sustenta o teto.",
    url: "https://www.credanceleiloes.com.br/peca.asp?ID=32122316",
  },
  {
    lot: 232,
    artist: "Supertramp",
    title: "Famous Last Words",
    date: "27 ago · 18h",
    condition: "Brasil 1982; capa VG+, contracapa EX e disco NM; encarte não informado",
    currentBid: 20,
    nextBid: 25,
    ceiling: 30,
    priority: "Preço normal",
    tone: "careful",
    note: "Já existem anúncios ativos por R$ 25–30, inclusive com encarte. Não vale transformar em disputa.",
    url: "https://www.credanceleiloes.com.br/peca.asp?ID=32122317",
  },
];
const acioliAuctionWatch: AuctionWatch[] = [
  {
    lot: 61,
    artist: "Damnation",
    title: "The Second Damnation",
    date: "27 ago · 19h",
    condition: "Original brasileira de 1970; capa VG e disco VG+; matriz informada S-UA-6773",
    currentBid: 150,
    nextBid: 150,
    bidLabel: "Abertura",
    ceiling: 120,
    priority: "Teto ultrapassado · passar",
    tone: "careful",
    note: "Há anúncio nacional aparentemente equivalente por R$ 120 com frete grátis. Confirmar matriz, mas não entrar no valor atual.",
    url: "https://www.aciolileiloes.com.br/peca.asp?ID=31983926",
  },
  {
    lot: 73,
    artist: "Dire Straits",
    title: "On Every Street",
    date: "27 ago · 19h",
    condition: "Brasil 1991; capa, encarte e disco VG+",
    currentBid: 60,
    nextBid: 60,
    bidLabel: "Abertura",
    ceiling: 60,
    priority: "No limite · 6,8/10",
    tone: "careful",
    note: "O piso ativo começa em R$ 79,60; comissão e frete consomem a vantagem. Não disputar acima da abertura.",
    url: "https://www.aciolileiloes.com.br/peca.asp?ID=31984923",
  },
  {
    lot: 99,
    artist: "4 Non Blondes",
    title: "Bigger, Better, Faster, More!",
    date: "27 ago · 19h",
    condition: "Brasil 1992; capa, encarte e disco VG+",
    currentBid: 60,
    nextBid: 65,
    ceiling: 105,
    priority: "Garimpo principal · 9,3/10",
    tone: "high",
    note: "Comparáveis ativos: OLX R$ 150–200 e Mercado Livre R$ 189–230. Confirmar a prensagem nas fotos.",
    url: "https://www.aciolileiloes.com.br/peca.asp?ID=32009060",
  },
  {
    lot: 145,
    artist: "Marillion",
    title: "Seasons End",
    date: "27 ago · 19h",
    condition: "Brasil 1989; capa gatefold e disco VG+",
    currentBid: 20,
    nextBid: 20,
    bidLabel: "Abertura",
    ceiling: 50,
    priority: "Garimpo principal · 9,2/10",
    tone: "high",
    note: "Comparáveis ativos começam em R$ 80 e se concentram perto de R$ 90–146. Bom enquanto permanecer baixo.",
    url: "https://www.aciolileiloes.com.br/peca.asp?ID=32019441",
  },
  {
    lot: 209,
    artist: "The Cult",
    title: "Sonic Temple",
    date: "28 ago · 19h",
    condition: "1ª brasileira 068 427007 1; capa e encarte VG, disco VG+",
    currentBid: 40,
    nextBid: 40,
    bidLabel: "Abertura",
    ceiling: 60,
    priority: "Prioridade alta · 9/10",
    tone: "high",
    note: "Piso ativo isolado em R$ 85; faixa mais recorrente de R$ 120–189. O encarte ajuda, mas o teto continua controlado.",
    url: "https://www.aciolileiloes.com.br/peca.asp?ID=32033153",
  },
  {
    lot: 217,
    artist: "Titãs",
    title: "Jesus Não Tem Dentes no País dos Banguelas",
    date: "28 ago · 19h",
    condition: "Brasil 1987; capa, encarte e disco VG",
    currentBid: 20,
    nextBid: 20,
    bidLabel: "Abertura",
    ceiling: 50,
    priority: "Garimpo forte · 8,7/10",
    tone: "high",
    note: "Comparáveis ativos aparecem de R$ 79 a R$ 149. Estado VG impede perseguir o lote acima do teto.",
    url: "https://www.aciolileiloes.com.br/peca.asp?ID=32053645",
  },
  {
    lot: 236,
    artist: "Alcione",
    title: "Não Deixe o Samba Morrer",
    date: "28 ago · 19h",
    condition: "Globo/Polydor, 1995; capa e disco VG",
    currentBid: 2,
    nextBid: 4,
    ceiling: 75,
    priority: "Melhor oportunidade · 9,7/10",
    tone: "high",
    note: "Comparáveis ativos da edição de 1995 aparecem de R$ 120 a R$ 240. Melhor relação entre lance e mercado do catálogo.",
    url: "https://www.aciolileiloes.com.br/peca.asp?ID=32095908",
  },
  {
    lot: 246,
    artist: "Carlinhos Félix",
    title: "Basta Querer",
    date: "28 ago · 19h",
    condition: "MK, 1993; capa e disco VG; encarte não informado",
    currentBid: 2,
    nextBid: 4,
    ceiling: 65,
    priority: "Prioridade alta · 9,5/10",
    tone: "high",
    note: "Comparáveis ativos aparecem por R$ 110, R$ 150 e R$ 249,95. Liquidez de nicho segura o teto.",
    url: "https://www.aciolileiloes.com.br/peca.asp?ID=32097061",
  },
  {
    lot: 259,
    artist: "Ed Motta & Conexão Japeri",
    title: "Ed Motta & Conexão Japeri",
    date: "28 ago · 19h",
    condition: "WEA, 1988; capa e disco VG",
    currentBid: 22,
    nextBid: 24,
    ceiling: 50,
    priority: "Garimpo forte · 8,8/10",
    tone: "high",
    note: "Há cópia com capa pior por R$ 79; as demais referências ativas começam em R$ 106–150.",
    url: "https://www.aciolileiloes.com.br/peca.asp?ID=32099648",
  },
  {
    lot: 285,
    artist: "Michel Petrucciani",
    title: "Power of Three",
    date: "28 ago · 19h",
    condition: "Blue Note; capa, encarte e disco VG",
    currentBid: 2,
    nextBid: 4,
    ceiling: 45,
    priority: "Garimpo forte · 8,5/10",
    tone: "high",
    note: "Dois comparáveis brasileiros localizados por R$ 89,05 e R$ 110; confiança média pela amostra pequena.",
    url: "https://www.aciolileiloes.com.br/peca.asp?ID=32103966",
  },
  {
    lot: 318,
    artist: "Wayne Shorter",
    title: "Joy Ryder",
    date: "28 ago · 19h",
    condition: "Columbia, 1988; capa e disco VG+",
    currentBid: 5,
    nextBid: 7,
    ceiling: 50,
    priority: "Curinga jazz · 8,3/10",
    tone: "medium",
    note: "Comparável brasileiro localizado por R$ 119,90, mas sem amostra suficiente para uma nota de confiança alta.",
    url: "https://www.aciolileiloes.com.br/peca.asp?ID=32104613",
  },
  {
    lot: 319,
    artist: "Zbigniew Namysłowski Quintet",
    title: "Winobranie · Polish Jazz Vol. 33",
    date: "28 ago · 19h",
    condition: "Muza, 1973; capa e disco VG+; confirmar selo e matriz",
    currentBid: 6,
    nextBid: 8,
    ceiling: 45,
    priority: "Curinga importado · 7,8/10",
    tone: "medium",
    note: "Referências polonesas aparecem por 45–100 zł antes do frete. Interessante, mas com liquidez local incerta.",
    url: "https://www.aciolileiloes.com.br/peca.asp?ID=32104625",
  },
];

const albertoLopesAuctionWatch: AuctionWatch[] = [
  {
    lot: 29,
    artist: "Impacto V",
    title: "Rio Potengi",
    date: "26 ago · 19h",
    condition: "Capa VG; disco NM; com encarte",
    currentBid: 25,
    nextBid: 35,
    ceiling: 50,
    priority: "Aposta · 5,5/10",
    tone: "careful",
    note: "Sem comparável brasileiro exato. Não confundir com outros títulos do Impacto V nem ultrapassar o teto sem confirmar a edição.",
    url: "https://www.albertolopesleiloeiro.com.br/peca.asp?ID=32104991",
  },
  {
    lot: 35,
    artist: "Diana Pequeno",
    title: "Sinal de Amor",
    date: "26 ago · 19h",
    condition: "Capa VG+; disco NM; encarte não informado",
    currentBid: 15,
    nextBid: 25,
    ceiling: 45,
    priority: "Boa compra · 7,5/10",
    tone: "medium",
    note: "Comparáveis ativos em R$ 50–90. O teto pode chegar a R$ 60 somente se o encarte for confirmado.",
    url: "https://www.albertolopesleiloeiro.com.br/peca.asp?ID=32104997",
  },
  {
    lot: 41,
    artist: "Alice in Chains",
    title: "Facelift",
    date: "26 ago · 19h",
    condition: "Capa VG+; disco NM; com encarte; confirmar país e ano",
    currentBid: 320,
    nextBid: 340,
    ceiling: 360,
    priority: "Só até o teto · 6/10",
    tone: "careful",
    note: "Usados comparáveis começam em R$ 380–395. A vantagem já é curta após comissão e frete.",
    url: "https://www.albertolopesleiloeiro.com.br/peca.asp?ID=32105003",
  },
  {
    lot: 185,
    artist: "Iron Maiden",
    title: "A Real Live One",
    date: "26 ago · 19h",
    condition: "Capa e disco VG+; encarte não informado",
    currentBid: 102,
    nextBid: 122,
    ceiling: 180,
    priority: "Garimpo principal · 8,5/10",
    tone: "high",
    note: "Comparáveis ativos em R$ 300–480. Teto de R$ 180 sem encarte; até R$ 220 se estiver completo.",
    url: "https://www.albertolopesleiloeiro.com.br/peca.asp?ID=32105147",
  },
  {
    lot: 385,
    artist: "Supertramp",
    title: "The Autobiography of Supertramp",
    date: "27 ago · 19h",
    condition: "Capa e disco NM; com encarte",
    currentBid: 25,
    nextBid: 35,
    ceiling: 55,
    priority: "Preço normal · 6/10",
    tone: "careful",
    note: "Existe comparável ativo a R$ 38,99. O excelente estado ajuda, mas não vale transformar em disputa.",
    url: "https://www.albertolopesleiloeiro.com.br/peca.asp?ID=32105347",
  },
  {
    lot: 449,
    artist: "Santana",
    title: "Abraxas",
    date: "27 ago · 19h",
    condition: "Capa e disco VG+; confirmar selo e ano",
    currentBid: 25,
    nextBid: 35,
    ceiling: 75,
    priority: "Garimpo principal · 8,5/10",
    tone: "high",
    note: "Procura do Márcio. Comparáveis nacionais começam em R$ 109; teto de R$ 90 só se for prensagem antiga.",
    url: "https://www.albertolopesleiloeiro.com.br/peca.asp?ID=32105411",
  },
  {
    lot: 453,
    artist: "Kiss",
    title: "Revenge",
    date: "27 ago · 19h",
    condition: "Disco perfeito; capa em mau estado; edição não confirmada",
    currentBid: 15,
    nextBid: 25,
    ceiling: 110,
    priority: "Garimpo principal · 8,5/10",
    tone: "high",
    note: "Comparáveis ativos em R$ 270–445. Até R$ 150 somente se a edição de 1992 for confirmada.",
    url: "https://www.albertolopesleiloeiro.com.br/peca.asp?ID=32105415",
  },
  {
    lot: 455,
    artist: "Muddy Waters",
    title: "Hard Again",
    date: "27 ago · 19h",
    condition: "Capa e disco VG+; encarte não informado",
    currentBid: 71,
    nextBid: 81,
    ceiling: 120,
    priority: "Muito bom · 7,5/10",
    tone: "medium",
    note: "Comparáveis ativos em R$ 180–280. Manter teto conservador sem confirmar edição e encarte.",
    url: "https://www.albertolopesleiloeiro.com.br/peca.asp?ID=32105417",
  },
  {
    lot: 473,
    artist: "Hermeto Paschoal e Grupo",
    title: "Brasil Universo",
    date: "27 ago · 19h",
    condition: "Disco NM; capa em mau estado; encarte não informado",
    currentBid: 35,
    nextBid: 45,
    ceiling: 80,
    priority: "Muito bom · 7,5/10",
    tone: "medium",
    note: "Comparáveis completos em R$ 160–285. A capa ruim e a falta do encarte limitam o teto.",
    url: "https://www.albertolopesleiloeiro.com.br/peca.asp?ID=32105435",
  },
  {
    lot: 545,
    artist: "Beto Guedes",
    title: "Amor de Índio",
    date: "27 ago · 19h",
    condition: "Capa e disco NM; com encarte",
    currentBid: 35,
    nextBid: 45,
    ceiling: 70,
    priority: "Boa compra · 8/10",
    tone: "high",
    note: "Procura do Márcio. Comparáveis em R$ 68–125; estado NM e encarte tornam o lance atraente.",
    url: "https://www.albertolopesleiloeiro.com.br/peca.asp?ID=32105507",
  },
  {
    lot: 575,
    artist: "Rumo",
    title: "Rumo",
    date: "27 ago · 19h",
    condition: "Capa e disco VG; encarte não informado",
    currentBid: 15,
    nextBid: 25,
    ceiling: 45,
    priority: "Bom · 7/10",
    tone: "medium",
    note: "Anúncios ativos perto de R$ 90–96. O estado VG reduz a margem.",
    url: "https://www.albertolopesleiloeiro.com.br/peca.asp?ID=32105537",
  },
  {
    lot: 583,
    artist: "Aguilar e Banda Performática",
    title: "Aguilar e Banda Performática",
    date: "27 ago · 19h",
    condition: "Capa VG+; disco VG",
    currentBid: 75,
    nextBid: 85,
    ceiling: 120,
    priority: "Bom · 7,5/10",
    tone: "medium",
    note: "Comparável ativo por R$ 229 em estado superior. A condição VG pede teto mais baixo.",
    url: "https://www.albertolopesleiloeiro.com.br/peca.asp?ID=32105545",
  },
];

const auctionEvents: AuctionEvent[] = [
  {
    id: "catavento-discos-64297",
    house: "Catavento Discos",
    title: "61º Leilão · discos, CDs e equipamentos vintage",
    dates: "20 e 21 de agosto · 20h",
    expiresAt: "2026-08-22T20:00:00-03:00",
    costs: "5% de comissão + frete/embalagem",
    catalogUrl: "https://leiloes.cataventodiscos.com.br/catalogo.asp?Num=64297&Nav=lista&Sec=Catalogo&Pag=1&Srt=1&dia=2",
    updatedAt: "21 ago 2026 · 1h07",
    items: cataventoAuctionWatch,
  },
  {
    id: "rt-leiloes-64580",
    house: "RT Leilões",
    title: "LD Colecionismo · Vinis, CDs e DVDs",
    dates: "24, 25 e 26 de agosto · 18h",
    expiresAt: "2026-08-27T18:00:00-03:00",
    costs: "5% de comissão + frete/embalagem",
    catalogUrl: "https://www.rtleiloes.com.br/catalogo.asp?Num=64580&p=on&Dia=&Tipo=&artista=&pesquisa=&Srt=10",
    updatedAt: "24 ago 2026",
    items: rtAuctionWatch,
  },
  {
    id: "bruce-angeiras-63353",
    house: "Bruce Angeiras",
    title: "47º Meier · 8º exclusivo de mídias",
    dates: "24, 25 e 26 de agosto · 15h",
    expiresAt: "2026-08-27T15:00:00-03:00",
    costs: "5% de comissão + frete",
    catalogUrl: "https://www.bruceangeirasleiloeiro.com.br/catalogo.asp?Num=63353&fav=1&p=on",
    updatedAt: "20 ago 2026",
    items: auctionWatch,
  },
  {
    id: "alberto-lopes-64516",
    house: "Alberto Lopes",
    title: "18º Leilão Discos da Palmeira",
    dates: "26 e 27 de agosto · 19h",
    expiresAt: "2026-08-28T19:00:00-03:00",
    costs: "5% de comissão + frete/embalagem cobrados depois",
    catalogUrl: "https://www.albertolopesleiloeiro.com.br/catalogo.asp?Num=64516",
    updatedAt: "23 ago 2026",
    items: albertoLopesAuctionWatch,
  },
  {
    id: "credan-64533",
    house: "Credance Leilões",
    title: "106º · Desapego de colecionador — do rock à MPB 2",
    dates: "27 de agosto · 18h",
    expiresAt: "2026-08-28T18:00:00-03:00",
    costs: "5% de comissão + R$ 6 de embalagem + frete",
    catalogUrl: "https://www.credanceleiloes.com.br/catalogo.asp?Num=64533&Nav=lista&Sec=Catalogo&pag=1&Srt=1",
    updatedAt: "22 ago 2026",
    items: credanAuctionWatch,
  },
  {
    id: "acioli-63493",
    house: "Acioli Leilões",
    title: "Grande leilão de vinil · de oportunidades a raridades",
    dates: "27 e 28 de agosto · 19h",
    expiresAt: "2026-08-29T19:00:00-03:00",
    costs: "5% de comissão + frete/embalagem",
    catalogUrl: "https://www.aciolileiloes.com.br/catalogo.asp?Num=63493",
    updatedAt: "23 ago 2026",
    items: acioliAuctionWatch,
  },
];

function auctionGroups(items: AuctionWatch[]) {
  const grouped = new Map<string, AuctionWatch[]>();
  [...items]
    .sort((a, b) => {
      const dateOrder = Number.parseInt(a.date, 10) - Number.parseInt(b.date, 10);
      if (dateOrder) return dateOrder;
      const ranks = { "A+": 0, A: 1, B: 2 } as const;
      const aWanted = wantedMatch(a.artist, a.title);
      const bWanted = wantedMatch(b.artist, b.title);
      const priorityOrder = (aWanted ? ranks[aWanted.priority] : 3) - (bWanted ? ranks[bWanted.priority] : 3);
      return priorityOrder || a.lot - b.lot;
    })
    .forEach((item) => grouped.set(item.date, [...(grouped.get(item.date) ?? []), item]));
  return [...grouped.entries()];
}

function normalize(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

function lookupText(value: string) {
  return normalize(value)
    .replace(/\b(disco de vinil|vinil|lp|usado|lacrado)\b/g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function wantedMatch(artist: string, title: string) {
  const artistKey = lookupText(artist);
  const titleKey = lookupText(title);
  return preparedWanted.find(({ artistKey: wantedArtist, titleKey: wantedTitle }) =>
    artistKey === wantedArtist
      && (titleKey === wantedTitle || (titleKey.length > 5 && wantedTitle.length > 5
        && (titleKey.includes(wantedTitle) || wantedTitle.includes(titleKey)))))?.item;
}

function money(value: number | null) {
  if (value === null) return "—";
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  }).format(value);
}

function exactMoney(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: value % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function source(record: CatalogRecord, name: string) {
  const displays = [...new Set(record.market
    .filter((item) => item.source === name)
    .map((item) => item.display))];
  if (!displays.length) return "—";
  if (displays.length === 1) return displays[0];
  return `R$ ${displays.map((display) => display.replace(/^R\$\s*/, "")).join("/")}`;
}

function mergeCatalogEdits(edits: CatalogEdit[]) {
  const edited = new Map<string, CatalogRecord>();
  const deleted = new Set<string>();
  for (const edit of edits) {
    if (edit.status === "deleted") deleted.add(edit.id);
    else if (edit.record) edited.set(edit.id, edit.record);
  }
  const merged = baseRecords
    .filter((record) => !deleted.has(record.id))
    .map((record) => edited.get(record.id) ?? record);
  const baseIds = new Set(baseRecords.map((record) => record.id));
  for (const edit of edits) {
    if (edit.status === "upserted" && edit.record && !baseIds.has(edit.id) && !deleted.has(edit.id)) {
      merged.push(edit.record);
    }
  }
  return merged;
}

function parseNumberList(value: string) {
  return [...new Set(value
    .split(/[/;]/)
    .map((part) => Number(part.trim().replace(",", ".").replace(/[^0-9.]/g, "")))
    .filter((number) => Number.isFinite(number) && number > 0))];
}

function marketPriceInput(record: CatalogRecord, name: string) {
  return [...new Set(record.market
    .filter((item) => item.source === name && item.numeric !== null && item.numeric > 0)
    .map((item) => item.numeric!))]
    .join("/");
}

function recordDraft(record: CatalogRecord): CatalogDraft {
  const years = record.years?.length ? record.years : record.year != null ? [record.year] : [];
  const auction = record.auctionPrices?.length
    ? record.auctionPrices
    : record.auctionPrice != null
      ? [record.auctionPrice]
      : [];
  const auctionSeen = [...new Set([
    ...auction,
    ...record.market
      .filter((item) => item.source === "Leilão observado" && item.numeric !== null && item.numeric > 0)
      .map((item) => item.numeric!),
  ])];
  return {
    id: record.id,
    artist: record.artist,
    title: record.title,
    year: years.join("/"),
    mercadoLivre: marketPriceInput(record, "Mercado Livre"),
    olx: marketPriceInput(record, "OLX"),
    shopee: marketPriceInput(record, "Shopee"),
    leilao: auctionSeen.join("/"),
    vinylSocialClub: marketPriceInput(record, "Vinyl Social Club"),
    adornos: adornosValues(record).join("/"),
  };
}

function replaceMarketPrices(market: MarketObservation[], sourceName: string, value: string) {
  const retained = market.filter((item) => item.source !== sourceName);
  const checkedAt = new Date().toISOString().slice(0, 10);
  const additions = parseNumberList(value).map((numeric) => ({
    source: sourceName,
    display: money(numeric),
    numeric,
    checkedAt,
    status: "editado no site",
  }));
  return [...retained, ...additions];
}

function recordFromDraft(record: CatalogRecord, draft: CatalogDraft): CatalogRecord {
  const previous = recordDraft(record);
  const sourceValues: Array<[string, string, keyof CatalogDraft]> = [
    ["Mercado Livre", draft.mercadoLivre, "mercadoLivre"],
    ["OLX", draft.olx, "olx"],
    ["Shopee", draft.shopee, "shopee"],
    ["Vinyl Social Club", draft.vinylSocialClub, "vinylSocialClub"],
  ];
  const updatedMarket = sourceValues.reduce(
    (current, [sourceName, value, field]) => value === previous[field]
      ? current
      : replaceMarketPrices(current, sourceName, value),
    record.market,
  );
  const market = draft.leilao === previous.leilao
    ? updatedMarket
    : updatedMarket.filter((item) => item.source !== "Leilão observado");
  const marketNumbers = market
    .map((item) => item.numeric)
    .filter((value): value is number => value !== null && value > 0);
  const years = parseNumberList(draft.year).map((value) => Math.round(value));
  const auctionPrices = parseNumberList(draft.leilao);
  const adornosPrices = parseNumberList(draft.adornos);
  return {
    ...record,
    artist: draft.artist.trim(),
    title: draft.title.trim(),
    year: years[0] ?? null,
    years: years.length > 1 ? years : undefined,
    auctionPrice: auctionPrices.length ? Math.min(...auctionPrices) : null,
    auctionPrices: auctionPrices.length > 1 ? auctionPrices : undefined,
    auctionPriceStatus: undefined,
    market,
    marketMin: marketNumbers.length ? Math.min(...marketNumbers) : null,
    adornosPrice: adornosPrices[0] ?? null,
    adornosPrices: adornosPrices.length > 1 ? adornosPrices : undefined,
  };
}

function yearDisplay(record: CatalogRecord) {
  const years = record.years?.length ? record.years : record.year != null ? [record.year] : [];
  return years.length ? years.join("/") : "n/d";
}

function auctionDisplay(record: CatalogRecord) {
  const values = [...new Set([
    ...(record.auctionPrices?.length ? record.auctionPrices : record.auctionPrice != null ? [record.auctionPrice] : []),
    ...record.market
      .filter((item) => item.source === "Leilão observado" && item.numeric !== null && item.numeric > 0)
      .map((item) => item.numeric!),
  ])];
  return values.length ? `R$ ${values.map((value) => new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 2 }).format(value)).join("/")}` : "—";
}

function adornosValues(record: CatalogRecord) {
  const values = record.adornosPrices?.length
    ? record.adornosPrices
    : record.adornosPrice != null
      ? [record.adornosPrice]
      : [];
  return [...new Set(values.filter((value) => value > 0))];
}

function adornosDisplay(record: CatalogRecord) {
  const values = adornosValues(record);
  if (!values.length) return "—";
  const formatted = values.map((value) => new Intl.NumberFormat("pt-BR", {
    maximumFractionDigits: 0,
  }).format(value));
  return `R$ ${formatted.join("/")}`;
}

function referencePrice(record: CatalogRecord) {
  // Several rows came from one pasted auction list whose repeated R$ 19 was not
  // tied to a verifiable lot. Keep that historical value visible, but do not let
  // it override a newly researched marketplace price.
  const auctionReference = record.auctionPriceStatus === "unverified-copy"
    ? null
    : record.auctionPrice;
  const values = [auctionReference, record.marketMin, ...adornosValues(record)].filter(
    (value): value is number => value !== null && value > 0,
  );
  return values.length ? Math.min(...values) : null;
}

function assessment(offer: number | null, reference: number | null) {
  if (offer === null) return { label: "—", tone: "neutral", delta: null };
  if (reference === null) return { label: "Sem referência", tone: "unknown", delta: null };
  const delta = Math.round(((offer - reference) / reference) * 100);
  if (offer <= reference * 0.7) return { label: "Muito barato", tone: "great", delta };
  if (offer <= reference * 0.9) return { label: "Barato", tone: "good", delta };
  if (offer <= reference * 1.1) return { label: "Na faixa", tone: "fair", delta };
  return { label: "Caro", tone: "high", delta };
}

export default function Home() {
  const [records, setRecords] = useState<CatalogRecord[]>(baseRecords);
  const [activeView, setActiveView] = useState<SiteView>("catalogo");
  const [query, setQuery] = useState("");
  const [wantedQuery, setWantedQuery] = useState("");
  const [wantedPriority, setWantedPriority] = useState("todas");
  const [wantedSeparated, setWantedSeparated] = useState<Record<string, boolean>>({});
  const [copyFeedback, setCopyFeedback] = useState("");
  const [decade, setDecade] = useState("todas");
  const [coverage, setCoverage] = useState("todos");
  const [sort, setSort] = useState("artista");
  const [offers, setOffers] = useState<Record<string, string>>({});
  const [clock, setClock] = useState<number | null>(null);
  const [editor, setEditor] = useState<EditorSession | null>(null);
  const [editingCell, setEditingCell] = useState<EditingCell | null>(null);
  const [inlineValue, setInlineValue] = useState("");
  const [editingRecord, setEditingRecord] = useState<CatalogRecord | null>(null);
  const [draft, setDraft] = useState<CatalogDraft | null>(null);
  const [savingRecord, setSavingRecord] = useState(false);
  const [editorFeedback, setEditorFeedback] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function loadCatalogEdits() {
      try {
        const response = await fetch("/api/catalog", { cache: "no-store" });
        const data = await response.json() as {
          edits?: CatalogEdit[];
          editor?: EditorSession;
          error?: string;
        };
        if (!response.ok) throw new Error(data.error ?? "Não foi possível carregar as edições.");
        if (cancelled) return;
        setRecords(mergeCatalogEdits(data.edits ?? []));
        setEditor(data.editor ?? { signedIn: false, canEdit: false, email: null });
      } catch {
        if (cancelled) return;
        setEditor({ signedIn: false, canEdit: false, email: null });
        setEditorFeedback("A consulta continua disponível, mas a edição online está temporariamente indisponível.");
      }
    }
    loadCatalogEdits();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    const syncViewFromHash = () => setActiveView(window.location.hash === "#marcio-candido" ? "marcio" : "catalogo");
    syncViewFromHash();
    window.addEventListener("hashchange", syncViewFromHash);
    return () => window.removeEventListener("hashchange", syncViewFromHash);
  }, []);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem("preco-de-disco-ofertas");
      if (saved) setOffers(JSON.parse(saved));
      const savedWanted = window.localStorage.getItem("preco-de-disco-procuras-separadas");
      if (savedWanted) setWantedSeparated(JSON.parse(savedWanted));
    } catch { /* preferência local opcional */ }
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem("preco-de-disco-ofertas", JSON.stringify(offers));
    } catch { /* preferência local opcional */ }
  }, [offers]);

  useEffect(() => {
    try {
      window.localStorage.setItem("preco-de-disco-procuras-separadas", JSON.stringify(wantedSeparated));
    } catch { /* preferência local opcional */ }
  }, [wantedSeparated]);
  useEffect(() => {
    const updateClock = () => setClock(Date.now());
    updateClock();
    const timer = window.setInterval(updateClock, 86_400_000);
    return () => window.clearInterval(timer);
  }, []);


  const decades = useMemo(
    () => [...new Set(records.flatMap((record) => record.year ? [Math.floor(record.year / 10) * 10] : []))].sort(),
    [records],
  );

  const filtered = useMemo(() => {
    if (activeView !== "catalogo") return [];
    const needle = normalize(query.trim());
    return records
      .filter((record) => {
        const matchesQuery = !needle || normalize(`${record.artist} ${record.title} ${record.year ?? ""}`).includes(needle);
        const matchesDecade = decade === "todas" || (record.year !== null && Math.floor(record.year / 10) * 10 === Number(decade));
        const reference = referencePrice(record);
        const matchesCoverage = coverage === "todos"
          || (coverage === "com-referencia" && reference !== null)
          || (coverage === "adornos" && adornosValues(record).length > 0)
          || (coverage === "mercado" && record.market.length > 0)
          || (coverage === "sem-referencia" && reference === null)
          || (coverage === "com-oferta" && Boolean(offers[record.id]));
        return matchesQuery && matchesDecade && matchesCoverage;
      })
      .sort((a, b) => {
        if (sort === "planilha") return a.sourceRow - b.sourceRow;
        if (sort === "album") return a.title.localeCompare(b.title, "pt-BR");
        if (sort === "ano") return (b.year ?? 0) - (a.year ?? 0);
        if (sort === "referencia-menor") return (referencePrice(a) ?? Infinity) - (referencePrice(b) ?? Infinity);
        if (sort === "referencia-maior") return (referencePrice(b) ?? -1) - (referencePrice(a) ?? -1);
        if (sort === "melhor-oferta") {
          const scoreA = offers[a.id] && referencePrice(a) ? Number(offers[a.id].replace(",", ".")) / referencePrice(a)! : Infinity;
          const scoreB = offers[b.id] && referencePrice(b) ? Number(offers[b.id].replace(",", ".")) / referencePrice(b)! : Infinity;
          return scoreA - scoreB;
        }
        return a.artist.localeCompare(b.artist, "pt-BR") || a.title.localeCompare(b.title, "pt-BR");
      });
  }, [activeView, query, decade, coverage, sort, offers, records]);

  const comparedCount = Object.values(offers).filter(Boolean).length;
  const separatedCount = Object.values(wantedSeparated).filter(Boolean).length;

  const filteredWanted = useMemo(() => {
    if (activeView !== "marcio") return [];
    const needle = lookupText(wantedQuery);
    return wantedItems.filter((item) => {
      const matchesQuery = !needle || lookupText(item.artist + " " + item.title).includes(needle);
      const matchesPriority = wantedPriority === "todas" || item.priority === wantedPriority;
      return matchesQuery && matchesPriority;
    });
  }, [activeView, wantedPriority, wantedQuery]);

  async function copySeparated() {
    const selected = wantedItems.filter((item) => wantedSeparated[item.id]);
    if (!selected.length) {
      setCopyFeedback("Marque os discos que você separou");
      return;
    }
    try {
      await navigator.clipboard.writeText(selected.map((item) => item.artist + " — " + item.title).join("\n"));
      setCopyFeedback(selected.length + (selected.length === 1 ? " disco copiado" : " discos copiados"));
    } catch {
      setCopyFeedback("Não foi possível copiar neste navegador");
    }
  }

  function selectView(view: SiteView) {
    setActiveView(view);
    const hash = view === "marcio" ? "#marcio-candido" : "";
    window.history.replaceState(null, "", window.location.pathname + window.location.search + hash);
    window.scrollTo({ top: 0 });
  }

  function beginCellEdit(record: CatalogRecord, field: EditableCatalogField) {
    if (!editor?.canEdit || savingRecord) return;
    setEditingCell({ recordId: record.id, field });
    setInlineValue(String(recordDraft(record)[field]));
    setEditorFeedback("");
  }

  function cancelEdit() {
    setEditingCell(null);
    setInlineValue("");
    setEditingRecord(null);
    setDraft(null);
  }

  function updateDraft(field: keyof CatalogDraft, value: string) {
    setDraft((current) => current ? { ...current, [field]: value } : current);
  }

  function addRecord() {
    const newRecord: CatalogRecord = {
      id: `site-${crypto.randomUUID()}`,
      sourceRow: Math.max(0, ...records.map((record) => record.sourceRow)) + 1,
      lot: null,
      artist: "",
      title: "",
      year: null,
      auctionPrice: null,
      marketMin: null,
      market: [],
      tags: [],
      adornosPrice: null,
    };
    setEditingRecord(newRecord);
    setDraft(recordDraft(newRecord));
    setEditorFeedback("Novo disco: preencha artista e álbum.");
  }

  async function saveInlineCell(cell: EditingCell, value: string) {
    if (savingRecord) return;
    const record = records.find((item) => item.id === cell.recordId);
    if (!record) return;
    const currentDraft = recordDraft(record);
    if (value === String(currentDraft[cell.field])) {
      setEditingCell(null);
      setInlineValue("");
      return;
    }
    const nextDraft = { ...currentDraft, [cell.field]: value };
    if (!nextDraft.artist.trim() || !nextDraft.title.trim()) {
      setEditorFeedback("Artista e álbum não podem ficar vazios.");
      return;
    }
    const savedRecord = recordFromDraft(record, nextDraft);
    setEditingCell(null);
    setInlineValue("");
    setSavingRecord(true);
    setEditorFeedback("Salvando...");
    try {
      const response = await fetch("/api/catalog", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: savedRecord.id, status: "upserted", record: savedRecord }),
      });
      const data = await response.json() as { error?: string };
      if (!response.ok) throw new Error(data.error ?? "Não foi possível salvar.");
      setRecords((current) => current.map((item) => item.id === savedRecord.id ? savedRecord : item));
      setEditorFeedback("Alteração salva online.");
    } catch (error) {
      setEditorFeedback(error instanceof Error ? error.message : "Não foi possível salvar.");
    } finally {
      setSavingRecord(false);
    }
  }

  function inlineCell(
    record: CatalogRecord,
    field: EditableCatalogField,
    display: ReactNode,
    className = "",
    inputMode?: "text" | "numeric" | "decimal",
  ) {
    const active = editingCell?.recordId === record.id && editingCell.field === field;
    const editable = Boolean(editor?.canEdit);
    return (
      <td
        className={[className, editable ? "inline-editable-cell" : "", active ? "inline-editing-cell" : ""].filter(Boolean).join(" ") || undefined}
        onClick={() => !active && beginCellEdit(record, field)}
        onKeyDown={(event) => {
          if (!active && editable && (event.key === "Enter" || event.key === " ")) {
            event.preventDefault();
            beginCellEdit(record, field);
          }
        }}
        tabIndex={editable && !active ? 0 : undefined}
        title={editable ? "Clique para editar" : undefined}
      >
        {active ? (
          <input
            ref={(element) => {
              if (element && document.activeElement !== element) element.focus();
            }}
            className="inline-cell-input"
            inputMode={inputMode}
            value={inlineValue}
            onChange={(event) => setInlineValue(event.target.value)}
            onClick={(event) => event.stopPropagation()}
            onBlur={() => saveInlineCell({ recordId: record.id, field }, inlineValue)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                saveInlineCell({ recordId: record.id, field }, inlineValue);
              } else if (event.key === "Escape") {
                event.preventDefault();
                setEditingCell(null);
                setInlineValue("");
              }
            }}
            aria-label={"Editar " + field + " de " + record.artist + " — " + record.title}
          />
        ) : display}
      </td>
    );
  }

  async function saveDraft() {
    if (!draft || !editingRecord || savingRecord) return;
    if (!draft.artist.trim() || !draft.title.trim()) {
      setEditorFeedback("Preencha artista e álbum antes de salvar.");
      return;
    }
    const savedRecord = recordFromDraft(editingRecord, draft);
    setSavingRecord(true);
    setEditorFeedback("Salvando...");
    try {
      const response = await fetch("/api/catalog", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: savedRecord.id, status: "upserted", record: savedRecord }),
      });
      const data = await response.json() as { error?: string };
      if (!response.ok) throw new Error(data.error ?? "Não foi possível salvar.");
      setRecords((current) => current.some((record) => record.id === savedRecord.id)
        ? current.map((record) => record.id === savedRecord.id ? savedRecord : record)
        : [...current, savedRecord]);
      setEditingRecord(null);
      setDraft(null);
      setEditorFeedback("Alteração salva online.");
    } catch (error) {
      setEditorFeedback(error instanceof Error ? error.message : "Não foi possível salvar.");
    } finally {
      setSavingRecord(false);
    }
  }

  async function deleteEditingRecord() {
    if (!editingRecord || savingRecord) return;
    if (!records.some((record) => record.id === editingRecord.id)) {
      cancelEdit();
      return;
    }
    if (!window.confirm(`Excluir ${editingRecord.artist} — ${editingRecord.title} da tabela?`)) return;
    setSavingRecord(true);
    setEditorFeedback("Excluindo...");
    try {
      const response = await fetch("/api/catalog", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: editingRecord.id, status: "deleted" }),
      });
      const data = await response.json() as { error?: string };
      if (!response.ok) throw new Error(data.error ?? "Não foi possível excluir.");
      setRecords((current) => current.filter((record) => record.id !== editingRecord.id));
      setEditingRecord(null);
      setDraft(null);
      setEditorFeedback("Disco excluído da tabela.");
    } catch (error) {
      setEditorFeedback(error instanceof Error ? error.message : "Não foi possível excluir.");
    } finally {
      setSavingRecord(false);
    }
  }

  function openAuctions() {
    selectView("catalogo");
    window.requestAnimationFrame(() => document.getElementById("proximos-leiloes")?.scrollIntoView({ behavior: "smooth" }));
  }

  const visibleAuctionEvents = useMemo(
    () => auctionEvents.filter((event) => clock === null || clock < new Date(event.expiresAt).getTime()),
    [clock],
  );
  const auctionWatchCount = visibleAuctionEvents.reduce((total, event) => total + event.items.length, 0);

  return (
    <main>
      <header className="topbar">
        <div className="identity">
          <span className="record-dot" aria-hidden="true"><i /></span>
          <div><strong>Preço de Disco</strong><span>lista de consulta</span></div>
        </div>
        <div className="base-status">
          <span><b>{records.length}</b> discos</span>
          <span><b>{records.filter((record) => referencePrice(record) !== null).length}</b> com referência</span>
          <span><b>{records.filter((record) => adornosValues(record).length > 0).length}</b> Adornos</span>
          <span><b>{comparedCount}</b> ofertas comparadas</span>
          <button className="status-link" type="button" onClick={() => selectView("marcio")}><b>{wantedItems.length}</b> para Márcio</button>
          <button className="status-link" type="button" onClick={openAuctions}><b>{auctionWatchCount}</b> em leilão</button>
        </div>
      </header>

      <nav className="site-tabs" aria-label="Áreas do site">
        <button type="button" className={activeView === "catalogo" ? "active" : ""} aria-pressed={activeView === "catalogo"} onClick={() => selectView("catalogo")}>
          Preços e leilões
        </button>
        <button type="button" className={activeView === "marcio" ? "active" : ""} aria-pressed={activeView === "marcio"} onClick={() => selectView("marcio")}>
          Procuras · Márcio Cândido <b>{wantedItems.length}</b>
        </button>
      </nav>

      <section className="intro" hidden={activeView !== "catalogo"}>
        <div>
          <p className="kicker">Consulta rápida de preços de vinil</p>
          <h1>Quanto vale esse disco?</h1>
          <p>Pesquise, compare as referências e digite o preço que encontrou. A lista mostra na hora se está barato.</p>
        </div>
        <div className="legend" aria-label="Legenda da comparação">
          <span><i className="great" /> muito barato</span>
          <span><i className="good" /> barato</span>
          <span><i className="fair" /> na faixa</span>
          <span><i className="high" /> caro</span>
        </div>
      </section>

      <section className="wanted-watch" id="marcio-candido" aria-labelledby="wanted-title" hidden={activeView !== "marcio"}>
        <div className="wanted-heading">
          <div>
            <p className="kicker">Cliente · fila de procura</p>
            <h2 id="wanted-title">Márcio Cândido</h2>
            <p>132 títulos pendentes para encontrar. A+ vem primeiro; marque “separei” quando localizar uma cópia e copie a seleção para enviar ao Márcio.</p>
          </div>
          <div className="wanted-summary" aria-label="Resumo das prioridades">
            <span><b>{wantedItems.filter((item) => item.priority === "A+").length}</b> A+</span>
            <span><b>{wantedItems.filter((item) => item.priority === "A").length}</b> A</span>
            <span><b>{wantedItems.filter((item) => item.priority === "B").length}</b> B</span>
            <span><b>{separatedCount}</b> separados</span>
          </div>
        </div>

        <div className="wanted-panel">
          <div className="wanted-controls">
            <label className="wanted-search">
              <span className="sr-only">Buscar na lista de procuras</span>
              <input
                type="search"
                value={wantedQuery}
                onChange={(event) => setWantedQuery(event.target.value)}
                placeholder="Buscar artista ou álbum na lista..."
              />
              {wantedQuery && <button type="button" onClick={() => setWantedQuery("")} aria-label="Limpar busca da lista">×</button>}
            </label>
            <label className="wanted-priority">
              <span>Prioridade</span>
              <select value={wantedPriority} onChange={(event) => setWantedPriority(event.target.value)}>
                <option value="todas">Todas</option>
                <option value="A+">A+</option>
                <option value="A">A</option>
                <option value="B">B</option>
              </select>
            </label>
            <button className="wanted-copy" type="button" onClick={copySeparated}>
              Copiar separados <b>{separatedCount}</b>
            </button>
          </div>

          <div className="wanted-result">
            <span><b>{filteredWanted.length}</b> na lista</span>
            <span aria-live="polite">{copyFeedback}</span>
          </div>

          <div className="wanted-list-head" aria-hidden="true">
            <span>Separei</span><span>Prioridade</span><span>Artista</span><span>Álbum</span>
          </div>
          <div className="wanted-list">
            {activeView === "marcio" && filteredWanted.map((item) => {
              const separated = Boolean(wantedSeparated[item.id]);
              return (
                <article className={"wanted-row" + (separated ? " separated" : "")} key={item.id}>
                  <label className="wanted-check">
                    <input
                      type="checkbox"
                      checked={separated}
                      onChange={(event) => setWantedSeparated((current) => ({ ...current, [item.id]: event.target.checked }))}
                      aria-label={"Marcar como separado: " + item.artist + " — " + item.title}
                    />
                    <span>{separated ? "Sim" : "Não"}</span>
                  </label>
                  <strong className={"wanted-badge priority-" + item.priority.replace("+", "plus")}>{item.priority}</strong>
                  <span className="wanted-artist">{item.artist}</span>
                  <span className="wanted-title">{item.title}</span>

                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="auction-watch" id="proximos-leiloes" aria-labelledby="auction-title" hidden={activeView !== "catalogo"}>
        <div className="auction-heading">
          <div>
            <p className="kicker">Radar de oportunidades</p>
            <h2 id="auction-title">Próximos leilões</h2>
            <p>Os discos que você escolheu acompanhar, com o custo da comissão e um teto prático para não se empolgar no lance.</p>
          </div>
        </div>

        <div className="auction-windows">
          {activeView === "catalogo" && visibleAuctionEvents.map((event) => (
            <details className="auction-window" key={event.id}>
              <summary>
                <span className="auction-window-status"><i aria-hidden="true" /> Próximo</span>
                <strong>{event.house}<small>{event.title}</small></strong>
                <span className="auction-window-date">{event.dates}</span>
                <span className="auction-window-count"><b>{event.items.length}</b> discos</span>
                <i className="auction-window-arrow" aria-hidden="true" />
              </summary>

              <div className="auction-board">
                <div className="auction-meta">
                  <div><span>Casa</span><strong>{event.house}</strong></div>
                  <div><span>Leilão</span><strong>{event.title}</strong></div>
                  <div><span>Quando</span><strong>{event.dates}</strong></div>
                  <div><span>Custos</span><strong>{event.costs}</strong></div>
                </div>

                <div className="auction-days">
                  {auctionGroups(event.items).map(([date, items]) => (
                    <section className="auction-day" key={date} aria-label={`Lotes de ${date}`}>
                      <header>
                        <strong>{date}</strong>
                        <span>{items.length} {items.length === 1 ? "disco" : "discos"} · por lote</span>
                      </header>
                      <div className="auction-list-head" aria-hidden="true">
                        <span>Lote</span><span>Disco / estado</span>
                        <span className="auction-price-head"><i>Lance</i><i>Próximo</i><i>Com 5%</i><i>Teto</i></span>
                        <span>Leitura</span><span />
                      </div>
                      <div className="auction-list">
                        {items.map((item) => {
                          const withCommission = item.currentBid * 1.05;
                          const wanted = wantedMatch(item.artist, item.title);
                          return (
                            <article className={`auction-row ${item.tone}`} key={item.lot}>
                              <div className="auction-lot"><span>Lote</span><b>{item.lot}</b></div>
                              <div className="auction-record">
                                <h3>{item.artist}<span>{item.title}</span></h3>
                                {wanted && (
                                  <em className="wanted-hit">Procura Márcio · {wanted.priority}</em>
                                )}
                                <p title={item.condition}>{item.condition}</p>
                                <small title={item.note}>{item.note}</small>
                              </div>
                              <dl className="auction-row-prices">
                                <div><dt>{item.bidLabel ?? "Lance"}</dt><dd>{money(item.currentBid)}</dd></div>
                                <div><dt>Próximo</dt><dd>{money(item.nextBid)}</dd></div>
                                <div><dt>Com 5%</dt><dd>{exactMoney(withCommission)}</dd></div>
                                <div className="ceiling"><dt>Teto</dt><dd>{money(item.ceiling)}</dd></div>
                              </dl>
                              <div className="auction-priority"><b>{item.priority}</b></div>
                              <a className="auction-open-lot" href={item.url} target="_blank" rel="noreferrer" aria-label={`Abrir lote ${item.lot}: ${item.artist} — ${item.title}`} title="Conferir lote e lance atual">
                                <span aria-hidden="true">↗</span>
                              </a>
                            </article>
                          );
                        })}
                      </div>
                    </section>
                  ))}
                </div>

                <div className="auction-footnote">
                  <span>Atualizado em {event.updatedAt}</span>
                  <p>Os lances mudam. Antes de ofertar, abra o lote e some comissão, frete e embalagem.</p>
                  <a href={event.catalogUrl} target="_blank" rel="noreferrer">Abrir este leilão <span aria-hidden="true">↗</span></a>
                </div>
              </div>
            </details>
          ))}
        </div>
      </section>

      <section className="controls" id="catalogo" aria-label="Busca e filtros" hidden={activeView !== "catalogo"}>
        <label className="search-box">
          <span className="search-symbol" aria-hidden="true" />
          <span className="sr-only">Buscar disco</span>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Artista, álbum ou ano..."
          />
          {query && <button type="button" onClick={() => setQuery("")} aria-label="Limpar busca">×</button>}
        </label>
        <label><span>Década</span><select value={decade} onChange={(event) => setDecade(event.target.value)}><option value="todas">Todas</option>{decades.map((value) => <option key={value} value={value}>{value}</option>)}</select></label>
        <label><span>Mostrar</span><select value={coverage} onChange={(event) => setCoverage(event.target.value)}><option value="todos">Tudo</option><option value="com-referencia">Com referência</option><option value="adornos">Com preço Adornos</option><option value="mercado">Com pesquisa de mercado</option><option value="sem-referencia">Sem referência</option><option value="com-oferta">Minhas comparações</option></select></label>
        <label><span>Ordenar</span><select value={sort} onChange={(event) => setSort(event.target.value)}><option value="artista">Artista A–Z</option><option value="album">Álbum A–Z</option><option value="planilha">Ordem original</option><option value="ano">Ano recente</option><option value="referencia-menor">Menor referência</option><option value="referencia-maior">Maior referência</option><option value="melhor-oferta">Melhor negócio</option></select></label>
      </section>

      <section className="catalog-editor" aria-label="Edição da tabela" hidden={activeView !== "catalogo"}>
        <div className="catalog-editor-status">
          <div>
            <strong>Tabela online</strong>
            <span>{editor?.canEdit ? `Clique em uma célula para editar · ${editor.email}` : "Consulta pública · edição protegida"}</span>
          </div>
          <div className="catalog-editor-actions">
            <span aria-live="polite">{editorFeedback}</span>
            {editor?.canEdit ? (
              <button className="editor-add" type="button" onClick={addRecord}>+ Novo disco</button>
            ) : editor?.signedIn ? (
              <span className="editor-denied">Conta sem permissão de edição</span>
            ) : editor ? (
              <a className="editor-signin" href="/signin-with-chatgpt?return_to=%2F">Entrar para editar</a>
            ) : (
              <span className="editor-loading">Verificando acesso...</span>
            )}
          </div>
        </div>

        {draft && editingRecord && (
          <form
            className="catalog-editor-panel"
            id="catalog-editor-panel"
            onSubmit={(event) => { event.preventDefault(); saveDraft(); }}
          >
            <header>
              <div>
                <span>{records.some((record) => record.id === editingRecord.id) ? "Editando disco" : "Novo disco"}</span>
                <strong>{draft.artist || "Artista"} — {draft.title || "Álbum"}</strong>
              </div>
              <button type="button" onClick={cancelEdit} aria-label="Fechar edição">×</button>
            </header>
            <div className="catalog-editor-fields">
              <label className="editor-field-wide"><span>Artista</span><input value={draft.artist} onChange={(event) => updateDraft("artist", event.target.value)} /></label>
              <label className="editor-field-wide"><span>Álbum / edição</span><input value={draft.title} onChange={(event) => updateDraft("title", event.target.value)} /></label>
              <label><span>Ano</span><input inputMode="numeric" placeholder="1989" value={draft.year} onChange={(event) => updateDraft("year", event.target.value)} /></label>
              <label><span>Mercado Livre</span><input inputMode="decimal" placeholder="60/80" value={draft.mercadoLivre} onChange={(event) => updateDraft("mercadoLivre", event.target.value)} /></label>
              <label><span>OLX</span><input inputMode="decimal" placeholder="60/80" value={draft.olx} onChange={(event) => updateDraft("olx", event.target.value)} /></label>
              <label><span>Shopee</span><input inputMode="decimal" placeholder="60/80" value={draft.shopee} onChange={(event) => updateDraft("shopee", event.target.value)} /></label>
              <label><span>Leilão visto</span><input inputMode="decimal" placeholder="20/30" value={draft.leilao} onChange={(event) => updateDraft("leilao", event.target.value)} /></label>
              <label><span>Vinyl Social Club</span><input inputMode="decimal" placeholder="59" value={draft.vinylSocialClub} onChange={(event) => updateDraft("vinylSocialClub", event.target.value)} /></label>
              <label><span>Adornos</span><input inputMode="decimal" placeholder="148/189" value={draft.adornos} onChange={(event) => updateDraft("adornos", event.target.value)} /></label>
            </div>
            <footer>
              <div>
                {records.some((record) => record.id === editingRecord.id) && (
                  <button className="editor-delete" type="button" onClick={deleteEditingRecord} disabled={savingRecord}>Excluir</button>
                )}
              </div>
              <div>
                <button className="editor-cancel" type="button" onClick={cancelEdit} disabled={savingRecord}>Cancelar</button>
                <button className="editor-save" type="submit" disabled={savingRecord}>{savingRecord ? "Salvando..." : "Salvar online"}</button>
              </div>
            </footer>
          </form>
        )}
      </section>

      <div className="result-line" hidden={activeView !== "catalogo"}>
        <strong>{filtered.length}</strong> {filtered.length === 1 ? "disco encontrado" : "discos encontrados"}
        <span>Referência = menor valor registrado entre leilão, pesquisa e Adornos</span>
      </div>

      <section className="table-shell" aria-label="Lista de preços de discos" hidden={activeView !== "catalogo"}>
        <table>
          <thead>
            <tr>
              <th className="col-index">#</th>
              <th className="col-artist">Artista</th>
              <th className="col-album">Álbum / edição</th>
              <th>Ano</th>
              <th>Mercado Livre</th>
              <th>OLX</th>
              <th>Shopee</th>
              <th>Leilão visto</th>
              <th>Vinyl Social Club</th>
              <th className="adornos-head">Adornos</th>
              <th className="reference-head">Referência</th>
              <th className="offer-head">Preço encontrado</th>
              <th className="verdict-head">Avaliação</th>
            </tr>
          </thead>
          <tbody>
            {activeView === "catalogo" && filtered.map((record, index) => {
              const reference = referencePrice(record);
              const offerText = offers[record.id] ?? "";
              const parsedOffer = offerText ? Number(offerText.replace(",", ".")) : null;
              const validOffer = parsedOffer !== null && Number.isFinite(parsedOffer) && parsedOffer >= 0 ? parsedOffer : null;
              const result = assessment(validOffer, reference);
              const rowClass = [
                offerText ? `compared ${result.tone}` : "",
                editingCell?.recordId === record.id ? "editing-row" : "",
              ].filter(Boolean).join(" ") || undefined;
              return (
                <tr key={record.id} className={rowClass}>
                  <td className="row-number">{index + 1}</td>
                  {inlineCell(record, "artist", record.artist, "artist-cell", "text")}
                  {inlineCell(record, "title", <>{record.title}{record.tags.length > 0 && <small>{record.tags.join(" · ")}</small>}</>, "album-cell", "text")}
                  {inlineCell(record, "year", yearDisplay(record), record.year === null && !record.years?.length ? "missing" : "", "numeric")}
                  {inlineCell(record, "mercadoLivre", source(record, "Mercado Livre"), "price-source", "decimal")}
                  {inlineCell(record, "olx", source(record, "OLX"), "price-source", "decimal")}
                  {inlineCell(record, "shopee", source(record, "Shopee"), "price-source", "decimal")}
                  {inlineCell(record, "leilao", auctionDisplay(record), "money-cell", "decimal")}
                  {inlineCell(record, "vinylSocialClub", source(record, "Vinyl Social Club"), "price-source", "decimal")}
                  {inlineCell(record, "adornos", adornosDisplay(record), "adornos-cell", "decimal")}
                  <td className="reference-cell">{money(reference)}</td>
                  <td className="offer-cell">
                    <span>R$</span>
                    <input
                      inputMode="decimal"
                      aria-label={`Preço encontrado para ${record.artist} — ${record.title}`}
                      value={offerText}
                      onChange={(event) => setOffers((current) => ({ ...current, [record.id]: event.target.value.replace(/[^0-9,.]/g, "") }))}
                      placeholder="0"
                    />
                    {offerText && <button type="button" onClick={() => setOffers((current) => ({ ...current, [record.id]: "" }))} aria-label="Apagar preço">×</button>}
                  </td>
                  <td className={`verdict-cell ${result.tone}`}>
                    <strong>{result.label}</strong>
                    {result.delta !== null && <small>{result.delta > 0 ? "+" : ""}{result.delta}%</small>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filtered.length === 0 && <div className="empty"><strong>Nenhum disco encontrado.</strong><button type="button" onClick={() => { setQuery(""); setDecade("todas"); setCoverage("todos"); }}>Limpar filtros</button></div>}
      </section>

      <footer>
        <span>A lista preserva os dados da planilha original.</span>
        <span>Alterações autorizadas na tabela ficam salvas online.</span>
      </footer>
    </main>
  );
}
