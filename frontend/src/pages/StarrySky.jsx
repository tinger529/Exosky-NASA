import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader';
//import Stars_catalog from './Stars_catalog';
import Papa from 'papaparse';
import { useNavigate } from 'react-router-dom';
//the glsl code for the shaders
//vertex shader
var _VS = `
uniform vec3 baseColor;
uniform vec3 viewVector;

varying float intensity;
varying vec3 vertexNormal;
varying vec3 objPosition;

void main() {
    gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

    vertexNormal = normal;
    objPosition = normalize(1.0 * position);
    
    //vec3 vNormal = normalize( normalMatrix * normal );
    //vec3 vNormel = normalize( normalMatrix * viewVector );
    //intensity = pow( dot(vNormal, vNormel), 1.5 );

    //vec3 actual_normal = vec3(modelMatrix * vec4(normal, 0.0));
    //intensity = pow( dot(normalize(viewVector), actual_normal), 2.0 );
}
`;
//fragment shader
var _FS = `
uniform vec3 baseColor;
uniform vec3 starObjPosition;

varying float intensity;
varying vec3 vertexNormal;
varying vec3 objPosition;

void main() {
    //float colorIntensity = pow(0.5 - dot(vertexNormal, vec3(0.0, 1.0, 0.0)), 2.0);
    float colorIntensity = pow( - dot(vertexNormal, normalize(-1.0 * starObjPosition)), 2.0);
    //gl_FragColor = vec4( baseColor, 1.0 ) * colorIntensity;

    gl_FragColor = vec4( baseColor, colorIntensity );
}
`;

const StarryNight = () => {
  const mountRef = useRef(null);
  const [rotSpeed, setRotSpeed] = useState(0.0005);
  const [latitude, setLatitude] = useState(23.5);
  const [hoveredStar, setHoveredStar] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const navigate = useNavigate();

  // Declare stars_objs and lastHoveredStar
  let stars_objs = [];
  let lastHoveredStar = null;

  // Define resizeStar function
  function resizeStar(star, scale) {
    const newSize = star.userData.originalSize * scale;
    star.geometry = new THREE.SphereGeometry(newSize, 18, 10);
  }

  // Function to update suggestions based on search term
  const updateSuggestions = (term) => {
    if (term.length === 0) {
      setSuggestions([]);
      return;
    }
    const filteredStars = stars_objs
      .filter(star => star.name.toLowerCase().includes(term.toLowerCase()))
      .map(star => star.name);
    console.log('Filtered Stars:', filteredStars); // Debugging log
    // console the first star in starsobjects
    //console.log('First Star:', stars_objs[0].name); // Debugging log
    setSuggestions(filteredStars);
  };

  // Function to handle search input change
  const handleSearchChange = (e) => {
    const term = e.target.value;
    setSearchTerm(term);
    console.log('Search Term:', term); // Debugging log
    updateSuggestions(term);
  };

  // Function to select a star from suggestions
  const selectStar = (starName) => {
    setSearchTerm(starName);
    setSuggestions([]);
    searchStar(starName);
  };

  // Updated searchStar function to accept a star name
  const searchStar = (starName) => {
    const star = stars_objs.find(star => star.name.toLowerCase() === starName.toLowerCase());
    if (star) {
      if (lastHoveredStar) {
        resizeStar(lastHoveredStar, 1); // Revert last hovered star to original size
      }
      resizeStar(star, 10); // Highlight the found star
      setHoveredStar(star.name);
      lastHoveredStar = star;
    } else {
      alert('Star not found');
    }
  };

  const [tempRotSpeed, setTempRotSpeed] = useState(0.0005);
  const [tempLatitude, setTempLatitude] = useState(23.5);

  useEffect(() => {
    let sky_group, ground_group, ground_circle, scene, camera, renderer, textue_loader, font_loader;
    let sky_texture, sky_sphere, amb_light, hemi_light, controls;
    let cur_rot_rad = lat2rot(latitude);
    const unit_i = new THREE.Vector3(1, 0, 0);
    const unit_j = new THREE.Vector3(0, 1, 0);
    let axis_polar = unit_j.clone();
    let raycaster, mouse;

    // Helper functions (bv2rgb, lat2rot) go here...

    //for rendering the stars 
    function load_stars() {
      fetch(`${process.env.PUBLIC_URL}/stars_catalog.json`)
          .then(response => response.json())
          .then(data => {
              const starcat = data.stars;
              
              for (let ct = 0; ct < starcat.length; ct++) {
                  const st = starcat[ct];
                  
                  //name
                  const name = st.name.substring(4, 14).trim();
                  
                  //the stats of the star, angles are in radians
                  //right ascension
                  const ra = (parseFloat(st.RA[0]) / 24 + parseFloat(st.RA[1]) / (24*60) + parseFloat(st.RA[2]) / (24*60*60)) * 2 * Math.PI;
                  //declination
                  let de = (parseFloat(st.DE[1]) / 360 + parseFloat(st.DE[2]) / (360*60) + parseFloat(st.DE[3]) / (360*60*60)) * 2 * Math.PI;
                  if (st.DE[0] === "-") {// if -ve sign
                      de = -de;
                  }
                  //visual magnitude (i.e. brightness)
                  const vmag = parseFloat(st.vmag);
                  
                  //calculate the xyz coordinate of this star using modified spherical coordinate system
                  //equations here: https://en.wikipedia.org/wiki/Equatorial_coordinate_system
                  const sx = 10000 * Math.cos(de) * Math.cos(ra);
                  const sy = 10000 * Math.cos(de) * Math.sin(ra);
                  const sz = 10000 * Math.sin(de);
                  
                  if (isNaN(sx) || isNaN(sy) || isNaN(sz)) {
                      console.log("star data missing/malformed: " + st.name + ": " + sx + ", " + sy + ", " + sz);
                      continue;
                  }
                  
                  //calculate the size (lower vmag -> brighter -> larger dot visually)
                  const osize = 75 * Math.pow(1.35, Math.min(-vmag, 0.15));
                  
                  //get the color (from bv index)
                  const bv = parseFloat(st.bv);
                  const st_color = bv2rgb(bv);
                  
                  //create the model object
                  const geometry = new THREE.SphereGeometry(osize, 18, 10);
                  const material = new THREE.ShaderMaterial({
                      uniforms: {
                          baseColor: {type: "c", value: new THREE.Color(st_color[0], st_color[1], st_color[2])},
                          viewVector: { type: "v3", value: camera.position },
                          starObjPosition: { type: "v3", value: new THREE.Color(sy, sz, sx) },
                      },
                      vertexShader: _VS,
                      fragmentShader: _FS,
                      blending: THREE.AdditiveBlending,
                  });
                  
                  const star = new THREE.Mesh(geometry, material);
                  
                  //set position and add to scene
                  star.position.x = sy;
                  star.position.y = sz;
                  star.position.z = sx;
                  star.name = name;
                  star.userData.originalSize = osize;
                  sky_group.add(star);
                  stars_objs.push(star);
              }
              console.log(`Loaded ${stars_objs.length} stars`);
          })
          .catch(error => console.error('Error loading stars catalog:', error));
  }

    function load_skysphere() {
        var skygeo = new THREE.SphereGeometry(14000, 96, 48);
        
        sky_texture = textue_loader.load(`${process.env.PUBLIC_URL}/textures/starmap_16k_d57.jpg`);
        
        var material = new THREE.MeshPhongMaterial({ 
            map: sky_texture,
        });
        
        sky_sphere = new THREE.Mesh(skygeo, material);
        sky_sphere.material.side = THREE.BackSide;
        
        sky_sphere.rotateY(-Math.PI / 2);
        
        //scene.add(sky_sphere);
        sky_group.add(sky_sphere);
    }

    //geo latitude to in program skydome rotation
    function lat2rot (lat) {
        return (90 - lat) / 180 * Math.PI;
    }


    //convert a star's b-v temperature index to human eye color
    function bv2rgb(bv){    // RGB <0,1> <- BV <-0.4,+2.0> [-]
        var t;  
        var r=0.0;
        var g=0.0;
        var b=0.0; 
        
        if (bv<-0.4) bv=-0.4; if (bv> 2.0) bv=2.0;
        
            if ((bv>=-0.40)&&(bv<0.00)) { t=(bv+0.40)/(0.00+0.40); r=0.61+(0.11*t)+(0.1*t*t); }
        else if ((bv>= 0.00)&&(bv<0.40)) { t=(bv-0.00)/(0.40-0.00); r=0.83+(0.17*t)          ; }
        else if ((bv>= 0.40)&&(bv<2.10)) { t=(bv-0.40)/(2.10-0.40); r=1.00                   ; }
            if ((bv>=-0.40)&&(bv<0.00)) { t=(bv+0.40)/(0.00+0.40); g=0.70+(0.07*t)+(0.1*t*t); }
        else if ((bv>= 0.00)&&(bv<0.40)) { t=(bv-0.00)/(0.40-0.00); g=0.87+(0.11*t)          ; }
        else if ((bv>= 0.40)&&(bv<1.60)) { t=(bv-0.40)/(1.60-0.40); g=0.98-(0.16*t)          ; }
        else if ((bv>= 1.60)&&(bv<2.00)) { t=(bv-1.60)/(2.00-1.60); g=0.82         -(0.5*t*t); }
            if ((bv>=-0.40)&&(bv<0.40)) { t=(bv+0.40)/(0.40+0.40); b=1.00                   ; }
        else if ((bv>= 0.40)&&(bv<1.50)) { t=(bv-0.40)/(1.50-0.40); b=1.00-(0.47*t)+(0.1*t*t); }
        else if ((bv>= 1.50)&&(bv<1.94)) { t=(bv-1.50)/(1.94-1.50); b=0.63         -(0.6*t*t); }
        return [r, g, b];
    }

    function createCompassMarkers() {
        const markerSize = 2; // Adjust size as needed
        const markerHeight = 0.5;
        const markerY = -2.4; // Adjust height as needed
        const textY = markerY + 2; // Height for text, above the markers
        const distanceFromCenter = 26; // Distance of markers from center
    
        const markerGeometry = new THREE.BoxGeometry(markerSize, markerHeight, markerSize);
        
        const markerMaterials = {
            N: new THREE.MeshStandardMaterial({color: 0xe84d4d}), // Red
            E: new THREE.MeshStandardMaterial({color: 0xa6a6a6}), // Light Gray
            S: new THREE.MeshStandardMaterial({color: 0x3d5ccc}), // Blue
            W: new THREE.MeshStandardMaterial({color: 0xa6a6a6})  // Light Gray
        };
    
        const directions = ['N', 'E', 'S', 'W'];
        const positions = [
            [0, 0, 1],   // North
            [1, 0, 0],   // East
            [0, 0, -1],  // South
            [-1, 0, 0]   // West
        ];
    
        directions.forEach((dir, index) => {
            const [x, y, z] = positions[index];
    
            // Create marker
            const marker = new THREE.Mesh(markerGeometry, markerMaterials[dir]);
            marker.position.set(x * distanceFromCenter, markerY, z * distanceFromCenter);
            ground_group.add(marker);
    
            // Create text sprite
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            canvas.width = 256;
            canvas.height = 256;
            context.font = 'Bold 100px Arial';
            context.fillStyle = 'white';
            context.textAlign = 'center';
            context.fillText(dir, 128, 128);
    
            const texture = new THREE.CanvasTexture(canvas);
            const spriteMaterial = new THREE.SpriteMaterial({ map: texture });
            const sprite = new THREE.Sprite(spriteMaterial);
    
            sprite.scale.set(5, 5, 1);
            sprite.position.set(x * (distanceFromCenter + 2), textY, z * (distanceFromCenter + 2));
    
            ground_group.add(sprite);
        });
    }

    function load_ground() {
        var geom = new THREE.CylinderGeometry(50, 50, 0.5, 8);
        
        // Use absolute path and add error handling for texture loading
        textue_loader.load(
            `${process.env.PUBLIC_URL}/textures/grass_textures.jpg`,
            function(grass_texture) {
                grass_texture.wrapS = THREE.RepeatWrapping;
                grass_texture.wrapT = THREE.RepeatWrapping;
                grass_texture.repeat.set(8, 8);
                var mat = new THREE.MeshPhongMaterial({ map: grass_texture });
                ground_circle = new THREE.Mesh(geom, mat);
                ground_circle.position.y = -3;
                
                ground_group = new THREE.Group();
                ground_group.add(ground_circle);
                
                // Create compass markers
                createCompassMarkers();
                
                scene.add(ground_group);
            },
            undefined,
            function(error) {
                console.error('An error happened while loading the grass texture:', error);
                // Fallback to a basic material if texture fails to load
                var mat = new THREE.MeshPhongMaterial({ color: 0x144a09 });
                ground_circle = new THREE.Mesh(geom, mat);
                ground_circle.position.y = -3;
                
                ground_group = new THREE.Group();
                ground_group.add(ground_circle);
                
                // Create compass markers
                createCompassMarkers();
                
                scene.add(ground_group);
            }
        );
    }

    function checkStarHover() {
        // Update the picking ray with the camera and mouse position
        raycaster.setFromCamera(mouse, camera);
  
        // Calculate objects intersecting the picking ray
        const intersects = raycaster.intersectObjects(stars_objs);
  
        if (intersects.length > 0) {
            const hoveredStarObject = intersects[0].object;
            const hoveredStarName = hoveredStarObject.name;
            console.log(`Hovered star: ${hoveredStarName}`); // Debugging log
        
            if (lastHoveredStar && lastHoveredStar !== hoveredStarObject) {
            resizeStar(lastHoveredStar, 1); // Revert last hovered star to original size
            }
            
            if (lastHoveredStar !== hoveredStarObject) {
            resizeStar(hoveredStarObject, 10); // Increase size of currently hovered star
            console.log(`Hovered star: ${hoveredStarName}`);
            }
            
            setHoveredStar(hoveredStarName);
            lastHoveredStar = hoveredStarObject;
        } else {
            if (lastHoveredStar) {
                resizeStar(lastHoveredStar, 1); // Revert last hovered star to original size
                lastHoveredStar = null;
            }
            setHoveredStar(null);
        }
    }

    function onMouseMove(event) {
        // Calculate mouse position in normalized device coordinates
        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = - (event.clientY / window.innerHeight) * 2 + 1;
        checkStarHover();
    }

    function animate() {
      requestAnimationFrame(animate);
      
      sky_group.rotateOnWorldAxis(axis_polar, -rotSpeed);
      
      controls.update();
    //   checkStarHover();
      
      renderer.render(scene, camera);
    }

    function indexjs_setup() {
        scene = new THREE.Scene();
        camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 15000);
        
        textue_loader = new THREE.TextureLoader();
        font_loader = new FontLoader();
        
        renderer = new THREE.WebGLRenderer({"antialias": true});
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.shadowMap.enabled = true;
        mountRef.current.appendChild(renderer.domElement);
        
        controls = new OrbitControls(camera, renderer.domElement);
        controls.enablePan = false;
        controls.enableZoom = false;
        
        amb_light = new THREE.AmbientLight(0x909090);
        scene.add(amb_light);
        
        hemi_light = new THREE.HemisphereLight(0x21266e, 0x080820, 0.2);
        scene.add(hemi_light);
        
        camera.position.z = -0.01;
  
        sky_group = new THREE.Group();

        raycaster = new THREE.Raycaster();
        raycaster.params.Points.threshold = 1000; // Increase raycaster sensitivity
        mouse = new THREE.Vector2();
        
        load_stars();
        load_skysphere();
        scene.add(sky_group);
        load_ground();
        sky_group.rotateOnWorldAxis(unit_i, cur_rot_rad);
        
        animate();

        window.addEventListener('mousemove', onMouseMove, false);
        console.log('Mouse move event listener added');
    }

    function window_resize() {
      renderer.setSize(window.innerWidth, window.innerHeight);
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
    }

    

    indexjs_setup();
    animate();

    window.addEventListener('resize', window_resize);

    return () => {
      window.removeEventListener('mousemove', onMouseMove, false);
      window.removeEventListener('resize', window_resize);

      // Check if mountRef.current is not null before removing the child
      if (mountRef.current && mountRef.current.contains(renderer.domElement)) {
        mountRef.current.removeChild(renderer.domElement);
      }
    };
  }, [rotSpeed, latitude]);

  const handleRotSpeedChange = (event) => {
    setTempRotSpeed(parseFloat(event.target.value) / 10000);
  };

  const handleLatitudeChange = (event) => {
    setTempLatitude(parseFloat(event.target.value));
  };

  const applySettings = () => {
    const newLatitude = Math.max(-90, Math.min(90, tempLatitude));
    setLatitude(newLatitude);
    setRotSpeed(tempRotSpeed);
  };

  const navigateToSearchPage = () => {
    navigate('/search'); // Adjust the path as needed
  };

  return (
    <div>
      <div ref={mountRef} style={{ width: '100%', height: '100vh' }}></div>
      <div style={{ position: 'absolute', top: 10, left: 10, color: 'white' }}>
        <label>
          Rotation Speed:
          <input
            type="range"
            min="0"
            max="100"
            value={tempRotSpeed * 10000}
            onChange={handleRotSpeedChange}
          />
        </label>
        <br />
        <label>
          Latitude:
          <input
            type="number"
            value={tempLatitude}
            onChange={handleLatitudeChange}
            style={{ width: '60px' }}
          />
        </label>
        <button onClick={applySettings}>Set Latitude & Speed</button>
        <br />
        <label>
          Search Star:
          <input
            type="text"
            value={searchTerm}
            onChange={handleSearchChange}
            style={{ width: '100px' }}
          />
        </label>
        <button onClick={() => searchStar(searchTerm)}>Search</button>
        <ul style={{ listStyleType: 'none', padding: 0, margin: 0 }}>
          {suggestions.map((suggestion, index) => (
            <li
              key={index}
              onClick={() => selectStar(suggestion)}
              style={{ cursor: 'pointer', backgroundColor: 'rgba(255, 255, 255, 0.1)', padding: '5px' }}
            >
              {suggestion}
            </li>
          ))}
        </ul>
      </div>
      <button
        onClick={navigateToSearchPage}
        style={{
          position: 'absolute',
          top: 10,
          right: 10,
          padding: '10px 20px',
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          color: 'white',
          border: 'none',
          borderRadius: '5px',
          cursor: 'pointer',
          //size of text
          fontSize: '30px',
          fontWeight: 'bold',
        }}
      >
        Select Exoplanet
      </button>
      {hoveredStar && (
        <div style={{
          position: 'absolute',
          bottom: 10,
          left: 10,
          color: 'white',
          backgroundColor: 'rgba(0,0,0,0.5)',
          padding: '5px 10px',
          borderRadius: '5px'
        }}>
          Star: {hoveredStar}
        </div>
      )}
    </div>
  );
};

export default StarryNight;