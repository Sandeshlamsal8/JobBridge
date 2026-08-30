const {
  calculateSimilarity,
  batchCalculateSimilarity,
} = require("../ai-service/embeddingService");

test("identical text has full similarity", async () => {
  await expect(
    calculateSimilarity("Node React MongoDB", "Node React MongoDB"),
  ).resolves.toBe(100);
});

test("related text scores above unrelated text", async () => {
  const related = await calculateSimilarity(
    "JavaScript React frontend developer",
    "React JavaScript engineer",
  );
  const unrelated = await calculateSimilarity(
    "JavaScript React frontend developer",
    "accounting payroll tax",
  );

  expect(related).toBeGreaterThan(unrelated);
});

test("batch similarity preserves input order", async () => {
  await expect(
    batchCalculateSimilarity(["React developer", "tax accountant"], "React engineer"),
  ).resolves.toEqual([expect.any(Number), expect.any(Number)]);
});
