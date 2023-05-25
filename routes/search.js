const express = require('express');
const router = express.Router();
const db = require('./db-connector');
const ejs = require('ejs');
PORT = 3000;

router.get('/', async function(req, res) {
  const search_query = `SELECT drugID FROM Drugs 
  WHERE drugName 
  LIKE CONCAT('%', ?, '%');`
});