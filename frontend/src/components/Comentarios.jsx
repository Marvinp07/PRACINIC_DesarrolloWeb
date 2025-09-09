import React, { useState } from 'react';

export default function Comentario({ comentarios, onAgregar }) {
  const [nuevoComentario, setNuevoComentario] = useState('');

  const usuario = JSON.parse(localStorage.getItem('usuario'));

  const enviarComentario = (e) => {
    e.preventDefault();
    if (nuevoComentario.trim() === '') return;

    const comentario = {
      autor: usuario?.nombre || "Anónimo",
      texto: nuevoComentario
    };

    onAgregar(comentario);
    setNuevoComentario('');
  };

  return (
    <div className="mt-6">
      <h3 className="text-sm font-semibold text-gray-700 mb-2">Comentarios</h3>
      <ul className="text-sm text-gray-600 space-y-2 mb-4">
        {comentarios.map((c, i) => (
          <li key={i} className="bg-gray-100 p-2 rounded-md">
            <span className="font-semibold text-indigo-600">{c.autor}:</span> {c.texto}
          </li>
        ))}
      </ul>

      <form onSubmit={enviarComentario} className="flex gap-2">
        <input
          type="text"
          value={nuevoComentario}
          onChange={(e) => setNuevoComentario(e.target.value)}
          placeholder="Escribe tu comentario..."
          className="flex-grow p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <button
          type="submit"
          className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition"
        >
          Comentar
        </button>
      </form>
    </div>
  );
}
