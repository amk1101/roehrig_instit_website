// --- netlify/functions/api.js (Final Version with Netlify DB & SendGrid) ---

// Load environment variables for local testing
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const serverless = require('serverless-http');
const { db } = require('@netlify/db'); // Import the Netlify DB helper
const sgMail = require('@sendgrid/mail');

// --- Service Configuration ---
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// --- App Setup ---
const app = express();
const router = express.Router();

app.use(cors());
app.use(express.json());

// --- API Endpoint for Form Submissions ---
router.post('/registrations', async (req, res) => {
    const newRegistration = req.body;
    newRegistration.createdAt = new Date().toISOString(); // Add a timestamp for good practice

    try {
        // 1. Create a unique key for the database entry
        const key = `registration_${Date.now()}`;

        // 2. Save the new registration data to Netlify DB
        await db.set(key, newRegistration);
        console.log(`Successfully saved new registration with key: ${key}`);

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
    }
});

// --- Netlify Configuration ---
// This tells Netlify to handle routes that start with /.netlify/functions/api
app.use('/.netlify/functions/api', router);
module.exports.handler = serverless(app);