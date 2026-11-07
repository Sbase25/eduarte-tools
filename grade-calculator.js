(function (root, factory) {
  const calculator = factory();
  if (typeof module === "object" && module.exports) module.exports = calculator;
  else root.EduarteGradeCalculator = calculator;
})(globalThis, function () {
  function median(values) {
    if (!values.length) return null;
    const sorted = [...values].sort((a, b) => a - b);
    const middle = Math.floor(sorted.length / 2);
    return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
  }

  function calculateGradeSummary(entries, goal, futureWeight, minimum = 1, maximum = 10) {
    const grades = entries.filter(({ result, weight }) =>
      Number.isFinite(result) && result >= minimum && result <= maximum &&
      Number.isFinite(weight) && weight > 0
    );
    if (!grades.length) return null;

    const totalWeight = grades.reduce((total, grade) => total + grade.weight, 0);
    const weightedTotal = grades.reduce((total, grade) => total + grade.result * grade.weight, 0);
    const weightedAverage = weightedTotal / totalWeight;
    const medianGrade = median(grades.map(({ result }) => result));
    const medianWeight = median(grades.map(({ weight }) => weight));

    if (!Number.isFinite(goal) || goal < minimum || goal > maximum ||
        !Number.isFinite(futureWeight) || futureWeight <= 0) {
      return { totalWeight, weightedAverage, median: medianGrade, medianWeight };
    }

    const needed = (goal * (totalWeight + futureWeight) - weightedTotal) / futureWeight;
    const boundedNeeded = Math.max(minimum, Math.min(maximum, needed));
    return {
      totalWeight,
      weightedAverage,
      median: medianGrade,
      medianWeight,
      needed,
      achievable: needed <= maximum,
      roundedNeeded: Math.ceil((needed - Number.EPSILON) * 10) / 10,
      projectedAverage: (weightedTotal + boundedNeeded * futureWeight) / (totalWeight + futureWeight),
      currentlyPassing: weightedAverage >= goal,
    };
  }

  function calculateGradeStatistics(entries, threshold = 5.5) {
    const values = entries
      .map(({ result }) => result)
      .filter((result) => Number.isFinite(result));
    if (!values.length) return null;

    const mean = values.reduce((total, value) => total + value, 0) / values.length;
    const medianGrade = median(values);
    const frequencies = new Map();
    values.forEach((value) => frequencies.set(value, (frequencies.get(value) || 0) + 1));
    const highestFrequency = Math.max(...frequencies.values());
    const modes = highestFrequency > 1
      ? [...frequencies].filter(([, count]) => count === highestFrequency).map(([value]) => value).sort((a, b) => a - b)
      : [];
    const standardDeviation = Math.sqrt(
      values.reduce((total, value) => total + (value - mean) ** 2, 0) / values.length
    );
    const sufficient = values.filter((value) => value >= threshold).length;

    return {
      count: values.length,
      mean,
      median: medianGrade,
      modes,
      modeCount: modes.length ? highestFrequency : 0,
      standardDeviation,
      minimum: Math.min(...values),
      maximum: Math.max(...values),
      sufficient,
      insufficient: values.length - sufficient,
      sufficientPercent: (sufficient / values.length) * 100,
      distribution: Array.from({ length: 10 }, (_, index) => {
        const bucket = index + 1;
        return { grade: bucket, count: values.filter((value) => Math.round(value) === bucket).length };
      }),
    };
  }

  function parseGradeBackup(value, minimum = 1, maximum = 10) {
    let backup;
    try {
      backup = typeof value === "string" ? JSON.parse(value) : value;
    } catch {
      throw new Error("Dit back-upbestand bevat geen geldige JSON.");
    }

    const isEduarteBackup = backup?.format === "eduarte-tools-grades" && backup.version === 1;
    const isStudyToolsBackup = backup?.date && backup?.year && Array.isArray(backup?.grades);
    if (!backup || (!isEduarteBackup && !isStudyToolsBackup) || !Array.isArray(backup.grades)) {
      throw new Error("Dit is geen ondersteunde Eduarte Tools-cijferback-up.");
    }

    const grades = backup.grades.map((grade) => {
      if (isStudyToolsBackup) {
        return {
          result: Number(String(grade?.CijferStr ?? "").replace(",", ".")),
          weight: Number(grade?.CijferKolom?.Weging),
          title: String(
            grade?.CijferKolom?.KolomOmschrijving ||
            grade?.CijferKolom?.KolomNaam ||
            grade?.CijferKolom?.WerkInformatieOmschrijving ||
            ""
          ).slice(0, 160),
        };
      }
      return {
        result: Number(String(grade?.result ?? "").replace(",", ".")),
        weight: Number(String(grade?.weight ?? "").replace(",", ".")),
        title: String(grade?.title || "").slice(0, 160),
      };
    });
    if (!grades.length || grades.some(({ result, weight }) =>
      !Number.isFinite(result) || result < minimum || result > maximum ||
      !Number.isFinite(weight) || weight <= 0
    )) {
      throw new Error("De back-up bevat geen geldige cijfers en positieve wegingen.");
    }
    return grades;
  }

  return { calculateGradeSummary, calculateGradeStatistics, parseGradeBackup };
});
