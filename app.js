const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const mongoose = require('mongoose');
const routes = require('./routes');

require('dotenv').config({
	path: '.env'
});

// Middleware to parse JSON request bodies
app.use(bodyParser.json());

mongoose.set('strictQuery', true);
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
});
mongoose.Promise = global.Promise;
mongoose.connection.on('error', (err) => {
    console.log(`An error occured while connecting to the database: ${err}`);
});

app.use(express.static(__dirname + '/dist/chess-x'));

app.use('/', routes);

app.listen(process.env.PORT || 8531);
