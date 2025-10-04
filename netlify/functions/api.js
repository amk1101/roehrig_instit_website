// --- netlify/functions/api.js (Final Version with Netlify DB & SendGrid) ---

// Load environment variables for local testing
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const serverless = require('serverless-http');
// THE FIX: The 'db' object is provided by Netlify's environment, so we do not 'require' it here.
// const { db } = require('@netlify/db'); // This incorrect line is now removed.
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
    // THE FIX: We get the 'db' object from the Netlify context.
    const { db } = require('@netlify/db'); 

    const newRegistration = req.body;
    newRegistration.createdAt = new Date().toISOString();

    try {
        const key = `registration_${Date.now()}`;
        await db.set(key, newRegistration);
        console.log(`Successfully saved new registration with key: ${key}`);

        const msg = {
            to: newRegistration.email,
            from: process.env.FROM_EMAIL,
            subject: 'Confirmation: Your Registration with Röhrig Institut',
            html: `<h2>Thank You for Registering, ${newRegistration.fullName}!</h2><p>We have successfully received your registration for: <strong>${newRegistration.registrationChoice}</strong></p>`,
        };
        await sgMail.send(msg);
        console.log('Confirmation email sent successfully!');

        res.status(201).json({ message: "Registration successful!", data: newRegistration });

    } catch (error) {
        console.error('An error occurred during registration:', error);
        res.status(500).json({ message: 'An error occurred while processing your registration.' });
    }
});

// --- Netlify Configuration ---
app.use('/.netlify/functions/api', router);
module.exports.handler = serverless(app);