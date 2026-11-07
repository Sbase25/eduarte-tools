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
