// Entry point único: evita levantar el servidor legacy que sólo tenía /login.
// El servidor del backend carga su propio .env y expone /calcular-viaje.
require('./backend/src/server');
