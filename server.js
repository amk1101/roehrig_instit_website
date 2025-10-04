const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const port = 3000;

// --- Middleware ---

// 1. Enable CORS for all requests
app.use(cors());

// 2. Allow the server to understand incoming JSON data
app.use(express.json());

// 3. Serve all the static files (html, css, js) in your project folder
app.use(express.static(__dirname));

// Define the path to your database file
const dbPath = path.join(__dirname, 'db.json');

// --- API Endpoint ---

// This is where your form will send data
app.post('/registrations', (req, res) => {
  const newRegistration = req.body;
  newRegistration.id = Date.now(); // Add a unique ID

  // Read the db.json file
  fs.readFile(dbPath, 'utf8', (err, data) => {
    if (err) {
      console.error(err);
      return res.status(500).send('Error reading database file');
    }
    
    const db = JSON.parse(data);
    
    // Make sure the "registrations" array exists
    if (!db.registrations) {
      db.registrations = [];
    }
    
    // Add the new data and write it back to the file
    db.registrations.push(newRegistration);
    fs.writeFile(dbPath, JSON.stringify(db, null, 2), (err) => {
      if (err) {
        console.error(err);
        return res.status(500).send('Error writing to database file');
      }
      console.log('Successfully saved a new registration!');
      res.status(201).json(newRegistration);
    });
  });
});

// --- Start the Server ---
app.listen(port, () => {
  console.log(`Server is running!`);
  console.log(`Your website is now live at: http://localhost:${port}`);
});


//run using node server.js on the terminal
