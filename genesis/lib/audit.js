import { createHash } from "node:crypto";

const ZERO_HASH = "0".repeat(64);

export class AuditLedger {
  #events = [];

  append(type, details = {}) {
    const previousHash = this.#events.at(-1)?.hash || ZERO_HASH;
    const event = {
      sequence: this.#events.length + 1,
      timestamp: new Date().toISOString(),
      type,
      details,
      previousHash
    };
    event.hash = createHash("sha256").update(JSON.stringify(event)).digest("hex");
    this.#events.push(Object.freeze(event));
    return event;
  }

  list() {
    return this.#events.map(event => ({ ...event }));
  }

  verify() {
    let previousHash = ZERO_HASH;
    for (let index = 0; index < this.#events.length; index += 1) {
      const event = this.#events[index];
      const { hash, ...payload } = event;
      const expected = createHash("sha256").update(JSON.stringify(payload)).digest("hex");
      if (event.sequence !== index + 1 || event.previousHash !== previousHash || hash !== expected) {
        return { valid: false, invalidSequence: event.sequence };
      }
      previousHash = hash;
    }
    return { valid: true, entries: this.#events.length, head: previousHash };
  }
}
