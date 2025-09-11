import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Comentario from './Comentarios';


export default function Portal() {
    const [publicaciones, setPublicaciones] = useState([]);
    const [registro, setRegistro] = useState('');
    const navigate = useNavigate();
    const [mostrarSidebar, setMostrarSidebar] = useState(true);
    const [errores, setErrores] = useState([]);
    const [comentarios, setComentarios] = useState([]);
    const [publicacionSeleccionada, setPublicacionSeleccionada] = useState(null);
    //Filtros
    const [filtroCurso, setFiltroCurso] = useState('');
    const [publicacionesOriginales, setPublicacionesOriginales] = useState([]);
    const [terminoProfesor, setTerminoProfesor] = useState('');

  const agregarError = (msg) => {
      const id = Date.now();
      setErrores(prev => [...prev, { id, msg }]);
      setTimeout(() => {
      setErrores(prev => prev.filter(e => e.id !== id));
      }, 3000);
  };  

  //CARGA DE PUBLICACIONES PORTAL
  useEffect(() => {
    const fetchPublicaciones = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/publicaciones/obtenerPublicaciones");

      if (!res.ok) {
        const errorData = await res.json();
        console.error("Error del backend:", errorData.error);
        return; 
      }

      const data = await res.json();
      

      if (!Array.isArray(data)) {
        console.error("La data recibida no es un array:", data);
        return;
      }

      const publicacionesFormateadas = data.map(pub => ({
        id: pub.ID_PUBLI,
        autor:`${pub.estudiante} ${pub.apellido_estudiante}`,
        curso: pub.NOMBRE_CURSO,
        nombre: `${pub.Nombre}`,
        apellido: `${pub.Apellido}`,
        contenido: pub.MENSAJE,
        fecha: pub.FECHA
      }));

      setPublicaciones(publicacionesFormateadas);
      setPublicacionesOriginales(publicacionesFormateadas);

    } catch (err) {
      console.error("Error al obtener publicaciones:", err);
    }
    };
    fetchPublicaciones(); 
  }, []);

    //FILTROS
  const aplicarFiltro = async () => {
    const cursoActivo = filtroCurso.trim() !== '';
    const profesorActivo = terminoProfesor.trim() !== '';

    if (cursoActivo && profesorActivo) {
      agregarError("Solo se puede aplicar un filtro a la vez");
      return;
    }
    if (cursoActivo) {
      try {
        const token = localStorage.getItem('token'); 
        const res = await fetch(`http://localhost:5000/api/publicaciones/cursos/${filtroCurso}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });
        const data = await res.json();
        console.log(data);
        if (!data.publicaciones || data.publicaciones.length === 0) {
          agregarError("No se encontraron publicaciones para ese curso");
          return;
        }

        const publicacionesFormateadas = data.publicaciones.map(pub => ({
          id: pub.id,
          contenido: pub.mensaje,
          fecha: pub.fecha_creacion,
          curso: pub.curso.nombre,
          nombre: pub.autor.nombres,
          apellido: pub.autor.apellidos,
          autor: `${pub.autor.nombres} ${pub.autor.apellidos}`
        }));

        setPublicaciones(publicacionesFormateadas);
      } catch (err) {
        console.error("Error al aplicar filtro por curso:", err);
        agregarError("Hubo un problema al aplicar el filtro");
      }
      return;
    }
    if (profesorActivo) {
      try {
        const res = await fetch(`http://localhost:5000/api/profesores/buscar/${terminoProfesor}`);
        const data = await res.json();

        const coincidencias = data.profesores.map(p => ({
          nombre: p.NOMBRES.toLowerCase(),
          apellido: p.APELLIDOS.toLowerCase()
        }));

        const publicacionesFiltradas = publicacionesOriginales.filter(pub =>
          coincidencias.some(prof =>
            prof.apellido === pub.apellido.toLowerCase() || prof.nombre === pub.nombre.toLowerCase()
          )
        );

        setPublicaciones(publicacionesFiltradas);
      } catch (err) {
        console.error("Error al aplicar filtro por profesor:", err);
        agregarError("Hubo un problema al aplicar el filtro");
      }
      return;
    }

    agregarError("No se ha ingresado ningún filtro");
  };

    //OPCION DE BUSQUEDA
  const buscarEstudiante = (e) => {
    e.preventDefault();
    if (registro.trim() !== '') {
      navigate(`/otroPerfil/${registro.trim()}`);
    }
  };

  //PARA RESETEAR FILTROS
  const resetFiltros = () => {
    setPublicaciones(publicacionesOriginales);
    setTerminoProfesor('');
  };


    const cerrarSesion = () => {
        localStorage.clear();
        navigate('/'); 

    };
    const irPerfil = () => {
      navigate('/perfil'); 

    };

    const cargarComentarios = async (idPublicacion) => {
      try {
        const res = await fetch(`http://localhost:5000/api/comentarios/publicacion/${idPublicacion}`);
        const data = await res.json();
        console.log('Comentarios recibidos:', data); // <-- Agrega esto
        if (res.ok && data.comentarios) {
          setComentarios(data.comentarios.lista);
          setPublicacionSeleccionada(idPublicacion);
        } else {
          setComentarios([]);
          setPublicacionSeleccionada(idPublicacion);
        }
      } catch (err) {
        setComentarios([]);
        setPublicacionSeleccionada(idPublicacion);
      }
    };

    const agregarComentario = async (comentario) => {
      const sesion = JSON.parse(localStorage.getItem('sesion'));
      const usuarioId = sesion?.usuario?.id;
      if (!publicacionSeleccionada || !usuarioId || !comentario.trim()) return;

      try {
        const res = await fetch('http://localhost:5000/api/comentarios/crearComentario', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            PUBLICACIONES_ID_PUBLI: publicacionSeleccionada,
            USUARIOS_ID_USUARIO: usuarioId,
            MENSAJE_COMENTARIO: comentario
          })
        });
        if (res.ok) {
          cargarComentarios(publicacionSeleccionada);
        }
      } catch (err) {
        agregarError("No se pudo agregar el comentario");
      }
    };

  return (
    <div className="flex min-h-screen bg-gray-100">


      {/* Sidebar */}
    
    <aside className={`${mostrarSidebar ? 'block' : 'hidden'} w-64 bg-gradient-to-bl from-gray-900 via-purple-900 to-violet-900 bg-black bg-opacity-20 bg-white/10 shadow-md p-4`}>
        <h2 className="text-xl font-bold text-violet-100 mb-4">Panel</h2>
        <form onSubmit={buscarEstudiante} className="space-y-2">
          <label className="block text-sm font-medium text-white">Buscar por registro</label>
          <input
            type="text"
            value={registro}
            onChange={(e) => setRegistro(e.target.value)}
            placeholder="Ej. 202100123"
            className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-violet-500"
          />
          <button type="submit" className="w-full bg-violet-600 text-white py-2 rounded-md hover:bg-violet-700 transition">
            Buscar 
          </button>
        </form>

      </aside>
      
      {/* Contenido principal */}
      <main className="flex-1 p-6 bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 bg-black bg-opacity-20 bg-white/10">
        <button onClick={() => setMostrarSidebar(!mostrarSidebar)}
         className="bg-violet-800 text-white px-4 py-2 rounded-md hover:bg-violet-900 transition mb-4">
            {mostrarSidebar ? 'Ocultar menú' : 'Buscar Estudiante'}
        </button>
        <button onClick={() =>navigate('/publicacion')}
          className="bg-violet-800 text-white px-4 py-2 rounded-md hover:bg-violet-900 transition mb-4 m-4">
          Crear Publicacion
        </button>
        <button
            onClick={cerrarSesion}
            className="absolute top-4 right-4 p-2 text-white hover:bg-violet-500 hover:bg-opacity-20 rounded-full transition-colors duration-200"
            title="Cerrar Sesion">
            <Home/>
        </button>
        <button
            onClick={irPerfil}
            className="absolute top-4 right-14 p-2 text-white hover:bg-violet-500 hover:bg-opacity-20 rounded-full transition-colors duration-200"
            title="Menu de Perfil">
            <User/>
        </button>
        <h1 className="text-3xl font-bold text-center mb-6 text-violet-200">Publicaciones Recientes</h1>
        
        <div className="flex items-center space-x-4 mb-6">

          {/* Filtro por profesor */}
          <input
            type="text"
            placeholder="Buscar profesor por nombre o apellido"
            value={terminoProfesor}
            onChange={(e) => setTerminoProfesor(e.target.value)}
            disabled={filtroCurso.trim() !== ''}
            className="px-3 py-2 border border-gray-300 rounded-md w-4/12 mb-0"
          />
                    {/* Filtro por Curso */}
          <input
            type="text"
            placeholder ="Buscar curso"
            value={filtroCurso}
            onChange={(e) => setFiltroCurso(e.target.value)} 
            disabled={terminoProfesor.trim() !== ''}
            className="px-3 py-2 border border-gray-300 rounded-md w-4/12 mb-0"
          />

          <button
            onClick={aplicarFiltro}
            className="px-4 py-2 bg-violet-800 text-white rounded-md hover:bg-violet-900 transition">
            Aplicar filtros
          </button>
          <button
            onClick={resetFiltros}
            className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400 transition">
            Restablecer
          </button>
        </div>

        <div className="space-y-6 ">
          {publicaciones.map(pub => (
            <div key={pub.id} className=" p-6 rounded-lg shadow-md bg-white/10 backdrop-blur-lg border border-white/20">
              <h2 className="text-xl font-semibold text-white">  {pub.curso === "null" || !pub.curso ? `Profesor: ${pub.nombre} ${pub.apellido}` : `Curso: ${pub.curso}`}</h2>
              <p className="text-sm text-gray-200">{pub.autor}</p>
              <p className="mt-2 text-gray-300">{pub.contenido}</p>
              <p className="text-xs text-gray-400 mt-1">Publicado: {new Date(pub.fecha).toLocaleDateString()}</p>
              <button
                className="mt-2 px-3 py-1 bg-violet-100 text-violet-700 rounded hover:bg-violet-200"
                onClick={() => cargarComentarios(pub.id)}
              >
                Ver comentarios
              </button>
              {/* Mostrar comentarios si esta publicación está seleccionada */}
              {publicacionSeleccionada === pub.id && (
                <Comentario comentarios={comentarios} onAgregar={agregarComentario} />
              )}
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
const Home = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
  </svg>
);

const User = () => (
  <svg className= "w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);