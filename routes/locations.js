const express = require('express');
const router = express.Router();
const db = require('./db-connector');
const ejs = require('ejs');
const path = require('path')

PORT = 3000;

router.get('/', function(req, res) {
  res.sendFile(path.join(__dirname, 'html', 'locations.html'))
})

module.exports = router;