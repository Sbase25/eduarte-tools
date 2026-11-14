export function drawGradeCards(grades, random = Math.random) {
  const shuffled = grades
    .filter((grade) => Number.isFinite(grade.result) && grade.result >= 0 && grade.result <= 10)
    .map((grade, index) => ({
      id: String(grade.id ?? index),
      subject: String(grade.title || "Eduarte-cijfer"),
      result: grade.result,
      weight: grade.hasWeight ? grade.weight : null,
    }));

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }

  return shuffled.slice(0, 3);
}

// Zelfde sleutel als extension/grade-reveal.js: zo weet het portaal welke cijfers onthuld zijn.
export function gradeKey(grade) {
  return `${String(grade?.title ?? "").trim()}|${Number(grade?.result)}`;
}

// Trekt drie kaarten, met nog niet onthulde (nieuwe) cijfers eerst.
// `revealed` is de lijst sleutels die al gezien zijn; null = alles is al gezien.
export function drawPackCards(grades, revealed = null, random = Math.random) {
  const valid = grades.filter((grade) => Number.isFinite(grade.result) && grade.result >= 0 && grade.result <= 10);
  const seen = revealed ? new Set(revealed) : null;
  const isNew = (grade) => Boolean(seen) && !seen.has(gradeKey(grade));
  const shuffle = (list) => {
    const copy = [...list];
    for (let index = copy.length - 1; index > 0; index -= 1) {
      const swapIndex = Math.floor(random() * (index + 1));
      [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
    }
    return copy;
  };
  const picked = [...shuffle(valid.filter(isNew)), ...shuffle(valid.filter((grade) => !isNew(grade)))].slice(0, 3);
  return picked.map((grade, index) => ({
    id: String(grade.id ?? index),
    key: gradeKey(grade),
    subject: String(grade.title || "Eduarte-cijfer"),
    result: grade.result,
    weight: grade.hasWeight ? grade.weight : null,
    isNew: isNew(grade),
  }));
}

// De kaart die de walkout krijgt: het hoogste nieuwe cijfer, anders het hoogste cijfer.
export function starCard(cards) {
  if (!cards.length) return null;
  const pool = cards.some((card) => card.isNew) ? cards.filter((card) => card.isNew) : cards;
  return pool.reduce((best, card) => (card.result > best.result ? card : best));
}
