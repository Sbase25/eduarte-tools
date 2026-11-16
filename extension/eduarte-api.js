(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.EduarteApi = api;
})(globalThis, function () {
  const GRADE_PATTERN = /^(?:[0-9]|10)(?:[,.][0-9]{1,2})?$/;
  const TABLE_SELECTORS = [
    ".result-overview--grades table",
    ".result-overview--grades",
    ".container-card table",
    "table[id^='id']",
  ];

  function parseGrade(value, minimum = 1, maximum = 10) {
    const text = String(value ?? "").trim();
    if (!GRADE_PATTERN.test(text)) return null;
    const result = Number(text.replace(",", "."));
    return Number.isFinite(result) && result >= minimum && result <= maximum ? result : null;
  }

  function getWeight(element, row) {
    const raw = element.dataset?.weight
      ?? element.dataset?.weging
      ?? row.dataset?.weight
      ?? row.dataset?.weging
      ?? element.getAttribute("data-weegfactor")
      ?? row.getAttribute("data-weegfactor");
    if (raw == null || String(raw).trim() === "") return null;
    const weight = Number(String(raw).replace(",", "."));
    return Number.isFinite(weight) && weight > 0 ? weight : null;
  }

  function getGrades(document, { minimum = 1, maximum = 10 } = {}) {
    const tables = new Set(TABLE_SELECTORS.flatMap((selector) => [...document.querySelectorAll(selector)]));
    const seenCells = new Set();
    const grades = [];

    tables.forEach((table, tableIndex) => {
      [...table.querySelectorAll("tr")].forEach((row, rowIndex) => {
        const cells = [...row.querySelectorAll("th, td")];
        cells.forEach((cell, cellIndex) => {
          if (seenCells.has(cell)) return;
          const result = parseGrade(cell.textContent, minimum, maximum);
          if (result === null) return;
          seenCells.add(cell);

          const columnHeader = table.querySelectorAll("thead tr:last-child th, thead tr:last-child td")[cellIndex];
          const rowHeading = cells.slice(0, cellIndex).find((candidate) =>
            candidate.tagName === "TH" || !parseGrade(candidate.textContent, minimum, maximum)
          );
          const parts = [rowHeading?.textContent, columnHeader?.textContent]
            .map((part) => part?.trim())
            .filter(Boolean);
          const weight = getWeight(cell, row);

          grades.push({
            id: cell.id || cell.dataset.gradeId || `${tableIndex}:${rowIndex}:${cellIndex}`,
            result,
            weight: weight ?? 1,
            hasWeight: weight !== null,
            title: parts.join(" · ").slice(0, 160) || `Cijfer ${grades.length + 1}`,
            rowIndex,
            columnIndex: cellIndex,
            element: cell,
          });
        });
      });
    });

    return grades;
  }

  function watchGrades(document, callback, options) {
    const observer = new document.defaultView.MutationObserver(() => callback(getGrades(document, options)));
    observer.observe(document.documentElement, { childList: true, subtree: true, characterData: true });
    return () => observer.disconnect();
  }

  return { parseGrade, getGrades, watchGrades };
});
