import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Comentario from './Comentarios';


export default function Portal() {
    const [publicaciones, setPublicaciones] = useState([]);
    const [registro, setRegistro] = useState('');
    const navigate = useNavigate();
    const [mostrarSidebar, setMostrarSidebar] = useState(true);
    const [errores, setErrores] = useState([]);
    //Filtros
    const [filtroCurso, setFiltroCurso] = useState('');
    const [publicacionesOriginales, setPublicacionesOriginales] = useState([]);
    const [terminoProfesor, setTerminoProfesor] = useState('');
    const [profesorExiste, setProfesorExiste] = useState(null); // null, true, false
    const [buscandoProfesor, setBuscandoProfesor] = useState(false);




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
        // Si el backend devolvió error (404, 500, etc)
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
        autor: pub.estudiante,
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
        const token = localStorage.getItem('token'); // o el nombre que usaste para guardarlo
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



  /*
  const agregarComentario = (idPublicacion, idUsuario, nuevoComentario) => {
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

      //Busqueda del profresor exacto
    const buscarProfesorExacto = async () => {
      const nombre = publicacion.profesorNombre.trim();
      const apellido = publicacion.profesorApellido.trim();
      if (nombre.length < 2 || apellido.length < 2) {
        setProfesorExiste(null);
        return;
      }
      setBuscandoProfesor(true);
      try {
        const termino = `${nombre} ${apellido}`;
        const res = await fetch(`http://localhost:5000/api/profesores/buscar/${encodeURIComponent(termino)}`);
        const data = await res.json();
        // Verifica coincidencia exacta de nombre y apellido
        const existe = data.profesores.some(
          p =>
            p.NOMBRES.trim().toLowerCase() === nombre.toLowerCase() &&
            p.APELLIDOS.trim().toLowerCase() === apellido.toLowerCase()
        );
        setProfesorExiste(existe);
      } catch (err) {
        setProfesorExiste(null);
      }
      setBuscandoProfesor(false);
    };


    //OPCION DE BUSQUEDA
  const buscarEstudiante = (e) => {
    e.preventDefault();
    if (registro.trim() !== '') {
      navigate(`/estudiante/${registro}`);
    }
  };

  //PARA RESETEAR FILTROS
  const resetFiltros = () => {
    setPublicaciones(publicacionesOriginales);
    setTerminoProfesor('');
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
          <button type="submit" className="w-full bg-indigo-600 text-white py-2 rounded-md hover:bg-indigo-700 transition">
            Buscar
          </button>
        </form>

        <nav className="mt-6 space-y-2 text-sm text-gray-700">
          <a className="block hover:text-indigo-600 cursor-pointer ml-1" onClick={() =>navigate('/perfil')}>Perfil</a>
        </nav>
      </aside>
      
      {/* Contenido principal */}
      <main className="flex-1 p-6">
        <button onClick={() => setMostrarSidebar(!mostrarSidebar)}
         className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition mb-4">
            {mostrarSidebar ? 'Ocultar menú' : 'Buscar Estudiante'}
        </button>
        <button onClick={() =>navigate('/publicacion')}
          className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition mb-4 m-4">
          Crear Publicacion
        </button>
        <h1 className="text-3xl font-bold text-center mb-6 text-indigo-700">Publicaciones Recientes</h1>
        
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
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition">
            Aplicar filtros
          </button>
          <button
            onClick={resetFiltros}
            className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400 transition">
            Restablecer
          </button>
        </div>

        <div className="space-y-6">
          {publicaciones.map(pub => (
            <div key={pub.id} className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold text-indigo-600">  {pub.curso === "null" || !pub.curso ? `Profesor: ${pub.nombre} ${pub.apellido}` : `Curso: ${pub.curso}`}</h2>
              <p className="text-sm text-gray-500">{pub.autor}</p>
              <p className="mt-2 text-gray-700">{pub.contenido}</p>
              <p className="text-xs text-gray-400 mt-1">Publicado: {new Date(pub.fecha).toLocaleDateString()}</p>
          {/*
            <Comentario
                comentarios={pub.comentarios}
                onAgregar={(comentario) => agregarComentario(pub.id, comentario)}
              
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
