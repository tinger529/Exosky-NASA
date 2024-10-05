import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import HomePage from './pages/HomePage';
import MainPage from './pages/MainPage';
import ExoplanetDisc from './pages/ExoplanetSlider';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/main" element={<MainPage />} />
        <Route path="/search" element={<ExoplanetDisc />} />
      </Routes>
    </Router>
  );
}

export default App;
