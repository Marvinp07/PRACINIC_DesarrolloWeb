import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Registrar() {
    const[registro_academico, setCarnet] = useState('');
    const[nombres, setNombre] = useState('');
    const[apellidos, setApellido] = useState('');
    const[contrasena, setPass] = useState('');
    const[correo, setEmail] = useState('');
    const [errores, setErrores] = useState([]);
    const navigate = useNavigate();


    const agregarError = (msg) => {
        const id = Date.now();
        setErrores(prev => [...prev, { id, msg }]);
        setTimeout(() => {
        setErrores(prev => prev.filter(e => e.id !== id));
        }, 3000);
    };

    const enviarRegistro = async(e) => {
        e.preventDefault();
        //Backend
        const res = await fetch('http://localhost:5000/api/usuarios/registro',{
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({registro_academico,nombres,apellidos,contrasena,correo})
        });

        if (res.ok ){
        const data = res
        //localStorage.setItem('nombres',data.nombres);
        console.log(data.message);
        navigate('/');
        }else{
        const data = res
        agregarError(data.error || "Ocurrió un error");
        }
    }

    return (
    <div className="bg-red-950 min-h-screen flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
            <div className="mb-8 text-center">
                <h1 className="text-2xl font-bold text-gray-800">Registrar Usuario</h1>
            </div>

            <form onSubmit={enviarRegistro} >
                <div className="space-y-4">

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="nombres" className="block text-sm font-medium text-gray-700 mb-1">Nombres</label>
                            <input id="nombres" 
                                name="nombres" 
                                type="text" 
                                required 
                                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" 
                                placeholder="Francisco"
                                value={nombres}
                                onChange={(e) => setNombre(e.target.value)}/>
                        </div>
                        <div>
                            <label htmlFor="apellidos" className="block text-sm font-medium text-gray-700 mb-1">Apellidos</label>
                            <input id="apellidos" 
                                name="apellido1" 
                                type="text" 
                                required
                                value={apellidos}
                                onChange={(e) => setApellido(e.target.value)} 
                                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" 
                                placeholder="Blanco"/>
                        </div>
                    </div>

                    <div>
                        <label htmlFor="correo" className="block text-sm font-medium text-gray-700 mb-1">Correo Electronico</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                    <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                                    <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                                </svg>
                            </div>
                            <input id="correo" 
                                name="correo" type="email" 
                                autoComplete="email" 
                                required 
                                value={correo}
                                onChange={(e) => setEmail(e.target.value)}
                                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" 
                                placeholder="usuario@example.com"/>
                        </div>
                    </div>

                    <div>
                        <label htmlFor="contrasena" className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <input id="contrasena" 
                                name="contrasena" 
                                type="password" 
                                required 
                                value={contrasena}
                                onChange={(e)=>setPass(e.target.value)}
                                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" 
                                placeholder="••••••••"
                            />
                        </div>
                    </div>

                    <div>
                        <label htmlFor="registro_academico" className="block text-sm font-medium text-gray-700 mb-1">Registro Academico</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <svg className="h-5 w-6 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M4.5 3.75a3 3 0 0 0-3 3v10.5a3 3 0 0 0 3 3h15a3 3 0 0 0 3-3V6.75a3 3 0 0 0-3-3h-15Zm4.125 3a2.25 2.25 0 1 0 0 4.5 2.25 2.25 0 0 0 0-4.5Zm-3.873 8.703a4.126 4.126 0 0 1 7.746 0 .75.75 0 0 1-.351.92 7.47 7.47 0 0 1-3.522.877 7.47 7.47 0 0 1-3.522-.877.75.75 0 0 1-.351-.92ZM15 8.25a.75.75 0 0 0 0 1.5h3.75a.75.75 0 0 0 0-1.5H15ZM14.25 12a.75.75 0 0 1 .75-.75h3.75a.75.75 0 0 1 0 1.5H15a.75.75 0 0 1-.75-.75Zm.75 2.25a.75.75 0 0 0 0 1.5h3.75a.75.75 0 0 0 0-1.5H15Z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <input id="registro_academico" 
                                name="registro_academico" 
                                type="phone" 
                                required
                                value={registro_academico}
                                onChange={(e) => setCarnet(e.target.value)}
                                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" 
                                placeholder="12345678"/>
                        </div>
                    </div>

                    <div>
                        <button type="submit" 
                            className="w-full flex justify-center  py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                            Crear Usuario
                        </button>
                    </div>
                </div>
            </form>
            <div className="error-container">
                {errores.map(e => (
                    <div key={e.id} className="error-box">{e.msg}</div>
                ))}
            </div>
        </div>
    </div>
    )
}
