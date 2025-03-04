import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import Navigation from './components/Navigation';
import AdminPage from './pages/AdminPage';
import MappingPage from './pages/MappingPage';
import './App.css';

function App() {
  return (
    <Router>
      <div className="App">
        <Navigation />
        <div className="container mt-4">
          <Routes>
            <Route path="/admin" element={<AdminPage />} />
            <Route path="/mapping" element={<MappingPage />} />
            <Route path="/" element={<MappingPage />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;