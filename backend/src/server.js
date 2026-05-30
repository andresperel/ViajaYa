require('dotenv').config();

const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');

const app = express();

app.use(cors());
app.use(express.json());

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

app.get('/', (req, res) => {
  res.send('Backend funcionando');
});

app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  const { data, error } = await supabase
    .from('Usuario')
    .select('*')
    .eq('email', email)
    .single();

  if (error || !data) {
    return res.status(404).json({ mensaje: 'Usuario no encontrado' });
  }

  if (data.contraseña !== password) {
    return res.status(401).json({ mensaje: 'Contraseña incorrecta' });
  }

  res.status(200).json({
    mensaje: 'Login exitoso',
    usuario: data,
  });
});

app.post('/register', async (req, res) => {
  const { nombre, telefono, email, password } = req.body;

  const { data: existe } = await supabase
    .from('Usuario')
    .select('*')
    .eq('email', email)
    .single();

  if (existe) {
    return res.status(400).json({ mensaje: 'El usuario ya existe' });
  }

  const { error } = await supabase
    .from('Usuario')
    .insert([
      {
        nombre,
        telefono,
        email,
        contraseña: password,
      },
    ]);

  if (error) {
    return res.status(500).json({ mensaje: 'Error al registrar usuario' });
  }

  res.status(201).json({ mensaje: 'Usuario registrado' });
});

app.listen(3000, () => {
  console.log('Servidor corriendo en puerto 3000');
});