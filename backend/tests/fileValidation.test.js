const {
  detectFileType,
  validateUploadedFile,
} = require("../utils/fileValidation");

const OLE_SIGNATURE = Buffer.from("d0cf11e0a1b11ae1", "hex");

test.each([
  [Buffer.from("%PDF-1.7\n"), "pdf"],
  [OLE_SIGNATURE, "doc"],
  [Buffer.from("PK\x03\x04word/document.xml"), "docx"],
  [Buffer.from("ffd8ffe000104a464946", "hex"), "jpeg"],
  [Buffer.from("89504e470d0a1a0a", "hex"), "png"],
])("detects supported file signatures", (buffer, type) => {
  expect(detectFileType(buffer)).toBe(type);
});

test("rejects content that does not match the claimed document type", () => {
  expect(() =>
    validateUploadedFile({
      buffer: Buffer.from("plain text renamed as pdf"),
      mimetype: "application/pdf",
      originalname: "resume.pdf",
    }),
  ).toThrow("content does not match");
});

test("accepts a matching document signature, MIME type, and extension", () => {
  expect(
    validateUploadedFile({
      buffer: Buffer.from("%PDF-1.7\n"),
      mimetype: "application/pdf",
      originalname: "resume.pdf",
    }),
  ).toBe("pdf");
});
