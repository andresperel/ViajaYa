const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { resolve } = require('node:path');
const { createFormControl } = require('react-hook-form');

const rulesPromise = import(`data:text/javascript;base64,${readFileSync(resolve(__dirname, '../validation/registration.js')).toString('base64')}`);
const valid = { nombre: 'María González', email: 'maria@example.com', telefono: '+54 11 1234 5678', password: 'viajaya123', terminos: true };

async function submit(values) {
  const { registrationRules } = await rulesPromise;
  const form = createFormControl({ defaultValues: values });
  for (const [name, rules] of Object.entries(registrationRules)) form.register(name, rules);
  let sent = false;
  let errors = {};
  await form.handleSubmit(() => { sent = true; }, (invalid) => { errors = invalid; })();
  return { sent, errors, form };
}

test('un formulario vacío no llega al callback de registro y muestra los cinco errores', async () => {
  const result = await submit({ nombre: '', email: '', telefono: '', password: '', terminos: false });
  assert.equal(result.sent, false);
  assert.deepEqual(Object.keys(result.errors).sort(), Object.keys(valid).sort());
});

test('RHF bloquea datos inválidos antes del envío', async () => {
  for (const [name, value] of [
    ['nombre', '  '], ['nombre', 'Ab'], ['nombre', 'Usuario123'], ['nombre', 'A'.repeat(51)],
    ['email', 'sin-arroba'], ['email', 'a'.repeat(100) + '@a.com'],
    ['telefono', '1234567'], ['telefono', '1234567890123456'], ['telefono', 'abcd12345678'],
    ['password', '1234567'], ['password', '        '], ['password', 'a'.repeat(31)],
    ['password', '漢'.repeat(25)], ['terminos', false],
  ]) {
    const result = await submit({ ...valid, [name]: value });
    assert.equal(result.sent, false, `${name}: ${value}`);
    assert.ok(result.errors[name]?.message);
  }
});

test('acepta datos válidos, normalizables y contraseña de ocho caracteres', async () => {
  const result = await submit({ ...valid, nombre: ' María González ', email: ' MARIA@example.com ', password: '12345678' });
  assert.equal(result.sent, true);
});

test('reset limpia valores y errores para un nuevo registro', async () => {
  const { form } = await submit(valid);
  form.setError('email', { type: 'server', message: 'Duplicado' });
  form.reset({ nombre: '', email: '', telefono: '', password: '', terminos: false });
  assert.equal(form.getValues('email'), '');
  assert.equal(form.getValues('terminos'), false);
  assert.equal(form.getFieldState('email').error, undefined);
});
