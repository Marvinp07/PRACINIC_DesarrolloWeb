import './App.css';
import Login from './components/Login';
import Portal from './components/Portal';
import Registrar from './components/Registrar';
import Olvidar from './components/Olvidar'; 
import Perfil from './components/Perfil'; 
import Publicacion from './components/Publicacion';  
import OtroPerfil from './components/OtroPerfil';

import {BrowserRouter, Routes, Route} from 'react-router-dom';

function App() {
  return (
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Login />}/>
          <Route path="/portal" element={<Portal />}/>
          <Route path="/registrar" element={<Registrar />}/>
          <Route path="/olvidar" element={<Olvidar />}/>
          <Route path="/perfil" element={<Perfil />}/>
          <Route path="/publicacion" element={<Publicacion />}/>
          <Route path="/otroPerfil/:registro" element={<OtroPerfil />}/>
        </Routes>
      </BrowserRouter>  
);
}

export default App;
