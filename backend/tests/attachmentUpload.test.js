jest.mock("../models/Attachment", () => ({ create: jest.fn() }));
jest.mock("../utils/gridfs", () => ({
  uploadFile: jest.fn(),
  downloadFile: jest.fn(),
  deleteFile: jest.fn(),
}));

const Attachment = require("../models/Attachment");
const { uploadFile } = require("../utils/gridfs");
const AttachmentService = require("../services/attachmentService");

test("does not persist an attachment when malware scanning fails", async () => {
  const scanError = Object.assign(new Error("Malware detected"), {
    statusCode: 422,
  });
  jest.spyOn(AttachmentService, "scanBuffer").mockRejectedValue(scanError);

  await expect(
    AttachmentService.uploadAttachment(
      {
        buffer: Buffer.from("%PDF-test"),
        mimetype: "application/pdf",
        originalname: "resume.pdf",
        size: 9,
      },
      "user-id",
      "conversation-id",
    ),
  ).rejects.toBe(scanError);

  expect(uploadFile).not.toHaveBeenCalled();
  expect(Attachment.create).not.toHaveBeenCalled();
});
