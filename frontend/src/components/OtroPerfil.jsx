import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

export default function OtroPerfil() {
  const navigate = useNavigate();
  const { registro } = useParams();

  const [profile, setProfile] = useState({
    id: '',
    nombre: '',
    apellido: '',
    correo: '',
    contraseña: ''
  });

  const [idUsuario, setIdUsuario] = useState(null);
  const [cursosAprobados, setCursosAprobados] = useState([]);
  const [creditosTotales, setCreditosTotales] = useState(0);

  useEffect(() => {
    const actualizarInfo = async () => {
      const sesion = JSON.parse(localStorage.getItem('sesion'));
      const token = sesion?.token;

      const res = await fetch(`http://localhost:5000/api/usuarios/buscar/${registro}`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` }
      });

      const data = await res.json();

      if (res.ok && data.usuario) {
        setProfile({
          id: data.usuario.REGISTRO_ACADEMICO,
          nombre: data.usuario.NOMBRES,
          apellido: data.usuario.APELLIDOS,
          correo: data.usuario.CORREO,
          contraseña: ''
        });
        setIdUsuario(data.usuario.ID_USUARIO);
      } else {
        setProfile({
          id: '',
          nombre: '',
          apellido: '',
          correo: '',
          contraseña: ''
        });
        setIdUsuario(null);
      }
    };
    actualizarInfo();
  }, [registro]);

  useEffect(() => {
    if (!idUsuario) return;
    const cargarCursosAprobados = async () => {
      try {
        const res = await fetch(`http://localhost:5000/api/cursos-aprobados/aprobados/${idUsuario}`);
        const data = await res.json();
        if (res.ok && data.curso) {
          setCursosAprobados(
            data.curso.map(curso => ({
              id: curso.ID_CURSO,
              nombre: curso.NOMBRE_CURSO,
              creditos: curso.CREDITOS
            }))
          );
        } else {
          setCursosAprobados([]);
        }
      } catch (err) {
        setCursosAprobados([]);
      }
    };
    cargarCursosAprobados();
  }, [idUsuario]);

  useEffect(() => {
    const idsCursos = cursosAprobados.map(curso => curso.id);
    const calcularCreditosTotales = async (idsCursos) => {
      if (!idsCursos || idsCursos.length === 0) {
        setCreditosTotales(0);
        return;
      }
      try {
        const res = await fetch('http://localhost:5000/api/cursos-aprobados/suma-creditos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ CURSOS_ID_CURSO: idsCursos })
        });
        const data = await res.json();
        if (res.ok && data.success) {
          setCreditosTotales(data.total_creditos);
        } else {
          setCreditosTotales(0);
        }
      } catch (err) {
        setCreditosTotales(0);
      }
    };
    calcularCreditosTotales(idsCursos);
  }, [cursosAprobados]);

  const handleGoHome = () => {
    navigate('/portal');
  };

  const CampoPerfil = ({ label, field, icon: Icon, type = 'text' }) => {
    const displayValue = profile[field];
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow duration-200">
        <div className="flex items-center space-x-3 flex-1">
          <div className="p-2 bg-blue-50 rounded-full">
            <Icon className="w-5 h-5 text-blue-600" />
          </div>
          <div className="flex-1">
            <label className="text-sm font-medium text-gray-700 block mb-1">
              {label}
            </label>
            <div className="text-gray-900 font-medium">
              {displayValue}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className=" mx-auto p-6 bg-gray-50 min-h-screen bg-gradient-to-bl from-gray-900 via-slate-800 to-blue-900">
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        {/* Header con botón de home */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 px-6 py-8 relative">
          <button
            onClick={handleGoHome}
            className="absolute top-4 right-4 p-2 text-white hover:bg-white hover:bg-opacity-20 rounded-full transition-colors duration-200"
            title="Volver al menú principal">
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
              <p className="text-blue-100">Perfil de Usuario</p>
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
              <CampoPerfil label="Registro Académico" field="id" icon={Hash} />
              <CampoPerfil label="Nombre" field="nombre" icon={User} />
              <CampoPerfil label="Apellido" field="apellido" icon={User} />
              <CampoPerfil label="Correo Electrónico" field="correo" icon={Mail} type="email" />
            </div>
          </div>

          {/* Columna derecha - Cursos aprobados */}
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-800">
                Cursos Aprobados
              </h2>
              <div className="bg-green-100 px-3 py-1 rounded-full">
                <span className="text-green-800 text-sm font-medium">
                  {creditosTotales} créditos
                </span>
              </div>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-4">
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
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ICONOS SVG
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