const { pipeline, cos_sim } = require("@xenova/transformers");

// Singleton pattern for model loading
let embeddingModel = null;

/**
 * Initialize the embedding model (lazy loading)
 */
async function initializeModel() {
  if (!embeddingModel) {
    console.log("Loading embedding model...");
    // Using all-MiniLM-L6-v2 - lightweight and efficient for semantic similarity
    embeddingModel = await pipeline(
      "feature-extraction",
      "Xenova/all-MiniLM-L6-v2",
    );
    console.log("Embedding model loaded successfully");
  }
  return embeddingModel;
}

/**
 * Generate embeddings for text
 */
async function generateEmbedding(text) {
  try {
    const model = await initializeModel();

    // Truncate text if too long (model has token limits)
    const truncatedText = text.substring(0, 5000);

    // Generate embedding
    const output = await model(truncatedText, {
      pooling: "mean",
      normalize: true,
    });

    // Convert to array
    return Array.from(output.data);
  } catch (error) {
    console.error("Error generating embedding:", error);
    throw new Error("Failed to generate embedding");
  }
}

/**
 * Calculate cosine similarity between two embeddings
 */
function cosineSimilarity(embedding1, embedding2) {
  if (embedding1.length !== embedding2.length) {
    throw new Error("Embeddings must have the same length");
  }

  let dotProduct = 0;
  let norm1 = 0;
  let norm2 = 0;

  for (let i = 0; i < embedding1.length; i++) {
    dotProduct += embedding1[i] * embedding2[i];
    norm1 += embedding1[i] * embedding1[i];
    norm2 += embedding2[i] * embedding2[i];
  }

  norm1 = Math.sqrt(norm1);
  norm2 = Math.sqrt(norm2);

  if (norm1 === 0 || norm2 === 0) {
    return 0;
  }

  return dotProduct / (norm1 * norm2);
}

/**
 * Calculate similarity score between CV and Job Description
 */
async function calculateSimilarity(cvText, jobDescription) {
  try {
    const [cvEmbedding, jdEmbedding] = await Promise.all([
      generateEmbedding(cvText),
      generateEmbedding(jobDescription),
    ]);

    const similarity = cosineSimilarity(cvEmbedding, jdEmbedding);

    // Convert to percentage (0-100)
    return Math.round(similarity * 100);
  } catch (error) {
    console.error("Error calculating similarity:", error);
    throw error;
  }
}

/**
 * Batch calculate similarities for multiple CVs against one job
 */
async function batchCalculateSimilarity(cvTexts, jobDescription) {
  try {
    const jdEmbedding = await generateEmbedding(jobDescription);

    const similarities = await Promise.all(
      cvTexts.map(async (cvText) => {
        const cvEmbedding = await generateEmbedding(cvText);
        return cosineSimilarity(cvEmbedding, jdEmbedding);
      }),
    );

    // Convert to percentages
    return similarities.map((sim) => Math.round(sim * 100));
  } catch (error) {
    console.error("Error in batch similarity calculation:", error);
    throw error;
  }
}

module.exports = {
  initializeModel,
  generateEmbedding,
  cosineSimilarity,
  calculateSimilarity,
  batchCalculateSimilarity,
};
