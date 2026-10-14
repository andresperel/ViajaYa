const express = require('express');
const cors = require('cors');
const path = require('path');

const authRoutes = require('./routes/authRoutes');
const viajeRoutes = require('./routes/viajeRoutes');
const uberRoutes = require('./routes/uberRoutes');
const routeRoutes = require('./routes/routeRoutes');
const webhookRoutes = require('./routes/webhookRoutes');

const app = express();

app.use(cors());
app.use(express.json({
  verify: (req, res, buffer) => {
    req.rawBody = buffer;
  },
}));

app.get('/', (req, res) => {
  res.json({ servicio: 'ViajaYa API', estado: 'ok' });
});

app.get('/health', (req, res) => {
  res.json({ estado: 'ok', timestamp: new Date().toISOString() });
});

app.get('/privacy', (req, res) => {
  res.type('html').send(`<!doctype html>
  <html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width">
  <title>Privacidad - ViajaYa</title></head>
  <body style="font-family:Arial,sans-serif;max-width:760px;margin:40px auto;padding:0 20px;line-height:1.6;color:#172033">
    <h1>Política de privacidad de ViajaYa</h1>
    <p>ViajaYa utiliza los datos de cuenta, origen y destino exclusivamente para autenticar al usuario, comparar opciones de traslado y conservar su historial.</p>
    <p>Las contraseñas se almacenan de forma protegida. ViajaYa no vende información personal ni realiza seguimiento de ubicación en segundo plano.</p>
    <p>Cuando el usuario elige un proveedor, los datos necesarios para solicitar o consultar el viaje pueden compartirse con dicho proveedor conforme a sus políticas.</p>
    <p>El usuario puede consultar sus viajes y cerrar su sesión desde la aplicación.</p>
    <p>Última actualización: 28 de agosto de 2026.</p>
  </body></html>`);
});

app.get('/oauth/uber/callback', (req, res) => {
  res.type('html').send('<h1>ViajaYa</h1><p>Autorización de Uber recibida. Ya podés volver a la aplicación.</p>');
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
app.use('/', require('./routes/businessRoutes'));
app.use('/business-admin', express.static(path.join(__dirname, '../public/business-admin')));
app.use('/', viajeRoutes);
app.use('/', uberRoutes);
app.use('/', routeRoutes);
app.use('/', webhookRoutes);

module.exports = app;
