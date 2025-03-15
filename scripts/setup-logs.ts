import fs from 'fs';
import path from 'path';

const logsDir = path.join(process.cwd(), 'logs');

// Create logs directory if it doesn't exist
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
  console.log('Created logs directory:', logsDir);
}

// Ensure proper permissions (readable/writable by owner and group)
fs.chmodSync(logsDir, 0o775);
console.log('Set permissions for logs directory');

console.log('Logging setup completed successfully!');
