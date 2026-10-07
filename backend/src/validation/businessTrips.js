function validateTripClassification(body = {}) {
  const tipoViaje = body.tipoViaje === undefined ? 'personal' : body.tipoViaje;
  if (!['personal', 'business'].includes(tipoViaje)) throw new Error('tipoViaje debe ser personal o business.');
  const motivo = body.motivoViaje;
  if (motivo != null && (typeof motivo !== 'string' || Array.from(motivo).length > 200)) {
    throw new Error('motivoViaje debe ser texto de hasta 200 caracteres.');
  }
  return { tipoViaje, motivoViaje: motivo?.trim() || null };
}
module.exports = { validateTripClassification };
