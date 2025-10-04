// --- netlify/functions/api.js (Final Version with Netlify DB & SendGrid) ---

// Load environment variables
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const serverless = require('serverless-http');
const { db } = require('@netlify/db');
const sgMail = require('@sendgrid/mail'); // Import SendGrid

// --- Service Configuration ---
sgMail.setApiKey(process.env.SENDGRID_API_KEY); // Configure SendGrid

// --- App Setup ---
const app = express();
const router = express.Router();

app.use(cors());
app.use(express.json());

// --- API Endpoint for Form Submissions ---
router.post('/registrations', async (req, res) => {
    const newRegistration = req.body;
    newRegistration.createdAt = new Date().toISOString();

    try {
        // 1. Save data to Netlify DB
        const key = `registration_${Date.now()}`;
        await db.set(key, newRegistration);
        console.log(`Successfully saved new registration with key: ${key}`);

        // 2. After saving, define the confirmation email
        const msg = {
            to: newRegistration.email, // The email address from the form
            from: process.env.FROM_EMAIL, // Your verified sender email
            subject: 'Confirmation: Your Registration with Röhrig Institut',
            html: `
                <div style="font-family: Arial, sans-serif; line-height: 1.6;">
                    <h2>Thank You for Registering, ${newRegistration.fullName}!</h2>
                    <p>We have successfully received your registration for:</p>
                    <p><strong>${newRegistration.registrationChoice}</strong></p>
                    <p>We are excited to have you join us. If you have any questions, please don't hesitate to contact us.</p>
                    <br>
                    <p>Best regards,</p>
                    <p>The Röhrig Institut Team</p>
                </div>
            `,
        };

        // 3. Send the email
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
app.use('/.netlify/functions/api', router);
module.exports.handler = serverless(app);