import { NextApiRequest, NextApiResponse } from 'next';
import formidable from 'formidable';
import fs from 'fs';
import path from 'path';
import mime from 'mime-types';

export const config = {
  api: {
    bodyParser: false,
  },
};

const uploadDir = path.join(process.cwd(), 'public', 'uploads');

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    const form = formidable({ multiples: true, uploadDir, keepExtensions: true });

    form.parse(req, (err, fields, files) => {
      if (err) {
        return res.status(500).json({ message: 'Error parsing form data' });
      }

      const file = Array.isArray(files.file) ? files.file[0] : files.file;
      if (!file) {
        return res.status(400).json({ message: 'No file uploaded' });
      }

      // Check if the file is an image
      const originalFilename = file.originalFilename || '';
      const mimeType = mime.lookup(originalFilename);
      if (!mimeType || !mimeType.startsWith('image/')) {
        return res.status(400).json({ message: 'Only image files are allowed' });
      }

      // Get the custom filename from the fields
      const customFilename = fields.filename ? fields.filename.toString() : file.newFilename;
      const fileExtension = path.extname(originalFilename);
      const newFilename = `${customFilename}${fileExtension}`;
      const filePath = path.join(uploadDir, newFilename);

      // Rename the file
      fs.renameSync(file.filepath, filePath);

      res.status(200).json({ message: 'File uploaded successfully', fileName: newFilename });
    });
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}