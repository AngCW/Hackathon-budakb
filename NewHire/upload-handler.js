const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const userName = req.body.userName || 'default_user';
    const uploadsDir = path.join(__dirname, '../Uploads');
    const userDir = path.join(uploadsDir, userName.replace(/[^a-zA-Z0-9_-]/g, '_'));
    const documentDir = path.join(userDir, 'documents');
    
    // Create directories if they don't exist
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    if (!fs.existsSync(userDir)) {
      fs.mkdirSync(userDir, { recursive: true });
    }
    if (!fs.existsSync(documentDir)) {
      fs.mkdirSync(documentDir, { recursive: true });
    }
    
    cb(null, documentDir);
  },
  filename: function (req, file, cb) {
    const documentId = req.body.documentId || 'unknown';
    const timestamp = Date.now();
    const fileExtension = path.extname(file.originalname);
    const uniqueFilename = `document_${documentId}_${timestamp}${fileExtension}`;
    cb(null, uniqueFilename);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: function (req, file, cb) {
    // Allowed file types
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/jpeg',
      'image/jpg',
      'image/png'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('File type not allowed. Please upload PDF, DOC, DOCX, JPG, or PNG files.'), false);
    }
  }
});

// File upload endpoint
app.post('/upload', upload.single('document'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const file = req.file;
    const documentId = req.body.documentId || 'unknown';
    const userName = req.body.userName || 'default_user';
    
    // Create response data
    const response = {
      success: true,
      message: 'File uploaded successfully',
      filename: file.filename,
      originalName: file.originalname,
      size: file.size,
      type: file.mimetype,
      uploadPath: file.path,
      userName: userName,
      documentId: documentId,
      folderPath: path.dirname(file.path)
    };

    // Log the upload
    const userDir = path.dirname(path.dirname(file.path));
    const logEntry = `${new Date().toISOString()} - User: ${userName}, Document: ${documentId}, File: ${file.originalname}, Size: ${file.size} bytes, Path: ${file.path}\n`;
    
    fs.appendFileSync(path.join(userDir, 'upload_log.txt'), logEntry);

    // Create or update user info file
    const userInfoPath = path.join(userDir, 'user_info.json');
    let userInfo = {
      userName: userName,
      created: new Date().toISOString(),
      totalUploads: 1,
      lastUpload: new Date().toISOString()
    };

    if (fs.existsSync(userInfoPath)) {
      try {
        const existingInfo = JSON.parse(fs.readFileSync(userInfoPath, 'utf8'));
        userInfo = {
          ...existingInfo,
          totalUploads: (existingInfo.totalUploads || 0) + 1,
          lastUpload: new Date().toISOString()
        };
      } catch (error) {
        console.error('Error reading existing user info:', error);
      }
    }

    fs.writeFileSync(userInfoPath, JSON.stringify(userInfo, null, 2));

    res.json(response);

  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File too large. Maximum size is 10MB.' });
    }
  }
  
  if (error.message) {
    return res.status(400).json({ error: error.message });
  }
  
  res.status(500).json({ error: 'Internal server error' });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, () => {
  console.log(`Upload server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log(`Upload endpoint: http://localhost:${PORT}/upload`);
});

module.exports = app;
