const express = require('express');
const router = express.Router();
const db = require('./db-connector');
const ejs = require('ejs');
const path = require('path')

PORT = 3000;

router.get('/', function(req, res) {
  res.render('vendordrugs_blank.ejs')
});

router.post('/searchinfo', async function(req, res) {
  const search_term = req.body.vendor_name
  if (search_term === '') {
    res.redirect('/vendordrugs')
  } else {
    db.pool.query(`SELECT vendorName FROM Vendors WHERE vendorName LIKE CONCAT('%', ?, '%')`, [search_term], (error, result) => {
      if (error) {
        redirect(req, res) 
      } else {
        if (result.length >0) {
          const vendorName = result[0].vendorName
          const redirectURL = `/vendordrugs/${vendorName}`
          res.redirect(redirectURL)
        } else {
          req.flash('not_found', 'No matching vendors found')
          res.redirect('/vendordrugs')
        }
      }
    })
  }
});

router.get('/:vendorname', async function(req, res) {
  const vendor_name = req.params.vendorname

  const vendor_query = `SELECT * FROM Vendors
  WHERE vendorName = ?;`

  const drugs_sold_query = `SELECT Drugs.drugName, VendorDrugs.unitPrice, VendorDrugs.discountOffered
  FROM VendorDrugs
  INNER JOIN Drugs ON VendorDrugs.drugID = Drugs.drugID
  INNER JOIN Vendors ON VendorDrugs.vendorID = Vendors.vendorID
  WHERE VendorDrugs.vendorID = (
	  SELECT vendorID FROM Vendors WHERE vendorName = ?
  );`

  function query_result(query, params) {
    return new Promise((resolve, reject) => {
      db.pool.query(query, params, function(err, results) {
        if (err) {
          console.error(err);
          reject(err);
        } else {
          resolve(results);
        }
      })
    })
  };

  async function fetch_vendor_info() {
    try {
      const [vendor, drugs] = await Promise.all([
        query_result(vendor_query, [vendor_name]),
        query_result(drugs_sold_query, [vendor_name]),
      ]);

      return {
        vendor: vendor,
        drugs: drugs
      };
    } catch(error) {
      throw new Error('Fetch error');
    }
  };

  try {
    const vendor_data = await fetch_vendor_info();
    const success_message = req.flash('success');
    const no_changes_message = req.flash('no_changes')
    const missing_message = req.flash('missing')
    const added_message = req.flash('drug_added')
    const delete_error = req.flash('delete_error')
    const delete_success = req.flash('delete_success')


    res.render('vendordrugs.ejs', {
      vendor_name: vendor_name,
      vendor_data: vendor_data,
      success_message: success_message,
      no_changes_message: no_changes_message,
      missing_message: missing_message,
      added_message: added_message,
      delete_error: delete_error,
      delete_success: delete_success
      });
  } catch (error) {
    res.status(500).send('Internal Server Error');
  };
});

router.get('/editvendor/:vendorname', async function(req, res) {
  const vendor_name = req.params.vendorname

  const vendor_query = `SELECT * FROM Vendors
  WHERE vendorName = ?;`

  const drugs_sold_query = `SELECT Drugs.drugName, VendorDrugs.unitPrice, VendorDrugs.discountOffered
  FROM VendorDrugs
  INNER JOIN Drugs ON VendorDrugs.drugID = Drugs.drugID
  INNER JOIN Vendors ON VendorDrugs.vendorID = Vendors.vendorID
  WHERE VendorDrugs.vendorID = (
	  SELECT vendorID FROM Vendors WHERE vendorName = ?
  );`

  function query_result(query, params) {
    return new Promise((resolve, reject) => {
      db.pool.query(query, params, function(err, results) {
        if (err) {
          console.error(err);
          reject(err);
        } else {
          resolve(results);
        }
      })
    })
  };

  async function fetch_vendor_info() {
    try {
      const [vendor, drugs] = await Promise.all([
        query_result(vendor_query, [vendor_name]),
        query_result(drugs_sold_query, [vendor_name]),
      ]);

      return {
        vendor: vendor,
        drugs: drugs
      };
    } catch(error) {
      throw new Error('Fetch error');
    }
  };

  try {
    const vendor_data = await fetch_vendor_info();
    const drug_name = req.params.drugName;
    const success_message = req.flash('success');
    const no_changes_message = req.flash('no_changes')
    const missing_message = req.flash('missing')
    const added_message = req.flash('drug_added')
    const delete_error = req.flash('delete_error')
    const delete_success = req.flash('delete_success')


    res.render('vendordrugs_edit.ejs', {
      vendor_name: vendor_name,
      drugName: drug_name,
      vendor_data: vendor_data,
      success_message: success_message,
      no_changes_message: no_changes_message,
      missing_message: missing_message,
      added_message: added_message,
      delete_error: delete_error,
      delete_success: delete_success
      });
  } catch (error) {
    res.status(500).send('Internal Server Error');
  };
});

router.get('/editdrug/:drugName/:vendorname', async function(req, res) {
  const vendor_name = req.params.vendorname

  const vendor_query = `SELECT * FROM Vendors
  WHERE vendorName = ?;`

  const drugs_sold_query = `SELECT Drugs.drugName, VendorDrugs.unitPrice, VendorDrugs.discountOffered
  FROM VendorDrugs
  INNER JOIN Drugs ON VendorDrugs.drugID = Drugs.drugID
  INNER JOIN Vendors ON VendorDrugs.vendorID = Vendors.vendorID
  WHERE VendorDrugs.vendorID = (
	  SELECT vendorID FROM Vendors WHERE vendorName = ?
  );`

  function query_result(query, params) {
    return new Promise((resolve, reject) => {
      db.pool.query(query, params, function(err, results) {
        if (err) {
          console.error(err);
          reject(err);
        } else {
          resolve(results);
        }
      })
    })
  };

  async function fetch_vendor_info() {
    try {
      const [vendor, drugs] = await Promise.all([
        query_result(vendor_query, [vendor_name]),
        query_result(drugs_sold_query, [vendor_name]),
      ]);

      return {
        vendor: vendor,
        drugs: drugs,
      };
    } catch(error) {
      throw new Error('Fetch error');
    }
  };

  try {
    const vendor_data = await fetch_vendor_info();
    const drug_name = req.params.drugName;
    const success_message = req.flash('success');
    const no_changes_message = req.flash('no_changes')
    const missing_message = req.flash('missing')
    const added_message = req.flash('drug_added')
    const delete_error = req.flash('delete_error')
    const delete_success = req.flash('delete_success')


    res.render('vendordrugs_edit.ejs', {
      vendor_name: vendor_name,
      drugName: drug_name,
      vendor_data: vendor_data,
      success_message: success_message,
      no_changes_message: no_changes_message,
      missing_message: missing_message,
      added_message: added_message,
      delete_error: delete_error,
      delete_success: delete_success
      });
  } catch (error) {
    res.status(500).send('Internal Server Error');
  };
});

router.post('/adddrug/:vendorName', get_data_web_add, validate_input, add_data, redirect_add);

router.put('../vendorchanges', get_data_web_vendor_table, check_changes_vendor, insert_data_vendors, no_changes_vendors, redirect_vendor);

router.put('/drugchanges/:vendorName', get_data_web_vdrug_table, check_changes_drugs, insert_data_drugs, no_changes_drugs, redirect_drug);

router.delete('/deleteVendor/:vendorID', delete_data_vendor, redirect_vendor);

router.delete('/deleteDrug/:drugName/:vendorName', delete_data_drug, redirect_delete);

async function get_data_vendors_sql(req, res) {
  const select_query = `SELECT * FROM Vendors;`;

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
    return drug_data
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  };
};

async function get_data_vdrugs_sql(req, res) {
  const select_query = `SELECT * FROM VendorDrugs;`;

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
    const vdrug_data = await fetch_drug_list();
    return vdrug_data
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  };
};

function get_data_web_add(req, res, next) {
  const [drug_name, unit_price, discount]
  = [req.body.add_drugn, req.body.add_unitp, req.body.add_discount];

  const vendor_name = req.params.vendorName

  req.add_drug = {
    vendorName: vendor_name,
    drugName: drug_name,
    unitPrice: unit_price,
    discount: discount
  };

  next()
};

function get_data_web_vdrug_table(req, res, next) {
  const [drug_name, unit_price, discount]
  = [req.body.edit_drugn, req.body.edit_unitp, req.body.edit_discount];

  const vendorName = req.params.vendorName

  req.edit_drug = {
    vendorName: vendorName,
    drugName: drug_name,
    unitPrice: unit_price,
    discount: discount
  };

  next()
};

function get_data_web_vendor_table(req, res, next) {
  const [vendor_name, contact_person, phone, email, street, city, state, zip_code]
  = [req.body.name, req.body.contact, req.body.phoneNumber, req.body.email, req.body.street, req.body.city, req.body.state, req.body.zipCode];

  req.vendor_data = {
    vendorName: vendor_name,
    contactPerson: contact_person,
    phoneNumber: phone,
    email: email,
    street: street,
    city: city,
    state: state,
    zipCode: zip_code
  };

  next()
};

function validate_input(req, res, next) {
  const { vendorName, drugName, unitPrice, discount } = req.add_drug;

  if (!drugName || !unitPrice || !discount) {
    req.flash('missing', 'Required fields missing');
    redirect_add(req, res, next)
  } else {
    next()
  }
};

function add_data(req, res, next) {
  const { vendorName, drugName, unitPrice, discount } = req.add_drug;

  const vendorID_query = `SELECT vendorID FROM Vendors WHERE vendorName = ?;`
  const vendorID_params = [ vendorName ]

  db.pool.query(vendorID_query, vendorID_params, (vendor_error, vendor_result) => {
    if (vendor_error) {
      return next(vendor_error)
    }

    const vendorID = vendor_result[0].vendorID;

    const drugID_query = `SELECT drugID FROM Drugs WHERE drugName = ?;`
    const drugID_params = [ drugName ]

    db.pool.query(drugID_query, drugID_params, (drug_error, drug_results) => {
      if (drug_error) {
        return next(drug_error)
      }

      const drugID = drug_results[0].drugID

      const insert_query = `INSERT INTO VendorDrugs (vendorID, drugID, unitPrice, discountOffered)
      VALUES (?, ?, ?, ?);`
      const insert_params = [vendorID, drugID, unitPrice, discount]

      db.pool.query(insert_query, insert_params, (error, results) => {
        if (error) {
          return next(error);
        } else {
          req.flash('drug_added', 'Drug added succesfully')
          next()
        }
      })
    })
  })
};

async function check_changes_vendor(req,res,next) {
  const { vendorName, contactPerson, phoneNumber, email, street, city, state, zipCode } = req.vendor_data;
  const sql_data = await get_data_vendors_sql()

  const vendor_editted = sql_data.find(vendor => vendor.vendorName === vendorName);  

  const is_modified =
    vendorName != vendor_editted.vendorName ||
    contactPerson != vendor_editted.contactPerson ||
    phoneNumber != vendor_editted.phoneNumber ||
    email != vendor_editted.email ||
    street != vendor_editted.street ||
    city != vendor_editted.city ||
    state != vendor_editted.state ||
    zipCode != vendor_editted.zipCode;

  if (is_modified) {
    insert_data_vendors(req, res, next);
  } else {
    no_changes_vendors(req, res, next);
  }
};

async function check_changes_drugs(req,res,next) {
  const { vendorName, drugName, unitPrice, discount } = req.edit_drug;
  const sql_data = await get_data_vdrugs_sql();

  const drug_editted = sql_data.find(vendorDrug => vendorDrug.unitPrice == unitPrice); 
  
  db.pool.query(`SELECT vendorName FROM Vendors WHERE vendorID = ?`, [drug_editted.vendorID], (vendor_error, vendor_result) => {
    if (vendor_error) {
      return next(vendor_error)
    } else {

      db.pool.query(`SELECT drugName FROM Drugs WHERE drugID = ?`, [drug_editted.drugID], (drug_error, drug_results) => {
        if (drug_error) {
          return next(drug_error)
        } else {

          const is_modified =
          vendorName != vendor_result[0].vendorName ||
          drugName != drug_results[0].drugName ||
          unitPrice != drug_editted.unitPrice ||
          discount != drug_editted.discountOffered;
        
          if (is_modified) {
            insert_data_drugs(req, res, next);
          } else {
            no_changes_drugs(req, res, next);
          }
        }
      })
    }
  })
};

function insert_data_vendors(req, res, next) {
  const { vendorName, contactPerson, phoneNumber, email, street, city, state, zipCode } = req.vendor_data;

  db.pool.query(`UPDATE Vendors 
    SET vendorName = ?, contactPerson = ?, phoneNumber = ?, email = ?, street = ?, city = ?, state = ?, zipCode = ?
    WHERE vendorName = ?`, [vendorName, contactPerson, phoneNumber, email, street, city, state, zipCode, vendorName ],
    (error, results) => { 
    if (error) {
      return next(error); 
    } else {
      req.flash('success', 'Vendor updated succesfully');
      req.flash('no_changes', null)
    
      setTimeout(() => {
        redirect_vendor(req, res, next);
      }, 500);
    }
  })
};

function insert_data_drugs(req, res, next) {
  const { vendorName, drugName, unitPrice, discount } = req.edit_drug;

  const vendorID_query = `SELECT vendorID FROM Vendors WHERE vendorName = ?;`
  const vendorID_params = [vendorName]

  db.pool.query(vendorID_query, vendorID_params, (vendor_error, vendor_results) => {
    if (vendor_error) {
      return next(vendor_error)
    }

    const vendorID = vendor_results[0].vendorID

    const drugID_query = `SELECT drugID FROM Drugs WHERE drugName = ?;`
    const drugID_params = [drugName]

    db.pool.query(drugID_query, drugID_params, (drug_error, drug_results) => {
      if (drug_error) {
        return next(drug_error)
      }

      const drugID = drug_results[0].drugID

      const update_query = `UPDATE VendorDrugs 
      SET unitPrice = ?, discountOffered = ?
      WHERE vendorID = ? AND
      drugID = ?;`
      const udpdate_params = [unitPrice, discount, vendorID, drugID]

      db.pool.query(update_query, udpdate_params, (update_error, update_results) => { 
        if (update_error) {
          return next(update_error); 
        } else {
          req.flash('success', 'Drug association updated succesfully');
          req.flash('no_changes', null)
        
          setTimeout(() => {
            redirect_drug(req, res, next);
          }, 500);
        }
      })
    }
  )}
)};

function delete_data_vendor(req, res, next) {
  const { vendorID } = req.params;

  db.pool.query(`DELETE FROM Vendors
  WHERE vendorID = ?;`, [ vendorID ], (error, results) => {
    if (error) {
      req.flash('delete_error', 'Couldn\'t delete the vendor from the database');
      setTimeout(() => {
        redirect_vendor(req, res, next);
      }, 500);
    } else {
      req.flash('delete_success', 'Vendor deleted from the database');
      setTimeout(() => {
        redirect_vendor(req, res, next);
      }, 500);
    }
  })
};

function delete_data_drug(req, res, next) {
  const { drugName, vendorName } = req.params;

  req.vendor_name = vendorName

  db.pool.query(`DELETE FROM VendorDrugs
  WHERE 
  drugID = (SELECT drugID FROM Drugs WHERE drugName = ?) AND
  vendorID = (SELECT vendorID FROM Vendors WHERE vendorName = ?);`,
  [ drugName, vendorName ], (error, results) => {
    if (error) {
      req.flash('delete_error', 'Couldn\'t delete the vendor from the database');
      setTimeout(() => {
        redirect_delete(req, res, next);
      }, 500);
    } else {
      req.flash('delete_success', 'Vendor deleted from the database');
      setTimeout(() => {
        redirect_delete(req, res, next);
      }, 500);
    }
  })
}

function no_changes_vendors(req,res,next) {
  req.flash('no_changes', 'No changes were made')
  req.flash('success', null)

  redirect_vendor(req, res, next);
};

function no_changes_drugs(req,res,next) {
  req.flash('no_changes', 'No changes were made')
  req.flash('success', null)

  redirect_drug(req, res, next);
};

function redirect_vendor(req, res) {
  res.redirect('/vendordrugs/' + encodeURIComponent(req.vendor_data.vendorName))
};

function redirect_add(req, res) {
  res.redirect('/vendordrugs/' + encodeURIComponent(req.add_drug.vendorName))
};

function redirect_drug(req, res) {
  res.redirect('/vendordrugs/' + encodeURIComponent(req.edit_drug.vendorName))
};

function redirect_delete(req, res) {
  res.redirect('/vendordrugs/' + encodeURIComponent(req.vendor_name))
};


module.exports = router;