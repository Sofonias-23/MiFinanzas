'use client';

import { FormEvent, useState } from 'react';
import { supabase } from '@/lib/supabase';

const initialForm = {
  name: '',
  email: '',
  subject: 'Consulta general',
  message: '',
  website: '',
};

export default function ContactForm() {
  const [form, setForm] = useState(initialForm);
  const [sending, setSending] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  async function submit(event: FormEvent) {
    event.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    const email = form.email.trim();
    const message = form.message.trim();

    if (!email.includes('@') || email.length < 5) {
      setErrorMessage('Escribe un correo válido para poder responderte.');
      return;
    }

    if (message.length < 10) {
      setErrorMessage('Cuéntanos un poco más para poder revisar tu consulta.');
      return;
    }

    if (form.website) {
      setSuccessMessage('Mensaje recibido.');
      return;
    }

    setSending(true);

    const { error } = await supabase.from('contact_messages').insert({
      name: form.name.trim() || null,
      email,
      subject: form.subject,
      message,
      source: 'web',
    });

    setSending(false);

    if (error) {
      setErrorMessage('No se pudo enviar el mensaje. Inténtalo nuevamente en unos minutos.');
      return;
    }

    setForm(initialForm);
    setSuccessMessage('Mensaje enviado. Lo revisaremos lo antes posible.');
  }

  return (
    <form className="contactForm" onSubmit={submit}>
      <div className="contactFieldGrid">
        <label>
          Nombre
          <input
            value={form.name}
            maxLength={100}
            onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
            placeholder="Cómo te llamamos"
          />
        </label>

        <label>
          Correo para responderte
          <input
            type="email"
            required
            value={form.email}
            maxLength={254}
            onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
            placeholder="tu@correo.com"
          />
        </label>
      </div>

      <label>
        Motivo
        <select
          value={form.subject}
          onChange={(event) => setForm((current) => ({ ...current, subject: event.target.value }))}
        >
          <option>Consulta general</option>
          <option>Soporte de SFIQ</option>
          <option>Privacidad y datos</option>
          <option>Corrección de contenido</option>
          <option>Publicidad y colaboraciones</option>
        </select>
      </label>

      <label>
        Mensaje
        <textarea
          required
          rows={7}
          maxLength={4000}
          value={form.message}
          onChange={(event) => setForm((current) => ({ ...current, message: event.target.value }))}
          placeholder="Describe tu consulta o el problema que encontraste."
        />
      </label>

      <label className="contactHoneypot" aria-hidden="true">
        Sitio web
        <input
          tabIndex={-1}
          autoComplete="off"
          value={form.website}
          onChange={(event) => setForm((current) => ({ ...current, website: event.target.value }))}
        />
      </label>

      <p className="contactSafety">
        No envíes contraseñas, números completos de tarjetas ni credenciales bancarias.
      </p>

      {errorMessage ? <p className="formError">{errorMessage}</p> : null}
      {successMessage ? <p className="formSuccess">{successMessage}</p> : null}

      <button className="primaryButton contactSubmit" type="submit" disabled={sending}>
        {sending ? 'Enviando...' : 'Enviar mensaje'}
      </button>
    </form>
  );
}
