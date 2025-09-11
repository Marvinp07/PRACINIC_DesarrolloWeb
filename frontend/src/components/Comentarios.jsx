import React, { useState } from 'react';

export default function Comentario({ comentarios, onAgregar }) {
  const [nuevoComentario, setNuevoComentario] = useState('');
  const sesion = JSON.parse(localStorage.getItem('sesion'));
  const usuario = sesion?.usuario;

  const enviarComentario = (e) => {
    e.preventDefault();
    if (nuevoComentario.trim() === '') return;
    onAgregar(nuevoComentario.trim());
    setNuevoComentario('');
  };

  return (
    <div className="mt-6">
      <h3 className="text-sm font-semibold text-gray-100 mb-2  ">Comentarios</h3>
      <ul className="text-sm text-gray-800 space-y-2 mb-4">
        {comentarios.map((c, i) => (
          <li key={i} className="bg-gray-100 p-2 rounded-md">
            <span className="font-semibold text-violet-600">
              {c.autor.nombres} {c.autor.apellidos}:
            </span> {c.mensaje}
          </li>
        ))}
      </ul>

      <form onSubmit={enviarComentario} className="flex gap-2">
        <input
          type="text"
          value={nuevoComentario}
          onChange={(e) => setNuevoComentario(e.target.value)}
          placeholder="Escribe tu comentario..."
          className="flex-grow p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-violet-500"
        />
        <button
          type="submit"
          className="bg-violet-600 text-white px-4 py-2 rounded-md hover:bg-violet-900 transition"
        >
          Comentar
        </button>
      </form>
    </div>
  );
}
