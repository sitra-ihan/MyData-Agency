const scheduler = require('./scheduler');
const express = require('express');
const router = express.Router();

scheduler.initConsentDaemon();
console.log('Consent Daemon Initiated!');

module.exports = router;