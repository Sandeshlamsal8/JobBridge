const { tokenVersionMatches } = require("../middleware/auth");

test("accepts matching token versions including legacy zero", () => {
  expect(tokenVersionMatches({}, {})).toBe(true);
  expect(tokenVersionMatches({ tokenVersion: 2 }, { tokenVersion: 2 })).toBe(true);
});

test("rejects tokens issued before a password change", () => {
  expect(tokenVersionMatches({ tokenVersion: 1 }, { tokenVersion: 2 })).toBe(false);
});
