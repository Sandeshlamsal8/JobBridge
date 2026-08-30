function tokenize(text) {
  return String(text || "")
    .toLowerCase()
    .match(/[a-z0-9+#.]+/g)?.filter((token) => token.length > 1) || [];
}

function termCounts(text) {
  const counts = new Map();
  for (const token of tokenize(text)) {
    counts.set(token, (counts.get(token) || 0) + 1);
  }
  return counts;
}

function cosineSimilarity(vector1, vector2) {
  if (vector1.length !== vector2.length) {
    throw new Error("Vectors must have the same length");
  }
  let dotProduct = 0;
  let norm1 = 0;
  let norm2 = 0;
  for (let index = 0; index < vector1.length; index += 1) {
    dotProduct += vector1[index] * vector2[index];
    norm1 += vector1[index] ** 2;
    norm2 += vector2[index] ** 2;
  }
  return norm1 && norm2 ? dotProduct / Math.sqrt(norm1 * norm2) : 0;
}

async function calculateSimilarity(firstText, secondText) {
  const first = termCounts(firstText);
  const second = termCounts(secondText);
  const vocabulary = [...new Set([...first.keys(), ...second.keys()])];
  const firstVector = vocabulary.map((term) => first.get(term) || 0);
  const secondVector = vocabulary.map((term) => second.get(term) || 0);
  return Math.round(cosineSimilarity(firstVector, secondVector) * 100);
}

async function batchCalculateSimilarity(texts, comparisonText) {
  return Promise.all(texts.map((text) => calculateSimilarity(text, comparisonText)));
}

async function initializeModel() {
  return true;
}

module.exports = {
  initializeModel,
  cosineSimilarity,
  calculateSimilarity,
  batchCalculateSimilarity,
};
