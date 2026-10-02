Para iniciar la API y el tunel (dos terminales desde la raiz):

```powershell
npm --prefix backend start
npm --prefix backend run tunnel
```

El tunel requiere ngrok v3 en PATH, en `.tools/ngrok/ngrok.exe`, o una ruta en `NGROK_BIN` dentro de `backend/.env`. Configura `NGROK_AUTHTOKEN` en ese mismo archivo con el authtoken de tu cuenta; el script ahora lo pasa al proceso de ngrok. `NGROK_URL` (o la variable existente `NGROK`) indica el dominio reservado de esa cuenta. Sin `NGROK_URL`, ngrok asigna un dominio temporal nuevo cuando inicia.

El comando sincroniza la URL HTTPS con `frontend/.env`. Luego inicia Expo:

```powershell
npm --prefix frontend start -- --clear
```

Mantene ambas terminales abiertas. Una APK existente requiere recompilarse si cambia la URL de la API.

Si el dominio cambia, reinicia Expo para que lea `frontend/.env`. Para iniciar sesión con Google, la URL de redireccionamiento `viajaya://auth/callback` también debe estar permitida en Supabase (Authentication > URL Configuration) y Google debe estar habilitado como proveedor. En Android, OAuth requiere una compilación de desarrollo o APK con el esquema `viajaya` registrado; Expo Go no completa este retorno personalizado.

## Seguimiento de Uber

La app puede asociar un viaje de Uber con `POST /viaje/:idViaje/uber` (token de ViajaYa y JSON `{ "idViajeProveedor": "..." }`). El webhook público es `POST /webhooks/uber`; configura esa URL en el panel de Uber, habilita los eventos de cambio de estado y define `UBER_WEBHOOK_SIGNING_KEY`. Los eventos firmados actualizan el viaje a realizado o cancelado. `GET /viaje/:idViaje/verificar` permite consultar el estado guardado.

La pantalla “Continuar en Uber” solo abre Uber con origen y destino; Uber no devuelve el identificador del viaje a ViajaYa. Por eso el seguimiento automático requiere que una integración habilitada por Uber proporcione ese ID y entregue los webhooks. Las credenciales sandbox o de estimaciones por sí solas no habilitan acceso a viajes reales ni a sus eventos.
