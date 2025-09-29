const express = require('express');
const router = express.Router();
const insuranceClaimController = require('../controllers/insuranceClaimController');

// /api/insurance-claims
router.use('/', insuranceClaimController);

module.exports = router;
