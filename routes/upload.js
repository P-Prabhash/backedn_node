const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const upload = require('../middleware/uploadMiddleware');
const { authenticate } = require('../middleware/authMiddleware');
const { formatPhotoUrl } = require('../utils/imageHelper');

// ============================================================
// POST /upload (.php) /upload.php
// ============================================================
router.post(['/', '/upload.php', '/image', '/image.php'], authenticate, (req, res, next) => {
  upload.any()(req, res, (err) => {
    if (err) {
      console.warn('[UPLOAD WARNING]', err.message);
    }
    next();
  });
}, (req, res) => {
  // 1. Check Multer File Upload
  const uploadedFile = (req.files && req.files.length > 0) ? req.files[0] : req.file;

  if (uploadedFile) {
    let folder = req.query.folder || req.body.folder || req.body.type || 'customers';
    folder = String(folder).trim().toLowerCase();
    if (folder === 'customer') folder = 'customers';
    if (folder === 'gold_item' || folder === 'golditem') folder = 'gold';

    const photoUrl = formatPhotoUrl(req, `uploads/${folder}/${uploadedFile.filename}`);

    return res.json({
      success: true,
      message: 'File uploaded successfully.',
      photo_url: photoUrl,
      url: photoUrl,
      filename: uploadedFile.filename,
      data: {
        photo_url: photoUrl,
        url: photoUrl
      }
    });
  }

  // 2. Check Base64 Image Upload in JSON
  const base64Str = String(
    req.body.image_base64 ||
    req.body.image ||
    req.body.photo ||
    req.body.base64 ||
    req.body.file_base64 ||
    ''
  ).trim();

  if (base64Str) {
    try {
      let folder = String(
        req.body.folder ||
        req.body.type ||
        req.body.upload_type ||
        req.query.folder ||
        req.query.type ||
        'customers'
      ).trim().toLowerCase();

      if (folder === 'customer') folder = 'customers';
      if (folder === 'gold_item' || folder === 'golditem') folder = 'gold';

      const targetDir = path.join(__dirname, '..', 'uploads', folder);
      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
      }

      const cleanBase64 = base64Str.replace(/^data:image\/\w+;base64,/, '');
      const buffer = Buffer.from(cleanBase64, 'base64');
      const filename = `${folder}_${Date.now()}_${Math.floor(Math.random() * 1000)}.jpg`;
      const filePath = path.join(targetDir, filename);

      fs.writeFileSync(filePath, buffer);
      const photoUrl = formatPhotoUrl(req, `uploads/${folder}/${filename}`);

      return res.json({
        success: true,
        message: 'Image uploaded successfully.',
        photo_url: photoUrl,
        url: photoUrl,
        filename,
        data: {
          photo_url: photoUrl,
          url: photoUrl
        }
      });
    } catch (err) {
      return res.status(500).json({
        success: false,
        message: 'Failed to save base64 image: ' + err.message
      });
    }
  }

  return res.status(400).json({
    success: false,
    message: 'No photo file or base64 image provided.'
  });
});

module.exports = router;
