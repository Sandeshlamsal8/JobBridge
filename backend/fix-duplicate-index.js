require('dotenv').config();
const mongoose = require('mongoose');

async function fixDuplicateIndex() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const db = mongoose.connection.db;
    const collection = db.collection('applications');

    // Get all indexes
    console.log('\nCurrent indexes:');
    const indexes = await collection.indexes();
    indexes.forEach(index => {
      console.log(`- ${index.name}:`, JSON.stringify(index.key));
    });

    // Drop the unique index if it exists
    try {
      console.log('\nDropping unique index job_1_applicant_1...');
      await collection.dropIndex('job_1_applicant_1');
      console.log('✅ Unique index dropped successfully');
    } catch (error) {
      if (error.code === 27) {
        console.log('ℹ️  Index does not exist (already dropped)');
      } else {
        throw error;
      }
    }

    // Create a non-unique index
    console.log('\nCreating non-unique index...');
    await collection.createIndex({ job: 1, applicant: 1 }, { unique: false });
    console.log('✅ Non-unique index created');

    // Show final indexes
    console.log('\nFinal indexes:');
    const finalIndexes = await collection.indexes();
    finalIndexes.forEach(index => {
      console.log(`- ${index.name}:`, JSON.stringify(index.key), index.unique ? '(UNIQUE)' : '');
    });

    console.log('\n✅ Database fix completed successfully!');
    console.log('You can now apply for jobs multiple times (after withdrawal).');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('\nDatabase connection closed.');
    process.exit(0);
  }
}

fixDuplicateIndex();
