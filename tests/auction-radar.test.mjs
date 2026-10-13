import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const items = JSON.parse(await readFile(new URL("../app/data/bv-65902-radar.json", import.meta.url), "utf8"));
const page = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
const wanted = JSON.parse(await readFile(new URL("../app/data/wanted.json", import.meta.url), "utf8"));

test("BV radar contains distinct sorted lots, not one bid per album", () => {
  assert.equal(items.length, 27);
  assert.equal(new Set(items.map((item) => item.lot)).size, items.length);
  assert.deepEqual(items.map((item) => item.lot), [...items.map((item) => item.lot)].sort((a, b) => a - b));
  for (const item of items) {
    assert.equal(item.date, "14 out · 19h30");
    assert.match(item.url, /^https:\/\/www\.bvcolecionismo\.lel\.br\/peca\.asp\?ID=\d+$/);
    assert.ok(item.nextBid >= item.currentBid);
    assert.ok(item.analysis.greatBuy <= item.analysis.fairBid);
    assert.ok(item.analysis.fairBid <= item.ceiling);
    if (item.analysis.score >= 7) assert.ok(item.analysis.comparables.length >= 2);
    for (const reference of item.analysis.comparables) {
      assert.equal(reference.checkedAt, "12/10/2026");
      assert.ok(reference.shipping && reference.edition && reference.status);
      assert.match(reference.url, /^https:\/\//);
    }
  }
  assert.equal(items.find((item) => item.lot === 188).discs.length, 2);
  assert.match(items.find((item) => item.lot === 188).condition, /quatro LPs/);
  assert.match(items.find((item) => item.lot === 133).condition, /Três LPs/);
});

test("commission uses verified next bid once, including opening and unusual increments", () => {
  for (const [lot, next, total] of [[3, 12, 12.6], [58, 20, 21], [133, 40, 42], [188, 20, 21], [100, 225, 236.25]]) {
    const item = items.find((entry) => entry.lot === lot);
    assert.equal(item.nextBid, next);
    assert.equal(Math.round(item.nextBid * 1.05 * 100) / 100, total);
  }
  assert.match(page, /\(isSold \? item\.settledPrice! : item\.nextBid\) \* 1\.05/);
});

test("bundles expose each album for Márcio matching and do not update catalog prices", () => {
  const bundle = items.find((item) => item.lot === 103);
  assert.ok(bundle.discs.some((disc) => wanted.some((entry) => entry.artist === disc.artist && entry.title === disc.title && entry.priority === "A")));
  assert.ok(items.find((item) => item.lot === 121).discs.some((disc) => disc.artist === "Luiz Melodia" && disc.title === "Pérola Negra"));
  assert.match(page, /const wanted = \(item\.discs \?\? \[item\]\)/);
  const event = page.slice(page.indexOf('id: "bv-colecionismo-65902"'), page.indexOf('id: "muller-colecoes-65046"'));
  assert.match(event, /syncCatalog: false/);
  assert.match(event, /items: bv65902Radar as AuctionWatch\[\]/);
  assert.doesNotMatch(page, /<details className="auction-window"[^>]*\bopen\b/);
});
