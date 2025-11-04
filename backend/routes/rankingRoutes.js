const express = require('express');
const router = express.Router();
const rankingController = require('../controllers/rankingController.js');

router.get('/ranking', rankingController.getRanking);

module.exports = router;