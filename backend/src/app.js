const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/authRoutes');
const viajeRoutes = require('./routes/viajeRoutes');
const uberRoutes = require('./routes/uberRoutes');
const routeRoutes = require('./routes/routeRoutes');

const app = express();

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send('Backend funcionando');
});

app.use('/', authRoutes);
app.use('/', viajeRoutes);
app.use('/', uberRoutes);
app.use('/', routeRoutes);

module.exports = app;