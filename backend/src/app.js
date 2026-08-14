const express = require('express');
const cors = require('cors');
const path = require('path');

const authRoutes = require('./routes/authRoutes');
const viajeRoutes = require('./routes/viajeRoutes');
const uberRoutes = require('./routes/uberRoutes');
const routeRoutes = require('./routes/routeRoutes');

const app = express();

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.json({ servicio: 'ViajaYa API', estado: 'ok' });
});

app.get('/health', (req, res) => {
  res.json({ estado: 'ok', timestamp: new Date().toISOString() });
});

app.get('/descargar-apk', (req, res) => {
  const apkPath = path.resolve(
    __dirname,
    '../../frontend/android/app/build/outputs/apk/release/app-release.apk'
  );

  res.download(apkPath, 'ViajaYa.apk', (error) => {
    if (error && !res.headersSent) {
      res.status(404).json({ mensaje: 'La APK todavia no esta disponible.' });
    }
  });
});

app.use('/', authRoutes);
app.use('/', viajeRoutes);
app.use('/', uberRoutes);
app.use('/', routeRoutes);

module.exports = app;
