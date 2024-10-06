import React from 'react';
import { useNavigate } from 'react-router-dom';
import Snowflakes from '../components/SnowFlakes';
import CyberBox from '../components/CyberBox';

const description = `Choose an exoplanet and see the stars as\n
they would appear from its surface. Draw your own constellations\n, 
view galactic coordinates, and export your custom star chart in PNG\n
 or PDF. Discover the universe from a whole new perspective!
`;
function HomePage() {
  const navigate = useNavigate();

  return (
    <Snowflakes>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
        }}
      >
        <h1
          style={{
            color: '#F75049',
            fontFamily: 'Rajdhani',
            fontSize: '64px',
            fontStyle: 'normal',
            fontWeight: 500,
            lineHeight: 'normal',
            letterSpacing: '-3.36px',
            textTransform: 'uppercase',
            filter: 'blur(1px)',
            marginBottom: '10px',
          }}
        >
          EXOSKY-SANTOL
        </h1>
        <div style={{ position: 'relative' }}>
          <CyberBox description={description} />
          <div
            style={{
              position: 'absolute',
              right: '36px',
              bottom: '36px',
              color: '#5EF6FF',
              cursor: 'pointer',
              transition: 'transform 0.2s ease',
            }}
            onClick={() => navigate('/main')}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateX(10px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateX(0)';
            }}
          >
            Start
          </div>
        </div>
      </div>
    </Snowflakes>
  );
}

export default HomePage;
