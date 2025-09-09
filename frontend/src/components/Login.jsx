import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const [usuario, setUsuario] = useState('');
  const [clave, setClave] = useState('');
  const navigate = useNavigate();

  const verificarLogin = async(e) => {
    e.preventDefault();
  /* //Para el backend
    const res = await fetch('http://localhost:5000/login', {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({usuario,clave})
    });*/

    //Respuesta de prueba
    const res = {
  "id": 1,
  "nombre": "Charlito",
  "email": "charly@ejemplo.com",
  "rol": "admin",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
    //if(res.ok and && res.verificado == "V"){
      //const data = await res.json();
    if (usuario == res.nombre ){
      const data = res
      localStorage.setItem('usuario', JSON.stringify(data)); //Para guardar los datos y poder manejarlos despues
      navigate('/portal');
    }else{
      navigate('/error');
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
            <label className="block text-sm font-medium text-gray-700">Usuario</label>
            <input
              type="text"
              value={usuario}
              onChange={(e) => setUsuario(e.target.value)}
              placeholder="Usuario"
              className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Contraseña</label>
            <input
              type="password"
              value={clave}
              onChange={(e) => setClave(e.target.value)}
              placeholder="Contraseña"
              className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>
          <button
            type="submit"
            className="w-full bg-red-600 text-white py-2 rounded-md hover:bg-red-900 transition duration-200">
            Iniciar Sesión
          </button>
          <div class="flex items-center text-sm">
            <p>Crea una cuenta    </p>
            <p class="underline cursor-pointer ml-1" onClick={() =>navigate('/registrar')}>   Registrarse</p>
          </div>
        </form>
      </div>
    </div>
  );
}
