const limpiar = (value) => value.trim();

// Las reglas validan los mismos valores normalizados que recibe el backend.
export const registrationRules = {
  nombre: {
    validate: {
      required: (v) => !!limpiar(v) || 'El nombre es obligatorio',
      length: (v) => (limpiar(v).length >= 3 && limpiar(v).length <= 50) || 'El nombre debe tener entre 3 y 50 caracteres',
      format: (v) => /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+(?:[ '-][A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+)*$/.test(limpiar(v)) || 'Usá letras, espacios, apóstrofes o guiones',
    },
  },
  email: {
    validate: {
      required: (v) => !!limpiar(v) || 'El email es obligatorio',
      format: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(limpiar(v)) || 'Ingresá un email válido',
      length: (v) => limpiar(v).length <= 100 || 'El email es demasiado largo',
    },
  },
  telefono: {
    required: 'El teléfono es obligatorio',
    validate: (v) => (/^[+\d\s()-]+$/.test(v) && /^\d{8,15}$/.test(v.replace(/\D/g, ''))) || 'Ingresá un teléfono de entre 8 y 15 números',
  },
  password: {
    validate: {
      required: (v) => !!limpiar(v) || 'La contraseña es obligatoria',
      min: (v) => limpiar(v).length >= 8 || 'La contraseña debe tener al menos 8 caracteres',
      max: (v) => limpiar(v).length <= 30 || 'La contraseña debe tener como máximo 30 caracteres',
      bytes: (v) => Array.from(limpiar(v)).reduce((total, char) => {
        const code = char.codePointAt(0);
        return total + (code <= 0x7f ? 1 : code <= 0x7ff ? 2 : code <= 0xffff ? 3 : 4);
      }, 0) <= 72 || 'La contraseña supera el límite de 72 bytes',
    },
  },
  terminos: { validate: (v) => v === true || 'Debés aceptar los términos y condiciones' },
};

