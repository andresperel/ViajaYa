Para iniciar la API y el tunel (dos terminales desde la raiz):

```powershell
npm --prefix backend start
npm --prefix backend run tunnel
```

El tunel requiere ngrok v3 en PATH, en `.tools/ngrok/ngrok.exe`, o una ruta en `NGROK_BIN` dentro de `backend/.env`. Configura `NGROK_AUTHTOKEN` en ese mismo archivo con el authtoken de tu cuenta. `NGROK_URL` (o la variable existente `NGROK`) indica el dominio de esa cuenta.

El comando sincroniza la URL HTTPS con `frontend/.env`. Luego inicia Expo:

```powershell
npm --prefix frontend start -- --clear
```

Mantene ambas terminales abiertas. Una APK existente requiere recompilarse si cambia la URL de la API.
