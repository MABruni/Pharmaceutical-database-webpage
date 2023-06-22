const express = require('express');
const app = express();
const methodOverride = require('method-override');
const session = require('express-session');
const flash = require('connect-flash');
const path = require('path')
const drug_router = require('./routes/drugs');
const drug_info_router = require('./routes/drug_info');
const order_router = require('./routes/orders');
const vendor_router = require('./routes/vendors');
const vendor_drug_router = require('./routes/vendor_drugs');
const locations_router = require('./routes/locations');
const shelves_router = require('./routes/shelves');
const ingredients_router = require('./routes/ingredients');
PORT = 3000;

app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method'));
app.use(session({
  secret: 'cs340',
  saveUninitialized: true,
  resave: true
}));
app.use(flash());

app.use('/', drug_router);
app.use('/editdrug/:drugID', drug_router);
app.use('/adddrug', drug_router);
app.use('/deletedrug/:drugID', drug_router)
app.use('/druginformation', drug_info_router);
app.use('/orders', order_router);
app.use('/vendors', vendor_router);
app.use('/vendordrugs', vendor_drug_router);
app.use('/locations', locations_router);
app.use('/shelves', shelves_router);
app.use('/ingredients', ingredients_router);


app.listen(PORT, function() {
  console.log('Express started on http://localhost:' + PORT)
});