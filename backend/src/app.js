const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/authRoutes');
const viajeRoutes = require('./routes/viajeRoutes');

const app = express();

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send('Backend funcionando');
});

app.use('/', authRoutes);
app.use('/', viajeRoutes);

module.exports = app;