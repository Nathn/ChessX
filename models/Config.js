const mongoose = require('mongoose');
const mongodbErrorHandler = require('mongoose-mongodb-errors');

const configSchema = new mongoose.Schema({
    adminPassword: String
});

configSchema.plugin(mongodbErrorHandler);

module.exports = mongoose.model('Config', configSchema);
