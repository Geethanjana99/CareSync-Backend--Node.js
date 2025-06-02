const mongoose = require('mongoose');

module.exports = async () => {
  console.log('Tearing down test environment...');
  
  try {
    // Close MongoDB connection
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
      console.log('MongoDB connection closed');
    }

    // Additional cleanup can be added here
    console.log('Test environment teardown complete');
  } catch (error) {
    console.error('Error during test teardown:', error);
  }
};
