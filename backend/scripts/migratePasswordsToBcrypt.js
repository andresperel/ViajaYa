const path = require('path');
const bcrypt = require('bcrypt');

require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const supabase = require('../src/config/supabase');

const SALT_ROUNDS = 12;
const BCRYPT_HASH = /^\$2[aby]\$\d{2}\$.{53}$/;

async function migratePasswords() {
  const { data: usuarios, error } = await supabase
    .from('Usuario')
    .select('idUsuario,contraseña');

  if (error) throw error;

  const pendientes = usuarios.filter(usuario => !BCRYPT_HASH.test(usuario.contraseña || ''));
  for (const usuario of pendientes) {
    if (!usuario.contraseña) {
      console.warn(`Usuario ${usuario.idUsuario}: no se migro porque no tiene contrasena.`);
      continue;
    }

    const { error: updateError } = await supabase
      .from('Usuario')
      .update({ contraseña: await bcrypt.hash(usuario.contraseña, SALT_ROUNDS) })
      .eq('idUsuario', usuario.idUsuario);

    if (updateError) throw updateError;
  }

  console.log(`Migracion terminada. Usuarios actualizados: ${pendientes.length}.`);
}

migratePasswords().catch(error => {
  console.error('La migracion fallo:', error.message);
  process.exitCode = 1;
});
