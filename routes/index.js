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
            moves: [{
                fen: req.body.fen,
                color: req.body.color
            }],
            color: req.body.color
        });
        await game.save();
        res.send(game);
    } else {
        if (game[0].moves.length > 0 && game[0].moves[game[0].moves.length - 1].fen === req.body.fen) {
            res.send(game[0]);
        } else {
            game[0].moves.push({
                fen: req.body.fen,
                color: req.body.color
            });
            game[0].fen = req.body.fen;
            game[0].color = req.body.color;
            await game[0].save();
            res.send(game[0]);
        }
    }
});

router.post('/undo', async (req, res) => {
    let game = await Game.find();
    if (game.length === 0) {
        game = new Game({
            fen: req.body.fen,
            moves: [{
                fen: req.body.fen,
                color: req.body.color
            }],
            color: req.body.color
        });
        await game.save();
        res.send(game);
    } else {
        if (game[0].moves.length < 2) {
            res.send(game[0]);
        }
        game[0].fen = game[0].moves[game[0].moves.length - 2].fen;
        game[0].color = game[0].moves[game[0].moves.length - 2].color;
        game[0].moves.pop();
        await game[0].save();
        res.send(game[0]);
    }
});

router.post('/reset', async (req, res) => {
    let game = await Game.find();
    if (game.length === 0) {
        game = new Game({
            fen: req.body.fen,
            moves: [{
                fen: req.body.fen,
                color: req.body.color
            }],
            color: req.body.color
        });
        await game.save();
        res.send(game);
    } else {
        game[0].fen = req.body.fen;
        game[0].color = req.body.color;
        game[0].moves = [{
            fen: req.body.fen,
            color: req.body.color
        }];
        await game[0].save();
        res.send(game[0]);
    }
});

router.get('/*', (req, res) => {
    res.sendFile(path.resolve(__dirname, '../dist/chess-x/index.html'));
});

module.exports = router;
