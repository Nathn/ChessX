const mongoose = require('mongoose');
const mongodbErrorHandler = require('mongoose-mongodb-errors');

const tchatSchema = new mongoose.Schema({
    messages: [{
        text: String,
        datetime: {
            type: Date,
            default: Date.now
        }
    }]
});

tchatSchema.plugin(mongodbErrorHandler);

module.exports = mongoose.model('Tchat', tchatSchema);
