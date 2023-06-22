const express = require('express');
const router = express.Router();
const db = require('./db-connector');
const ejs = require('ejs');
const path = require('path')

PORT = 3000;

router.get('/', async (req, res) => {
  const vendor_data = await get_data_sql();
  const success_message = req.flash('success');
  const no_changes_message = req.flash('no_changes')
  const missing_message = req.flash('missing')
  const added_message = req.flash('vendor_added')
  const delete_error = req.flash('delete_error')
  const delete_success = req.flash('delete_success')
  res.render(
    'vendor_blank.ejs', 
    {
      vendor_data: vendor_data,
      success_message: success_message,
      no_changes_message: no_changes_message,
      missing_message: missing_message,
      added_message: added_message,
      delete_error: delete_error,
      delete_success: delete_success 
    });
});

router.get('/editvendor/:vendorName', async function(req, res) {
  const formattedData = await get_data_sql();
  const { vendorName } = req.params;
  res.render('editvendor.ejs', { vendorData: formattedData, name: vendorName });
});

router.put('/vendorchanges', get_data_web_table, check_changes, insert_data, no_changes, redirect)

router.post('/addvendor', get_data_web_add, validate_input, add_data, redirect);

router.post('/vendorsearch', get_data_web_search, search_data, search_redirect)

router.delete('/deletevendor/:vendorID', delete_data, redirect);


async function get_data_sql(req, res) {
  const selectQuery = `SELECT * FROM Vendors`;

  async function fetch_vendor_list() {
    return new Promise((resolve, reject) => {
      db.pool.query(selectQuery, (err, results) => {
        (err) ? reject(err) : resolve(results);
      })
    })
  };

  try {
    const vendor_data = await fetch_vendor_list();
    return vendor_data;
  } catch (err) {
    console.error(err);
    res.status(500).send('Internal Server Error');
  }
};

function get_data_web_table(req, res, next) {
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

function get_data_web_add(req, res, next) {
  const [vendor_name, contact_person, phone, email, street, city, state, zip_code]
  = [req.body.add_name, req.body.add_contact, req.body.add_phone, req.body.add_email, req.body.add_street, req.body.add_city, req.body.add_state, req.body.add_zip];

  req.add_vendor = {
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

function get_data_web_search(req, res, next) {
  const [vendor_name, contact_person, phone, email, street, city, state, zip_code]
  = [req.body.search_name, req.body.search_contact, req.body.search_phone, req.body.search_email, req.body.search_street, req.body.search_city, req.body.search_state, req.body.search_zip];

  req.search_data = {
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
  const [vendor_name, contact_person, phone, email, street, city, state, zip_code]
  = [req.body.add_name, req.body.add_contact, req.body.add_phone, req.body.add_email, req.body.add_street, req.body.add_city, req.body.add_state, req.body.add_zip];

  if (!vendor_name || !contact_person || !phone || !email || !street || !city || !state || !zip_code) res.status(400).send('Missing required fields');
  next();
};

function add_data(req, res, next) {
  const { vendorName, contactPerson, phoneNumber, email, street, city, state, zipCode } = req.add_vendor;
  
  db.pool.query(`INSERT INTO Vendors (vendorName, contactPerson, phoneNumber, email, street, city, state, zipCode)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?);`,
  [vendorName, contactPerson, phoneNumber, email, street, city, state, zipCode],
  (error, results) => {
    if (error) {
      return next(error);
    } else {
      req.flash('vendor_added', 'Vendor added succesfully')
      next()
    }
  })
}

function insert_data(req, res, next) {
  const { vendorName, contactPerson, phoneNumber, email, street, city, state, zipCode } = req.vendorData;

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
        redirect(req, res, next);
      }, 500);
    }
  })
};

function search_data(req, res, next) {
  const { vendorName, contactPerson, phoneNumber, email, street, city, state, zipCode } = req.search_data;
  
  let search_query = "SELECT * FROM Vendors WHERE 1=1"
  let params = []

  if (vendorName) {
    search_query += " AND vendorName LIKE CONCAT('%', ?, '%')"
    params.push(vendorName)
  }

  if (contactPerson) {
    search_query += " AND contactPerson = ?"
    params.push(contactPerson)
  }

  if (phoneNumber) {
    search_query += " AND phoneNumber = ?"
    params.push(phoneNumber)
  }

  if (email) {
    search_query += " AND email = ?"
    params.push(email)
  }

  if(street) {
    search_query += " AND street = ?"
    params.push(street)
  }

  if (city) {
    search_query += " AND city = ?"
    params.push(city)
  }

  if (state) {
    search_query += " AND state = ?"
    params.push(state)
  }

  if (zipCode) {
    search_query += " AND zipCode = ?"
    params.push(zipCode)
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
  const { vendorName, contactPerson, phoneNumber, email, street, city, state, zipCode } = req.vendorData;
  const sql_data = await get_data_sql()

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
    insert_data(req, res, next);
  } else {
    no_changes(req, res, next);
  }
};

function delete_data(req, res, next) {
  const { vendorID } = req.params;

  db.pool.query(`DELETE FROM Vendors
  WHERE vendorID = ?;`, [ vendorID ], (error, results) => {
    if (error) {
      req.flash('delete_error', 'Couldn\'t delete the vendor from the database');
      setTimeout(() => {
        redirect(req, res, next);
      }, 500);
    } else {
      req.flash('delete_success', 'Vendor deleted from the database');
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

function search_redirect(req, res) {
  const search_data = req.search
  const success_message = req.flash('success');
  const no_changes_message = req.flash('no_changes')
  const missing_message = req.flash('missing')
  const added_message = req.flash('drug_added')
  const delete_error = req.flash('delete_error')
  const delete_success = req.flash('delete_success')

  res.render(
    './vendor_blank.ejs',
    {
      vendor_data: search_data,
      success_message: success_message,
      no_changes_message: no_changes_message,
      missing_message: missing_message,
      added_message: added_message,
      delete_error: delete_error,
      delete_success: delete_success
    });
};

function redirect(req, res) {
  res.redirect('/vendors');
};


module.exports = router;