const express = require('express');
const router = express.Router();
const db = require('./db-connector');
const ejs = require('ejs');
const path = require('path')

PORT = 3000;

router.get('/', async (req, res) => {
  const ingredient_data = await get_data_sql();
  const success_message = req.flash('success');
  const no_changes_message = req.flash('no_changes')
  const missing_message = req.flash('missing')
  const added_message = req.flash('drug_added')
  const delete_error = req.flash('delete_error')
  const delete_success = req.flash('delete_success')

  res.render(
    'ingredients.ejs',
    {
      ingredientsData: ingredient_data,
      success_message: success_message,
      no_changes_message: no_changes_message,
      missing_message: missing_message,
      added_message: added_message,
      delete_error: delete_error,
      delete_success: delete_success
    });
});

router.get('/ingredientedit/:ingredientName', async (req, res) => {
  const ingredient_data = await get_data_sql();
  const { ingredientName } = req.params
  res.render('ingredients_edit.ejs', {ingredientsData: ingredient_data, ingredientName:ingredientName});
});

router.put('/ingredientchanges', get_data_web_table, check_changes, insert_data, redirect);

router.post('/addingredient', get_data_web_add, validate_input, add_data, redirect);

router.post('/searchingredient', get_data_web_search, search_data, search_redirect);

router.delete('/deleteingredient/:ingredientName', delete_data, redirect);


async function get_data_sql(req, res) {
  const selectQuery = `SELECT * FROM Ingredients`;

  async function fetchIngredientsList() {
    return new Promise((resolve, reject) => {
      db.pool.query(selectQuery, (err, results) => {
        (err) ? reject(err) : resolve(results);
      })
    })
  };

  try {
    const ingredient_data = await fetchIngredientsList();
    return ingredient_data;

  } catch (err) {
    console.error(err);
    res.status(500).send('Internal Server Error');
  }
};

function validate_input(req, res, next) {
  const { ingredientName } = req.add_ingredient;

  if (!ingredientName) {
    req.flash('missing', 'Required fields missing');
    redirect(req, res, next)
  } else {
    next();
  }
};

function get_data_web_table(req, res, next) {
  const [ingredient_name, original_name]
    = [req.body.edit_ingredient, req.body.original_name];

  req.edit_ingredient = {
    ingredientName: ingredient_name,
    originalName: original_name
  };

  next();
};

function get_data_web_add(req, res, next) {
  const [ingredient_name]
    = [req.body.add_name];

  req.add_ingredient = {
    ingredientName: ingredient_name,
  };

  next();
};

function get_data_web_search(req, res, next) {
  const [ingredientName]
    = [req.body.search_name];

  req.ingredient_search = {
    ingredientName: ingredientName
  };

  next();
};

function add_data(req, res, next) {
  const { ingredientName } = req.add_ingredient
  
  db.pool.query(`INSERT INTO Ingredients (ingredientName)
  VALUES (?);
  `, [ingredientName],
  (error, results) => {
    if (error) {
      return next(error);
    } else {
      req.flash('drug_added', 'Drug added succesfully')
      next()
    }
  })
};

function insert_data(req, res, next) {
  const { ingredientName, originalName } = req.edit_ingredient;

  const update_query = `
    UPDATE Ingredients 
    SET ingredientName = ?
    WHERE ingredientName = ?;
    `;

  const update_params = [ ingredientName, originalName ];

  db.pool.query(update_query, update_params, (update_error, update_results) => {
    if (update_error) {
      return next(update_error)
    }

    req.flash('success', 'Ingredient updated succesfully');
    req.flash('no_changes', null)

    next();
  })
};

async function check_changes(req,res,next) {
  const { ingredientName, originalName } = req.edit_ingredient;

  const is_modified =
    ingredientName != originalName 

  console.log*(is_modified)

  if (is_modified) {
    insert_data(req, res, next);
  } else {
    no_changes(req, res, next);
  }
};

function delete_data(req, res, next) {
  const { ingredientName } = req.params;

  db.pool.query(`DELETE FROM Ingredients
  WHERE ingredientName = ?;`, [ ingredientName ], (error, results) => {
    if (error) {
      req.flash('delete_error', 'Couldn\'t delete the drug from the database');
      setTimeout(() => {
        redirect(req, res, next);
      }, 500);
    } else {
      req.flash('delete_success', 'Ingredient deleted from the database');
      setTimeout(() => {
        redirect(req, res, next);
      }, 500);
    }
  })
};

function search_data(req, res, next) {
  const { ingredientName } = req.ingredient_search;
  
  let search_query = "SELECT * FROM Ingredients WHERE 1=1"
  let params = []

  if (ingredientName) {
    search_query += " AND ingredientName LIKE CONCAT('%', ?, '%')"
    params.push(ingredientName)
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

function no_changes(req,res,next) {
  req.flash('no_changes', 'No changes were made')
  req.flash('success', null)

  redirect(req, res, next);
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
    './ingredients.ejs',
    {
      ingredientsData: search_data,
      success_message: success_message,
      no_changes_message: no_changes_message,
      missing_message: missing_message,
      added_message: added_message,
      delete_error: delete_error,
      delete_success: delete_success
    });
};

function redirect(req, res) {
  res.redirect('/ingredients');
};

module.exports = router;