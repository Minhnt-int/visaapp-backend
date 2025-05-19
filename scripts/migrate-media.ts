import fs from 'fs';
import path from 'path';
import { connectToDatabase } from '../lib/db';
import { Media } from '../model';
import logger from '../lib/logger';

async function migrateMediaFiles() {
  try {
    await connectToDatabase();
    
    const publicUploadsDir = path.join(process.cwd(), 'public', 'uploads');
    const newUploadsDir = path.join(process.cwd(), 'uploads');

    // Create new uploads directory if it doesn't exist
    if (!fs.existsSync(newUploadsDir)) {
      fs.mkdirSync(newUploadsDir, { recursive: true });
    }

    // Get all media records
    const mediaRecords = await Media.findAll();
    logger.info(`Found ${mediaRecords.length} media records to migrate`);

    for (const media of mediaRecords) {
      try {
        const oldPath = path.join(publicUploadsDir, path.basename(media.url));
        const newPath = path.join(newUploadsDir, path.basename(media.url));

        // Check if file exists in old location
        if (fs.existsSync(oldPath)) {
          // Copy file to new location
          fs.copyFileSync(oldPath, newPath);
          logger.info(`Migrated file: ${path.basename(media.url)}`);
        } else {
          logger.warn(`File not found in old location: ${oldPath}`);
        }
      } catch (error) {
        logger.error(`Error migrating file ${media.url}:`, error);
      }
    }

    logger.info('Media migration completed');
  } catch (error) {
    logger.error('Error during media migration:', error);
  }
}

// Run the migration
migrateMediaFiles(); 