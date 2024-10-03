import React from 'react';
import { Link } from 'react-router-dom';

function HomePage() {
  return (
    <div>
      <h1>Home Page</h1>
      <Link to="/main">Go to Main Page</Link>
    </div>
  );
}

export default HomePage;
