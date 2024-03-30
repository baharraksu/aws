const express = require('express');
const multer = require('multer');
const AWS = require('aws-sdk');
const path = require('path');
require('dotenv').config();
const app = express();
const storage = multer.memoryStorage();
const fileFilter = (req, file, cb) => {
    // Allow only image files
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'), false);
    }
};
const upload = multer({
    storage: storage,
    limits: { fileSize: 1024 * 1024 * 5 },
    fileFilter: fileFilter
});
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
});
app.use(express.static(__dirname)); // Serve static files from the current directory
app.post('/upload', upload.single('file'), async (req, res) => {
    const file = req.file;
    const params = {
      Bucket: process.env.AWS_S3_BUCKET_NAME,
      Key: file.originalname,
      Body: file.buffer,
      ContentType: file.mimetype
    };
    try {
      await s3.upload(params).promise();
      res.status(200).send('File uploaded to S3 successfully!');
    } catch (error) {
      console.error(error);
      res.status(500).send('Error uploading file to S3');
    }
});
app.use((error, req, res, next) => {
    if (error instanceof multer.MulterError) {
      res.status(400).send('Error uploading file: ' + error.message);
    } else if (error) {
      res.status(400).send('Error: ' + error.message);
    } else {
      next();
    }
});
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'basic.html'));
  });
app.listen(3000, () => {
    console.log('Server is running on port 3000');
});