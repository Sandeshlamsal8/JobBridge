const { adminConfig } = require("../scripts/createAdmin");

test("administrator bootstrap requires deployment credentials", () => {
  expect(() => adminConfig({})).toThrow("MONGODB_URI");
  expect(() => adminConfig({ MONGODB_URI: "mongodb://db/jobbridge" })).toThrow(
    "ADMIN_EMAIL",
  );
});

test("administrator bootstrap rejects weak passwords", () => {
  expect(() =>
    adminConfig({
      MONGODB_URI: "mongodb://db/jobbridge",
      ADMIN_EMAIL: "admin@example.com",
      ADMIN_PASSWORD: "password",
    }),
  ).toThrow("ADMIN_PASSWORD");
});

test("administrator bootstrap accepts strong environment credentials", () => {
  expect(
    adminConfig({
      MONGODB_URI: "mongodb://db/jobbridge",
      ADMIN_EMAIL: "ADMIN@example.com ",
      ADMIN_PASSWORD: "StrongPassword1!",
    }),
  ).toEqual({
    mongoUri: "mongodb://db/jobbridge",
    email: "admin@example.com",
    password: "StrongPassword1!",
  });
});
