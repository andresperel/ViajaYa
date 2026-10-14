const $ = (id) => document.getElementById(id);
let token = '';
let selected = null;
let busy = false;
const money = (n) => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(n);
async function api(path, method = 'GET', body) {
  const response = await fetch(`/business/${path}`, { method, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: body ? JSON.stringify(body) : undefined });
  const data = await response.json();
  if (!response.ok) {
    if (response.status === 401 && path !== 'admin/login') logout();
    throw new Error(data.mensaje || 'No se pudo completar la operación.');
  }
  return data;
}
async function action(fn) {
  if (busy) return;
  busy = true; $('message').textContent = '';
  document.querySelectorAll('button').forEach(b => { b.disabled = true; });
  try { await fn(); } catch (e) { $('message').textContent = e.message; }
  finally { busy = false; document.querySelectorAll('button').forEach(b => { b.disabled = false; }); }
}
function logout() {
  token = ''; selected = null; $('panel').hidden = true; $('login').hidden = false; $('logout').hidden = true; $('detail').hidden = true; $('password').value = ''; $('members').replaceChildren(); $('companies').replaceChildren();
}
$('logout').onclick = logout;
$('refresh').onclick = () => action(detail);
$('loginForm').onsubmit = e => { e.preventDefault(); action(async () => {
  const data = await api('admin/login', 'POST', { email: $('email').value.trim(), password: $('password').value });
  token = data.token; $('password').value = ''; $('login').hidden = true; $('panel').hidden = false; $('logout').hidden = false;
  await companies();
}); };
async function companies() {
  const list = await api('admin/empresas'); $('companies').replaceChildren();
  if (!list.length) $('companies').textContent = 'Todavía no hay empresas.';
  list.forEach(company => {
    const button = document.createElement('button'); button.textContent = company.nombre; button.setAttribute('aria-pressed', company.id === selected);
    button.onclick = () => action(async () => { selected = company.id; await detail(); await companies(); }); $('companies').append(button);
  });
}
$('companyForm').onsubmit = e => { e.preventDefault(); action(async () => {
  const company = await api('admin/empresas', 'POST', { nombre: $('companyName').value });
  $('companyForm').reset(); selected = company.id; await detail(); await companies();
}); };
$('memberForm').onsubmit = e => { e.preventDefault(); action(async () => {
  await api(`admin/empresas/${selected}/usuarios`, 'POST', { email: $('memberEmail').value }); $('memberForm').reset(); await detail();
}); };
async function detail() {
  $('detail').hidden = true;
  const data = await api(`admin/empresas/${selected}`);
  $('companyTitle').textContent = data.empresa.nombre; $('code').textContent = data.empresa.codigo;
  $('stats').replaceChildren();
  [['Empleados activos', data.stats.activos], ['Cuentas vinculadas', data.stats.vinculados], ['Viajes', data.stats.viajes], ['Realizados', data.stats.realizados], ['Gasto estimado', money(data.stats.gastoEstimado)]].forEach(([label, value]) => {
    const card = document.createElement('div'); card.className = 'stat'; const strong = document.createElement('strong'); strong.textContent = value; card.append(strong, document.createTextNode(label)); $('stats').append(card);
  });
  $('members').replaceChildren();
  data.usuarios.forEach(user => {
    const row = document.createElement('tr');
    [user.email, user.activo ? 'Activo' : 'Inactivo', user.usuarioId ? 'Vinculado' : 'Pendiente', user.fechaAcceso ? new Date(user.fechaAcceso).toLocaleString('es-AR') : 'Sin ingreso', user.viajes, user.realizados, money(user.gastoEstimado)].forEach(value => { const cell = document.createElement('td'); cell.textContent = value; row.append(cell); });
    const cell = document.createElement('td'); const button = document.createElement('button'); button.textContent = user.activo ? 'Inactivar' : 'Activar'; button.setAttribute('aria-label', `${button.textContent} ${user.email}`);
    button.onclick = () => action(async () => { await api(`admin/usuarios/${user.id}`, 'PATCH', { activo: !user.activo }); await detail(); }); cell.append(button); row.append(cell); $('members').append(row);
  });
  if (!data.usuarios.length) { const row = document.createElement('tr'); const cell = document.createElement('td'); cell.colSpan = 8; cell.textContent = 'Agregá el primer correo autorizado.'; row.append(cell); $('members').append(row); }
  $('detail').hidden = false;
}
