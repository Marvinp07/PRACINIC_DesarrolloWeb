import './App.css';
import Login from './components/Login';
import Portal from './components/Portal';
import Registrar from './components/Registrar';
import Olvidar from './components/Olvidar'; 
import Perfil from './components/Perfil';  

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
        </Routes>
      </BrowserRouter>  
);
}

export default App;
