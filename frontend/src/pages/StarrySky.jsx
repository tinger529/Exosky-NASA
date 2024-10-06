import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry';
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
  const [wrenderer, setWRenderer] = useState(null);
  const [oriStarData, setOriStarDatar] = useState([]);
  const [currentCoordinates, setCurrentCoordinates] = useState({ ra: 0, dec: 0 });
  const [showCoordinates, setShowCoordinates] = useState(true);
  const coordinateGroupRef = useRef(null);

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
      .filter((star) => star.name.toLowerCase().includes(term.toLowerCase()))
      .map((star) => star.name);
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
    const star = stars_objs.find(
      (star) => star.name.toLowerCase() === starName.toLowerCase()
    );
    if (star) {
      if (lastHoveredStar) {
        resizeStar(lastHoveredStar, 1); // Revert last hovered star to original size
      }
      resizeStar(star, 10); // Highlight the found star
      setHoveredStar({
        "name": star.name,
        "ra": star.ra,
        "dec": star.dec
      });
      lastHoveredStar = star;
    } else {
      alert('Star not found');
    }
  };

  function toggleCoordinates() {
    setShowCoordinates(!showCoordinates);
    if (coordinateGroupRef.current) {
      coordinateGroupRef.current.visible = !showCoordinates;
    }
  }

  const [preRotSpeed, setPreRotSpeed] = useState(rotSpeed);
  const [tempRotSpeed, setTempRotSpeed] = useState(0.0005);
  const [tempLatitude, setTempLatitude] = useState(23.5);

  const [mode, setMode] = useState('off');

  const toggleMode = () => {
    if (mode === 'on') {
      //  代表要關掉了
      const userConfirmed = window.confirm(
        'Your constellation will disappear! Do you want to proceed?'
      );
      if (userConfirmed) {
        setMode((prevMode) => (prevMode === 'on' ? 'off' : 'on'));
        setRotSpeed(preRotSpeed);
      }
    } else {
      setPreRotSpeed(rotSpeed);
      setRotSpeed(0);
      setMode((prevMode) => (prevMode === 'on' ? 'off' : 'on'));
    }
  };

  const [exRa, setExRa] = useState(69.3405531); // Default value
  const [exDec, setExDec] = useState(26.8502997); // Default value
  const [exDistance, setExDistance] = useState(101); // Default value
  const [exName, setExName] = useState('Earth'); // Default value

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ex_ra = params.get('ex_ra');
    const ex_dec = params.get('ex_dec');
    const ex_distance = params.get('ex_distance');
    const ex_name = params.get('ex_name');

    if (ex_ra) setExRa(parseFloat(ex_ra));
    if (ex_dec) setExDec(parseFloat(ex_dec));
    if (ex_distance) setExDistance(parseFloat(ex_distance));
    if (ex_name) setExName(ex_name);
    async function fetch_stars_from_backend(){
      // Example values for testing
      // const ex_ra = 69.3405531; // Right ascension of exoplanet
      // const ex_dec = 26.8502997; // Declination of exoplanet
      // const ex_distance = 128.4840000; // Distance of exoplanet in parsecs
      const ra = 0; // Observed right ascension
      const dec = 0; // Observed declination

      try {
        const response = await fetch(
          'http://localhost:8000/api/v1/star/skyview/exoplanet',
          {
            method: 'POST',
            headers: {
              Accept: 'application/json',
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              ex_ra: ex_ra ? ex_ra : 0,
              ex_dec: ex_dec ? ex_dec : 0,
              ex_distance: ex_distance ? ex_distance : 0,
              ra: ra,
              dec: dec,
            }),
          }
        );

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const response2 = await fetch(
          'http://localhost:8000/api/v1/star/skyview/exoplanet',
          {
            method: 'POST',
            headers: {
              Accept: 'application/json',
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              ex_ra: ex_ra ? ex_ra : 0,
              ex_dec: ex_dec ? ex_dec : 0,
              ex_distance: ex_distance  ? ex_distance : 0,
              ra: ra + 180,
              dec: dec,
            }),
          }
        );

        if (!response2.ok) {
          throw new Error(`HTTP error! status: ${response2.status}`);
        }

        // Wait for fetched data, for example:
        // {"star": {"name", "ra", "dec", "vmag", "bv"}, {"name", "ra", "dec", "vmag", "bv"}...}
        const starData1 = await response.json();
        const starData2 = await response2.json();
        // All stars
        const starData = [...starData1.stars, ...starData2.stars];
        setOriStarDatar(starData)
      }catch (error) {
        console.error('Error loading stars:', error);
      }
    }
    fetch_stars_from_backend()
  }, [])

  useEffect(() => {
    let sky_group,
      ground_group,
      ground_circle,
      scene,
      camera,
      renderer,
      textue_loader,
      font_loader;
    let sky_texture, sky_sphere, amb_light, hemi_light, controls;
    let cur_rot_rad = lat2rot(latitude);
    const unit_i = new THREE.Vector3(1, 0, 0);
    const unit_j = new THREE.Vector3(0, 1, 0);
    let axis_polar = unit_j.clone();
    let raycaster, mouse;

    //for rendering the stars
    async function load_stars() {
        const starData = oriStarData
        stars_objs = []
        starData.forEach(s => {
            const name = s.name;
            const ra = parseFloat(s.ra);
            const dec = parseFloat(s.dec);
            const vmag = parseFloat(s.vmag);
            const bv = parseFloat(s.bv);
  
            // Convert RA and Dec to x, y, z coordinates
            const phi = ra * (Math.PI / 180);
            const theta = (90 - dec) * (Math.PI / 180);
            const radius = 10000; // Adjust this value as needed
  
            const x = radius * Math.sin(theta) * Math.cos(phi);
            const y = radius * Math.sin(theta) * Math.sin(phi);
            const z = radius * Math.cos(theta);
  
            // Calculate size based on visual magnitude (vmag)
            const size = 5 * Math.max(1, 20 - vmag); // Adjust this calculation as needed
            const scaleFactor = 1; // Adjust this value to change overall star sizes
  
            // Create star geometry
            const geometry = new THREE.SphereGeometry(size * scaleFactor, 18, 10);
  
            // Calculate star color based on B-V index
            const color = bv2rgb(bv);
  
            const material = new THREE.ShaderMaterial({
              uniforms: {
                baseColor: {
                  type: 'c',
                  value: new THREE.Color(color[0], color[1], color[2]),
                },
                viewVector: { type: 'v3', value: camera.position },
                starObjPosition: {
                  type: 'v3',
                  value: new THREE.Vector3(y, z, x),
                },
              },
              vertexShader: _VS,
              fragmentShader: _FS,
              blending: THREE.AdditiveBlending,
            });
  
            const star = new THREE.Mesh(geometry, material);
            star.position.set(y, z, x);
            star.name = name;
            star.ra = ra;
            star.dec = dec;
            star.userData.originalSize = size * scaleFactor;
            star.userData.ra = ra;
            star.userData.dec = dec;
  
            sky_group.add(star);
            stars_objs.push(star);
        })

        console.log(`Loaded ${stars_objs.length} stars`);
      
    }

    function load_skysphere() {
      var skygeo = new THREE.SphereGeometry(14000, 96, 48);

      sky_texture = textue_loader.load(
        `${process.env.PUBLIC_URL}/textures/starmap_16k_d57.jpg`
      );

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
    function lat2rot(lat) {
      return ((90 - lat) / 180) * Math.PI;
    }

    //convert a star's b-v temperature index to human eye color
    function bv2rgb(bv) {
      // RGB <0,1> <- BV <-0.4,+2.0> [-]
      var t;
      var r = 0.0;
      var g = 0.0;
      var b = 0.0;

      if (bv < -0.4) bv = -0.4;
      if (bv > 2.0) bv = 2.0;

      if (bv >= -0.4 && bv < 0.0) {
        t = (bv + 0.4) / (0.0 + 0.4);
        r = 0.61 + 0.11 * t + 0.1 * t * t;
      } else if (bv >= 0.0 && bv < 0.4) {
        t = (bv - 0.0) / (0.4 - 0.0);
        r = 0.83 + 0.17 * t;
      } else if (bv >= 0.4 && bv < 2.1) {
        t = (bv - 0.4) / (2.1 - 0.4);
        r = 1.0;
      }
      if (bv >= -0.4 && bv < 0.0) {
        t = (bv + 0.4) / (0.0 + 0.4);
        g = 0.7 + 0.07 * t + 0.1 * t * t;
      } else if (bv >= 0.0 && bv < 0.4) {
        t = (bv - 0.0) / (0.4 - 0.0);
        g = 0.87 + 0.11 * t;
      } else if (bv >= 0.4 && bv < 1.6) {
        t = (bv - 0.4) / (1.6 - 0.4);
        g = 0.98 - 0.16 * t;
      } else if (bv >= 1.6 && bv < 2.0) {
        t = (bv - 1.6) / (2.0 - 1.6);
        g = 0.82 - 0.5 * t * t;
      }
      if (bv >= -0.4 && bv < 0.4) {
        t = (bv + 0.4) / (0.4 + 0.4);
        b = 1.0;
      } else if (bv >= 0.4 && bv < 1.5) {
        t = (bv - 0.4) / (1.5 - 0.4);
        b = 1.0 - 0.47 * t + 0.1 * t * t;
      } else if (bv >= 1.5 && bv < 1.94) {
        t = (bv - 1.5) / (1.94 - 1.5);
        b = 0.63 - 0.6 * t * t;
      }
      return [r, g, b];
    }

    function createCompassMarkers() {
      const markerSize = 2; // Adjust size as needed
      const markerHeight = 0.5;
      const markerY = -2.4; // Adjust height as needed
      const textY = markerY + 2; // Height for text, above the markers
      const distanceFromCenter = 26; // Distance of markers from center

      const markerGeometry = new THREE.BoxGeometry(
        markerSize,
        markerHeight,
        markerSize
      );

      const markerMaterials = {
        N: new THREE.MeshStandardMaterial({ color: 0xe84d4d }), // Red
        E: new THREE.MeshStandardMaterial({ color: 0xa6a6a6 }), // Light Gray
        S: new THREE.MeshStandardMaterial({ color: 0x3d5ccc }), // Blue
        W: new THREE.MeshStandardMaterial({ color: 0xa6a6a6 }), // Light Gray
      };

      const directions = ['N', 'E', 'S', 'W'];
      const positions = [
        [0, 0, 1], // North
        [1, 0, 0], // East
        [0, 0, -1], // South
        [-1, 0, 0], // West
      ];

      directions.forEach((dir, index) => {
        const [x, y, z] = positions[index];

        // Create marker
        const marker = new THREE.Mesh(markerGeometry, markerMaterials[dir]);
        marker.position.set(
          x * distanceFromCenter,
          markerY,
          z * distanceFromCenter
        );
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
        sprite.position.set(
          x * (distanceFromCenter + 2),
          textY,
          z * (distanceFromCenter + 2)
        );

        ground_group.add(sprite);
      });
    }

    function load_ground() {
      var geom = new THREE.CylinderGeometry(50, 50, 0.5, 8);

      // Use absolute path and add error handling for texture loading
      textue_loader.load(
        `${process.env.PUBLIC_URL}/textures/grass_textures.jpg`,
        function (grass_texture) {
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
        function (error) {
          console.error(
            'An error happened while loading the grass texture:',
            error
          );
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
        // console.log(`Hovered star: ${hoveredStarName}`); // Debugging log

        if (lastHoveredStar && lastHoveredStar !== hoveredStarObject) {
          resizeStar(lastHoveredStar, 1); // Revert last hovered star to original size
        }

        if (lastHoveredStar !== hoveredStarObject) {
          resizeStar(hoveredStarObject, 6); // Increase size of currently hovered star
          console.log(`Hovered star: ${hoveredStarName}`);
        }
        console.log(hoveredStarObject)
        setHoveredStar({
          "name": hoveredStarObject.name,
          "ra": hoveredStarObject.ra,
          "dec": hoveredStarObject.dec
        });
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
      mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
      checkStarHover();
    }

    function createCoordinateGrid() {
      const lineColor = 0xD4AF37;
      const lineWidth = 0.25;
      console.log('Creating coordinate grid');
      const coordinateGroup = new THREE.Group();
      coordinateGroupRef.current = coordinateGroup;
    
      // Create RA lines and labels
      for (let i = 0; i < 12; i++) {
        const angle = (i / 12) * Math.PI * 2;
        const x = Math.cos(angle) * 10100;
        const z = Math.sin(angle) * 10100;
        
        // Create RA line
        const points = [];
        for (let j = -90; j <= 90; j++) {
          const y = 10100 * Math.sin(j * Math.PI / 180);
          const radius = 10100 * Math.cos(j * Math.PI / 180);
          points.push(new THREE.Vector3(x * radius / 10100, y, z * radius / 10100));
        }
        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        const material = new THREE.LineBasicMaterial({ 
          color: lineColor, 
          linewidth: lineWidth,
          transparent: true,
          opacity: 0.5
        });
        const line = new THREE.Line(geometry, material);
        coordinateGroup.add(line);
        
        // Create RA label
        const loader = new FontLoader();
        loader.load(`${process.env.PUBLIC_URL}/fonts/helvetiker_regular.typeface.json`, (font) => {
          const geometry = new TextGeometry(`${i*2}h`, {
            font: font,
            size: 200,
            height: 5,
          });
          const material = new THREE.MeshBasicMaterial({ 
            color: lineColor,
            linewidth: lineWidth,
            transparent: true,
            opacity: 0.5
          });
          const textMesh = new THREE.Mesh(geometry, material);
          textMesh.position.set(x, 0, z);
          textMesh.lookAt(0, 0, 0);
          coordinateGroup.add(textMesh);
        });
      }

      // Create Dec lines and labels
      for (let i = -80; i <= 80; i += 10) {
        // Skip the line near the camera center (0 degrees declination)
    
        const phi = (90 - Math.abs(i)) * Math.PI / 180; // Convert to radians
        const radius = 10100 * Math.sin(phi); // Radius of the declination circle
        const y = 10100 * Math.cos(phi) * Math.sign(i); // Y-position of the circle
    
        const points = [];
        for (let j = 0; j <= 360; j++) {
          const theta = j * Math.PI / 180;
          const x = radius * Math.cos(theta);
          const z = radius * Math.sin(theta);
          points.push(new THREE.Vector3(x, y, z));
        }
    
        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        const material = new THREE.LineBasicMaterial({ 
          color: lineColor,
          linewidth: lineWidth,
          transparent: true,
          opacity: 0.5
        });
        const line = new THREE.Line(geometry, material);
        coordinateGroup.add(line);
    
        // Create Dec label (if needed)
        if (i % 20 === 0) {
          const loader = new FontLoader();
          loader.load(`${process.env.PUBLIC_URL}/fonts/helvetiker_regular.typeface.json`, (font) => {
            const textGeometry = new TextGeometry(`${i}°`, {
              font: font,
              size: 200,
              height: 5,
            });
            const textMaterial = new THREE.MeshBasicMaterial({ color: lineColor });
            const textMesh = new THREE.Mesh(textGeometry, textMaterial);
            textMesh.position.set(radius, y, 0);
            textMesh.lookAt(0, 0, 0);
            coordinateGroup.add(textMesh);
          });
        }
      }

      sky_group.add(coordinateGroup);
    }
  
    
  
    function updateCoordinateDisplay() {
      const vector = new THREE.Vector3();
      camera.getWorldDirection(vector);
    
      // Rotate the vector to account for the sky_group rotation
      vector.applyAxisAngle(new THREE.Vector3(0, 0, 1), -Math.PI / 2);
    
      const phi = Math.atan2(vector.x, vector.z);
      const theta = Math.acos(vector.y);
    
      const ra = ((phi >= 0 ? phi : (2 * Math.PI + phi)) * (12 / Math.PI) + 6) % 24;
      const dec = 90 - (theta * (180 / Math.PI));
    
      setCurrentCoordinates({ ra: ra.toFixed(2), dec: dec.toFixed(2) });
    }

    function animate() {
      requestAnimationFrame(animate);

      sky_group.rotateOnWorldAxis(new THREE.Vector3(1, 0, 0), -rotSpeed);

      controls.update();
      updateCoordinateDisplay();
      //   checkStarHover();

      renderer.render(scene, camera);
    }

    function addDebugCubes() {
      // Create a green cube for positive y-axis
      const greenGeometry = new THREE.BoxGeometry(500, 500, 500);
      const greenMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
      const greenCube = new THREE.Mesh(greenGeometry, greenMaterial);
      greenCube.position.set(0, 10600, 0); // Slightly beyond the celestial sphere
      sky_group.add(greenCube);
    
      // Create a red cube for negative y-axis
      const redGeometry = new THREE.BoxGeometry(500, 500, 500);
      const redMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
      const redCube = new THREE.Mesh(redGeometry, redMaterial);
      redCube.position.set(0, -10600, 0); // Slightly beyond the celestial sphere
      sky_group.add(redCube);
    }

    function indexjs_setup() {
      scene = new THREE.Scene();
      camera = new THREE.PerspectiveCamera(
        60,
        window.innerWidth / window.innerHeight,
        0.1,
        15000
      );

      camera.position.set(100, 0, 0);

      // Make the camera look at the center of the scene
      // camera.lookAt(0, 0, 0);

      textue_loader = new THREE.TextureLoader();
      font_loader = new FontLoader();

      renderer = new THREE.WebGLRenderer({
        antialias: true,
        preserveDrawingBuffer: true,
        alpha: false,
      });
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

      camera.position.z = 0.01;

      sky_group = new THREE.Group();

      raycaster = new THREE.Raycaster();
      raycaster.params.Points.threshold = 1000; // Increase raycaster sensitivity
      mouse = new THREE.Vector2();

      load_stars();
      load_skysphere();
      createCoordinateGrid();
      // addDebugCubes();
      scene.add(sky_group);
      // load_ground();
      // sky_group.rotateOnWorldAxis(unit_i, cur_rot_rad);
      sky_group.rotation.z = Math.PI/2;

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
    const lineMaterial = new THREE.LineBasicMaterial({
      color: 0x5ef6ff, // 设置线条颜色为红色
      linewidth: 2, // 线条宽度
    });

    let selectedStars = []; // 存储用户点击的星星
    let lines = []; // 存储已经绘制的线条

    function onMouseClick(event) {
      if (mode == 'off') return;
      // 将鼠标位置转换为标准化设备坐标 (NDC)
      mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

      // 设置 raycaster，从相机通过鼠标位置发出
      raycaster.setFromCamera(mouse, camera);

      // 检测光线与场景中所有星星的相交
      const intersects = raycaster.intersectObjects(stars_objs);

      if (intersects.length > 0) {
        const selectedStar = intersects[0].object; // 获取第一个相交的星星
        console.log('Selected star:', selectedStars);

        // 将选中的星星存储在 selectedStars 数组中
        selectedStars.push(selectedStar);
        if (selectedStars.length === 2) {
          const startPosition = selectedStars[0].position;
          const endPosition = selectedStars[1].position;

          const existingLineIndex = lines.findIndex(
            (line) =>
              (line.start === startPosition && line.end === endPosition) ||
              (line.start === endPosition && line.end === startPosition)
          );

          if (existingLineIndex !== -1) {
            // 如果线条存在，移除它并从 lines 数组中删除
            const existingLine = lines[existingLineIndex].line;
            sky_group.remove(existingLine); // 从场景中移除
            lines.splice(existingLineIndex, 1); // 从数组中删除
          } else {
            const points = [startPosition, endPosition];
            const geometry = new THREE.BufferGeometry().setFromPoints(points);

            // 使用已有的线条材质绘制线
            const line = new THREE.Line(geometry, lineMaterial);
            sky_group.add(line);

            // 将新线条的起点、终点和线条对象存储起来
            lines.push({
              start: startPosition,
              end: endPosition,
              line: line,
            });
          }
          selectedStars = [];
        }
      }
    }

    // 将鼠标点击事件绑定到窗口
    window.addEventListener('click', onMouseClick);
    setWRenderer(renderer);
    return () => {
      window.removeEventListener('mousemove', onMouseMove, false);
      window.removeEventListener('resize', window_resize);

      // Check if mountRef.current is not null before removing the child
      if (mountRef.current && mountRef.current.contains(renderer.domElement)) {
        mountRef.current.removeChild(renderer.domElement);
      }
    };
  }, [rotSpeed, latitude , exRa, exDec, exDistance , oriStarData]);

  const handleRotSpeedChange = (event) => {
    setRotSpeed(parseFloat(event.target.value) / 10000);
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

  const exportAsImage = (format = 'image/png') => {
    if (!wrenderer) return;
    // 使用 toDataURL 方法将场景内容转换为 base64 图片
    const imgData = wrenderer.domElement.toDataURL(format);
    // 创建一个临时链接，用于下载图片
    const link = document.createElement('a');
    link.href = imgData;
    link.download = format === 'image/jpeg' ? 'scene.jpeg' : 'scene.png';
    link.click();
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
            onChange={(e) => setTempRotSpeed(e.target.value/10000)}
            onMouseUp={handleRotSpeedChange}
          />
        </label>
        <br />
        <label>Constellation Mode:</label>
        <button
          onClick={toggleMode}
          style={{
            marginLeft: '10px',
            cursor: 'pointer',
            borderRadius: '5px',
            border: 'none',
          }}
        >
          {mode === 'on' ? 'On' : 'Off'}
        </button>
        <br />
        <label>Export Screen:</label>
        <button
          onClick={() => exportAsImage('image/png')}
          style={{
            marginLeft: '10px',
            cursor: 'pointer',
            borderRadius: '5px',
            border: 'none',
          }}
        >
          Export PNG
        </button>
        <button
          onClick={() => exportAsImage('image/jpeg')}
          style={{
            marginLeft: '10px',
            cursor: 'pointer',
            borderRadius: '5px',
            border: 'none',
          }}
        >
          Export JPEG
        </button>
        <br />
        <br />
        <button
          onClick={toggleCoordinates}
          style={{
            cursor: 'pointer',
            borderRadius: '5px',
            border: 'none',
            backgroundColor: showCoordinates ? 'green' : 'red',
            color: 'white',
            padding: '5px 10px',
          }}
        >
          {showCoordinates ? 'Hide Coordinates' : 'Show Coordinates'}
        </button>

        <ul style={{ listStyleType: 'none', padding: 0, margin: 0 }}>
          {suggestions.map((suggestion, index) => (
            <li
              key={index}
              onClick={() => selectStar(suggestion)}
              style={{
                cursor: 'pointer',
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                padding: '5px',
              }}
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
        <div
          style={{
            position: 'absolute',
            bottom: 30,
            left: 10,
            color: 'white',
            backgroundColor: 'rgba(0,0,0,0.5)',
            padding: '5px 10px',
            borderRadius: '5px',
          }}
        >
          Star Info <br/>
          name: {hoveredStar.name} <br/>
          ra:  {hoveredStar.ra}<br/>
          dec: {hoveredStar.dec}
        </div>
      )}

      <div style={{
        position: 'absolute',
        bottom: 10,
        right: 10,
        color: 'white',
        backgroundColor: 'rgba(0,0,0,0.5)',
        padding: '5px 10px',
        borderRadius: '5px',
      }}>
        RA: {currentCoordinates.ra}h, Dec: {currentCoordinates.dec}°
      </div>
      <div style={{
        position: 'absolute',
        bottom: 10,
        left: 10,
        color: 'white',
        backgroundColor: 'rgba(0,0,0,0.5)',
        padding: '5px 10px',
        borderRadius: '5px',
      }}>
        Current Planet: {exName}
      </div>
    </div>
  );
};

export default StarryNight;
