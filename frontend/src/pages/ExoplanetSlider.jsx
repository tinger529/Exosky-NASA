// frontend/src/pages/ExoplanetDisc.jsx
import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import exoplanets from './Exoplanet'; // Adjust the path as necessary
import Snowflakes from '../components/SnowFlakes';
import { useNavigate } from 'react-router-dom'; // Import useNavigate

const ExoplanetDisc = () => {
  const mountRef = useRef(null);
  const [rotation, setRotation] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [selectedPlanet, setSelectedPlanet] = useState(null);
  const navigate = useNavigate(); // Initialize navigate

  useEffect(() => {
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);

    // Append the renderer's DOM element only if mountRef.current is available
    if (mountRef.current) {
      mountRef.current.appendChild(renderer.domElement);
    }

    const light = new THREE.AmbientLight(0x404040); // soft white light
    scene.add(light);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
    scene.add(directionalLight);

    const group = new THREE.Group();
    const radius = 5; // Radius of the circular path

    const planetColors = [
      0x1f77b4, // Blue
      0xff7f0e, // Orange
      0x2ca02c, // Green
      0xd62728, // Red
      0x9467bd, // Purple
      0x8c564b, // Brown
      0xe377c2, // Pink
      0x7f7f7f, // Gray
      0xbcbd22, // Olive
      0x17becf  // Cyan
    ];

    exoplanets.forEach((planet, index) => {
      const angle = (index / exoplanets.length) * Math.PI * 2;
      const x = radius * Math.cos(angle);
      const z = radius * Math.sin(angle);

      // Use planet radius for size, default to 0.5 if not available
      const size = planet.pl_rade ? Math.max(0.1, planet.pl_rade / 10) : 0.5;

      // Assign a color from the predefined palette
      const color = new THREE.Color(planetColors[index % planetColors.length]);

      const geometry = new THREE.SphereGeometry(size, 32, 32);
      const material = new THREE.MeshStandardMaterial({ color });
      const sphere = new THREE.Mesh(geometry, material);
      sphere.position.set(x, 0, z);
      group.add(sphere);
    });

    scene.add(group);
    camera.position.z = 10;

    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const animate = () => {
      requestAnimationFrame(animate);
      group.rotation.y = rotation;
      renderer.render(scene, camera);
    };
    animate();

    const handleMouseDown = (event) => {
      setIsDragging(true);
      setStartX(event.clientX);
    };

    const handleMouseMove = (event) => {
      if (!isDragging) return;
      const deltaX = event.clientX - startX;
      setRotation((prevRotation) => prevRotation + deltaX * 0.005);
      setStartX(event.clientX);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    const handleMouseClick = (event) => {
      // Calculate mouse position in normalized device coordinates
      mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

      // Update the raycaster with the camera and mouse position
      raycaster.setFromCamera(mouse, camera);

      // Calculate objects intersecting the ray
      const intersects = raycaster.intersectObjects(group.children);

      if (intersects.length > 0) {
        const selectedSphere = intersects[0].object;
        const selectedIndex = group.children.indexOf(selectedSphere);
        setSelectedPlanet(exoplanets[selectedIndex]);
      }
    };

    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('click', handleMouseClick);

    return () => {
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('click', handleMouseClick);

      // Remove the renderer's DOM element only if it was appended
      if (mountRef.current && mountRef.current.contains(renderer.domElement)) {
        mountRef.current.removeChild(renderer.domElement);
      }
    };
  }, [rotation, isDragging, startX]);

  const frontIndex = Math.round((rotation / (Math.PI * 2)) * exoplanets.length) % exoplanets.length;
  const frontPlanet = exoplanets[frontIndex];

  const handleSelectButtonClick = () => {
    setSelectedPlanet(frontPlanet);
    navigate('/main'); // Navigate to the main page
  };

  return (
    <div>
    <Snowflakes>
      <div ref={mountRef} style={{ width: '100%', height: '100vh' }}></div>
      {frontPlanet && (
        <div style={{
          position: 'absolute',
          bottom: '10px',
          left: '50%',
          transform: 'translateX(-50%)',
          color: 'white',
          backgroundColor: 'rgba(0,0,0,0.5)',
          padding: '10px',
          borderRadius: '5px',
          textAlign: 'center'
        }}>
          <h2>{frontPlanet.pl_name}</h2>
          <p><strong>Host Name:</strong> {frontPlanet.hostname}</p>
          <p><strong>Orbital Period:</strong> {frontPlanet.pl_orbper} days</p>
          <p><strong>Planet Radius:</strong> {frontPlanet.pl_rade} Earth radii</p>
          <p><strong>Distance:</strong> {frontPlanet.sy_dist} pc</p>
          <button onClick={handleSelectButtonClick} style={{ marginTop: '10px', padding: '5px 10px' }}>
            Select
          </button>
        </div>
      )}
      {selectedPlanet && (
        <div style={{
          position: 'absolute',
          top: '10px',
          left: '50%',
          transform: 'translateX(-50%)',
          color: 'white',
          backgroundColor: 'rgba(0,0,0,0.7)',
          padding: '10px',
          borderRadius: '5px'
        }}>
          <h2>Selected: {selectedPlanet.pl_name}</h2>
        </div>
      )}
      </Snowflakes>
    </div>
  );
};

export default ExoplanetDisc;