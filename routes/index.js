const express = require('express');
const mongoose = require('mongoose');
const path = require('path');

const Game = require('../models/Game');

const router = express.Router();

router.get('/game', async (req, res) => {
    let game = await Game.find();
    res.send(game[0]);
});

router.post('/move', async (req, res) => {
    let game = await Game.find();
    if (game.length === 0) {
        game = new Game({
            fen: req.body.fen,
            color: req.body.color
        });
        await game.save();
        res.send(game);
    } else {
        game[0].fen = req.body.fen;
        game[0].color = req.body.color;
        await game[0].save();
        res.send(game[0]);
    }
});

router.get('/*', (req, res) => {
    res.sendFile(path.resolve(__dirname, '../dist/chess-x/index.html'));
});

module.exports = router;
