const express = require('express');
const router = express.Router();
const db = require('./db-connector');
const ejs = require('ejs');
const path = require('path')

PORT = 3000;


router.get('/', async (req, res) => {
  const location_data = await get_data_sql();
  const success_message = req.flash('success');
  const no_changes_message = req.flash('no_changes')
  const missing_message = req.flash('missing')
  const added_message = req.flash('drug_added')
  const delete_error = req.flash('delete_error')
  const delete_success = req.flash('delete_success')

  res.render(
    'locations.ejs',
    {
      locationsData: location_data,
      success_message: success_message,
      no_changes_message: no_changes_message,
      missing_message: missing_message,
      added_message: added_message,
      delete_error: delete_error,
      delete_success: delete_success
    }
  );
});

router.get('/editlocation/:locationName/:room', async (req, res) => {
  const { locationName, room } = req.params
  const locationData = await get_data_sql();

  res.render(
    'locations_edit.ejs',
    {
      locationsData: locationData,
      locationName: locationName,
      room: room
    }
  );
});

router.put('/locationchanges', get_data_web_table, check_changes, insert_data, no_changes, redirect);

router.post('/addlocation', get_data_web_add, validate_input, add_data, redirect)

router.delete('/deletelocation/:locationID', delete_data, redirect)

router.post('/searchlocation', get_data_web_search, search_data, search_redirect)

async function get_data_sql(req, res) {
  const selectQuery = `SELECT * FROM Locations`;

  async function fetchLocationList() {
    return new Promise((resolve, reject) => {
      db.pool.query(selectQuery, (err, results) => {
        (err) ? reject(err) : resolve(results);
      })
    })
  };

  try {
    const locationsData = await fetchLocationList();
    const formattedData = locationsData.map(locations => ({
      ...locations,
    }));
    return formattedData;

  } catch (err) {
    console.error(err);
    res.status(500).send('Internal Server Error');
  }
};

function get_data_web_table(req, res, next) {
  const [locationID, locationName, room]
    = [req.body.locationID, req.body.edit_location, req.body.edit_room];

  req.location_data = {
    locationID: locationID,
    locationName: locationName,
    room: room,
  };

  next();
};

function get_data_web_add(req, res, next) {
  const [locationName, room]
    = [req.body.add_name, req.body.add_room];

  req.add_location = {
    locationName: locationName,
    room: room,
  };

  next();
};

function get_data_web_search(req, res, next) {
  const [locationName, room]
    = [req.body.search_name, req.body.search_room];

  req.location_search = {
    locationName: locationName,
    room: room,
  };

  next();
};

function validate_input(req, res, next) {
  const { locationName, room } = req.add_location;

  if (!locationName || !room) {
    req.flash('missing', 'Required fields missing');
    redirect(req, res, next)
  } else {
    next()
  }
};

function add_data(req, res, next) {
  const { locationName, room } = req.add_location;
  
  db.pool.query(`INSERT INTO Locations (locationName, room)
  VALUES (?, ?);
  `, [locationName, room],
  (add_error, add_results) => {
    if (add_error) {
      return next(add_error);
    } else {
      req.flash('drug_added', 'Drug added succesfully')
      next()
    }
  })
};

function insert_data(req, res, next) {
  const { locationID, locationName, room } = req.location_data;

  db.pool.query(`UPDATE Locations
  SET locationName = ?, room = ?
  WHERE locationID = ?`,
  [ locationName, room, locationID ],
  (location_error, location_results) => {
    if (location_error) {
      return next(location_error);
    }

    req.flash('success', 'Location updated succesfully');
    req.flash('no_changes', null)

    redirect(req,res,next);
  }
)};

function redirect(req, res) {
  res.redirect('/');
};

async function check_changes(req,res,next) {
  const { locationID, locationName, room } = req.location_data;

  const sql_data = await get_data_sql()

  const location_editted = sql_data.find(location => location.locationID == locationID);
  const is_modified =
    locationName !== location_editted.locationName ||
    room !== location_editted.room

  if (is_modified) {
    insert_data(req, res, next);
  } else {
    no_changes(req, res, next);
  }
};

function no_changes(req,res,next) {
  req.flash('no_changes', 'No changes were made')
  req.flash('success', null)

  redirect(req, res, next);
};

function delete_data(req, res, next) {
  const { locationID } = req.params;

  db.pool.query(`DELETE FROM Locations
  WHERE locationID = ?;`, [ locationID ], (error, results) => {
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
};

function search_data(req, res, next) {
  const { locationName, room } = req.location_search;
  
  let search_query = "SELECT * FROM Locations WHERE 1=1"
  let params = []

  if (locationName) {
    search_query += " AND locationName LIKE CONCAT('%', ?, '%')"
    params.push(locationName)
  }

  if (room) {
    search_query += " AND room LIKE CONCAT('%', ?, '%')"
    params.push(room)
  }
  
  db.pool.query(search_query, params, (error, results) => {
    if (error) {
      return next(error);
    } else {
      req.search = results
      next()
    }
  })
};

function redirect(req, res) {
  res.redirect('/locations');
};

function search_redirect(req, res) {
  const search_data = (req.search)

  const success_message = req.flash('success');
  const no_changes_message = req.flash('no_changes')
  const missing_message = req.flash('missing')
  const added_message = req.flash('drug_added')
  const delete_error = req.flash('delete_error')
  const delete_success = req.flash('delete_success')

  res.render(
    './locations.ejs',
    {
      locationsData: search_data,
      success_message: success_message,
      no_changes_message: no_changes_message,
      missing_message: missing_message,
      added_message: added_message,
      delete_error: delete_error,
      delete_success: delete_success
    });
};


module.exports = router;