import { getConnection } from '../../../lib/db';
import formidable from 'formidable';
import {IncomingForm} from "formidable"
import fs from 'fs/promises';
import path from 'path';

export const config = {
  api: {
    bodyParser: false,
  },
};

// Ensure upload directory exists with more robust path handling
const ensureUploadDirectory = async () => {
  // Use an absolute path or fallback to a reliable upload directory
  const uploadDir = path.resolve(process.cwd(), 'uploads');
  
  try {
    // Ensure the directory exists, create if not
    await fs.mkdir(uploadDir, { recursive: true });
  } catch (error) {
    console.error('Error creating upload directory:', error);
    // Fallback to a system-wide temp directory if needed
    if (error.code !== 'EEXIST') {
      throw error;
    }
  }
  
  return uploadDir;
};

export default async function handler(req, res) {
  try {
    // Get the upload directory path, with robust error handling
    const uploadDir = await ensureUploadDirectory();

    if (req.method === 'POST') {
      const form = new IncomingForm({
        uploadDir: uploadDir,
        keepExtensions: true,
        maxFileSize: 5 * 1024 * 1024 // 5MB max file size
      });

      const parseForm = () => {
        return new Promise((resolve, reject) => {
          form.parse(req, async (err, fields, files) => {
            if (err) {
              reject(err);
              return;
            }

            // Convert files to a standard format
            const processedFiles = {};
            Object.keys(files).forEach(key => {
              const file = files[key];
              processedFiles[key] = Array.isArray(file) ? file[0] : file;
            });

            resolve({ 
              fields: Object.fromEntries(
                Object.entries(fields).map(([k, v]) => [k, Array.isArray(v) ? v[0] : v])
              ), 
              files: processedFiles 
            });
          });
        });
      };

      try {
        const { fields, files } = await parseForm();

        // Safely extract fields
        const name = fields.name;
        const address = fields.address;
        const city = fields.city;
        const state = fields.state;
        const contact = fields.contact;
        const email_id = fields.email_id;
        
        // Handle file specifically
        const imageFile = files.image;

        // Comprehensive validation
        const validationErrors = [];
        if (!name) validationErrors.push('Name is required');
        if (!address) validationErrors.push('Address is required');
        if (!city) validationErrors.push('City is required');
        if (!state) validationErrors.push('State is required');
        if (!contact || !/^[0-9]{10}$/.test(contact)) 
          validationErrors.push('Contact must be a 10-digit number');
        if (!email_id || !/\S+@\S+\.\S+/.test(email_id)) 
          validationErrors.push('Valid email is required');
        
        // Specific image validation
        if (!imageFile || !imageFile.filepath) {
          validationErrors.push('Image is required');
        }

        // Handle validation errors
        if (validationErrors.length > 0) {
          // Clean up uploaded file if it exists
          if (imageFile && imageFile.filepath) {
            try {
              await fs.unlink(imageFile.filepath);
            } catch (cleanupError) {
              console.error('Error cleaning up file:', cleanupError);
            }

            return res.status(400).json({ 
              error: 'Validation Failed', 
              details: validationErrors 
            });
          }
        }

        // Verify file path exists and is valid
        if (!imageFile.filepath) {
          throw new Error('Invalid file path');
        }

        // Read file as buffer
        const imageBuffer = await fs.readFile(imageFile.filepath);

        // Get database connection
        const connection = await getConnection();

        // Insert data into the database, including the image as BLOB
        const [result] = await connection.query(
          'INSERT INTO schools (name, address, city, state, contact, email_id, image) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [name, address, city, state, contact, email_id, imageBuffer]
        );

        // Clean up uploaded file
        await fs.unlink(imageFile.filepath);

        res.status(201).json({ 
          message: 'School added successfully',
          id: result.insertId 
        });

      } catch (error) {
        // Comprehensive error logging
        console.error('Full error details:', {
          message: error.message,
          name: error.name,
          stack: error.stack,
          code: error.code
        });

        // Ensure a JSON response
        res.status(500).json({ 
          error: 'Internal Server Error', 
          message: error.message,
          // Only include stack trace in development
          ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
        });
      }
    } else {
      res.status(405).json({ error: 'Method Not Allowed' });
    }
  } catch (setupError) {
    // Handle any errors in initial setup (like directory creation)
    console.error('Setup error:', setupError);
    res.status(500).json({ 
      error: 'Server Setup Error', 
      message: setupError.message 
    });
  }
};