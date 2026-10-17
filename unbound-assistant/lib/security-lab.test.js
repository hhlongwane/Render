import test from "node:test";
import assert from "node:assert/strict";
import { listSecurityCases } from "./security-lab.js";

test("security regression cases have unique IDs and usable descriptions", () => {
  const cases = listSecurityCases();
  assert.equal(cases.length, 5);
  assert.equal(new Set(cases.map(item => item.id)).size, cases.length);
  for (const item of cases) {
    assert.ok(item.id.length > 0);
    assert.ok(item.title.length > 0);
    assert.ok(item.rationale.length > 0);
  }
});
