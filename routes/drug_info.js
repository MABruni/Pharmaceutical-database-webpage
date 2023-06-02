const express = require('express');
const router = express.Router();
const db = require('./db-connector');
const ejs = require('ejs');
PORT = 3000;

router.get('/', function(req, res) {
  const not_found_message = req.flash('not_found');
  res.render('druginfo_blank.ejs', { not_found_message: not_found_message })
});

router.get('/:drugName', async function(req,res) {
  const not_found_message = req.flash('not_found');
  const drug_name = req.params.drugName;

  const location_query = `SELECT Locations.locationName, Locations.room, Shelves.shelfCode, Shelves.fridge, Shelves.freezer, DrugLocations.containerCode, DrugLocations.capacity, DrugLocations.availability
  FROM DrugLocations
  INNER JOIN Shelves ON Shelves.shelfID = DrugLocations.shelfID
  INNER JOIN Locations ON Shelves.locationID = Locations.locationID
  WHERE DrugLocations.drugID = (
    SELECT drugID FROM Drugs WHERE drugName = ?
  );`;

  const ingredient_query = `SELECT ingredientName 
  FROM Ingredients
  INNER JOIN DrugIngredients ON Ingredients.ingredientID = DrugIngredients.ingredientID
  WHERE DrugIngredients.drugID = (
    SELECT drugID FROM Drugs WHERE drugName = ?
  );`;

  const order_query = `SELECT OrderDetails.status, Drugs.drugName, Vendors.vendorName, Orders.orderDate, OrderDetails.quantity, OrderDetails.expiryDate, OrderDetails.lotNumber, Orders.totalPrice
  FROM OrderDetails
  INNER JOIN Orders ON OrderDetails.orderID = Orders.orderID
  INNER JOIN Drugs ON OrderDetails.drugID = Drugs.drugID
  INNER JOIN Vendors ON OrderDetails.vendorID = Vendors.vendorID
  WHERE Drugs.drugID = (
    SELECT DrugID FROM Drugs WHERE drugName = ?
  );`;

  const vendor_query = `SELECT Vendors.vendorName, Vendors.contactPerson, Vendors.phoneNumber, Vendors.email, Vendors.street, Vendors.city, Vendors.state, Vendors.zipCode, VendorDrugs.unitPrice, VendorDrugs.discountOffered
  FROM VendorDrugs
  INNER JOIN Vendors ON Vendors.vendorID = VendorDrugs.vendorID
  WHERE VendorDrugs.drugID = (
    SELECT DrugID FROM Drugs WHERE drugName = ?
  );`;
  
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

  async function fetch_drug_info () {
    try {
      const [locations, ingredients, orders, vendors] = await Promise.all([
        query_result(location_query, [drug_name]),
        query_result(ingredient_query, [drug_name]),
        query_result(order_query, [drug_name]), 
        query_result(vendor_query, [drug_name]),
      ]);

      const formatted_location = locations.map(location => ({
        ...location,
        fridge: Boolean(location.fridge.readUInt8()),
        freezer: Boolean(location.freezer.readUInt8())
      }));

      const formatted_orders = orders.map(order => ({
        ...order,
        orderDate: order.orderDate.toISOString().split('T')[0],
        expiryDate:  order.expiryDate.toISOString().split('T')[0],
      }));

      return {
        locations: formatted_location,
        ingredients: ingredients,
        orders: formatted_orders,
        vendors:vendors,
      };
    } catch(error) {
      throw new Error('Fetch error');
    }
  };

  try {
    const info_data = await fetch_drug_info();

    res.render('druginfo.ejs', {
      drug_name: drug_name,
      info_data: info_data,
      not_found_message: not_found_message
    })
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  };
});

router.post('/searchinfo', async function(req, res) {
  const search_term = req.body.drug_name
  if (search_term === '') {
    res.redirect('/druginformation')
  } else {
    db.pool.query(`SELECT drugName FROM Drugs WHERE drugName LIKE CONCAT('%', ?, '%')`, [search_term], (error, result) => {
      if (error) {
        redirect(req, res) 
      } else {
        if (result.length >0) {
          const drugName = result[0].drugName
          const redirectURL = `/druginformation/${drugName}`
          res.redirect(redirectURL)
        } else {
          req.flash('not_found', 'No matching drugs found')
          res.redirect('/druginformation')
        }
      }
    })
  }
});

router.post('/addlocation', async function(req,res) {
  const [loc_name, room, shelf, fridge, freezer, container, capacity, availability, drug_name] = [
    req.body.new_name,
    req.body.new_room,
    req.body.new_shelf,
    req.body.new_fridge,
    req.body.new_freezer,
    req.body.new_container,
    req.body.new_capacity,
    req.body.new_availability,
    req.body.name
  ];

  const query1 = `SELECT shelfID
  FROM Shelves
  INNER JOIN Locations ON Shelves.locationID = (
    SELECT locationID FROM Locations
    WHERE locationName = ?
    AND room = ?
  )
  WHERE Shelves.shelfCode = ?
  AND Shelves.fridge = ?
  AND Shelves.freezer = ?;
  `;
  const query2 = `SELECT drugID FROM Drugs
  WHERE drugName = ?;
  `;
  const insert_query = `INSERT INTO DrugLocations (drugID, shelfID, containerCode, capacity, availability)
  VALUES (?, ?, ?, ?, ?);
  `;

  async function fetch_shelfID() {
    return new Promise((resolve, reject) => {
      db.pool.query(query1, [loc_name, room, shelf, fridge, freezer], function(err, results) {
        if (err) {
          reject(err);
        } else {
          resolve(results[0].shelfID);
        }
      })
    })
  };

  async function fetch_drugID() {
    return new Promise((resolve, reject) => {
      db.pool.query(query2, [drug_name], function(err, results) {
        if (err) {
          reject(err);
        } else {
          resolve(results[0].drugID);
        }
      })
    })
  };

  const shelf_id = await fetch_shelfID();
  const drug_id = await fetch_drugID();

  const loc_inserted = await db.pool.query(insert_query, [drug_id, shelf_id, container, capacity, availability])

  res.redirect('/druginformation/' + encodeURIComponent(drug_name));
});

router.post('/addingredient', function(req,res) {
  const new_ingredient = req.body.new_ingredient
  const drug_name = req.body.name

  const insert_query = `INSERT INTO DrugIngredients (drugID, ingredientID)
  VALUES (
    (SELECT drugID FROM Drugs WHERE drugName = ?),
    (SELECT ingredientID FROM Ingredients WHERE ingredientName = ?)
  );`

  const ingredient_insert = db.pool.query(insert_query, [drug_name, new_ingredient])

  res.redirect('/druginformation/' + encodeURIComponent(drug_name));
})


router.put('/updateingredient', async function(req,res) {
  const drug_name = req.body.name;
  const ingredient = req.body.ingredient;

  const update_query = `UPDATE DrugIngredients
  SET ingredientID = NULL
  WHERE drugID = (
    SELECT drugID FROM Drugs WHERE drugName = ?
  )
  AND ingredientID = (
    SELECT ingredientID FROM Ingredients WHERE ingredientName = ?
  );`

  try {
    const ingredients = await db.pool.query(update_query, [drug_name, ingredient]);
    res.redirect('/druginformation/' + encodeURIComponent(drug_name));
  } catch(error) {
    console.error(error);
    res.status(500).send('Error deleting association');
  }
});

router.delete('/deletelocation', async function(req,res) {
  const drug_name = req.body.name;
  const shelf_code = req.body.shelf;
  const container = req.body.container;

  const delete_query = `DELETE FROM DrugLocations
  WHERE drugID = (
    SELECT drugID FROM Drugs WHERE drugName = ?
  )
  AND shelfID = (
    SELECT shelfID FROM Shelves WHERE shelfCode = ?
  )
  AND containerCode = ?;`;

  const loc_delete = await db.pool.query(delete_query, [drug_name, shelf_code, container]);

  res.redirect('/druginformation/' + encodeURIComponent(drug_name));
})

module.exports = router;