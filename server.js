const pool = require('./db');
const express = require('express');

const app = express();

app.use(express.json());

// Usuario de prueba
const usuario = {
    email: 'admin@gmail.com',
    password: '1234'
};

// Ruta principal
app.get('/', (req, res) => {

    res.send('Backend funcionando');

});

// Login
app.post('/login', (req, res) => {

    const { email, password } = req.body;

    const loginCorrecto =
        email === usuario.email &&
        password === usuario.password;

    if (loginCorrecto) {

        return res.status(200).json({
            mensaje: 'Login exitoso'
        });

    }

    res.status(401).json({
        mensaje: 'Datos incorrectos'
    });

});
// PROBAR BASE DE DATOS
app.get('/db', async (req, res) => {

    try {

        const result = await pool.query(
            'SELECT NOW()'
        );

        res.json(result.rows);

    } catch (error) {

        console.log(error);

        res.status(500).send('Error de conexión');

    }

});

app.listen(3000, () => {

    console.log('Servidor corriendo en puerto 3000');

});