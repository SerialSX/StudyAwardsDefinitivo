const express = require('express');
const router = express.Router();
const rankingController = require('../controllers/rankingController.js');
const { authMiddleware } = require('../middleware/authMiddleware.js');

router.get('/ranking', authMiddleware, rankingController.getRanking);

module.exports = router;