import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const [registro_academico, setUsuario] = useState('');
  const [contrasena, setClave] = useState('');
  const [errores, setErrores] = useState([]);
  const navigate = useNavigate();

  const agregarError = (msg) => {
    const id = Date.now();
    setErrores(prev => [...prev, { id, msg }]);
    setTimeout(() => {
      setErrores(prev => prev.filter(e => e.id !== id));
    }, 3000);
  };


  const verificarLogin = async(e) => {
    e.preventDefault();
    const res = await fetch('http://localhost:5000/api/usuarios/login', {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({registro_academico,contrasena})
    });

        
    const data = await res.json();
    if(res.ok){
      localStorage.setItem('sesion', JSON.stringify(data)); //Para guardar los datos y poder manejarlos despues
      navigate('/portal');
    }else{
      agregarError(data.error || "Ocurrió un error");
      navigate('/');
    }

  };
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-l from-red-500 to-black">
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
        <h2 className="text-2xl font-bold text-center text-red-800 mb-6">
          Inicio de Sesión - Ingeniería USAC
        </h2>
        <form onSubmit={verificarLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Registro Academico</label>
            <input
              type="text"
              value={registro_academico}
              onChange={(e) => setUsuario(e.target.value)}
              placeholder="Registro Academico"
              required
              className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Contraseña</label>
            <input
              type="password"
              value={contrasena}
              onChange={(e) => setClave(e.target.value)}
              placeholder="Contraseña"
              required
              className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>
          <button
            type="submit"
            className="w-full bg-red-600 text-white py-2 rounded-md hover:bg-red-900 transition duration-200">
            Iniciar Sesión
          </button>
          <div className="flex items-center text-sm">
            <p>Crea una cuenta    </p>
            <p className="underline cursor-pointer ml-1" onClick={() =>navigate('/registrar')}>  Registrarse </p>
          </div>
          <div className="flex items-center text-sm">
            <p className="underline cursor-pointer ml-1" onClick={() =>navigate('/olvidar')}> ¿Olvidaste tu contraseña? </p>
          </div>
        </form>
        <div className="error-container">
          {errores.map(e => (
            <div key={e.id} className="error-box">{e.msg}</div>
          ))}
        </div>
      </div>
    </div>
  );
}
