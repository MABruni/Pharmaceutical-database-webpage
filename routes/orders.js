const express = require('express');
const router = express.Router();
const db = require('./db-connector');
const ejs = require('ejs');

PORT = 3000;

router.get('/', async function(req, res) {
  const formatted_data = await get_data_sql();
  const added_message = req.flash('order_added');
  const missing_message = req.flash('missing');
  res.render(
    'orders.ejs',
    {
      order_data: formatted_data,
      added_message: added_message,
      missing_message: missing_message
    });
})

router.post('/addorder', get_data_web_add, validate_input, add_data, redirect)

async function get_data_sql(req, res) {
  const order_query = `SELECT OrderDetails.status, Drugs.drugName, Drugs.drugNDC, Vendors.vendorName, Orders.orderDate, OrderDetails.quantity, OrderDetails.expiryDate, OrderDetails.lotNumber, Orders.totalPrice
  FROM OrderDetails
  INNER JOIN Orders ON OrderDetails.orderID = Orders.orderID
  INNER JOIN Drugs ON OrderDetails.drugID = Drugs.drugID
  INNER JOIN Vendors ON OrderDetails.vendorID = Vendors.vendorID
  ORDER BY OrderDetails.orderDetailsID;`;

  async function fetch_order_list() {
    return new Promise((resolve, reject) => {
      db.pool.query(order_query, function(err, results) {
        if (err) {
          reject(err);
        } else {
          resolve(results);
        }
      })
    })
  };

  try {
    const order_data = await fetch_order_list();
    const formatted_data = order_data.map(order => ({
      ...order,
      orderDate: order.orderDate.toISOString().split('T')[0],
      expiryDate: order.expiryDate.toISOString().split('T')[0]
    }));
    return formatted_data
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  };
};

async function get_data_web_add(req, res, next) {
  const [status, dname, ndc, vname, date, quantity, expiration, lotn, price]
  = [req.body.add_status, req.body.add_dname, req.body.add_ndc, req.body.add_vname, req.body.add_date, req.body.add_quantity, req.body.add_expiration, req.body.add_lotn, req.body.add_price];

  req.add_order = {
    status: status,
    dname: dname,
    ndc: ndc,
    vname: vname,
    date: date,
    quantity: quantity,
    expiration: expiration,
    lotn: lotn,
    price: parseInt(price),
  };

  next()
};

async function validate_input(req, res, next) {
  const { status, dname, ndc, vname, date, quantity, expiration, lotn, price } = req.add_order;
  
  if (!status || !dname || !ndc || !vname || !date || !quantity || !expiration || !lotn || !price) {
    req.flash('missing', 'Required fields missing');
    redirect(req, res, next)
  } else {
    next()
  }
};

async function add_data(req, res, next) {
  const { status, dname, ndc, vname, date, quantity, expiration, lotn, price } = req.add_order;

  const insert_order_query = 'INSERT INTO Orders (orderDate, totalPrice) VALUES (?, ?)';
  const insert_order_params = [date, price];
  
  db.pool.query(insert_order_query, insert_order_params, (insert_order_error, insert_order_result) => {
    if (insert_order_error) {
      return next(insert_order_error);
    }
  
    const order_id_query = 'SELECT orderID FROM Orders WHERE orderDate = ? AND totalPrice = ?';
    const order_id_params = [date, price];
  
    db.pool.query(order_id_query, order_id_params, (order_id_error, order_id_result) => {
      if (order_id_error) {
        return next(order_id_error);
      }
  
      const order_id = order_id_result[0].orderID;
  
      const drug_id_query = 'SELECT drugID FROM Drugs WHERE drugName = ? AND drugNDC = ?';
      const drug_id_params = [dname, ndc];
  
      db.pool.query(drug_id_query, drug_id_params, (drug_id_error, drug_id_result) => {
        if (drug_id_error) {
          return next(drug_id_error);
        }
  
        const drug_id = drug_id_result[0].drugID;
  
        const insert_order_details_query = 'INSERT INTO OrderDetails (drugID, orderID, vendorID, quantity, expiryDate, lotNumber, status) VALUES (?, ?, (SELECT vendorID FROM Vendors WHERE vendorName = ?), ?, ?, ?, ?)';
        const insert_order_details_params = [drug_id, order_id, vname, quantity, expiration, lotn, status];
  
        db.pool.query(insert_order_details_query, insert_order_details_params, (insert_order_details_error, insert_order_details_result) => {
          if (insert_order_details_error) {
            return next(insert_order_details_error);
          }
  
          req.flash('order_added', 'Order added successfully');
          next();
        });
      });
    });
  });
};  

function redirect(req, res) {
  res.redirect('/orders');
};

module.exports = router;