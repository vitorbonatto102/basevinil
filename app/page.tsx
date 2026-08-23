"use client";

import { useEffect, useMemo, useState } from "react";
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

const records = catalog.records as CatalogRecord[];
const wantedItems = wantedData as WantedItem[];
const preparedWanted = wantedItems.map((item) => ({
  item,
  artistKey: lookupText(item.artist),
  titleKey: lookupText(item.title),
}));

const auctionWatch: AuctionWatch[] = [
  {
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
    currentBid: 10,
    nextBid: 15,
    ceiling: 40,
    priority: "Garimpo forte",
    tone: "high",
    note: "Edição de 1990. Piso ativo visto em R$ 44–49; várias cópias entre R$ 63 e R$ 90.",
    url: "https://www.rtleiloes.com.br/peca.asp?ID=32152815",
  },
  {
    lot: 64,
    artist: "Finis Africae",
    title: "Finis Africae",
    date: "24 ago · 18h",
    condition: "Com encarte; capa com desgastes; risco bem sutil no disco",
    currentBid: 15,
    nextBid: 15,
    bidLabel: "Abertura",
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
    currentBid: 40,
    nextBid: 45,
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
    currentBid: 35,
    nextBid: 40,
    ceiling: 55,
    priority: "Boa oportunidade",
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
    currentBid: 15,
    nextBid: 15,
    bidLabel: "Abertura",
    ceiling: 30,
    priority: "Boa oportunidade",
    tone: "high",
    note: "Comparáveis ativos começam perto de R$ 35–40, com várias cópias entre R$ 58 e R$ 85.",
    url: "https://www.rtleiloes.com.br/peca.asp?ID=32152951",
  },
  {
    lot: 77,
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
    lot: 435,
    artist: "Pink Floyd",
    title: "Animals",
    date: "26 ago · 18h",
    condition: "Capa dupla e encarte; capa gasta; muitos riscos, com raros estalos",
    currentBid: 50,
    nextBid: 50,
    bidLabel: "Abertura",
    ceiling: 65,
    priority: "Você marcou · cautela",
    tone: "careful",
    note: "Cópias nacionais melhores passam de R$ 239, mas esta é uma cópia de audição arriscada; não pagar preço de VG.",
    url: "https://www.rtleiloes.com.br/peca.asp?ID=32152847",
  },
  {
    lot: 442,
    artist: "O Têrço",
    title: "Mudança de Tempo",
    date: "26 ago · 18h",
    condition: "Reedição de 1991; capa dupla e encarte; capa e disco em bom estado",
    currentBid: 60,
    nextBid: 65,
    ceiling: 65,
    priority: "Só até o teto",
    tone: "medium",
    note: "Há anúncios da mesma reedição por R$ 80–89; a margem desaparece rapidamente com comissão e frete.",
    url: "https://www.rtleiloes.com.br/peca.asp?ID=32152952",
  },
  {
    lot: 14,
    artist: "Jorge Ben",
    title: "Sonsual",
    date: "24 ago · 18h",
    condition: "Com encarte; capa com pequenos desgastes; disco em bom estado",
    currentBid: 60,
    nextBid: 65,
    ceiling: 60,
    priority: "Você marcou · passar",
    tone: "careful",
    note: "Já existe cópia equivalente anunciada por R$ 50. Com 5%, o lance atual vira R$ 63 antes do frete.",
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
    updatedAt: "20 ago 2026",
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

function yearDisplay(record: CatalogRecord) {
  const years = record.years?.length ? record.years : record.year != null ? [record.year] : [];
  return years.length ? years.join("/") : "n/d";
}

function auctionDisplay(record: CatalogRecord) {
  const values = record.auctionPrices?.length ? record.auctionPrices : record.auctionPrice != null ? [record.auctionPrice] : [];
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
    [],
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
  }, [activeView, query, decade, coverage, sort, offers]);

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
            autoFocus
          />
          {query && <button type="button" onClick={() => setQuery("")} aria-label="Limpar busca">×</button>}
        </label>
        <label><span>Década</span><select value={decade} onChange={(event) => setDecade(event.target.value)}><option value="todas">Todas</option>{decades.map((value) => <option key={value} value={value}>{value}</option>)}</select></label>
        <label><span>Mostrar</span><select value={coverage} onChange={(event) => setCoverage(event.target.value)}><option value="todos">Tudo</option><option value="com-referencia">Com referência</option><option value="adornos">Com preço Adornos</option><option value="mercado">Com pesquisa de mercado</option><option value="sem-referencia">Sem referência</option><option value="com-oferta">Minhas comparações</option></select></label>
        <label><span>Ordenar</span><select value={sort} onChange={(event) => setSort(event.target.value)}><option value="artista">Artista A–Z</option><option value="album">Álbum A–Z</option><option value="planilha">Ordem original</option><option value="ano">Ano recente</option><option value="referencia-menor">Menor referência</option><option value="referencia-maior">Maior referência</option><option value="melhor-oferta">Melhor negócio</option></select></label>
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
              <th>Valor leilão</th>
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
              return (
                <tr key={record.id} className={offerText ? `compared ${result.tone}` : undefined}>
                  <td className="row-number">{index + 1}</td>
                  <td className="artist-cell">{record.artist}</td>
                  <td className="album-cell">{record.title}{record.tags.length > 0 && <small>{record.tags.join(" · ")}</small>}</td>
                  <td className={record.year === null && !record.years?.length ? "missing" : ""}>{yearDisplay(record)}</td>
                  <td className="price-source">{source(record, "Mercado Livre")}</td>
                  <td className="price-source">{source(record, "OLX")}</td>
                  <td className="price-source">{source(record, "Shopee")}</td>
                  <td className="price-source">{source(record, "Leilão observado")}</td>
                  <td className="money-cell">{auctionDisplay(record)}</td>
                  <td className="price-source">{source(record, "Vinyl Social Club")}</td>
                  <td className="adornos-cell">{adornosDisplay(record)}</td>
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
        <span>Os preços digitados ficam somente neste navegador.</span>
      </footer>
    </main>
  );
}
