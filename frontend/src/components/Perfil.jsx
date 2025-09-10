import React, {  useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';


export default function ProfilePanel() {
    const navigate = useNavigate();
    const sesionRaw = localStorage.getItem('sesion');
    

    const [profile, setProfile] = useState({
        id: '',
        nombre: '',
        apellido: '',
        correo: '',
        contraseña: '••••••••'
    });



    useEffect(() => {
        const actualizarInfo = async () => {
            const sesion = JSON.parse(localStorage.getItem('sesion'));
            const registro = sesion?.usuario?.registro_academico;
            const token = sesion?.token;

            const res = await fetch(`http://localhost:5000/api/usuarios/buscar/${registro}`, {
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${token}`
            }
            });

            const data = await res.json();

            if (res.ok) {
            setProfile({
                id: data.usuario.REGISTRO_ACADEMICO,
                nombre: data.usuario.NOMBRES,
                apellido: data.usuario.APELLIDOS,
                correo: data.usuario.CORREO,
                contraseña: '••••••••'
            });
            } else {
                console.error('Error:', data.error);
            }
        };
        actualizarInfo();
    }, []);


    //Lista para cursos Aprobados
    const [cursosAprobados, setCursosAprobados] = useState([]);

    const [creditosTotales, setCreditosTotales] = useState(0);
    


    useEffect(() => {
    const cargarCursosAprobados = async () => {
        const sesion = JSON.parse(localStorage.getItem('sesion'));
        const idUsuario = sesion?.usuario?.id;

        const res = await fetch(`http://localhost:5000/api/cursos-aprobados/aprobados/${idUsuario}`);
        const data = await res.json();

        if (res.ok && data.data) {
        const cursos = Array.isArray(data.data) ? data.data : [data.data];

        const cursosTransformados = cursos.map(curso => ({
            id: curso.CURSOS_ID_CURSO,
            nombre: curso.NOMBRE_CURSO,
            creditos: curso.CREDITOS
        }));

        setCursosAprobados(cursosTransformados);

        const total = cursosTransformados.reduce((acc, c) => acc + c.creditos, 0);
        setCreditosTotales(total);
        }
    };

    cargarCursosAprobados();
    }, []);



  // Cursos disponibles y aprobados
    const [cursosDisponibles] = useState([
        { id: 1, nombre: 'Matemáticas I', creditos: 4 },
        { id: 2, nombre: 'Física I', creditos: 4 },
        { id: 3, nombre: 'Programación I', creditos: 3 },
        { id: 4, nombre: 'Cálculo I', creditos: 5 },
        { id: 5, nombre: 'Química General', creditos: 4 },
        { id: 6, nombre: 'Inglés I', creditos: 2 },
        { id: 7, nombre: 'Estadística', creditos: 3 },
        { id: 8, nombre: 'Base de Datos', creditos: 4 },
        { id: 9, nombre: 'Algoritmos', creditos: 4 },
        { id: 10, nombre: 'Redes', creditos: 3 }
    ]);


    const [cursoSeleccionado, setCursoSeleccionado] = useState('');

    const [isEditing, setIsEditing] = useState({
        nombre: false,
        apellido: false,
        correo: false,
        contraseña: false
    });

    const [tempValues, setTempValues] = useState({});

    // Cursos no aprobados disponibles para agregar
    const cursosDisponiblesParaAgregar = cursosDisponibles.filter(
        curso => !cursosAprobados.some(aprobado => aprobado.id === curso.id)
    );

    const handleGoHome = () => {
        // Aquí puedes agregar tu lógica de navegación:
        navigate('/portal'); 

    };

    
    //Agregar cursos aprobados al usuario
    const agregarCurso = () => {
        if (cursoSeleccionado) {
        const curso = cursosDisponibles.find(c => c.id === parseInt(cursoSeleccionado));
        if (curso && !cursosAprobados.some(c => c.id === curso.id)) {
            setCursosAprobados([...cursosAprobados, curso]);
            setCursoSeleccionado('');
        }
        }
    };

    const eliminarCurso = (cursoId) => {
        setCursosAprobados(cursosAprobados.filter(curso => curso.id !== cursoId));
    };

    const modoEdicion = (field) => {
        setIsEditing(prev => ({ ...prev, [field]: true }));
        setTempValues(prev => ({ ...prev, [field]: profile[field] }));
    };

    const guardarValorEditado = (field) => {
        setProfile(prev => ({ ...prev, [field]: tempValues[field] }));
        setIsEditing(prev => ({ ...prev, [field]: false }));
        setTempValues(prev => {
        const newTemp = { ...prev };
        delete newTemp[field];
        return newTemp;
        });
    };

    const cancelarEdicion = (field) => {
        setIsEditing(prev => ({ ...prev, [field]: false }));
        setTempValues(prev => {
        const newTemp = { ...prev };
        delete newTemp[field];
        return newTemp;
        });
    };

    const valorTemporal = (field, value) => {
        setTempValues(prev => ({ ...prev, [field]: value }));
    };

    const CampoPerfil = ({ label, field, icon: Icon, type = 'text', disabled = false }) => {
        const isCurrentlyEditing = isEditing[field];
        const displayValue = field === 'contraseña' ? '••••••••' : profile[field];

    return (
      <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow duration-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3 flex-1">
            <div className="p-2 bg-blue-50 rounded-full">
              <Icon className="w-5 h-5 text-blue-600" />
            </div>
            <div className="flex-1">
              <label className="text-sm font-medium text-gray-700 block mb-1">
                {label}
              </label>
              {isCurrentlyEditing ? (
                <input
                  type={type}
                  value={tempValues[field] || ''}
                  onChange={(e) => valorTemporal(field, e.target.value)}
                  className="w-full px-3 py-2 border border-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder={`Ingresa tu ${label.toLowerCase()}`}
                  autoFocus
                />
              ) : (
                <div className="text-gray-900 font-medium">
                  {displayValue}
                </div>
              )}
            </div>
          </div>
          
          <div className="flex items-center space-x-2 ml-4">
            {isCurrentlyEditing ? (
              <>
                <button
                  onClick={() => guardarValorEditado(field)}
                  className="p-2 text-green-600 hover:bg-green-50 rounded-full transition-colors duration-200"
                  title="Guardar"
                >
                  <Guardar className="w-4 h-4" />
                </button>
                <button
                  onClick={() => cancelarEdicion(field)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-full transition-colors duration-200"
                  title="Cancelar"
                >
                  <X className="w-4 h-4" />
                </button>
              </>
            ) : (
              !disabled && (
                <button
                  onClick={() => modoEdicion(field)}
                  className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors duration-200"
                  title="Editar"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
              )
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-gray-50 min-h-screen">
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        {/* Header con botón de home */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 px-6 py-8 relative">
          <button
            onClick={handleGoHome}
            className="absolute top-4 right-4 p-2 text-white hover:bg-white hover:bg-opacity-20 rounded-full transition-colors duration-200"
            title="Volver al menú principal"
          >
            <Home />
          </button>
          
          <div className="flex items-center space-x-4">
            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center">
              <User className="w-10 h-10 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">
                {profile.nombre} {profile.apellido}
              </h1>
              <p className="text-blue-100">Configuración de Perfil</p>
              <div className="flex items-center space-x-2 mt-2">
                <Award className="w-4 h-4 text-blue-200" />
                <span className="text-blue-100 text-sm font-medium">
                  {creditosTotales} créditos aprobados
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6">
          {/* Columna izquierda - Información Personal */}
          <div>
            <h2 className="text-xl font-semibold text-gray-800 mb-6">
              Información Personal
            </h2>
            
            <div className="space-y-4">
              <CampoPerfil
                label="Registro Academico"
                field="id"
                icon={Hash}
                disabled={true}
              />
              
              <CampoPerfil
                label="Nombre"
                field="nombre"
                icon={User}
              />
              
              <CampoPerfil
                label="Apellido"
                field="apellido"
                icon={User}
              />
              
              <CampoPerfil
                label="Correo Electrónico"
                field="correo"
                icon={Mail}
                type="email"
              />
              
              <CampoPerfil
                label="Contraseña"
                field="contraseña"
                icon={Pass}
                type="password"
              />
            </div>
          </div>

          {/* Columna derecha - Gestión de Cursos */}
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-800">
                Gestión Académica
              </h2>
              <div className="bg-green-100 px-3 py-1 rounded-full">
                <span className="text-green-800 text-sm font-medium">
                  {creditosTotales} créditos
                </span>
              </div>
            </div>

            {/* Agregar curso */}
            <div className="bg-white rounded-lg border border-gray-200 p-4 mb-4">
              <div className="flex items-center space-x-3 mb-3">
                <div className="p-2 bg-green-50 rounded-full">
                  <Plus className="w-4 h-4 text-green-600" />
                </div>
                <h3 className="font-medium text-gray-800">Agregar Curso</h3>
              </div>
              
              <div className="flex space-x-2">
                <select
                  value={cursoSeleccionado}
                  onChange={(e) => setCursoSeleccionado(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                  <option value="">Selecciona un curso...</option>
                  {cursosDisponiblesParaAgregar.map(curso => (
                    <option key={curso.id} value={curso.id}>
                      {curso.nombre} ({curso.creditos} créditos)
                    </option>
                  ))}
                </select>
                <button
                  onClick={agregarCurso}
                  disabled={!cursoSeleccionado}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors duration-200">
                  Agregar
                </button>
                </div>
            </div>

            {/* Lista de cursos aprobados */}
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-center space-x-3 mb-4">
                <div className="p-2 bg-blue-50 rounded-full">
                  <BookOpen />
                </div>
                <h3 className="font-medium text-gray-800">Cursos Aprobados</h3>
              </div>

              <div className="space-y-2 max-h-64 overflow-y-auto">
                {cursosAprobados.length === 0 ? (
                  <p className="text-gray-500 text-sm italic py-4 text-center">
                    No hay cursos aprobados aún
                  </p>
                ) : (
                  cursosAprobados.map(curso => (
                    <div key={curso.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200">
                      <div>
                        <span className="font-medium text-gray-800">{curso.nombre}</span>
                        <span className="ml-2 text-sm text-gray-600">
                          ({curso.creditos} créditos)
                        </span>
                      </div>
                      <button
                        onClick={() => eliminarCurso(curso.id)}
                        className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors duration-200"
                        title="Eliminar curso"
                      >
                        <Trash />
                      </button>
                    </div>
                  ))
                )}
                </div>
                </div>
            </div>
        </div>

        {/* Guardar cambios*/}
        <div className="px-6 pb-6">
          <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2">
            <Guardar />
            <span>Guardar Todos los Cambios</span>
          </button>
        </div>
      </div>
    </div>
  );
}


// ICONOS SVG
const Edit2 = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
  </svg>
);

const Guardar = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
);

const X = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const User = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

const Mail = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  </svg>
);

const Pass = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
  </svg>
);

const Hash = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
  </svg>
);

const Home = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
  </svg>
);

const BookOpen = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
  </svg>
);

const Award = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
  </svg>
);

const Plus = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
  </svg>
);

const Trash = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);