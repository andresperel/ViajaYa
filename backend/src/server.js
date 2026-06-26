// Importo las variables de entorno.
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

// Importo la app principal, donde tengo configuradas las rutas.
const app = require('./app');

// Uso el puerto del archivo .env o el 3000 por defecto.
const puertoServidor = process.env.PORT || 3000;

// Levanto el servidor.
app.listen(puertoServidor, () => {
  console.log(`Servidor corriendo en puerto ${puertoServidor}`);
});
