const express = require('express');
const mongoose = require('mongoose');
const path = require('path');

const Game = require('../models/Game');
const Config = require('../models/Config');

const router = express.Router();

router.get('/game', async (req, res) => {
    let game = await Game.findOne({
        active: true
    });
    res.send(game);
});

router.post('/move', async (req, res) => {
    let game = await Game.findOne({
        active: true
    });
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
        if (game.moves.length > 0 && game.moves[game.moves.length - 1].fen === req.body.fen) {
            res.send(game);
        } else {
            game.moves.push({
                fen: req.body.fen,
                color: req.body.color
            });
            game.fen = req.body.fen;
            game.color = req.body.color;
            await game.save();
            res.send(game);
        }
    }
});

router.post('/undo', async (req, res) => {
    let game = await Game.findOne({
        active: true
    });
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
        if (game.moves.length < 2) {
            res.send(game);
        }
        game.fen = game.moves[game.moves.length - 2].fen;
        game.color = game.moves[game.moves.length - 2].color;
        game.moves.pop();
        await game.save();
        res.send(game);
    }
});

router.post('/reset', async (req, res) => {
    let game = await Game.findOne({
        active: true
    });
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
        game.fen = req.body.fen;
        game.color = req.body.color;
        game.moves = [{
            fen: req.body.fen,
            color: req.body.color
        }];
        game.tchat = [];
        await game.save();
        res.send(game);
    }
});

router.post('/names', async (req, res) => {
    let game = await Game.findOne({
        active: true
    });
    if (game.length === 0) {
        res.send({
            white: 'White',
            black: 'Black'
        });
    } else {
        game.white = req.body.white;
        game.black = req.body.black;
        await game.save();
        res.send(game);
    }
});

router.get('/tchat', async (req, res) => {
    let game = await Game.find({
        active: true
    });
    if (game.length === 0) {
        res.send([]);
    } else {
        res.send(game.tchat);
    }
});

router.post('/tchat', async (req, res) => {
    if (!req.body.text) {
        res.send([]);
    }
    let game = await Game.findOne({
        active: true
    });
    if (game.length === 0) {
        game = new Game();
        game.tchat.push({
            text: req.body.text
        });
        await game.save();
        res.send(game.tchat);
    } else {
        game.tchat.push({
            text: req.body.text
        });
        await game.save();
        res.send(game.tchat);
    }
});

router.post('/login', async (req, res) => {
    let config = await Config.findOne();
    if (req.body.password === config.adminPassword) {
        res.send({
            success: true
        });
    } else {
        res.send({
            success: false
        });
    }
});

router.get('/*', (req, res) => {
    res.sendFile(path.resolve(__dirname, '../dist/chess-x/index.html'));
});

module.exports = router;
