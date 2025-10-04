// --- netlify/functions/api.js (Final Version with MongoDB) ---

// Load environment variables
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const serverless = require('serverless-http');
const { MongoClient } = require('mongodb'); // Import the MongoDB driver
const sgMail = require('@sendgrid/mail');

// --- Service Configuration ---
sgMail.setApiKey(process.env.SENDGRID_API_KEY);
const mongoUri = process.env.MONGODB_URI;
const client = new MongoClient(mongoUri);

// --- App Setup ---
const app = express();
const router = express.Router();

app.use(cors());
app.use(express.json());

// --- API Endpoint for Form Submissions ---
router.post('/registrations', async (req, res) => {
    const newRegistration = req.body;
    newRegistration.createdAt = new Date(); // Add a timestamp

    try {
        // 1. Connect to the MongoDB Atlas database
        await client.connect();
        const database = client.db("rohrig_institut_db"); // This database will be created automatically
        const registrations = database.collection("registrations"); // This collection will be created automatically

        // 2. Insert the new registration data into the collection
        const result = await registrations.insertOne(newRegistration);
        console.log(`Successfully saved new registration with id: ${result.insertedId}`);

        // 3. After saving, send the confirmation email
        const msg = {
            to: newRegistration.email,
            from: process.env.FROM_EMAIL,
            subject: 'Confirmation: Your Registration with Röhrig Institut',
            html: `<h2>Thank You for Registering, ${newRegistration.fullName}!</h2><p>We have successfully received your registration for: <strong>${newRegistration.registrationChoice}</strong></p>`,
        };

        await sgMail.send(msg);
        console.log('Confirmation email sent successfully!');

        // Send a success response back to the browser
        res.status(201).json({ message: "Registration successful!", data: newRegistration });

    } catch (error) {
        console.error('An error occurred during registration:', error);
        res.status(500).json({ message: 'An error occurred while processing your registration.' });
    } finally {
        // IMPORTANT: Always close the connection in a serverless environment
        await client.close();
    }
});

// --- Netlify Configuration ---
app.use('/.netlify/functions/api', router);
module.exports.handler = serverless(app);