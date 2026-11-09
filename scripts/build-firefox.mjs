// Bouwt de Firefox-versie van Eduarte Tools in dist/firefox en dist/eduarte-tools-firefox-<versie>.zip
// Gebruik: node scripts/build-firefox.mjs
import { cpSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const out = join(root, "dist", "firefox");
const manifest = JSON.parse(readFileSync(join(root, "manifest.json"), "utf8"));

rmSync(out, { recursive: true, force: true });
mkdirSync(out, { recursive: true });
for (const entry of [
  "background.js", "badge-logic.js", "badge.js", "content.js", "eduarte-api.js",
  "grade-calculator.js", "rooster-sync.js", "overlay.js", "theme.js", "privacy.html",
  "popup-dist", "icons", "assets", "LICENSE", "THIRD_PARTY_NOTICES.txt",
]) {
  cpSync(join(root, entry), join(out, entry), { recursive: true });
}

// Firefox: geen service worker en geen offscreen-API (background.js valt dan
// terug op navigator.geolocation in de achtergrondpagina).
const firefox = { ...manifest };
firefox.permissions = manifest.permissions.filter((permission) => permission !== "offscreen");
firefox.background = { scripts: ["background.js"] };
firefox.browser_specific_settings = {
  gecko: {
    id: "eduarte-tools@sbase25.github.io",
    strict_min_version: "128.0",
    data_collection_permissions: { required: ["none"], optional: ["locationInfo"] },
  },
};
writeFileSync(join(out, "manifest.json"), JSON.stringify(firefox, null, 2));

const zip = join(root, "dist", `eduarte-tools-firefox-${manifest.version}.zip`);
rmSync(zip, { force: true });
execFileSync("zip", ["-qr", zip, "."], { cwd: out });
console.log(`Firefox-build klaar: ${zip}`);
