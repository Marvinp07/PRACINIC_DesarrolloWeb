import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function CrearPublicacion() {
  // Estados para el formulario
  const [usuario, setUsuario] = useState({
    nombre: '',
    apellido: '',
    id: ''
  });
  const navigate = useNavigate();

  const [publicacion, setPublicacion] = useState({
    mensaje: '',
    fecha: '',
    curso: '',
    profesorNombre: '',
    profesorApellido: ''
  });


  const [tipoSeleccion, setTipoSeleccion] = useState(''); // 'curso' o 'profesor'
  const [errors, setErrors] = useState({});

  const [cursos, setCursos] = useState([]);



  // Cargar datos del usuario desde localStorage al montar el componente
  useEffect(() => {
    const cargarDatosIniciales = async () => {
      const sesion = JSON.parse(localStorage.getItem('sesion'));
      const registro = sesion?.usuario?.registro_academico;
      const token = sesion?.token;

      if (!registro || !token) {
        console.error("Sesión no válida");
        return;
      }

      try {
        // Cargar usuario
        const resUsuario = await fetch(`http://localhost:5000/api/usuarios/buscar/${registro}`, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        const dataUsuario = await resUsuario.json();

        if (resUsuario.ok) {
          setUsuario({
            id: dataUsuario.usuario.REGISTRO_ACADEMICO,
            nombre: dataUsuario.usuario.NOMBRES,
            apellido: dataUsuario.usuario.APELLIDOS
          });
        } else {
          console.error("Error al obtener usuario:", dataUsuario.error);
        }

        // Cargar cursos
        const resCursos = await fetch('http://localhost:5000/api/cursos');
        const dataCursos = await resCursos.json();

        if (resCursos.ok) {
          setCursos(dataCursos.cursos);
        } else {
          console.error("Error al obtener cursos:", dataCursos.error);
        }

        // Establecer fecha actual
        const fechaActual = new Date().toLocaleString('es-ES', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit'
        });

        setPublicacion(prev => ({
          ...prev,
          fecha: fechaActual
        }));
      } catch (err) {
        console.error("Error en la carga inicial:", err);
      }
    };

    cargarDatosIniciales();
  }, []);


  const irPortal = () => {
    navigate('/portal');
  };

  const handleInputChange = (field, value) => {
    setPublicacion(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Limpiar errores cuando el usuario empiece a escribir
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const gestionSeleccion = (tipo) => {
    if (tipo === 'curso') {
      setPublicacion(prev => ({
        ...prev,
        profesorNombre: '',
        profesorApellido: '',
        curso: prev.curso // se mantiene el curso actual
      }));
      setTipoSeleccion('curso');
    }

    if (tipo === 'profesor') {
      setPublicacion(prev => ({
        ...prev,
        curso: '',
        profesorNombre: prev.profesorNombre,
        profesorApellido: prev.profesorApellido
      }));
      setTipoSeleccion('profesor');
    }

    // Limpiar errores de selección
    setErrors(prev => ({
      ...prev,
      seleccion: ''
    }));
  };


  const validarFormulario = () => {
    const nuevosErrores = {};

    if (!publicacion.mensaje.trim()) {
      nuevosErrores.mensaje = 'El mensaje es obligatorio';
    } else if (publicacion.mensaje.trim().length < 1) {
      nuevosErrores.mensaje = 'El mensaje debe tener al menos 1 caracter';
    }

    if (
      !publicacion.curso &&
      !(publicacion.profesorNombre && publicacion.profesorApellido)
    ) {
      nuevosErrores.seleccion = 'Debes seleccionar un curso o un profesor';
    }

    if (tipoSeleccion === 'profesor') {
      if (!profesorExiste) {
        nuevosErrores.seleccion = 'Debes ingresar un profesor válido (nombre y apellido exactos)';
      }
    }

    setErrors(nuevosErrores);
    return Object.keys(nuevosErrores).length === 0;
  };

  const realizarPublicacion = async () => {
    if (validarFormulario()) {
      const sesion = JSON.parse(localStorage.getItem('sesion'));
      const token = sesion?.token;

      // Construir el objeto para enviar al backend
      const body = {
        MENSAJE: publicacion.mensaje.trim(),
        NOMBRE_CURSO: publicacion.curso || undefined,
        NOMBRES: publicacion.profesorNombre || undefined,
        APELLIDOS: publicacion.profesorApellido || undefined
      };

      try {
        const res = await fetch('http://localhost:5000/api/publicaciones', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify(body)
        });

        const data = await res.json();

        if (res.ok) {
          alert('¡Publicación creada exitosamente!');
          limpiarFormulario();
        } else {
          alert(data.error || 'Error al crear la publicación');
        }
      } catch (err) {
        alert('Error de red al crear la publicación');
      }
    }
  };


      //Limpieza
  const limpiarFormulario = () => {
    setPublicacion({
      mensaje: '',
      fecha: new Date().toLocaleString('es-ES', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      }),
      curso: '',
      profesor: ''
    });
    setTipoSeleccion('');
    setErrors({});
  };

  const [profesorExiste, setProfesorExiste] = useState(null); // null, true, false
  const [buscandoProfesor, setBuscandoProfesor] = useState(false);

  // Función para buscar profesor exacto
  const buscarProfesorExacto = async () => {
    const nombre = publicacion.profesorNombre.trim().toUpperCase();
    const apellido = publicacion.profesorApellido.trim().toUpperCase();
    if (nombre.length < 2 || apellido.length < 2) {
      setProfesorExiste(null);
      return;
    }
    setBuscandoProfesor(true);
    try {
      const res = await fetch(
        `http://localhost:5000/api/profesores/buscar/${nombre}/${apellido}`
      );
      const data = await res.json();
      setProfesorExiste(data.profesores && data.profesores.length > 0);
    } catch (err) {
      setProfesorExiste(null);
    }
    setBuscandoProfesor(false);
  };

  useEffect(() => {
    if (tipoSeleccion === 'profesor' && publicacion.profesorNombre && publicacion.profesorApellido) {
      buscarProfesorExacto();
    } else {
      setProfesorExiste(null);
    }
    // eslint-disable-next-line
  }, [publicacion.profesorNombre, publicacion.profesorApellido, tipoSeleccion]);

  return (
    <div className=" mx-auto p-6 bg-gradient-to-br from-emerald-950 via-green-950 to-slate-950 min-h-screen">
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-green-800 px-6 py-8 relative">
          <button
            onClick={irPortal}
            className="absolute top-4 right-4 p-2 text-white hover:bg-white hover:bg-opacity-20 rounded-full transition-colors duration-200"
            title="Volver al menú principal"
          >
            <Home />
          </button>
          
          <div className="flex items-center space-x-4">
            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center">
              <Mensaje className="w-10 h-10 text-green-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">
                Crear Publicación
              </h1>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6">
          {/* Columna izquierda - Información del Usuario */}
          <div>
            <h2 className="text-xl font-semibold text-gray-800 mb-6">
              Información del Usuario
            </h2>
            
            <div className="space-y-4">
              {/* Usuario ID */}
              <div className="bg-gray-50 rounded-lg border border-gray-200 p-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-50 rounded-full">
                    <User className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 block">
                      ID de Usuario
                    </label>
                    <div className="text-gray-900 font-medium">{usuario.id}</div>
                  </div>
                </div>
              </div>

              {/* Nombre completo */}
              <div className="bg-gray-50 rounded-lg border border-gray-200 p-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-50 rounded-full">
                    <Verificado />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 block">
                      Nombre Completo
                    </label>
                    <div className="text-gray-900 font-medium">
                      {usuario.nombre} {usuario.apellido}
                    </div>
                  </div>
                </div>
              </div>

              {/* Fecha */}
              <div className="bg-gray-50 rounded-lg border border-gray-200 p-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-50 rounded-full">
                    <Calendario />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 block">
                      Fecha de Creación
                    </label>
                    <div className="text-gray-900 font-medium">{publicacion.fecha}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Columna derecha - Contenido de la Publicación */}
          <div>
            <h2 className="text-xl font-semibold text-gray-800 mb-6">
              Contenido de la Publicación
            </h2>
            
            <div className="space-y-4">
              {/* Mensaje */}
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <div className="flex items-start space-x-3">
                  <div className="p-2 bg-green-50 rounded-full mt-1">
                    <Mensaje />
                  </div>
                  <div className="flex-1">
                    <label className="text-sm font-medium text-gray-700 block mb-2">
                      Mensaje *
                    </label>
                    <textarea
                      value={publicacion.mensaje}
                      onChange={(e) => handleInputChange('mensaje', e.target.value)}
                      className={`w-full px-3 py-3 border rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                        errors.mensaje ? 'border-red-500 bg-red-50' : 'border-gray-300'
                      }`}
                      placeholder="Escribe tu mensaje sobre el curso o profesor..."
                      rows="4"
                      maxLength="500"
                    />
                    <div className="flex justify-between items-center mt-1">
                      <span className={`text-xs ${errors.mensaje ? 'text-red-500' : 'text-gray-500'}`}>
                        {errors.mensaje || `${publicacion.mensaje.length}/500 caracteres`}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Selección de Curso */}
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <div className="flex items-center space-x-3 mb-3">
                  <div className="p-2 bg-blue-50 rounded-full">
                    <Libro />
                  </div>
                  <h3 className="font-medium text-gray-800">Curso</h3>
                </div>
                
                <select
                  value={publicacion.curso}
                  onChange={(e) => {
                    gestionSeleccion('curso');
                    handleInputChange('curso', e.target.value);
                  }}
                  className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">Selecciona un curso</option>
                  {cursos.map(curso => (
                    <option key={curso.NOMBRE_CURSO} value={curso.NOMBRE_CURSO}>
                      {curso.NOMBRE_CURSO}
                    </option>
                  ))}
                </select>
                {tipoSeleccion === 'profesor' && (
                  <p className="text-xs text-gray-500 mt-1 flex items-center">
                    <AlertaCircular className="mr-1" />
                    Deshabilitado porque seleccionaste un profesor
                  </p>
                )}
              </div>

                
                {/* Selección de Profesor */}
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <div className="flex items-center space-x-3 mb-3">
                  <div className="p-2 bg-purple-50 rounded-full">
                    <Verificado />
                  </div>
                  <h3 className="font-medium text-gray-800">Profesor</h3>
                </div>

                <div className="space-y-3">
                  <input
                    type="text"
                    placeholder="Apellido del profesor"
                    value={publicacion.profesorApellido}
                    onChange={(e) => {
                      gestionSeleccion('profesor');
                      handleInputChange('profesorApellido', e.target.value);
                    }}
                    disabled={tipoSeleccion === 'curso'}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                      tipoSeleccion === 'curso' ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : 'border-gray-300'
                    }`}
                  />

                  <input
                    type="text"
                    placeholder="Nombre del profesor"
                    value={publicacion.profesorNombre}
                    onChange={(e) => {
                      gestionSeleccion('profesor', 'manual');
                      handleInputChange('profesorNombre', e.target.value);
                    }}
                    disabled={tipoSeleccion === 'curso'}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                      tipoSeleccion === 'curso' ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : 'border-gray-300'
                    }`}
                  />
                </div>

                {tipoSeleccion === 'curso' && (
                  <p className="text-xs text-gray-500 mt-1 flex items-center">
                    <AlertaCircular className="mr-1" />
                    Deshabilitado porque seleccionaste un curso
                  </p>
                )}
              </div>

              {/* Error de selección */}
              {errors.seleccion && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-red-600 text-sm flex items-center">
                    <AlertaCircular className="mr-2" />
                    {errors.seleccion}
                  </p>
                </div>
              )}

              {tipoSeleccion === 'profesor' && (
                <div className="mt-2">
                  {buscandoProfesor && (
                    <span className="text-xs text-gray-500 flex items-center">
                      <AlertaCircular className="mr-1" /> Buscando profesor...
                    </span>
                  )}
                  {profesorExiste === false && (
                    <span className="text-xs text-red-500 flex items-center">
                      <AlertaCircular className="mr-1" /> No se encontró ningún profesor con ese nombre y apellido.
                    </span>
                  )}
                  {profesorExiste === true && (
                    <span className="text-xs text-green-600 flex items-center">
                      <Verificado className="mr-1" /> Profesor encontrado.
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Botones de acción */}
        <div className="px-6 pb-6 flex space-x-4">
          <button
            onClick={realizarPublicacion}
            className="flex-1 bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2"
          >
            <Enviar />
            <span>Publicar</span>
          </button>
          
          <button
            onClick={limpiarFormulario}
            className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white font-medium rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2"
          >
            <X />
            <span>Limpiar</span>
          </button>
        </div>
      </div>
    </div>
  );
}



// Iconos SVG
const Home = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
  </svg>
);

const User = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

const Mensaje = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
  </svg>
);

const Libro = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
  </svg>
);

const Verificado = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
  </svg>
);

const Calendario = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

const Enviar = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
  </svg>
);

const X = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const AlertaCircular = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);
