const express = require('express');
const router = express.Router();
const db = require('./db-connector');
const ejs = require('ejs');
PORT = 3000;


router.get('/', async function(req, res) {
  const formatted_data = await get_data_sql()
  const success_message = req.flash('success');
  const no_changes_message = req.flash('no_changes')
  const missing_message = req.flash('missing')
  const added_message = req.flash('drug_added')
  const delete_error = req.flash('delete_error')
  const delete_success = req.flash('delete_success')
  res.render(
    'drugs.ejs',
    {
      drug_data: formatted_data,
      success_message: success_message,
      no_changes_message: no_changes_message,
      missing_message: missing_message,
      added_message: added_message,
      delete_error: delete_error,
      delete_success: delete_success
    });
});

router.get('/editdrug/:drugID', async function(req, res) {
  const formatted_data = await get_data_sql()
  const { drugID } = req.params;
  res.render('drugedit.ejs', {drug_data: formatted_data, ID: drugID})
})

router.put('/drugchanges', get_data_web_table, check_changes, insert_data, no_changes, redirect);

router.post('/adddrug', get_data_web_add, validate_input, add_data, redirect);

router.post('/searchdrugs', get_data_web_search, search_data, search_redirect);

router.delete('/deletedrug/:drugID', delete_data, redirect);

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
      storeFridge: drug.storeFridge.readUInt8() === 1 ? 'true' : 'false',
      storeFreezer: drug.storeFreezer.readUInt8() === 1 ? 'true' : 'false',
      earlyExpiration: drug.earlyExpiration.toISOString().split('T')[0]
    }));
    return formatted_data
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  };
};

function get_data_web_table(req, res, next) {
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
    totalQuantity: parseInt(drug_quantity),
    earlyExpiration: drug_expiration
  };

  next()
};

function get_data_web_add(req, res, next) {
  const [drug_name, drug_propn, drug_strength, drug_form, drug_atc, drug_ndc, drug_fridge, drug_freezer, drug_quantity, drug_expiration]
  = [req.body.add_name, req.body.add_propn, req.body.add_strength, req.body.add_form, req.body.add_atc, req.body.add_ndc, req.body.add_fridge, req.body.add_freezer, req.body.add_quantity, req.body.add_expiration];

  req.add_drug = {
    drugName: drug_name,
    drugPropName: drug_propn === '' ? null : drug_propn,
    drugStrength: drug_strength,
    drugForm: drug_form,
    drugATC: drug_atc,
    drugNDC: drug_ndc,
    storeFridge: drug_fridge === 'true' ? 1 : 0,
    storeFreezer: drug_freezer === 'true' ? 1 : 0,
    totalQuantity: parseInt(drug_quantity),
    earlyExpiration: drug_expiration
  };

  next()
};

function get_data_web_search(req, res, next) {
  const [drug_name, drug_propn, drug_strength, drug_form, drug_atc, drug_ndc, drug_fridge, drug_freezer, drug_quantity, drug_expiration]
  = [req.body.search_name, req.body.search_propn, req.body.search_strength, req.body.search_form, req.body.search_atc, req.body.search_ndc, req.body.search_fridge, req.body.search_freezer, req.body.search_quantity, req.body.search_expiration];

  req.search_data = {
    drugName: drug_name,
    drugPropName: drug_propn === '' ? null : drug_propn,
    drugStrength: drug_strength,
    drugForm: drug_form,
    drugATC: drug_atc,
    drugNDC: drug_ndc,
    storeFridge: drug_fridge === 'true' ? 1 : 0,
    storeFreezer: drug_freezer === 'true' ? 1 : 0,
    totalQuantity: parseInt(drug_quantity),
    earlyExpiration: drug_expiration
  };

  next()
};

function validate_input(req, res, next) {
  const { drugName, drugPropName, drugStrength, drugForm, drugATC, drugNDC, storeFridge, storeFreezer, totalQuantity, earlyExpiration } = req.add_drug;

  if (!drugName || !drugStrength || !drugForm || !drugATC || !drugNDC || !(storeFridge === 0 || storeFridge === 1 || storeFreezer === 0 || storeFreezer === 1) || !totalQuantity || !earlyExpiration) {
    req.flash('missing', 'Required fields missing');
    redirect(req, res, next)
  } else {
    next()
  }
}

function add_data(req, res, next) {
  const { drugName, drugPropName, drugStrength, drugForm, drugATC, drugNDC, storeFridge, storeFreezer, totalQuantity, earlyExpiration } = req.add_drug;
  
  db.pool.query(`INSERT INTO Drugs (drugName, drugPropName, drugStrength, drugForm, drugATC, drugNDC, storeFridge, storeFreezer, totalQuantity, earlyExpiration)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
  `, [drugName, drugPropName, drugStrength, drugForm, drugATC, drugNDC, storeFridge, storeFreezer, totalQuantity, earlyExpiration],
  (error, results) => {
    if (error) {
      return next(error);
    } else {
      req.flash('drug_added', 'Drug added succesfully')
      next()
    }
  })
}

function search_data(req, res, next) {
  const { drugName, drugPropName, drugStrength, drugForm, drugATC, drugNDC, storeFridge, storeFreezer, totalQuantity, earlyExpiration } = req.search_data;
  
  let search_query = "SELECT * FROM Drugs WHERE 1=1"
  let params = []

  if (drugName) {
    search_query += " AND drugName LIKE CONCAT('%', ?, '%')"
    params.push(drugName)
  }

  if (drugPropName) {
    search_query += " AND drugPropName = ?"
    params.push(drugPropName)
  }

  if (drugStrength) {
    search_query += " AND drugStrength = ?"
    params.push(drugStrength)
  }

  if (drugForm) {
    search_query += " AND drugForm = ?"
    params.push(drugForm)
  }

  if(drugATC) {
    search_query += " AND drugATC = ?"
    params.push(drugATC)
  }

  if (drugNDC) {
    search_query += " AND drugNDC = ?"
    params.push(drugNDC)
  }

  if (storeFridge) {
    search_query += " AND storeFridge = ?"
    params.push(storeFridge)
  }

  if (storeFreezer) {
    search_query += " AND storeFreezer = ?"
    params.push(storeFreezer)
  }

  if (totalQuantity) {
    search_query += " AND totalQuantity = ?"
    params.push(totalQuantity)
  }

  if (earlyExpiration) {
    search_query += " AND earlyExpiration = ?"
    params.push(earlyExpiration)
  }
  
  db.pool.query(search_query, params, (error, results) => {
    if (error) {
      return next(error);
    } else {
      req.search = results
      next()
    }
  })
}

async function check_changes(req,res,next) {
  const { drugName, drugPropName, drugStrength, drugForm, drugATC, drugNDC, storeFridge, storeFreezer, totalQuantity, earlyExpiration } = req.drugData;
  const sql_data = await get_data_sql()
  const formatted_data = sql_data.map(drug => ({
    ...drug,
    storeFridge: drug.storeFridge === 'true' ? 1 : 0,
    storeFreezer: drug.storeFreezer === 'true' ? 1 : 0,
  }));

  const drug_editted = formatted_data.find(drug => drug.drugName === drugName);  

  const is_modified =
    drugName !== drug_editted.drugName ||
    drugPropName !== drug_editted.drugPropName ||
    drugStrength !== drug_editted.drugStrength ||
    drugForm !== drug_editted.drugForm ||
    drugATC !== drug_editted.drugATC ||
    drugNDC !== drug_editted.drugNDC ||
    storeFridge !== drug_editted.storeFridge ||
    storeFreezer !== drug_editted.storeFreezer ||
    totalQuantity !== drug_editted.totalQuantity ||
    earlyExpiration !== drug_editted.earlyExpiration;

  if (is_modified) {
    insert_data(req, res, next);
  } else {
    no_changes(req, res, next);
  }
};

function insert_data(req, res, next) {
  const { drugName, drugPropName, drugStrength, drugForm, drugATC, drugNDC, storeFridge, storeFreezer, totalQuantity, earlyExpiration } = req.drugData;
  
  db.pool.query(`UPDATE Drugs
    SET drugName = ?, drugPropName = ?, drugStrength = ?, drugForm = ?, drugATC = ?, drugNDC = ?, storeFridge = ?, storeFreezer = ?, totalQuantity = ?, earlyExpiration = ?
    WHERE drugName = ?`, [drugName, drugPropName, drugStrength, drugForm, drugATC, drugNDC, storeFridge, storeFreezer, totalQuantity, earlyExpiration, drugName], 
    (error, results) => {
    if (error) {
      return next(error);
    } else {
      req.flash('success', 'Drug updated succesfully');
      req.flash('no_changes', null)
    
      setTimeout(() => {
        redirect(req, res, next);
      }, 500);
    }
  })
};

function delete_data(req, res, next) {
  const { drugID } = req.params;

  db.pool.query(`DELETE FROM Drugs
  WHERE drugID = ?;`, [ drugID ], (error, results) => {
    if (error) {
      req.flash('delete_error', 'Couldn\'t delete the drug from the database');
      setTimeout(() => {
        redirect(req, res, next);
      }, 500);
    } else {
      req.flash('delete_success', 'Drug deleted from the database');
      setTimeout(() => {
        redirect(req, res, next);
      }, 500);
    }
  })
}

function no_changes(req,res,next) {
  req.flash('no_changes', 'No changes were made')
  req.flash('success', null)

  redirect(req, res, next);
}

function redirect(req, res) {
  res.redirect('/');
}

function search_redirect(req, res) {
  const formatted_data = (req.search).map(drug => ({
    ...drug,
    storeFridge: Boolean(drug.storeFridge.readUInt8()),
    storeFreezer: Boolean(drug.storeFreezer.readUInt8()),
    earlyExpiration: drug.earlyExpiration.toISOString().split('T')[0]
  }));

  const success_message = req.flash('success');
  const no_changes_message = req.flash('no_changes')
  const missing_message = req.flash('missing')
  const added_message = req.flash('drug_added')
  const delete_error = req.flash('delete_error')
  const delete_success = req.flash('delete_success')

  res.render(
    './drugs.ejs',
    {
      drug_data: formatted_data,
      success_message: success_message,
      no_changes_message: no_changes_message,
      missing_message: missing_message,
      added_message: added_message,
      delete_error: delete_error,
      delete_success: delete_success
    });
};

module.exports = router;