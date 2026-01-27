const pdf = require("pdf-parse");
const mammoth = require("mammoth");

/**
 * Extract text from PDF buffer
 */
async function extractTextFromPDF(buffer) {
  try {
    const data = await pdf(buffer);
    return data.text;
  } catch (error) {
    console.error("Error extracting text from PDF:", error);
    throw new Error("Failed to parse PDF file");
  }
}

/**
 * Extract text from Word document buffer
 */
async function extractTextFromWord(buffer) {
  try {
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  } catch (error) {
    console.error("Error extracting text from Word:", error);
    throw new Error("Failed to parse Word document");
  }
}

/**
 * Parse CV based on file type
 */
async function parseCV(buffer, contentType) {
  let text = "";

  if (contentType === "application/pdf") {
    text = await extractTextFromPDF(buffer);
  } else if (
    contentType === "application/msword" ||
    contentType ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {
    text = await extractTextFromWord(buffer);
  } else {
    throw new Error("Unsupported file type");
  }

  // Clean and normalize text
  text = cleanText(text);

  return text;
}

/**
 * Clean and normalize text
 */
function cleanText(text) {
  return text
    .replace(/\r\n/g, "\n") // Normalize line endings
    .replace(/\n{3,}/g, "\n\n") // Remove excessive line breaks
    .replace(/\s{2,}/g, " ") // Remove excessive spaces
    .replace(/[^\x00-\x7F]/g, "") // Remove non-ASCII characters
    .trim();
}

module.exports = {
  parseCV,
  extractTextFromPDF,
  extractTextFromWord,
  cleanText,
};
