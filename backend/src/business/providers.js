function providerContinuation(provider, quote) {
  if (provider === "Uber") {
    const [lng, lat] = quote.origen.coordinates;
    const [dlng, dlat] = quote.destino.coordinates;
    const params = new URLSearchParams({
      action: "setPickup",
      pickup: JSON.stringify({
        latitude: lat,
        longitude: lng,
        addressLine1: quote.origen.label,
      }),
      "drop[0]": JSON.stringify({
        latitude: dlat,
        longitude: dlng,
        addressLine1: quote.destino.label,
      }),
    });
    return {
      url: `https://m.uber.com/?${params}`,
      modo: "web",
      mensaje:
        "Continuá en Uber. Revisá recorrido, categoría y precio antes de confirmar allí.",
    };
  }
  return {
    url:
      provider === "Cabify"
        ? "https://cabify.com/ar"
        : "https://web.didiglobal.com/ar/pasajero/",
    modo: "telefono",
    mensaje: `Abrí ${provider} en tu teléfono e ingresá origen y destino. El enlace abre su sitio oficial; no precarga ni confirma un viaje.`,
  };
}
module.exports = { providerContinuation };
