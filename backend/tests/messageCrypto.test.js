const {
  encryptMessage,
  decryptMessage,
} = require("../utils/messageCrypto");

const KEY = "ab".repeat(32);

test("message encryption round-trips without exposing plaintext", () => {
  const ciphertext = encryptMessage("confidential message", KEY);

  expect(ciphertext).not.toContain("confidential message");
  expect(decryptMessage(ciphertext, KEY)).toBe("confidential message");
});

test("message encryption rejects malformed keys", () => {
  expect(() => encryptMessage("message", "weak-key")).toThrow(
    "MESSAGE_ENCRYPTION_KEY",
  );
});

test("legacy plaintext previews remain readable for migration", () => {
  expect(decryptMessage("legacy preview", KEY)).toBe("legacy preview");
  expect(decryptMessage("Interview time: 10:30", KEY)).toBe(
    "Interview time: 10:30",
  );
});
