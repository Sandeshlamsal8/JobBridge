const { pickJobFields } = require("../utils/jobFields");

test("keeps editable job fields", () => {
  expect(
    pickJobFields({
      title: "Software Engineer",
      applicationEmail: "jobs@example.com",
      salary: { min: 50000 },
    }),
  ).toEqual({
    title: "Software Engineer",
    applicationEmail: "jobs@example.com",
    salary: { min: 50000 },
  });
});

test("drops ownership and administrative job fields", () => {
  expect(
    pickJobFields({
      title: "Software Engineer",
      company: "attacker",
      companyName: "Fake Company",
      featured: true,
      urgent: true,
      applicationCount: 999,
      viewCount: 999,
      createdAt: new Date(),
    }),
  ).toEqual({ title: "Software Engineer" });
});
