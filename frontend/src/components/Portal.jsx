import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Comentario from './Comentarios';


export default function Portal() {
    const [publicaciones, setPublicaciones] = useState([]);
    const [registro, setRegistro] = useState('');
    const navigate = useNavigate();
    const [mostrarSidebar, setMostrarSidebar] = useState(true);
    const [errores, setErrores] = useState([]);


  const agregarError = (msg) => {
      const id = Date.now();
      setErrores(prev => [...prev, { id, msg }]);
      setTimeout(() => {
      setErrores(prev => prev.filter(e => e.id !== id));
      }, 3000);
  };  




  useEffect(() => {
    const fetchPublicaciones = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/publicaciones/obtenerPublicaciones");

      if (!res.ok) {
        // Si el backend devolvió error (404, 500, etc)
        const errorData = await res.json();
        console.error("Error del backend:", errorData.error);
        return; // salir de la función para no intentar mapear
      }

      const data = await res.json();
      
      // ⚡️ Solo mapear si es un array
      if (!Array.isArray(data)) {
        console.error("La data recibida no es un array:", data);
        return;
      }

      const publicacionesFormateadas = data.map(pub => ({
        id: pub.ID_PUBLI,
        autor: pub.estudiante,
        curso: pub.NOMBRE_CURSO,
        catedratico: `${pub.Nombre} ${pub.Apellido}`,
        contenido: pub.MENSAJE,
        fecha: pub.FECHA
      }));

      setPublicaciones(publicacionesFormateadas);

    } catch (err) {
      console.error("Error al obtener publicaciones:", err);
    }
    };
    fetchPublicaciones(); 
  }, []);
  /*
  const agregarComentario = (idPublicacion, nuevoComentario) => {
    const actualizadas = publicaciones.map(pub => {
      if (pub.id === idPublicacion) {
        return {
          ...pub
         // comentarios: [...pub.comentarios, nuevoComentario]
        };
      }
      return pub;
    });
    setPublicaciones(actualizadas);
  };*/

  const buscarEstudiante = (e) => {
    e.preventDefault();
    if (registro.trim() !== '') {
      navigate(`/estudiante/${registro}`);
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-100">


      {/* Sidebar */}

    <aside className={`${mostrarSidebar ? 'block' : 'hidden'} w-64 bg-white shadow-md p-4`}>
        <h2 className="text-xl font-bold text-indigo-600 mb-4">Panel</h2>
        <form onSubmit={buscarEstudiante} className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">Buscar por registro</label>
          <input
            type="text"
            value={registro}
            onChange={(e) => setRegistro(e.target.value)}
            placeholder="Ej. 202100123"
            className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <button
            type="submit"
            className="w-full bg-indigo-600 text-white py-2 rounded-md hover:bg-indigo-700 transition"
          >
            Buscar
          </button>
        </form>

        <nav className="mt-6 space-y-2 text-sm text-gray-700">
          <a href="/portal" className="block hover:text-indigo-600">Inicio</a>
          <a href="/reportes" className="block hover:text-indigo-600">Reportes</a>
          <a href="/configuracion" className="block hover:text-indigo-600">Configuración</a>
        </nav>
      </aside>

      {/* Contenido principal */}
      <main className="flex-1 p-6">
        <button
            onClick={() => setMostrarSidebar(!mostrarSidebar)}
            className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition mb-4">
            {mostrarSidebar ? 'Ocultar menú' : 'Buscar Estudiante'}
        </button>
        <h1 className="text-3xl font-bold text-center mb-6 text-indigo-700">Publicaciones Recientes</h1>
        <div className="space-y-6">
          {publicaciones.map(pub => (
            <div key={pub.id} className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold text-indigo-600">  {pub.curso === "null" || !pub.curso ? `Profesor: ${pub.catedratico}` : `Curso: ${pub.curso}`}</h2>
              <p className="text-sm text-gray-500">{pub.autor}</p>
              <p className="mt-2 text-gray-700">{pub.contenido}</p>
              <p className="text-xs text-gray-400 mt-1">Publicado: {new Date(pub.fecha).toLocaleDateString()}</p>
{/*
            <Comentario
                //comentarios={pub.comentarios}
                //onAgregar={(comentario) => agregarComentario(pub.id, comentario)}
              
              /> */}
            </div> 
          ))}
        </div>
      </main>
      <div className="error-container">
          {errores.map(e => (
              <div key={e.id} className="error-box">{e.msg}</div>
          ))}
      </div>
    </div>
  );
}
