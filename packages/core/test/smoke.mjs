// Zero-dep smoke tests. Runs against the built ESM output so this is
// what the world sees on npm. No runner / no framework — just assert().
// Run via `pnpm --filter @pixabots/core test` after the package is built.

import { strict as assert } from "node:assert";
import {
  encode,
  decode,
  isValidId,
  resolve,
  resolveId,
  randomId,
  seededId,
  hashString,
  mulberry32,
  createRng,
  partCount,
  totalCombinations,
  PARTS,
  CATEGORY_ORDER,
  LAYER_ORDER,
} from "../dist/index.js";

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`  ✓ ${name}`);
    passed++;
  } catch (e) {
    console.error(`  ✗ ${name}`);
    console.error(`    ${e.message}`);
    failed++;
  }
}

console.log("\n@pixabots/core smoke\n");

test("totalCombinations = 9856 (partCount product)", () => {
  const product = CATEGORY_ORDER.reduce((n, cat) => n * partCount(cat), 1);
  assert.equal(product, 9856);
  assert.equal(totalCombinations(), 9856);
});

test("encode ↔ decode round-trips for special IDs", () => {
  for (const id of ["0000", "2156", "1337", "f76a", "0001", "1234", "3141", "a001"]) {
    assert.equal(encode(decode(id)), id, `round-trip failed for ${id}`);
    assert.equal(isValidId(id), true, `expected ${id} valid`);
  }
});

test("isValidId rejects malformed + out-of-range", () => {
  for (const bad of ["", "abc", "abcde", "gggg", "!@#$", " 000", "ABCD", "zzzz"]) {
    assert.equal(isValidId(bad), false, `expected ${bad} invalid`);
  }
});

test("resolveId + resolve return matching names", () => {
  const byId = resolveId("2156");
  const byCombo = resolve(decode("2156"));
  assert.deepEqual(byId, byCombo);
  for (const cat of CATEGORY_ORDER) {
    assert.ok(typeof byId[cat] === "string");
  }
});

test("randomId always valid", () => {
  for (let i = 0; i < 100; i++) {
    const id = randomId();
    assert.equal(isValidId(id), true, `randomId produced invalid ${id}`);
  }
});

test("seededId is deterministic", () => {
  const a = seededId("pablo");
  const b = seededId("pablo");
  const c = seededId("pable");
  assert.equal(a, b);
  assert.notEqual(a, c);
});

test("hashString is deterministic", () => {
  assert.equal(hashString("x"), hashString("x"));
  assert.notEqual(hashString("x"), hashString("y"));
  assert.ok(Number.isInteger(hashString("anything")));
  assert.ok(hashString("anything") >= 0);
});

test("mulberry32 yields same sequence from same seed", () => {
  const a = mulberry32(42);
  const b = mulberry32(42);
  for (let i = 0; i < 5; i++) assert.equal(a(), b());
});

test("createRng composes hashString + mulberry32", () => {
  const rng = createRng("hello");
  const v1 = rng();
  const v2 = rng();
  assert.ok(v1 >= 0 && v1 < 1);
  assert.ok(v2 >= 0 && v2 < 1);
  assert.notEqual(v1, v2);
  // Same seed → same first value
  assert.equal(createRng("hello")(), v1);
});

test("CATEGORY_ORDER + LAYER_ORDER cover all four", () => {
  const want = new Set(["eyes", "heads", "body", "top"]);
  assert.deepEqual(new Set(CATEGORY_ORDER), want);
  assert.deepEqual(new Set(LAYER_ORDER), want);
});

test("PARTS catalog matches partCount", () => {
  for (const cat of CATEGORY_ORDER) {
    assert.equal(PARTS[cat].length, partCount(cat));
    for (const p of PARTS[cat]) {
      assert.ok(typeof p.name === "string" && p.name.length > 0);
      assert.ok(p.path.endsWith(".png"));
    }
  }
});

console.log(`\n${passed} passed, ${failed} failed\n`);
process.exit(failed ? 1 : 0);
