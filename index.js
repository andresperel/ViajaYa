const express = require('express');

const app = express();

app.use(express.json());

//usuario fijo de prueba
const usuario = {
    email: 'admin@gmail.com',
    password: '1234'
};

//ruta login
app.post('/login', (req, res) => {

    const { email, password } = req.body;

    if (
        email === usuario.email &&
        password === usuario.password
    ) {

        return res.json({
            mensaje: 'Login exitoso'
        });
    }

    res.status(401).json({
        mensaje: 'Datos incorrectos'
    });
});

//ruta principal
app.get('/', (req, res) => {
    res.send('Backend funcionando');
});

app.listen(3000, () => {
    console.log('Servidor corriendo en puerto 3000');
});