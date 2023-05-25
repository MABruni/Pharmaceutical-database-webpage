// Get an instance of mysql we can use in the app
let mysql = require('mysql')

// Create a 'connection pool' using the provided credentials
let pool = mysql.createPool({
    connectionLimit : 10,
    host            : 'localhost',
    user            : 'root',
    password        : 'WD*%NQfEoUtBqPa74Dvd',
    database        : 'cs340_project'
})

// Define a test query
const testQuery = 'SELECT 1';

// Execute the test query using the pool
pool.query(testQuery, function(err, results) {
  if (err) {
    console.error('Error connecting to MySQL:', err);
    return;
  }

  // If no error, the connection is successful
  console.log('Connected to MySQL successfully!');
});
// Export it for use in our application
module.exports.pool = pool;