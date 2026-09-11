(function () {
  if (location.hostname === "login.microsoftonline.com") return;
  if (!/\/resultaten(?:\/|$)/i.test(location.pathname)) return;
  const ROOT_ID = "eduarte-tools-overlay";
  if (document.getElementById(ROOT_ID)) return;

  chrome.storage.local.get(["eduarteGradesEnabled"], (settings) => {
    if (settings.eduarteGradesEnabled === false) return;
    createOverlay();
  });

  function createOverlay() {
  const root = document.createElement("div");
  root.id = ROOT_ID;
  const shadow = root.attachShadow({ mode: "closed" });
  document.documentElement.appendChild(root);

  shadow.innerHTML = `
    <style>
      :host { all: initial; }
      * { box-sizing: border-box; }
      .toggle {
        position: fixed; z-index: 2147483646; right: 18px; bottom: 20px;
        width: 52px; height: 52px; border: 0; border-radius: 18px;
        color: #fff; background: linear-gradient(135deg, #2563eb, #7c3aed);
        box-shadow: 0 12px 30px rgba(37,99,235,.35); cursor: pointer;
        font: 700 21px/1 system-ui, sans-serif; transition: transform .2s, box-shadow .2s;
      }
      .toggle:hover { transform: translateY(-3px) rotate(-3deg); box-shadow: 0 16px 34px rgba(37,99,235,.45); }
      .panel {
        position: fixed; z-index: 2147483645; top: 16px; right: 16px; bottom: 16px;
        width: min(390px, calc(100vw - 32px)); padding: 22px; overflow: auto;
        color: #eef2ff; background: rgba(15,23,42,.94); border: 1px solid rgba(148,163,184,.2);
        border-radius: 24px; box-shadow: 0 24px 80px rgba(2,6,23,.45);
        backdrop-filter: blur(22px); font: 14px/1.45 system-ui, sans-serif;
        transform: translateX(calc(100% + 32px)); opacity: 0;
        transition: transform .32s cubic-bezier(.22,1,.36,1), opacity .2s ease;
      }
      .panel.open { transform: translateX(0); opacity: 1; }
      .head { display:flex; align-items:center; justify-content:space-between; gap: 12px; margin-bottom: 18px; }
      h2 { margin: 0; font-size: 20px; letter-spacing: -.03em; }
      .eyebrow { margin: 0 0 3px; color: #93c5fd; font-size: 11px; font-weight: 700; letter-spacing: .09em; text-transform: uppercase; }
      .close, .icon { border: 0; color: #cbd5e1; background: rgba(148,163,184,.12); cursor:pointer; }
      .close { width: 32px; height: 32px; border-radius: 10px; font-size: 18px; }
      .close:hover, .icon:hover { background: rgba(148,163,184,.25); }
      .intro, .message { color: #94a3b8; font-size: 12px; }
      .intro { margin: 0 0 16px; }
      .rows { display: grid; gap: 7px; }
      .row { display:grid; grid-template-columns: 1fr 1fr 32px; gap: 7px; animation: enter .25s both; }
      input { width:100%; padding: 9px 10px; border: 1px solid rgba(148,163,184,.22); border-radius: 10px; outline: 0; color:#f8fafc; background: rgba(30,41,59,.8); font: inherit; }
      input:focus { border-color: #60a5fa; box-shadow: 0 0 0 3px rgba(96,165,250,.14); }
      .icon { border-radius: 10px; font-size: 16px; }
      .actions { display:flex; gap: 8px; margin: 12px 0 16px; }
      button.action { flex:1; padding: 10px; border: 1px solid rgba(148,163,184,.2); border-radius: 11px; color:#dbeafe; background: rgba(30,41,59,.85); cursor:pointer; font: 600 12px system-ui; }
      button.action.primary { border-color: transparent; color: white; background: linear-gradient(135deg,#2563eb,#7c3aed); }
      button.action:hover { transform: translateY(-1px); filter: brightness(1.12); }
      .settings { display:grid; grid-template-columns: 1fr 1fr; gap: 8px; }
      label { color:#94a3b8; font-size: 11px; }
      label input { display:block; margin-top: 5px; }
      .metrics { display:grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-top: 16px; }
      .metric { padding: 12px; border:1px solid rgba(148,163,184,.16); border-radius: 14px; background: rgba(30,41,59,.58); }
      .metric b { display:block; color:#f8fafc; font-size: 20px; letter-spacing:-.03em; }
      .metric span { color:#94a3b8; font-size: 10px; }
      .message { min-height: 36px; margin: 13px 0 0; }
      @keyframes enter { from { opacity:0; transform:translateY(5px); } to { opacity:1; transform:none; } }
      @media (prefers-reduced-motion: reduce) { *, *::before, *::after { animation-duration: .01ms !important; transition-duration: .01ms !important; } }
    </style>
    <button class="toggle" aria-label="Open Eduarte cijferlijst" title="Eduarte Tools">✦</button>
    <aside class="panel" aria-hidden="true">
      <div class="head"><div><p class="eyebrow">Eduarte Tools</p><h2>Cijferoverzicht</h2></div><button class="close" aria-label="Sluiten">×</button></div>
      <p class="intro">Selecteer cijfers uit je cijferlijst of voeg ze hieronder toe. De berekening wordt meteen bijgewerkt.</p>
      <div class="rows"></div>
      <div class="actions"><button class="action" data-action="add">+ Cijfer</button><button class="action primary" data-action="scan">Cijferlijst scannen</button></div>
      <div class="settings"><label>Doelgemiddelde<input class="target" type="number" min="1" max="10" step=".1" value="5.5"></label><label>Weging volgend cijfer<input class="future" type="number" min=".1" step=".1" value="1"></label></div>
      <div class="metrics"><div class="metric"><b class="average">—</b><span>Gewogen gemiddelde</span></div><div class="metric"><b class="median">—</b><span>Mediaan</span></div><div class="metric"><b class="needed">—</b><span>Benodigd cijfer</span></div><div class="metric"><b class="result">—</b><span>Nieuw gemiddelde</span></div></div>
      <p class="message">Klik op “Cijferlijst scannen” als je cijfers nog niet zijn gevonden.</p>
    </aside>
  `;

  const panel = shadow.querySelector(".panel");
  const rows = shadow.querySelector(".rows");
  const message = shadow.querySelector(".message");
  const input = (className) => shadow.querySelector(`.${className}`);
  const format = (value) => Number.isFinite(value) ? value.toLocaleString("nl-NL", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "—";

  function addRow(grade = "", weight = "1") {
    const row = document.createElement("div");
    row.className = "row";
    row.innerHTML = `<input class="grade" type="number" min="1" max="10" step=".1" placeholder="Cijfer" value="${grade}"><input class="weight" type="number" min=".1" step=".1" placeholder="Weging" value="${weight}"><button class="icon" aria-label="Verwijderen">×</button>`;
    row.querySelector(".icon").addEventListener("click", () => { row.remove(); calculate(); });
    row.querySelectorAll("input").forEach((field) => field.addEventListener("input", calculate));
    rows.appendChild(row);
  }

  function calculate() {
    const values = [...rows.querySelectorAll(".row")].map((row) => ({
      result: Number(row.querySelector(".grade").value),
      weight: Number(row.querySelector(".weight").value),
    })).filter(({ result, weight }) => result >= 1 && result <= 10 && weight > 0);
    if (!values.length) {
      ["average", "median", "needed", "result"].forEach((name) => input(name).textContent = "—");
      message.textContent = "Voeg cijfers toe of scan je cijferlijst.";
      return;
    }
    const total = values.reduce((sum, item) => sum + item.weight, 0);
    const weighted = values.reduce((sum, item) => sum + item.result * item.weight, 0);
    const average = weighted / total;
    const sorted = values.map((item) => item.result).sort((a, b) => a - b);
    const middle = Math.floor(sorted.length / 2);
    const median = sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
    const target = Number(input("target").value);
    const future = Number(input("future").value);
    const needed = (target * (total + future) - weighted) / future;
    const bounded = Math.max(1, Math.min(10, needed));
    input("average").textContent = format(average);
    input("median").textContent = format(median);
    input("needed").textContent = format(needed);
    input("result").textContent = format((weighted + bounded * future) / (total + future));
    message.textContent = needed > 10 ? `Je hebt een ${format(needed)} nodig; dat is niet haalbaar met één cijfer.` : `Je hebt ongeveer een ${format(needed)} nodig voor een gemiddelde van ${format(target)}.`;
  }

  function readGradeCells() {
    const selectors = [
      ".result-overview--grades td",
      ".result-overview--grades [class*='result']",
      ".container-card table td",
      "table[id^='id'] td",
    ];
    const cells = [...new Set(selectors.flatMap((selector) => [...document.querySelectorAll(selector)]))];
    return cells.map((element) => ({
      element,
      text: element.textContent.trim().replace(",", "."),
    })).filter(({ text }) => /^(?:[1-9](?:\.\d{1,2})?|10(?:\.0{1,2})?)$/.test(text));
  }

  function scan() {
    const grades = readGradeCells();
    rows.innerHTML = "";
    grades.forEach(({ element, text }) => {
      element.classList.add("eduarte-tools-grade-source");
      addRow(text);
      element.addEventListener("click", () => addRow(text), { once: true });
    });
    calculate();
    message.textContent = grades.length ? `${grades.length} cijfers gevonden. Klik op een cijfer om het opnieuw toe te voegen.` : "De resultaten worden nog geladen. Probeer opnieuw zodra de matrix zichtbaar is.";
  }

  shadow.querySelector(".toggle").addEventListener("click", () => { panel.classList.add("open"); panel.setAttribute("aria-hidden", "false"); });
  shadow.querySelector(".close").addEventListener("click", () => { panel.classList.remove("open"); panel.setAttribute("aria-hidden", "true"); });
  shadow.querySelector('[data-action="add"]').addEventListener("click", () => { addRow(); calculate(); });
  shadow.querySelector('[data-action="scan"]').addEventListener("click", scan);
  input("target").addEventListener("input", calculate);
  input("future").addEventListener("input", calculate);
  addRow();
  calculate();
  const resultsObserver = new MutationObserver(() => {
    if (readGradeCells().length && !root.dataset.resultsFound) {
      root.dataset.resultsFound = "true";
      scan();
    }
  });
  resultsObserver.observe(document.documentElement, { childList: true, subtree: true });
  setTimeout(() => resultsObserver.disconnect(), 30000);
  }
})();
