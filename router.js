const express = require('express');
const router = express.Router();
const controller = require('./controllers/controller');
const authController = require('./controllers/authController');

router
  .route('/')
  .post(controller.checkPrivileges,controller.getCommand)

router.route('/login').post(authController.login)
  
module.exports = router;