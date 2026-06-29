// Importo las variables de entorno.
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

// Importo la app principal, donde tengo configuradas las rutas.
const app = require('./app');

// Uso el puerto del archivo .env o el 3000 por defecto.
const puertoServidor = process.env.PORT || 3000;
const hostServidor = process.env.HOST || '0.0.0.0';

// Levanto el servidor.
app.listen(puertoServidor, hostServidor, () => {
  console.log(`Servidor corriendo en http://${hostServidor}:${puertoServidor}`);
});
