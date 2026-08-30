const {
  hashResetToken,
  hashPin,
  comparePin,
} = require("../utils/securityTokens");

test("reset tokens become deterministic SHA-256 hashes", () => {
  const hash = hashResetToken("reset-secret");

  expect(hash).toMatch(/^[a-f0-9]{64}$/);
  expect(hash).toBe(hashResetToken("reset-secret"));
  expect(hash).not.toContain("reset-secret");
});

test("PIN hashes do not expose the PIN", async () => {
  const hash = await hashPin("123456");

  expect(hash).not.toContain("123456");
  await expect(comparePin("123456", hash)).resolves.toBe(true);
  await expect(comparePin("654321", hash)).resolves.toBe(false);
});
