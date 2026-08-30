const EDITABLE_JOB_FIELDS = [
  "title",
  "description",
  "shortDescription",
  "location",
  "jobType",
  "workMode",
  "experienceLevel",
  "salary",
  "skills",
  "requirements",
  "responsibilities",
  "benefits",
  "category",
  "status",
  "applicationDeadline",
  "applicationEmail",
];

function pickJobFields(input) {
  return Object.fromEntries(
    EDITABLE_JOB_FIELDS.filter((field) => input[field] !== undefined).map(
      (field) => [field, input[field]],
    ),
  );
}

module.exports = { EDITABLE_JOB_FIELDS, pickJobFields };
