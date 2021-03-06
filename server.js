const express = require('express');
const app = express();
var cors = require('cors')
const bodyParser = require('body-parser');
const port = 3100;

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cors())

const mongoose = require('mongoose');
mongoose.connect('mongodb://127.0.0.1:27017/gstinvoice', { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('connected to database'))
    .catch((err) => console.error(err));
    
const client = require('./routes/clients');
const invoice = require('./routes/invoice');
const product = require('./routes/product');

app.use('/clients', client);
app.use('/invoices', invoice);
app.use('/products', product);


app.listen(port, () => console.log(`Example app listening on port ${port}!`));