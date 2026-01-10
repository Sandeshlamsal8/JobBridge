require('dotenv').config();
const mongoose = require('mongoose');
const path = require('path');

async function fixResumePaths() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const db = mongoose.connection.db;
    const collection = db.collection('applications');

    // Find all applications with resume
    const applications = await collection.find({ 'resume.path': { $exists: true } }).toArray();
    console.log(`\nFound ${applications.length} applications with resumes`);

    let fixed = 0;
    let skipped = 0;

    for (const app of applications) {
      const oldPath = app.resume.path;
      
      // Check if path needs fixing (contains backslashes or full path)
      if (oldPath.includes('\\') || oldPath.includes('backend')) {
        // Extract just the filename
        const filename = path.basename(oldPath);
        const newPath = `uploads/${filename}`;
        
        console.log(`\nFixing application ${app._id}:`);
        console.log(`  Old: ${oldPath}`);
        console.log(`  New: ${newPath}`);
        
        await collection.updateOne(
          { _id: app._id },
          { $set: { 'resume.path': newPath } }
        );
        
        fixed++;
      } else if (!oldPath.startsWith('uploads/')) {
        // Path doesn't start with uploads/
        const filename = path.basename(oldPath);
        const newPath = `uploads/${filename}`;
        
        console.log(`\nFixing application ${app._id}:`);
        console.log(`  Old: ${oldPath}`);
        console.log(`  New: ${newPath}`);
        
        await collection.updateOne(
          { _id: app._id },
          { $set: { 'resume.path': newPath } }
        );
        
        fixed++;
      } else {
        console.log(`\nSkipping application ${app._id} (already correct): ${oldPath}`);
        skipped++;
      }
    }

    console.log(`\n✅ Fixed ${fixed} resume paths`);
    console.log(`ℹ️  Skipped ${skipped} (already correct)`);
    console.log('\nAll resume paths are now in the correct format!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('\nDatabase connection closed.');
    process.exit(0);
  }
}

fixResumePaths();
