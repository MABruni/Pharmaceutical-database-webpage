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
  const added_message = req.flash('shelf_added')
  const delete_error = req.flash('delete_error')
  const delete_success = req.flash('delete_success')
  res.render(
    'shelves.ejs',
    {
      shelf_data: formatted_data,
      success_message: success_message,
      no_changes_message: no_changes_message,
      missing_message: missing_message,
      added_message: added_message,
      delete_error: delete_error,
      delete_success: delete_success
    });
})

router.get('/editshelf/:shelfCode/:containerCode/:drugName', async function(req, res) {
  const formatted_data = await get_data_sql()
  const { shelfCode, containerCode, drugName } = req.params;
  res.render('shelvesedit.ejs', {
    shelf_data: formatted_data,
    shelf_code: shelfCode,
    container_code: containerCode,
    drug_name: drugName
  })
})

router.post('/addshelf', get_data_web_add, validate_input, add_data, redirect)

router.put('/shelfchanges', get_data_web_table, check_changes, update_data, no_changes, redirect);

router.delete('/deleteshelf/:shelfCode/:locationName/:room', delete_shelf, redirect)

async function get_data_sql(req, res) {
  const select_query = `SELECT Shelves.shelfCode, Shelves.fridge, Shelves.freezer, Locations.locationName, Locations.room, DrugLocations.containerCode, Drugs.drugName, Drugs.drugNDC, DrugLocations.capacity, DrugLocations.availability
  FROM Shelves
  LEFT JOIN DrugLocations ON DrugLocations.shelfID = Shelves.shelfID
  LEFT JOIN Drugs ON DrugLocations.drugID = Drugs.drugID
  LEFT JOIN Locations ON Shelves.locationID = Locations.locationID
  ORDER BY Shelves.shelfID ASC;`;

  async function fetch_shelf_info() {
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
    const shelves_data = await fetch_shelf_info();
    const formatted_data = shelves_data.map(shelf => ({
      ...shelf,
      fridge: shelf.fridge.readUInt8() === 1 ? 'true' : 'false',
      freezer: shelf.freezer.readUInt8() === 1 ? 'true' : 'false',
    }));
    return formatted_data
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  };
};

function get_data_web_table(req, res, next) {
  const [shelf_code, fridge, freezer, location, room, container_code, dname, ndc, capacity, availability]
  = [req.body.scode, req.body.fridge, req.body.freezer, req.body.location, req.body.room, req.body.container, req.body.dname, req.body.ndc, req.body.capacity, req.body.availability];

  req.shelfData = {
    shelfCode: shelf_code,
    fridge: fridge === 'true' ? 1 : 0,
    freezer: freezer === 'true' ? 1 : 0,
    locationName: location,
    room: room,
    containerCode: container_code,
    drugName: dname,
    drugNDC: ndc,
    capacity: parseInt(capacity),
    availability: parseInt(availability),
  };

  next()
};

async function check_changes(req,res,next) {
  const { shelfCode, fridge, freezer, locationName, room, containerCode, drugName, drugNDC, capacity, availability } = req.shelfData;
  const sql_data = await get_data_sql()
  const formatted_data = sql_data.map(shelf => ({
    ...shelf,
    fridge: shelf.fridge === 'true' ? 1 : 0,
    freezer: shelf.freezer === 'true' ? 1 : 0,
  }));

  const shelf_editted = formatted_data.find(shelf => (shelf.shelfCode == shelfCode && shelf.containerCode == containerCode && shelf.drugName == drugName));

  const is_modified =
    shelfCode !== shelf_editted.shelfCode ||
    fridge !== shelf_editted.fridge ||
    freezer !== shelf_editted.freezer ||
    locationName !== shelf_editted.locationName ||
    room !== shelf_editted.room ||
    containerCode !== shelf_editted.containerCode ||
    drugName !== shelf_editted.drugName ||
    drugNDC !== shelf_editted.drugNDC ||
    capacity !== shelf_editted.capacity ||
    availability !== shelf_editted.availability;

  if (is_modified) {
    update_data(req, res, next);
  } else {
    no_changes(req, res, next);
  }
};

function get_data_web_add(req, res, next) {
  const [shelfCode, fridge, freezer, locationName, room, containerCode, drugName, drugNDC, capacity, availability]
  = [req.body.add_shelf, req.body.add_fridge, req.body.add_freezer, req.body.add_location, req.body.add_room, req.body.add_container, req.body.add_drugn, req.body.add_drugndc, req.body.add_capacity, req.body.add_availability];

  req.add_shelf = {
    shelfCode: shelfCode,
    fridge: fridge === 'true' ? 1 : 0,
    freezer: freezer === 'true' ? 1 : 0,
    locationName: locationName,
    room: room,
    containerCode: containerCode,
    drugName: drugName,
    drugNDC: drugNDC,
    capacity: parseInt(capacity),
    availability: parseInt(availability)
  };

  next()
};

function validate_input(req, res, next) {
  const { shelfCode, fridge, freezer, locationName, room, containerCode, drugName, drugNDC, capacity, availability } = req.add_shelf;

  console.log(shelfCode, fridge, freezer, locationName, room, containerCode, drugName, drugNDC, capacity, availability)

  if (!shelfCode || !(fridge === 0 || fridge === 1 || freezer === 0 || freezer === 1) || !locationName || !room || !containerCode || !drugName || !drugNDC || !capacity || !availability) {
    req.flash('missing', 'Required fields missing');
    redirect(req, res, next);
  } else {
    next();
  }
}

function add_data(req, res, next) {
  const { shelfCode, fridge, freezer, locationName, room, containerCode, drugName, drugNDC, capacity, availability } = req.add_shelf;
  
  const location_query = `SELECT locationID 
      FROM Locations 
      WHERE locationName = ? AND
            room = ?;`
  const location_parameters = [locationName, room]

  db.pool.query(location_query, location_parameters, (location_error, location_result) => {
    if (location_error) {
      return next(location_error)
    }

    const location_id = location_result[0].locationID;

    const shelf_insert_query = `INSERT INTO Shelves (locationID, shelfCode, fridge, freezer)
    VALUES (?,?,?,?);`
    const shelf_parameters = [location_id, shelfCode, fridge, freezer]

    db.pool.query(shelf_insert_query, shelf_parameters, (shelf_error, shelf_result) => {
      if (shelf_error) {
        return next(shelf_error)
      }

      const shelf_query = `SELECT shelfID
      FROM Shelves
      WHERE locationID = ? AND
            shelfCode = ? AND
            fridge = ? AND
            freezer = ?;`

      db.pool.query(shelf_query, shelf_parameters, (shelf_error, shelf_result) => {
        if (shelf_error) {
          return next(shelf_error)
        }

        const shelf_id = shelf_result[0].shelfID;

        const drug_query = `SELECT drugID
        FROM Drugs
        WHERE drugName = ? AND
              drugNDC = ?;`
        const drug_parameters = [drugName, drugNDC]

        db.pool.query(drug_query, drug_parameters, (drug_error, drug_result) => {
          if (drug_error) {
            return next(drug_error)
          }
  
          const drug_id = drug_result[0].drugID

          const insert_drug_locations = `INSERT INTO DrugLocations (drugID, shelfID, containerCode, capacity, availability)
          VALUES (?,?,?,?,?);`
          const insert_dl_parameters = [drug_id, shelf_id, containerCode, capacity, availability]

          db.pool.query(insert_drug_locations, insert_dl_parameters, (insert_dl_error, insert_dl_result) => {
            if (insert_dl_error) {
              return next(insert_dl_error)
            } else {
              req.flash('shelf_added', 'Shelf added succesfully')
              next()
            }
          })
        })
      })
    })
  })
};


function update_data(req, res, next) {
  const { shelfCode, fridge, freezer, locationName, room, containerCode, drugName, drugNDC, capacity, availability } = req.shelfData;
  
  const location_query = `SELECT locationID 
      FROM Locations 
      WHERE locationName = ? AND
            room = ?;`
  const location_parameters = [locationName, room]

  db.pool.query(location_query, location_parameters, (location_error, location_result) => {
    if (location_error) {
      return next(location_error)
    }

    const location_id = location_result[0].locationID;

    const shelf_query = `SELECT shelfID
      FROM Shelves
      WHERE shelfCode = ? AND
            locationID = ?;`
    const shelf_parameters = [shelfCode, location_id]

    db.pool.query(shelf_query, shelf_parameters, (shelf_error, shelf_result) => {
      if (shelf_error) {
        return next(shelf_error)
      }

      const shelf_id = shelf_result[0].shelfID;

      const drug_query = `SELECT drugID
      FROM Drugs
      WHERE drugName = ? AND
            drugNDC = ?;`
      const drug_parameters = [drugName, drugNDC]

      db.pool.query(drug_query, drug_parameters, (drug_error, drug_result) => {
        if (drug_error) {
          return next(drug_error)
        }

        const drug_id = drug_result[0].drugID

        const update_query = `UPDATE Shelves
        LEFT JOIN DrugLocations ON DrugLocations.shelfID = Shelves.shelfID
        LEFT JOIN Drugs ON DrugLocations.drugID = Drugs.drugID
        LEFT JOIN Locations ON Shelves.locationID = Locations.locationID
        SET Shelves.shelfCode = ?, 
            Shelves.fridge = ?, 
            Shelves.freezer = ?, 
            Locations.locationName = ?, 
            Locations.room = ?, 
            DrugLocations.containerCode = ?, 
            Drugs.drugName = ?, 
            Drugs.drugNDC = ?,
            DrugLocations.capacity = ?, 
            DrugLocations.availability = ?
        WHERE Shelves.shelfID = ? AND
              Drugs.drugID = ? AND 
              DrugLocations.containerCode = ?;`

        const update_parameters = [
          shelfCode, 
          fridge, 
          freezer, 
          locationName, 
          room, 
          containerCode, 
          drugName, 
          drugNDC, 
          capacity, 
          availability,
          shelf_id,
          drug_id,
          containerCode
        ]

        db.pool.query(update_query, update_parameters, (update_error, update_result) => {
          if (update_error) {
            return next(update_error)
          } else {
            req.flash('success', 'Shelf updated succesfully');
            req.flash('no_changes', null)
          
            setTimeout(() => {
              redirect(req, res, next);
            }, 500);
          }
        })
      })
    })
  })
};


function delete_shelf(req, res, next) {
  const { shelfCode, locationName, room } = req.params;

  const location_query = `SELECT locationID 
  FROM Locations 
  WHERE locationName = ? AND
        room = ?;`
  const location_parameters = [locationName, room]

  db.pool.query(location_query, location_parameters, (location_error, location_result) => {
    if (location_error) {
      return next(location_error)
    }

    const location_id = location_result[0].locationID;

    const shelf_query = `SELECT shelfID
      FROM Shelves
      WHERE shelfCode = ? AND
            locationID = ?;`
    const shelf_parameters = [shelfCode, location_id]

    db.pool.query(shelf_query, shelf_parameters, (shelf_error, shelf_result) => {
      if (shelf_error) {
        return next(shelf_error)
      }

      const shelf_id = shelf_result[0].shelfID;

      const delete_query = `DELETE FROM Shelves
        WHERE shelfID = ?;`
        
      db.pool.query(delete_query, [shelf_id], (delete_error, delete_result) => {
        if (delete_error) {
          req.flash('delete_error', 'Couldn\'t delete the shelf from the database');
          setTimeout(() => {
            redirect(req, res, next);
          }, 500);
        } else {
          req.flash('delete_success', 'Shelf deleted from the database');
          setTimeout(() => {
            redirect(req, res, next);
          }, 500);
        }
      })
    })
  });
};

function no_changes(req,res,next) {
  req.flash('no_changes', 'No changes were made')
  req.flash('success', null)

  redirect(req, res, next);
}

function redirect(req, res) {
  res.redirect('/shelves');
}

module.exports = router;