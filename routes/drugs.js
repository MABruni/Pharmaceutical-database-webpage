const express = require('express');
const router = express.Router();
const db = require('./db-connector');
const ejs = require('ejs');
PORT = 3000;



async function get_data_sql(req, res) {
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
      storeFreezer: Boolean(drug.storeFreezer.readUInt8()),
      earlyExpiration:drug.earlyExpiration.toISOString().split('T')[0]
    }));
    return formatted_data
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  };
};


router.get('/', async function(req, res) {
  const formatted_data = await get_data_sql()
  res.render('drugs.ejs', {drug_data: formatted_data});
});

router.get('/editdrug', async function(req, res) {
  const formatted_data = await get_data_sql()
  res.render('drugedit.ejs', {drug_data: formatted_data})
})

// router.post('/', validateInput, insertData, handleErrors, redirectToHome);

function validateInput(req, res, next) {
  const { drugName, drugStrength, drugForm, drugATC, drugNDC, storeFridge, storeFreezer, totalQuantity, earlyExpiration } = req.body;

  if (!drugName || !drugStrength || !drugForm || !drugATC || !drugNDC || !storeFridge || !storeFreezer || !totalQuantity || !earlyExpiration) {
    return res.status(400).send('Missing required fields');
  }

  next();
}

function get_data_web(req, res, next) {
  const [drug_name, drug_propn, drug_strength, drug_form, drug_atc, drug_ndc, drug_fridge, drug_freezer, drug_quantity, drug_expiration]
  = [req.body.name, req.body.propName, req.body.strength, req.body.form, req.body.atc, req.body.ndc, req.body.fridge, req.body.freezer, req.body.quantity, req.body.expiration];

  req.drugData = {
    drugName: drug_name,
    drugPropName: drug_propn,
    drugStrength: drug_strength,
    drugForm: drug_form,
    drugATC: drug_atc,
    drugNDC: drug_ndc,
    storeFridge: drug_fridge === 'true' ? 1 : 0,
    storeFreezer: drug_freezer === 'true' ? 1 : 0,
    totalQuantity: drug_quantity,
    earlyExpiration: drug_expiration
  };

  next()
};

function insert_data(req, res, next) {
  const { drugName, drugPropName, drugStrength, drugForm, drugATC, drugNDC, storeFridge, storeFreezer, totalQuantity, earlyExpiration } = req.drugData;
  
  db.pool.query(`UPDATE Drugs
    SET drugName = ?, drugPropName = ?, drugStrength = ?, drugForm = ?, drugATC = ?, drugNDC = ?, storeFridge = ?, storeFreezer = ?, totalQuantity = ?, earlyExpiration = ?
    WHERE drugName = ?`, [drugName, drugPropName, drugStrength, drugForm, drugATC, drugNDC, storeFridge, storeFreezer, totalQuantity, earlyExpiration, drugName], 
    (error, results) => {
    if (error) {
      return next(error);
    }
  })

  next()
};

router.put('/drugchanges', get_data_web, insert_data, redirect);

function redirect(req, res) {
  res.redirect('/');
}

module.exports = router;