const rankingModel = require('../models/rankingModel.js');
exports.getRanking = (req, res, next) => {
  rankingModel.getRankingAlunos((err, rows) => {
    if (err) { 
      return next(err);
    }
    res.json({ ranking: rows });
  });
};