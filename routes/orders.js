const express = require('express');
const router = express.Router();
const db = require('./db-connector');
const ejs = require('ejs');

PORT = 3000;

router.get('/', async function(req, res) {
  const formatted_data = await get_data_sql();
  res.render('orders.ejs', {order_data: formatted_data});
})

async function get_data_sql(req, res) {
  const order_query = `SELECT OrderDetails.status, Drugs.drugName, Vendors.vendorName, Orders.orderDate, OrderDetails.quantity, OrderDetails.expiryDate, OrderDetails.lotNumber, Orders.totalPrice
  FROM OrderDetails
  INNER JOIN Orders ON OrderDetails.orderID = Orders.orderID
  INNER JOIN Drugs ON OrderDetails.drugID = Drugs.drugID
  INNER JOIN Vendors ON OrderDetails.vendorID = Vendors.vendorID;`;

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

module.exports = router;