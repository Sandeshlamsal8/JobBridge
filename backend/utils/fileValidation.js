const path = require("path");

const FILE_TYPES = {
  pdf: { mimes: ["application/pdf"], extensions: [".pdf"] },
  doc: { mimes: ["application/msword"], extensions: [".doc"] },
  docx: {
    mimes: ["application/vnd.openxmlformats-officedocument.wordprocessingml.document"],
    extensions: [".docx"],
  },
  jpeg: { mimes: ["image/jpeg", "image/jpg"], extensions: [".jpg", ".jpeg"] },
  png: { mimes: ["image/png"], extensions: [".png"] },
  gif: { mimes: ["image/gif"], extensions: [".gif"] },
  webp: { mimes: ["image/webp"], extensions: [".webp"] },
};

function startsWith(buffer, signature) {
  return buffer.length >= signature.length && buffer.subarray(0, signature.length).equals(signature);
}

function detectFileType(buffer) {
  if (!Buffer.isBuffer(buffer)) return null;
  if (startsWith(buffer, Buffer.from("%PDF-"))) return "pdf";
  if (startsWith(buffer, Buffer.from("d0cf11e0a1b11ae1", "hex"))) return "doc";
  if (
    startsWith(buffer, Buffer.from("504b0304", "hex")) &&
    buffer.includes(Buffer.from("word/document.xml"))
  ) {
    return "docx";
  }
  if (startsWith(buffer, Buffer.from("ffd8ff", "hex"))) return "jpeg";
  if (startsWith(buffer, Buffer.from("89504e470d0a1a0a", "hex"))) return "png";
  if (startsWith(buffer, Buffer.from("GIF87a")) || startsWith(buffer, Buffer.from("GIF89a"))) {
    return "gif";
  }
  if (
    startsWith(buffer, Buffer.from("RIFF")) &&
    buffer.length >= 12 &&
    buffer.subarray(8, 12).equals(Buffer.from("WEBP"))
  ) {
    return "webp";
  }
  return null;
}

function validateUploadedFile(file) {
  const detected = detectFileType(file?.buffer);
  const claimedMime = file?.mimetype?.toLowerCase();
  const extension = path.extname(file?.originalname || "").toLowerCase();
  const definition = detected && FILE_TYPES[detected];

  if (
    !definition ||
    !definition.mimes.includes(claimedMime) ||
    !definition.extensions.includes(extension)
  ) {
    const error = new Error("File content does not match its type or extension");
    error.statusCode = 422;
    throw error;
  }
  return detected;
}

module.exports = { FILE_TYPES, detectFileType, validateUploadedFile };
