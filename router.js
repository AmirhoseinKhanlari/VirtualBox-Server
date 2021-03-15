const express = require('express');
const router = express.Router();
const controller = require('./controller');

router
  .route('/')
  .post(controller.getCommand)
  
module.exports = router;