const express = require('express');
const router = express.Router();
const db = require('./db-connector');
const ejs = require('ejs');
PORT = 3000;


router.get('/', async function(req, res) {
  const select_query = `SELECT * FROM Drugs;`;

  async function fetch_drug_list() {
    return new Promise((resolve, reject) => {
      db.pool.query(select_query, function(err, results) {
        if (err) {
          reject(err);
        } else {
          resolve(results);
        }
      })
    })
  };

  try {
    const drug_data = await fetch_drug_list();
    const formatted_data = drug_data.map(drug => ({
      ...drug,
      storeFridge: Boolean(drug.storeFridge.readUInt8()),
      storeFreezer: Boolean(drug.storeFreezer.readUInt8())
    }));
    res.render('drugs.ejs', {drug_data: formatted_data});
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  };

});

router.post('/', validateInput, insertData, handleErrors, redirectToHome);

function validateInput(req, res, next) {
  const { drugName, drugStrength, drugForm, drugATC, drugNDC, storeFridge, storeFreezer, totalQuantity, earlyExpiration } = req.body;

  if (!drugName || !drugStrength || !drugForm || !drugATC || !drugNDC || !storeFridge || !storeFreezer || !totalQuantity || !earlyExpiration) {
    return res.status(400).send('Missing required fields');
  }

  // Continue to the next middleware if validation passes
  next();
}

function insertData(req, res, next) {
  const { drugName, drugPropName, drugStrength, drugForm, drugATC, drugNDC, storeFridge, storeFreezer, totalQuantity, earlyExpiration } = req.body;

  pool.query('INSERT INTO Drugs (drugName, drugPropName, drugStrength, drugForm, drugATC, drugNDC, storeFridge, storeFreezer, totalQuantity, earlyExpiration) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', [drugName, drugPropName, drugStrength, drugForm, drugATC, drugNDC, storeFridge, storeFreezer, totalQuantity, earlyExpiration], (error, results) => {
    if (error) {
      return next(error);
    }
    // Data successfully inserted, continue to the next middleware
    next();
  });
}

function redirectToHome(req, res) {
  res.redirect('/');
}

function handleErrors(error, req, res) {
  console.error(error);
  res.status(500).send('An error occurred');
}

module.exports = router;