# ViajaYa — React Context y React Hook Form

## Trabajo práctico: React Context

Repositorio: [andresperel/ViajaYa](https://github.com/andresperel/ViajaYa).

El estado global mantiene el idioma elegido entre pantallas y comparte avisos de viajes guardados sin pasarlos por props ni por parámetros de navegación.

| Consigna | Implementación |
| --- | --- |
| `createContext` | `frontend/context/AppContext.js` crea `AppContext`. |
| Provider | `frontend/app.js` envuelve la navegación con `AppProvider`. |
| Al menos dos consumidores con `useContext` | El hook `useApp` llama a `useContext(AppContext)`. Lo consumen `IdiomaScreen`, `PerfilScreen`, `HomeScreen`, `ResultadosScreen`, `NotificacionesScreen`, `AyudaScreen` y `PrivacidadScreen`. |
| Estado funcional | Idioma modifica la preferencia y las otras pantallas actualizan sus textos. Resultados agrega avisos después de guardar un viaje; Inicio muestra el indicador de avisos sin leer y Notificaciones muestra la lista y los marca como leídos. |

El Provider administra `idioma` y `notificaciones` con `useState` y expone `setIdioma`, `agregarNotificacion` y `marcarNotificacionesLeidas`. La lista se actualiza usando el estado anterior. `useApp` informa un error si se usa fuera del Provider.

Los avisos empiezan vacíos y se generan tras una respuesta exitosa de `POST /viaje`; si el guardado falla, no se agrega ningún aviso. Se conservan los últimos 12 durante la ejecución de la aplicación. Idioma y avisos se reinician al recargar; no hay persistencia ni notificaciones push. El aviso confirma el guardado en ViajaYa, no una reserva en la empresa de transporte.

### Comprobación manual

1. Iniciar sesión e ir a Perfil → Idioma → English. Volver a Perfil e Inicio y comprobar sus textos traducidos. Elegir Español y comprobar el cambio nuevamente.
2. En una ejecución nueva, comprobar que Inicio no muestra avisos sin leer y Notificaciones muestra la lista vacía.
3. Buscar un recorrido y elegir una oferta. Tras guardar exitosamente, volver a Inicio: debe aparecer el indicador de avisos sin leer.
4. Abrir Notificaciones y comprobar el aviso con empresa, origen y destino. Permanecer al menos 600 ms y volver a Inicio: el indicador desaparece y el aviso permanece en la lista.
5. Guardar otro viaje: se agrega un nuevo aviso y se reactiva el indicador. Probar un error de guardado: no debe agregar avisos.

Para entregar, subir los cambios y adjuntar el enlace al repositorio público actualizado. El enlace anterior corresponde al remoto configurado; comprobar su visibilidad pública antes de la entrega.

## Trabajo práctico: Registro con React Hook Form

Este TP adapta el formulario existente de **`frontend/screens/RegisterScreen.js`**. Se conserva el diseño y el flujo de ViajaYa: registro → backend Express → Supabase → pantalla de inicio de sesión. No se agregaron campos: se utiliza **Nombre completo**, ya existente, en lugar de inventar un nombre de usuario.

## Organización y responsabilidades

- `frontend/hooks/useRegistration.js`: administra los datos con `useForm`, ejecuta `handleSubmit`, expone `formState`, envía a la API y controla la limpieza y los errores del servidor.
- `frontend/validation/registration.js`: define las reglas que React Hook Form ejecuta en el cliente.
- `frontend/screens/RegisterScreen.js`: presenta el formulario, muestra `formState.errors` y usa `formState.isSubmitting` para deshabilitar los campos y el botón y mostrar “Creando cuenta...”.
- `Campo`, dentro de `RegisterScreen.js`: recibe `control`, nombre del campo, error y opciones mediante props. Su `Controller` conecta `value`, `onChangeText`, `onBlur` y `ref` con el `TextInput`. No guarda copias de los valores en `useState`. El checkbox también usa `Controller`.
- `frontend/services/api.js`: conserva la comunicación HTTP existente, incluidos los errores y el tiempo máximo de espera.
- `backend/src/controllers/authController.js`: mantiene las validaciones del servidor, la comprobación de email existente, el hash de contraseña y la inserción en Supabase.

## Validaciones del frontend

| Campo | Reglas anteriores al envío |
| --- | --- |
| Nombre completo | Obligatorio, entre 3 y 50 caracteres; letras, espacios, apóstrofes y guiones |
| Email | Obligatorio, formato válido, máximo 100 caracteres |
| Teléfono | Obligatorio, entre 8 y 15 dígitos; admite formato con `+`, espacios, paréntesis y guiones |
| Contraseña | Obligatoria, mínimo 8 y máximo 30 caracteres, máximo 72 bytes UTF-8 compatible con bcrypt |
| Términos y condiciones | Deben estar aceptados |

Las reglas se proporcionan a React Hook Form mediante `rules`, `required` y `validate`. Se valida al tocar y abandonar un campo, al corregirlo y al intentar enviar. `handleSubmit` solo ejecuta el registro si todos los campos son válidos. Cada error aparece junto a su campo; no basta con que Supabase rechace los datos.

Se validan nombre, email y contraseña sin espacios en los extremos, igual que los valores enviados. El email se envía en minúsculas y el teléfono solo con dígitos. Se mantiene el recorte de contraseña que ya utilizaban registro y login. El mínimo del frontend pasa de 6 a **8**; el backend conserva su mínimo existente de 6, sin modificar cuentas anteriores ni las demás restricciones.

## Envío, backend y comunicación entre componentes

```text
TextInput / checkbox → Controller → useForm en useRegistration
→ handleSubmit → validaciones del cliente
→ apiFetch POST /register → Express → Supabase
→ LoginScreen mediante parámetros de navegación
```

`RegisterScreen` administra el formulario a través de su hook. Los componentes `Campo` reciben sus valores desde React Hook Form y comunican las ediciones por callbacks, sin estado duplicado. El hook recibe el objeto validado y genera el cuerpo `{ nombre, telefono, email, password }` esperado por el backend. Los términos se comprueban en el cliente y no se agregan al contrato de la API.

Tras un registro exitoso, se envían **nombre y email normalizados** a `LoginScreen` mediante `navigation.navigate('Login', { registroExitoso: { nombre, email } })`. Login lee directamente `route.params.registroExitoso` para mostrar la confirmación personalizada: no copia esos datos a `useState` ni recibe la contraseña. Su formulario de inicio de sesión conserva sus propios valores independientes. La confirmación se elimina al salir de Login.

Un HTTP 409 del backend se asigna al campo email con `setError`. Los errores generales o de conexión aparecen en `errors.root.server`. Un error conserva los datos para permitir corregir y reintentar. Las validaciones y restricciones existentes del backend y de Supabase siguen vigentes.

## Limpieza y experiencia de uso

`useFocusEffect` ejecuta `reset` cada vez que se entra al registro: campos vacíos, términos desmarcados y sin errores anteriores. También se limpia tras un alta exitosa. Si se abandona la pantalla durante una petición, su respuesta no navega ni muestra errores en una visita posterior; la petición ya enviada puede completarse en el servidor.

Se evita enviar dos veces mientras hay una operación en curso. `KeyboardAvoidingView` y `ScrollView` permiten desplazar el formulario con el teclado abierto. Email y teléfono tienen teclados apropiados; la contraseña permanece oculta y sin autocorrección. Los errores incluyen etiquetas de accesibilidad.

## Ejecución y comprobaciones

Con el backend y sus variables de entorno ya configurados, ejecutar `npm install` y `npm start` desde `backend`. En `frontend`, configurar `EXPO_PUBLIC_API_URL` con la URL accesible del backend, ejecutar `npm install` y `npm start`. Se conserva la configuración Expo del proyecto.

Pruebas automatizadas desde `frontend`:

```sh
npm run test:registration
```

Las pruebas usan React Hook Form real (`createFormControl`): comprueban que un formulario vacío o inválido no ejecuta el callback de envío, que los datos válidos sí lo ejecutan y que `reset` limpia valores y errores. No crean usuarios ni llaman a Supabase.

Para verificar manualmente en un dispositivo:

1. Enviar vacío: deben aparecer errores en los cinco campos sin llamar al backend.
2. Probar nombre de dos caracteres, email inválido, teléfono corto, contraseña de siete caracteres y términos sin aceptar.
3. Corregir los datos: los errores deben actualizarse.
4. Registrar datos válidos con un email nuevo: comprobar el estado de carga y la confirmación con nombre y email en Login.
5. Intentar un email ya registrado: debe mostrarse el error junto al correo.
6. Probar sin conexión: debe conservarse el formulario y permitirse reintentar.
7. Salir y regresar a registro: comprobar campos y errores limpios.
8. Abrir el teclado y desplazarse hasta contraseña, términos y botón en una pantalla pequeña.

También se corrigió el import inicial `./App` a `./app` para que coincida con el archivo existente y Metro pueda resolverlo.
