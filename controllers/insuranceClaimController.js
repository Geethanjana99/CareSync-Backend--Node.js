const InsuranceClaim = require('../models/InsuranceClaim');
const express = require('express');
const router = express.Router();
const logger = require('../config/logger');

// Get all insurance claims
router.get('/', async (req, res) => {
  try {
    const claims = await InsuranceClaim.findAll();
    res.json({
      success: true,
      data: claims
    });
  } catch (err) {
    logger.error('Error fetching insurance claims:', err);
    res.status(500).json({ 
      success: false,
      error: err.message 
    });
  }
});

// Get claim by ID
router.get('/:id', async (req, res) => {
  try {
    const claim = await InsuranceClaim.findById(req.params.id);
    if (!claim) {
      return res.status(404).json({ 
        success: false,
        error: 'Claim not found' 
      });
    }
    res.json({
      success: true,
      data: claim
    });
  } catch (err) {
    logger.error('Error fetching insurance claim:', err);
    res.status(500).json({ 
      success: false,
      error: err.message 
    });
  }
});

// Create new insurance claim
router.post('/', async (req, res) => {
  try {
    console.log('Creating insurance claim with data:', req.body);
    
    const claimData = {
      patientName: req.body.patientName,

      doctorName: req.body.doctorName,
      serviceDate: req.body.serviceDate,
      claimDate: req.body.claimDate,
      amount: req.body.amount,
      insuranceProvider: req.body.insuranceProvider,
      serviceType: req.body.serviceType,
      status: req.body.status || 'pending',
      notes: req.body.notes || ''
    };

    const claim = await InsuranceClaim.create(claimData);
    
    logger.info('Insurance claim created successfully:', claim.id);
    
    res.status(201).json({
      success: true,
      message: 'Insurance claim created successfully',
      data: claim
    });
  } catch (err) {
    logger.error('Error creating insurance claim:', err);
    res.status(500).json({ 
      success: false,
      error: err.message 
    });
  }
});

// Update claim status
router.put('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const claimId = req.params.id;

    // Validate status
    const validStatuses = ['pending', 'approved', 'rejected', 'processing', 'paid'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid status. Must be one of: ' + validStatuses.join(', ')
      });
    }

    const result = await InsuranceClaim.updateStatus(claimId, status);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        error: 'Claim not found'
      });
    }

    logger.info(`Insurance claim ${claimId} status updated to: ${status}`);
    
    res.json({
      success: true,
      message: 'Claim status updated successfully',
      data: { id: claimId, status }
    });
  } catch (err) {
    logger.error('Error updating claim status:', err);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

module.exports = router;
