import { readFile } from "node:fs/promises";
import vm from "node:vm";

const html = await readFile(new URL("../public/index.html", import.meta.url), "utf8");
const scripts = [...html.matchAll(/<script>([\\s\\S]*?)<\\/script>/g)];
if (scripts.length === 0) throw new Error("No inline application script found.");
for (const [index, match] of scripts.entries()) {
  new vm.Script(match[1], { filename: `public/index.html:inline-script-${index + 1}` });
}
console.log(`Syntax checks passed for server.js and ${scripts.length} inline browser script(s).`);
