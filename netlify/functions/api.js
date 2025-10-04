// Load environment variables
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const serverless = require('serverless-http'); // New package
const sgMail = require('@sendgrid/mail');

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const app = express();
const router = express.Router(); // Use an Express router

app.use(cors());
app.use(express.json());

// This is where your form will send data
router.post('/registrations', (req, res) => {
    const newRegistration = req.body;
    console.log("Received new registration:", newRegistration);

    const msg = {
        to: newRegistration.email,
        from: process.env.FROM_EMAIL,
        subject: 'Confirmation: Your Registration with Röhrig Institut',
        html: `<h2>Thank You for Registering, ${newRegistration.fullName}!</h2><p>We have received your registration for: <strong>${newRegistration.registrationChoice}</strong></p>`,
    };

    sgMail.send(msg)
        .then(() => {
            console.log('Confirmation email sent!');
            res.status(200).json({ message: 'Registration successful and email sent.' });
        })
        .catch((error) => {
            console.error('Error sending email:', error);
            res.status(500).json({ message: 'Error sending email.' });
        });
});

// Tell the app to use the router for all routes starting with /api
app.use('/api/', router);

// Export the handler for Netlify
module.exports.handler = serverless(app);