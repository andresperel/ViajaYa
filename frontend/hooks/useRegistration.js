export { registrationRules } from '../validation/registration';
import { useCallback, useRef, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { useForm } from 'react-hook-form';
import { apiFetch } from '../services/api';

const defaultValues = { nombre: '', email: '', telefono: '', password: '', terminos: false };
const limpiar = (value) => value.trim();

export default function useRegistration(navigation) {
  const form = useForm({ defaultValues, mode: 'onTouched', reValidateMode: 'onChange' });
  const { reset, setError, clearErrors, handleSubmit } = form;
  const [mostrarPoliticas, setMostrarPoliticas] = useState(false);
  const activeVisit = useRef(null);
  const sending = useRef(false);

  useFocusEffect(useCallback(() => {
    const visit = {};
    activeVisit.current = visit;
    reset(defaultValues);
    setMostrarPoliticas(false);
    return () => { activeVisit.current = null; };
  }, [reset]));

  const registrar = async ({ nombre, email, telefono, password }) => {
    const visit = activeVisit.current;
    try {
      await apiFetch('/register', {
        method: 'POST',
        body: JSON.stringify({
          nombre: limpiar(nombre), email: limpiar(email).toLowerCase(),
          telefono: telefono.replace(/\D/g, ''), password: limpiar(password),
        }),
      });
      if (activeVisit.current !== visit) return;
      reset(defaultValues);
      navigation.navigate('Login', { registroExitoso: { nombre: limpiar(nombre), email: limpiar(email).toLowerCase() } });
    } catch (error) {
      if (activeVisit.current !== visit) return;
      setError(error.status === 409 ? 'email' : 'root.server', {
        type: 'server',
        message: error.status === 409 ? 'Este email ya está registrado' : error.message || 'No pude conectarme con el servidor',
      });
    }
  };

  const enviar = async () => {
    if (sending.current) return;
    sending.current = true;
    clearErrors('root.server');
    try { await handleSubmit(registrar)(); }
    finally { sending.current = false; }
  };

  return { ...form, enviar, mostrarPoliticas, setMostrarPoliticas };
}
