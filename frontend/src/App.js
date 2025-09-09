import './App.css';
import Login from './components/Login';
import Portal from './components/Portal';
import ErrorPage from './components/ErrorPage';
import Registrar from './components/Registrar';

import {BrowserRouter, Routes, Route} from 'react-router-dom';

function App() {
  return (
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Login />}/>
          <Route path="/portal" element={<Portal />}/>
          <Route path="/error" element={<ErrorPage />}/>
          <Route path="/registrar" element={<Registrar />}/>
        </Routes>
      </BrowserRouter>  
);
}

export default App;
