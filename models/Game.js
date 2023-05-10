const mongoose = require('mongoose');
const mongodbErrorHandler = require('mongoose-mongodb-errors');

const gameSchema = new mongoose.Schema({
    fen: String,
    color: String,
    active: Boolean,
    white: {
        type: String,
        default: 'White'
    },
    black: {
        type: String,
        default: 'Black'
    },
    moves: [{
        fen: String,
        color: String
    }],
    tchat: [{
        text: String,
        datetime: {
            type: Date,
            default: Date.now
        }
    }],
    datetime: {
        type: Date,
        default: Date.now
    }
});

gameSchema.plugin(mongodbErrorHandler);

module.exports = mongoose.model('Game', gameSchema);
