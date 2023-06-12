// Import required modules
const express = require('express');
const bodyParser = require('body-parser');
const mysql = require('mysql');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

// Create an instance of the express application
const app = express();

// Set the port number
const port = process.env.PORT || 3000;

// Use body-parser middleware to parse incoming requests with JSON payloads
app.use(bodyParser.json());

// Create a connection to the MySQL database
const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'dummy_db'
});

// Connect to the MySQL database
connection.connect((err) => {
  if (err) {
    console.error('Error connecting to database: ', err);
    return;
  }
  console.log('Connected to database!');
});

// Handle POST requests to the /signup endpoint
app.post('/signup', (req, res) => {
  // Extract the username, password, and role from the request body
  const { username, password, role } = req.body;
  // Hash the password using bcrypt with a salt of 10 rounds
  bcrypt.hash(password, 10, (err, hash) => {
    if (err) {
      console.error('Error hashing password: ', err);
      res.status(500).send('Internal server error');
      return;
    }
    // Create a new user object with the hashed password
    const user = { username, password: hash, role };
    // Insert the new user into the users table in the database
    connection.query('INSERT INTO users SET ?', user, (err, result) => {
      if (err) {
        console.error('Error inserting user into database: ', err);
        res.status(500).send('Internal server error');
        return;
      }
      console.log('User signed up successfully!');
      res.status(201).send('User signed up successfully!');
    });
  });
});

// Handle POST requests to the /signin endpoint
app.post('/signin', (req, res) => {
  // Extract the username and password from the request body
  const { username, password } = req.body;
  // Select the user with the given username from the users table in the database
  connection.query('SELECT * FROM users WHERE username = ?', username, (err, results) => {
    if (err) {
      console.error('Error selecting user from database: ', err);
      res.status(500).send('Internal server error');
      return;
    }
    // If no user is found with the given username, return an error response
    if (results.length === 0) {
      console.log('User not found!');
      res.status(401).send('Invalid username or password');
      return;
    }
    // Extract the user object from the query results
    const user = results[0];
    // Compare the given password with the hashed password stored in the database using bcrypt
    bcrypt.compare(password, user.password, (err, result) => {
      if (err) {
        console.error('Error comparing passwords: ', err);
        res.status(500).send('Internal server error');
        return;
      }
      // If the passwords do not match, return an error response
      if (!result) {
        console.log('Invalid password!');
        res.status(401).send('Invalid username or password');
        return;
      }
      // If the passwords match, create a JWT token with the user's username and role
      const token = jwt.sign({ username, role: user.role }, 'secret');
      console.log('User signed in successfully!');
      // Return the JWT token in the response body
      res.status(200).json({ token });
    });
  });
});

// Start the server and listen for incoming requests on the specified port
app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
