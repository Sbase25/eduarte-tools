// Bouwt de Firefox-versie van Eduarte Tools in dist/firefox en dist/eduarte-tools-firefox-<versie>.zip
// Gebruik: node scripts/build-firefox.mjs
import { cpSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const out = join(root, "dist", "firefox");
const source = join(root, "extension");
const manifest = JSON.parse(readFileSync(join(source, "manifest.json"), "utf8"));

rmSync(out, { recursive: true, force: true });
mkdirSync(out, { recursive: true });
// De hele map extension/ (behalve het manifest, dat hieronder wordt aangepast) plus licentie en privacybeleid
cpSync(source, out, { recursive: true, filter: (path) => path !== join(source, "manifest.json") });
for (const [from, to] of [["LICENSE", "LICENSE"], ["THIRD_PARTY_NOTICES.txt", "THIRD_PARTY_NOTICES.txt"], ["docs/privacy.html", "privacy.html"]]) {
  cpSync(join(root, from), join(out, to));
}

// Firefox: geen service worker en geen offscreen-API (background.js valt dan
// terug op navigator.geolocation in de achtergrondpagina).
const firefox = { ...manifest };
firefox.permissions = manifest.permissions.filter((permission) => permission !== "offscreen");
firefox.background = { scripts: ["calendar-feed.js", "background.js"] };
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
