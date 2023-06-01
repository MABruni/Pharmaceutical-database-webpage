const express = require('express');
const router = express.Router();
const db = require('./db-connector');
const ejs = require('ejs');
const path = require('path')

PORT = 3000;

router.get('/', function(req, res) {
  res.render('vendordrugs_blank.ejs')
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
    res.render('vendordrugs.ejs', {
      vendor_name: vendor_name,
      vendor_data: vendor_data
      });
  } catch (error) {
    res.status(500).send('Internal Server Error');
  };
});


module.exports = router;