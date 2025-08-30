const InsuranceClaim = require('../models/InsuranceClaim');
const express = require('express');
const router = express.Router();

// Get all insurance claims
router.get('/', async (req, res) => {
  try {
    const claims = await InsuranceClaim.findAll();
    res.json(claims);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get claim by ID
router.get('/:id', async (req, res) => {
  try {
    const claim = await InsuranceClaim.findById(req.params.id);
    if (!claim) return res.status(404).json({ error: 'Claim not found' });
    res.json(claim);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create new insurance claim
router.post('/', async (req, res) => {
  try {
    const claim = await InsuranceClaim.create(req.body);
    res.status(201).json(claim);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
