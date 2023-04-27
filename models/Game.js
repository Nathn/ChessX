const mongoose = require('mongoose');
const mongodbErrorHandler = require('mongoose-mongodb-errors');

const gameSchema = new mongoose.Schema({
    fen: String,
    color: String,
    moves: [{
        fen: String,
        color: String
    }],
    datetime: {
        type: Date,
        default: Date.now
    }
});

gameSchema.plugin(mongodbErrorHandler);

module.exports = mongoose.model('Game', gameSchema);
