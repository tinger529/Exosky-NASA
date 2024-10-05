import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import HomePage from './pages/HomePage';
import MainPage from './pages/MainPage';
import SearchPlanet from './pages/SearchPlanet';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/main" element={<MainPage />} />
        <Route path="/search" element={<SearchPlanet />} />
      </Routes>
    </Router>
  );
}

export default App;
