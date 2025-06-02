const express = require('express');
const router = express.Router();
const os = require('os');

router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    hostname: os.hostname(),
    timestamp: new Date().toISOString()
  });
});

module.exports = router;