const THREE = window.THREE;
const canvas = document.getElementById('gameCanvas');
const playfield = document.querySelector('.playfield');
const scoreElement = document.getElementById('score');
const bestElement = document.getElementById('best');
const overlay = document.getElementById('overlay');
const overlayCopy = document.getElementById('overlayCopy');
const startButton = document.getElementById('startButton');
const runStatus = document.getElementById('runStatus');
const worldLabel = document.getElementById('worldLabel');
const sprintMeter = document.getElementById('sprintMeter');

const GRAVITY = 22;
const JUMP_SPEED = 10.4;
const PLAYER_RADIUS = 0.28;
const PLAYER_HEIGHT = 1.65;
const MOUSE_SENSITIVITY = 0.0025;
const mouseSensitivitySetting = document.getElementById('mouseSensitivity');
const mouseSensitivityValue = document.getElementById('mouseSensitivityValue');
const ROUTE_RADIUS = 16;
const ROUTE_STEPS_PER_LAP = 32;
const JUMP_BUFFER_DURATION = 0.12;
const COYOTE_DURATION = 0.1;
const SPRINT_DRAIN_RATE = 34;
const SPRINT_RECOVERY_RATE = 22;
const MANTLE_DURATION = 0.52;
const keys = new Set();
const touchKeys = new Set();
const platforms = [];
const random = (seed) => {
  let value = seed >>> 0;
  return () => {
    value = (value * 1664525 + 1013904223) >>> 0;
    return value / 4294967296;
  };
};

let renderer;
try {
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
} catch (error) {
  console.error('ONLY UP could not create a WebGL renderer:', error);
  overlayCopy.textContent = '3D graphics are unavailable in this browser. Try enabling hardware acceleration or using a WebGL-capable browser.';
  startButton.disabled = true;
  throw error;
}

renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.65));
renderer.setSize(playfield.clientWidth, playfield.clientWidth * 2 / 3, false);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.96;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x9ac4df);
scene.fog = new THREE.Fog(0xc3d4d7, 180, 600);
const camera = new THREE.PerspectiveCamera(67, 1, 0.1, 700);
const cameraTarget = new THREE.Vector3();
const cameraPosition = new THREE.Vector3();
const world = new THREE.Group();
scene.add(world);

scene.add(new THREE.HemisphereLight(0xdff2ff, 0x68604d, 1.55));
const sunlight = new THREE.DirectionalLight(0xffe6bd, 2.65);
sunlight.position.set(-38, 72, -28);
sunlight.castShadow = true;
sunlight.shadow.mapSize.set(2048, 2048);
sunlight.shadow.camera.left = -38;
sunlight.shadow.camera.right = 38;
sunlight.shadow.camera.top = 48;
sunlight.shadow.camera.bottom = -32;
sunlight.shadow.camera.near = 1;
sunlight.shadow.camera.far = 150;
sunlight.shadow.bias = -0.00025;
sunlight.shadow.normalBias = 0.035;
scene.add(sunlight);
scene.add(sunlight.target);

const shared = {
  box: new THREE.BoxGeometry(1, 1, 1),
  pebble: new THREE.DodecahedronGeometry(1, 0),
  trunk: new THREE.CylinderGeometry(0.13, 0.23, 1, 6),
  rebar: new THREE.CylinderGeometry(0.035, 0.035, 1, 8),
};

function makeNoiseTexture(kind, seed) {
  const textureCanvas = document.createElement('canvas');
  textureCanvas.width = 256;
  textureCanvas.height = 256;
  const textureContext = textureCanvas.getContext('2d');
  const generator = random(seed);
  const palette = kind === 'wood'
    ? ['#69432d', '#80583a', '#503a2b', '#a17850']
    : kind === 'metal'
      ? ['#59635f', '#75807b', '#424c4a', '#a0a092']
      : kind === 'grass'
        ? ['#596346', '#718051', '#4b5c42', '#918261']
        : ['#77766d', '#8e8b7e', '#62645e', '#a7a08e'];
  const gradient = textureContext.createLinearGradient(0, 0, 256, 256);
  gradient.addColorStop(0, palette[0]);
  gradient.addColorStop(0.5, palette[1]);
  gradient.addColorStop(1, palette[2]);
  textureContext.fillStyle = gradient;
  textureContext.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 950; i += 1) {
    textureContext.globalAlpha = 0.08 + generator() * 0.17;
    textureContext.fillStyle = palette[Math.floor(generator() * palette.length)];
    const size = kind === 'wood' ? 1 + generator() * 2 : 1 + generator() * 3;
    textureContext.fillRect(generator() * 256, generator() * 256, size, size);
  }
  textureContext.globalAlpha = 0.22;
  if (kind === 'wood') {
    for (let row = 0; row < 8; row += 1) {
      const y = row * 36 + generator() * 12;
      textureContext.fillStyle = '#33271e';
      textureContext.fillRect(0, y, 256, 2);
      textureContext.fillStyle = '#b28a5c';
      textureContext.fillRect(0, y + 3, 256, 1);
      for (let knot = 0; knot < 3; knot += 1) {
        textureContext.beginPath();
        textureContext.ellipse(generator() * 256, y + 12, 4 + generator() * 5, 2, 0, 0, Math.PI * 2);
        textureContext.strokeStyle = '#3d3024';
        textureContext.lineWidth = 1;
        textureContext.stroke();
      }
    }
  } else if (kind === 'stone') {
    textureContext.strokeStyle = '#363a37';
    textureContext.lineWidth = 1;
    for (let crack = 0; crack < 12; crack += 1) {
      let x = generator() * 256;
      let y = generator() * 256;
      textureContext.beginPath();
      textureContext.moveTo(x, y);
      for (let step = 0; step < 3; step += 1) {
        x += (generator() - 0.5) * 28;
        y += (generator() - 0.5) * 28;
        textureContext.lineTo(x, y);
      }
      textureContext.stroke();
    }
  }
  textureContext.globalAlpha = 1;
  const texture = new THREE.CanvasTexture(textureCanvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
  return texture;
}

const materials = {
  concrete: new THREE.MeshStandardMaterial({ map: makeNoiseTexture('stone', 103), roughness: 0.94 }),
  stone: new THREE.MeshStandardMaterial({ map: makeNoiseTexture('stone', 317), roughness: 1 }),
  wood: new THREE.MeshStandardMaterial({ map: makeNoiseTexture('wood', 921), roughness: 0.86 }),
  metal: new THREE.MeshStandardMaterial({ map: makeNoiseTexture('metal', 641), roughness: 0.68, metalness: 0.42 }),
  rust: new THREE.MeshStandardMaterial({ color: 0x93624a, roughness: 0.82, metalness: 0.18 }),
  grass: new THREE.MeshStandardMaterial({ map: makeNoiseTexture('grass', 271), roughness: 1 }),
  trunk: new THREE.MeshStandardMaterial({ color: 0x5f4935, roughness: 1 }),
  rock: new THREE.MeshStandardMaterial({ color: 0x6d706a, roughness: 1 }),
  darkMetal: new THREE.MeshStandardMaterial({ color: 0x384346, roughness: 0.63, metalness: 0.52 }),
  skin: new THREE.MeshStandardMaterial({ color: 0xb77f5d, roughness: 0.8 }),
  hoodie: new THREE.MeshStandardMaterial({ color: 0x385b56, roughness: 0.91 }),
  hoodieLight: new THREE.MeshStandardMaterial({ color: 0x557268, roughness: 0.92 }),
  trousers: new THREE.MeshStandardMaterial({ color: 0x353c3d, roughness: 0.95 }),
  boot: new THREE.MeshStandardMaterial({ color: 0x262b2c, roughness: 0.88 }),
  backpack: new THREE.MeshStandardMaterial({ color: 0x80563c, roughness: 0.93 }),
  porcelain: new THREE.MeshStandardMaterial({ color: 0xe7e5d9, roughness: 0.26 }),
  cushion: new THREE.MeshStandardMaterial({ color: 0x8c5142, roughness: 0.94 }),
  fridge: new THREE.MeshStandardMaterial({ color: 0x89958e, roughness: 0.5, metalness: 0.32 }),
  tire: new THREE.MeshStandardMaterial({ color: 0x292d2d, roughness: 0.98 }),
  cushionLight: new THREE.MeshStandardMaterial({ color: 0xc3a77b, roughness: 0.95 }),
};
materials.grass.map.repeat.set(72, 72);

function makeMountain(seed, snowline) {
  const geometry = new THREE.SphereGeometry(1, 28, 18);
  const positions = geometry.attributes.position;
  const colors = [];
  const generator = random(seed);
  for (let i = 0; i < positions.count; i += 1) {
    const direction = new THREE.Vector3(positions.getX(i), positions.getY(i), positions.getZ(i)).normalize();
    const ridge = 0.88 + generator() * 0.22 + Math.sin(direction.x * 11 + seed) * 0.045;
    const height = direction.y * ridge + Math.max(0, direction.y) ** 3 * 0.22;
    positions.setXYZ(i, direction.x * ridge, height, direction.z * ridge);
    const blend = THREE.MathUtils.smoothstep(direction.y, snowline - 0.18, snowline + 0.22);
    const shade = 0.96 + generator() * 0.08;
    colors.push(
      THREE.MathUtils.lerp(0.3, 0.38, blend) * shade,
      THREE.MathUtils.lerp(0.35, 0.4, blend) * shade,
      THREE.MathUtils.lerp(0.29, 0.36, blend) * shade,
    );
  }
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  geometry.computeVertexNormals();
  return geometry;
}

const mountainMaterial = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1 });
const foliageMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 1 });

function createSky() {
  const skyCanvas = document.createElement('canvas');
  skyCanvas.width = 2048;
  skyCanvas.height = 1024;
  const sky = skyCanvas.getContext('2d');
  const gradient = sky.createLinearGradient(0, 0, 0, 1024);
  gradient.addColorStop(0, '#4e9bd2');
  gradient.addColorStop(0.38, '#8fc6e5');
  gradient.addColorStop(0.72, '#c6d9d7');
  gradient.addColorStop(1, '#e2d3b3');
  sky.fillStyle = gradient;
  sky.fillRect(0, 0, 2048, 1024);
  const sunGlow = sky.createRadialGradient(1390, 250, 12, 1390, 250, 300);
  sunGlow.addColorStop(0, 'rgba(255,244,218,0.95)');
  sunGlow.addColorStop(0.12, 'rgba(255,231,184,0.45)');
  sunGlow.addColorStop(1, 'rgba(255,225,172,0)');
  sky.fillStyle = sunGlow;
  sky.fillRect(1090, 0, 600, 550);
  sky.fillStyle = 'rgba(255,247,226,0.68)';
  sky.beginPath();
  sky.arc(1390, 250, 42, 0, Math.PI * 2);
  sky.fill();
  const generator = random(7921);
  for (let i = 0; i < 52; i += 1) {
    const x = generator() * 2048;
    const y = 110 + generator() * 390;
    const width = 25 + generator() * 150;
    sky.fillStyle = `rgba(255,255,255,${0.035 + generator() * 0.08})`;
    sky.beginPath();
    sky.ellipse(x, y, width, 5 + generator() * 18, 0, 0, Math.PI * 2);
    sky.ellipse(x + width * 0.4, y + 2, width * 0.55, 6 + generator() * 10, 0, 0, Math.PI * 2);
    sky.fill();
  }
  const texture = new THREE.CanvasTexture(skyCanvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.mapping = THREE.EquirectangularReflectionMapping;
  scene.background = texture;
}

function addLandscape() {
  const ground = new THREE.Mesh(new THREE.CircleGeometry(420, 64), materials.grass);
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -31;
  ground.receiveShadow = true;
  world.add(ground);

  const generator = random(847);
  for (let i = 0; i < 36; i += 1) {
    const angle = generator() * Math.PI * 2;
    const distance = 230 + generator() * 210;
    const height = 32 + generator() * 28;
    const radius = 28 + generator() * 46;
    const mountain = new THREE.Mesh(makeMountain(i * 83 + 17, 0.59 + generator() * 0.16), mountainMaterial);
    mountain.position.set(Math.cos(angle) * distance, -43 + height * 0.22, Math.sin(angle) * distance);
    mountain.rotation.y = generator() * Math.PI;
    mountain.scale.set(radius, height, radius * (0.7 + generator() * 0.7));
    world.add(mountain);
  }

  const trees = 520;
  const trunks = new THREE.InstancedMesh(shared.trunk, materials.trunk, trees);
  const crownGeometry = new THREE.ConeGeometry(1, 1, 7, 1);
  const crownLayers = [
    new THREE.InstancedMesh(crownGeometry, foliageMaterial, trees),
    new THREE.InstancedMesh(crownGeometry, foliageMaterial, trees),
    new THREE.InstancedMesh(crownGeometry, foliageMaterial, trees),
  ];
  const broadleaf = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 1), foliageMaterial, Math.floor(trees / 8));
  const dummy = new THREE.Object3D();
  const canopyOffsets = [[0, 0], [0.24, -0.12], [-0.2, 0.16]];
  for (let i = 0; i < trees; i += 1) {
    const angle = generator() * Math.PI * 2;
    const distance = 42 + generator() * 103;
    const height = 5 + generator() * 10;
    const x = Math.cos(angle) * distance;
    const z = Math.sin(angle) * distance;
    const baseY = -26 + generator() * 2;
    const lean = generator() * Math.PI;
    dummy.position.set(x, baseY + height * 0.22, z);
    dummy.rotation.set(0, lean, (generator() - 0.5) * 0.08);
    dummy.scale.set(0.6 + generator() * 0.45, height * 0.55, 0.6 + generator() * 0.45);
    dummy.updateMatrix();
    trunks.setMatrixAt(i, dummy.matrix);
    const treeWidth = 1.3 + generator() * 1.15;
    for (let layer = 0; layer < crownLayers.length; layer += 1) {
      const layerIndex = i;
      const crownHeight = [0.46, 0.4, 0.33][layer];
      const crownPosition = [0.55, 0.74, 0.9][layer];
      const crownWidth = [1.35, 1.08, 0.76][layer];
      dummy.position.set(
        x + treeWidth * canopyOffsets[layer][0],
        baseY + height * (crownPosition + (generator() - 0.5) * 0.025),
        z + treeWidth * canopyOffsets[layer][1],
      );
      dummy.scale.set(treeWidth * crownWidth, height * crownHeight, treeWidth * crownWidth);
      dummy.rotation.set(generator() * 0.16, lean + layer * 0.7, generator() * 0.16);
      dummy.updateMatrix();
      crownLayers[layer].setMatrixAt(layerIndex, dummy.matrix);
      const tint = new THREE.Color().setHSL(0.25 + generator() * 0.06, 0.24 + generator() * 0.13, 0.25 + generator() * 0.1);
      crownLayers[layer].setColorAt(layerIndex, tint);
    }
    if (i % 8 === 0) {
      const leafIndex = Math.floor(i / 8);
      dummy.position.set(x + (generator() - 0.5) * 2, baseY + height * 0.66, z + (generator() - 0.5) * 2);
      dummy.scale.set(treeWidth * 1.55, height * 0.34, treeWidth * 1.62);
      dummy.rotation.set(generator(), lean, generator());
      dummy.updateMatrix();
      broadleaf.setMatrixAt(leafIndex, dummy.matrix);
      broadleaf.setColorAt(leafIndex, new THREE.Color().setHSL(0.24 + generator() * 0.08, 0.22, 0.3 + generator() * 0.08));
    }
  }
  trunks.castShadow = true;
  crownLayers[0].castShadow = true;
  broadleaf.castShadow = true;
  world.add(trunks, ...crownLayers, broadleaf);

  for (let i = 0; i < 28; i += 1) {
    const cloud = new THREE.Mesh(
      new THREE.SphereGeometry(1, 12, 8),
      new THREE.MeshBasicMaterial({ color: 0xf3f4ea, transparent: true, opacity: 0.25, depthWrite: false }),
    );
    const angle = generator() * Math.PI * 2;
    const distance = 45 + generator() * 120;
    cloud.position.set(Math.cos(angle) * distance, -7 + generator() * 35, Math.sin(angle) * distance);
    const scale = 8 + generator() * 17;
    cloud.scale.set(scale * 1.8, scale * 0.32, scale);
    world.add(cloud);
  }
}

function addSpiralLandmark() {
  const tower = new THREE.Group();
  tower.position.set(0, -31, ROUTE_RADIUS);
  const core = new THREE.Mesh(
    new THREE.CylinderGeometry(1.45, 2.1, 108, 10, 1, false),
    materials.concrete,
  );
  core.position.y = 54;
  core.castShadow = true;
  core.receiveShadow = true;
  tower.add(core);

  const supportGeometry = new THREE.CylinderGeometry(0.1, 0.13, 108, 6);
  const supportMaterial = new THREE.MeshStandardMaterial({ color: 0x4a514f, roughness: 0.76, metalness: 0.38 });
  const ringGeometry = new THREE.TorusGeometry(2.9, 0.11, 6, 20);
  const ringMaterial = new THREE.MeshStandardMaterial({ color: 0x75634d, roughness: 0.9, metalness: 0.16 });
  for (let post = 0; post < 8; post += 1) {
    const angle = post / 8 * Math.PI * 2;
    const beam = new THREE.Mesh(supportGeometry, supportMaterial);
    beam.position.set(Math.sin(angle) * 2.65, 54, Math.cos(angle) * 2.65);
    beam.rotation.z = Math.cos(angle) * -0.035;
    beam.rotation.x = Math.sin(angle) * 0.035;
    beam.castShadow = true;
    tower.add(beam);
  }
  for (let level = 0; level < 12; level += 1) {
    const ring = new THREE.Mesh(ringGeometry, ringMaterial);
    ring.position.y = 3 + level * 8.2;
    ring.rotation.x = Math.PI / 2;
    ring.castShadow = true;
    tower.add(ring);
    if (level % 2 === 0) {
      const brace = new THREE.Mesh(
        new THREE.TorusGeometry(2.4, 0.045, 4, 20),
        materials.rust,
      );
      brace.position.y = ring.position.y - 0.4;
      brace.rotation.x = Math.PI / 2;
      tower.add(brace);
    }
  }
  world.add(tower);
}

createSky();
addLandscape();
addSpiralLandmark();

function makeBlock(parent, x, y, z, width, height, depth, material, rotationY = 0, rotationZ = 0) {
  const mesh = new THREE.Mesh(shared.box, material);
  mesh.position.set(x, y, z);
  mesh.scale.set(width, height, depth);
  mesh.rotation.set(0, rotationY, rotationZ);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

function decoratePlatform(group, platform, generator) {
  const { y, width, depth, index, stage, kind, propHeight } = platform;
  const x = 0;
  const z = 0;
  if (kind === 'toilet') {
    const bowlBase = y - propHeight;
    const bowlProfile = [
      new THREE.Vector2(0.18, 0),
      new THREE.Vector2(0.24, 0.12),
      new THREE.Vector2(0.32, 0.36),
      new THREE.Vector2(0.36, 0.57),
      new THREE.Vector2(0.3, 0.7),
      new THREE.Vector2(0.23, 0.72),
    ];
    const bowl = new THREE.Mesh(new THREE.LatheGeometry(bowlProfile, 18), materials.porcelain);
    bowl.position.set(x, bowlBase, z);
    bowl.castShadow = true;
    group.add(bowl);
    const seat = new THREE.Mesh(new THREE.TorusGeometry(0.275, 0.055, 8, 20), materials.porcelain);
    seat.rotation.x = Math.PI / 2;
    seat.position.set(x, y - 0.045, z + 0.015);
    seat.castShadow = true;
    group.add(seat);
    makeBlock(group, x, bowlBase + 0.48, z - 0.4, 0.54, 0.64, 0.28, materials.porcelain);
    makeBlock(group, x, bowlBase + 0.17, z - 0.4, 0.57, 0.06, 0.31, materials.darkMetal);
  } else if (kind === 'sofa') {
    makeBlock(group, x, y - 0.3, z, 1.45, 0.48, 0.9, materials.cushion);
    makeBlock(group, x, y - 0.08, z + 0.24, 1.34, 0.18, 0.52, materials.cushionLight);
    makeBlock(group, x, y + 0.23, z - 0.33, 1.42, 0.58, 0.24, materials.cushion);
    for (const side of [-1, 1]) makeBlock(group, side * 0.65, y - 0.12, z, 0.18, 0.55, 0.92, materials.cushion);
  } else if (kind === 'fridge') {
    makeBlock(group, x, y - propHeight / 2, z, 0.98, propHeight, 0.88, materials.fridge);
    makeBlock(group, x, y - 0.04, z + 0.45, 0.85, 0.025, 0.025, materials.darkMetal);
    makeBlock(group, x + 0.33, y - 0.8, z + 0.48, 0.045, 0.38, 0.045, materials.darkMetal);
    makeBlock(group, x, y - 0.09, z, 1.04, 0.12, 0.94, materials.darkMetal);
  } else if (kind === 'barrels') {
    for (const offset of [-0.32, 0.32]) {
      const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.31, 0.36, propHeight, 12), materials.rust);
      barrel.position.set(offset, y - propHeight / 2, 0);
      barrel.castShadow = true;
      group.add(barrel);
      for (const bandY of [y - propHeight * 0.75, y - propHeight * 0.28]) {
        const band = new THREE.Mesh(new THREE.TorusGeometry(0.33, 0.025, 6, 12), materials.darkMetal);
        band.rotation.x = Math.PI / 2;
        band.position.set(offset, bandY, 0);
        group.add(band);
      }
    }
  } else if (kind === 'tires') {
    for (let layer = 0; layer < 2; layer += 1) {
      const tire = new THREE.Mesh(new THREE.TorusGeometry(0.39, 0.16, 8, 16), materials.tire);
      tire.rotation.x = Math.PI / 2;
      tire.position.set(layer % 2 ? 0.12 : -0.12, y - propHeight + 0.4 + layer * 0.31, 0);
      tire.castShadow = true;
      group.add(tire);
    }
  } else if (kind === 'mantle') {
    makeBlock(group, x, y - 0.09, z, width, 0.18, depth, materials.concrete);
    makeBlock(group, x - 0.58, y - propHeight / 2, z, 0.28, propHeight, depth * 0.92, materials.concrete);
    for (const rungY of [y - 0.34, y - 0.68, y - 1.02, y - 1.36]) {
      makeBlock(group, x - 0.39, rungY, z + depth * 0.39, 0.16, 0.1, 0.16, materials.rust);
    }
  } else if (kind === 'beam') {
    makeBlock(group, x, y - propHeight / 2, z, width * 0.92, propHeight, 0.58, materials.wood);
    makeBlock(group, x, y - 0.05, z, width * 0.96, 0.1, 0.68, materials.darkMetal);
  } else if (kind === 'crate') {
    makeBlock(group, x, y - propHeight / 2, z, 1.18, propHeight, 1.08, materials.wood);
    makeBlock(group, x, y - 0.04, z + 0.55, 1.16, 0.08, 0.04, materials.darkMetal);
  } else if (kind === 'pallet') {
    for (const plankX of [-0.46, -0.16, 0.16, 0.46]) {
      makeBlock(group, plankX, y - 0.05, z, 0.24, 0.1, 1.06, materials.wood);
    }
    for (const railZ of [-0.38, 0, 0.38]) {
      makeBlock(group, 0, y - 0.22, z + railZ, 1.16, 0.18, 0.2, materials.darkMetal);
    }
  } else if (kind === 'rail') {
    makeBlock(group, x, y - 0.06, z, width, 0.12, depth, materials.metal);
    for (const side of [-1, 1]) {
      makeBlock(group, side * width * 0.34, y + 0.48, z, 0.11, 0.96, 0.12, materials.rust);
      makeBlock(group, side * width * 0.34, y + 0.88, z, 0.12, 0.12, depth, materials.rust);
    }
  } else if (index > 1 && index % 3 === 0) {
    const rock = new THREE.Mesh(shared.pebble, materials.rock);
    rock.position.set(x - width * 0.27, y + 0.4, z + depth * 0.14);
    rock.scale.set(0.48 + generator() * 0.22, 0.45 + generator() * 0.3, 0.46 + generator() * 0.24);
    rock.rotation.set(generator(), generator(), generator());
    rock.castShadow = true;
    rock.receiveShadow = true;
    group.add(rock);
  } else if (index > 2 && index % 5 === 0) {
    const crateSize = 0.72 + generator() * 0.18;
    makeBlock(group, x + width * 0.28, y + crateSize / 2, z - depth * 0.15, crateSize, crateSize, crateSize, materials.wood, generator() * 0.2);
    for (const offset of [-0.22, 0.22]) {
      makeBlock(group, x + width * 0.28 + offset, y + crateSize / 2, z - depth * 0.15 + crateSize / 2 + 0.012, 0.035, crateSize * 0.9, 0.025, materials.darkMetal);
    }
  }
  if (stage > 1 && index % 4 === 1) {
    const rebar = new THREE.Mesh(shared.rebar, materials.rust);
    rebar.rotation.z = Math.PI / 2;
    rebar.scale.set(width * 0.25, 1, 1);
    rebar.position.set(x, y + 0.37, z - depth * 0.22);
    rebar.castShadow = true;
    group.add(rebar);
  }
}

const PROP_KINDS = ['crate', 'beam', 'sofa', 'toilet', 'mantle', 'fridge', 'tires', 'barrels', 'rail', 'pallet'];

function platformKind(index) {
  return index === 0 ? 'start' : PROP_KINDS[(index - 1) % PROP_KINDS.length];
}

function routeAngle(index) {
  return index * Math.PI * 2 / ROUTE_STEPS_PER_LAP;
}

function routeYaw(index) {
  return Math.PI / 2 - routeAngle(index);
}

function routePoint(index) {
  const angle = routeAngle(index);
  return { x: ROUTE_RADIUS * Math.sin(angle), z: ROUTE_RADIUS * (1 - Math.cos(angle)) };
}

function createPlatform(x, z, y, width, index, generator) {
  const stage = Math.floor(index / 8);
  const kind = platformKind(index);
  const mantleRequired = kind === 'mantle';
  const propHeight = kind === 'toilet' ? 0.82
    : kind === 'sofa' ? 0.62
      : kind === 'fridge' ? 1.48
        : kind === 'tires' ? 0.92
          : kind === 'barrels' ? 1.08
            : kind === 'crate' || kind === 'pallet' ? 0.88
              : kind === 'beam' ? 0.5
                : kind === 'mantle' ? y - platforms[platforms.length - 1].y : 0;
  const platformWidth = index === 0 ? 4.2
    : kind === 'toilet' ? 0.86
      : kind === 'barrels' ? 1.12
        : kind === 'tires' ? 1.18
          : kind === 'fridge' ? 1.2
            : kind === 'crate' || kind === 'pallet' ? 1.28
              : kind === 'beam' ? Math.max(1.7, width) : kind === 'sofa' ? 1.6 : Math.max(1.65, width);
  const depth = index === 0 ? 4.2
    : kind === 'toilet' ? 0.86
      : kind === 'barrels' ? 0.9
        : kind === 'fridge' ? 1.05
          : kind === 'crate' || kind === 'pallet' ? 1.18
            : kind === 'beam' ? 0.78 : kind === 'sofa' ? 1.15 : Math.max(1.55, 2.1 - stage * 0.04);
  const collisionTopY = y + (kind === 'toilet' ? 0.285 : kind === 'tires' ? 0.34 : 0);
  const collisionTopWidth = kind === 'toilet' ? 0.66 : kind === 'tires' ? 1.32 : platformWidth;
  const collisionTopDepth = kind === 'toilet' ? 0.66 : kind === 'tires' ? 1.1 : depth;
  const angle = routeAngle(index);
  const platform = {
    x, z, y, width: platformWidth, depth, index, stage, kind, propHeight, mantleRequired,
    collisionTopY, collisionTopWidth, collisionTopDepth, baseTopY: y - propHeight,
    yaw: -angle, group: new THREE.Group(),
  };
  if (mantleRequired) {
    const previous = platforms[platforms.length - 1];
    platform.approachY = previous.y;
    platform.approachWidth = Math.hypot(previous.x - x, previous.z - z) + 0.64;
    makeBlock(
      platform.group,
      -platform.approachWidth / 2,
      platform.approachY - 0.09,
      0,
      platform.approachWidth,
      0.18,
      0.86,
      materials.wood,
    );
    makeBlock(platform.group, -platform.approachWidth / 2, platform.approachY - 0.03, -0.44,
      platform.approachWidth, 0.08, 0.05, materials.rust);
    makeBlock(platform.group, -platform.approachWidth / 2, platform.approachY - 0.03, 0.44,
      platform.approachWidth, 0.08, 0.05, materials.rust);
  }
  if (kind === 'mantle') {
    platform.obstacle = { x: -0.58, z: 0, width: 0.28, depth: depth * 0.92 };
  } else if (kind === 'crate' || kind === 'pallet') {
    platform.obstacle = { x: 0, z: 0, width: 1.18, depth: 1.08 };
  } else if (kind === 'beam') {
    platform.obstacle = { x: 0, z: 0, width: platformWidth * 0.92, depth: 0.68 };
  } else if (kind === 'sofa') {
    platform.obstacle = { x: 0, z: 0, width: 1.45, depth: 0.92 };
  } else if (kind === 'toilet') {
    platform.obstacle = { x: 0, z: -0.12, width: 0.72, depth: 0.96 };
  } else if (kind === 'fridge') {
    platform.obstacle = { x: 0, z: 0, width: 0.98, depth: 0.94 };
  } else if (kind === 'tires') {
    platform.obstacle = { x: 0, z: 0, width: 1.08, depth: 1.08 };
  } else if (kind === 'barrels') {
    platform.obstacle = { x: 0, z: 0, width: 1.35, depth: 0.78 };
  }
  platform.group.position.set(x, 0, z);
  platform.group.rotation.y = platform.yaw;
  const slabMaterial = kind === 'beam' || kind === 'sofa' ? materials.wood
    : kind === 'fridge' || kind === 'barrels' || kind === 'rail' ? materials.metal : materials.concrete;
  const baseThickness = kind === 'start' ? 0.62 : 0.18;
  const baseTop = y - propHeight;
  makeBlock(platform.group, 0, baseTop - baseThickness / 2, 0,
    kind === 'start' ? 4.2 : platformWidth + 0.14,
    baseThickness,
    kind === 'start' ? 4.2 : depth + 0.14,
    slabMaterial);
  if (kind !== 'toilet' && kind !== 'sofa' && kind !== 'fridge' && kind !== 'barrels'
    && kind !== 'tires' && kind !== 'mantle' && kind !== 'crate') {
    const rubbleCount = index === 0 ? 0 : 1 + Math.floor(generator() * 3);
    for (let i = 0; i < rubbleCount; i += 1) {
      const rubble = new THREE.Mesh(shared.pebble, i % 2 ? materials.stone : materials.rock);
      rubble.position.set((generator() - 0.5) * platformWidth * 0.48, baseTop + 0.06, (generator() - 0.5) * depth * 0.48);
      rubble.scale.set(0.12 + generator() * 0.2, 0.05 + generator() * 0.13, 0.12 + generator() * 0.21);
      rubble.rotation.set(generator(), generator(), generator());
      rubble.castShadow = true;
      platform.group.add(rubble);
    }
    if (index > 0 && kind !== 'mantle') {
      const supportMaterial = kind === 'fridge' || kind === 'barrels' || kind === 'rail'
        ? materials.darkMetal : materials.wood;
      const supportHeight = Math.min(1.2, Math.max(0.48, propHeight + 0.18));
      for (const sideX of [-1, 1]) {
        for (const sideZ of [-1, 1]) {
          const support = makeBlock(
            platform.group,
            sideX * (platformWidth * 0.38),
            baseTop - supportHeight / 2,
            sideZ * (depth * 0.38),
            0.11,
            supportHeight,
            0.11,
            supportMaterial,
          );
          support.rotation.z = sideX * sideZ * -0.12;
        }
      }
      makeBlock(platform.group, 0, baseTop - 0.16, 0, platformWidth + 0.04, 0.1, depth + 0.04, materials.darkMetal);
    }
  }
  decoratePlatform(platform.group, platform, generator);
  world.add(platform.group);
  platforms.push(platform);
  return platform;
}

let rng = random(Date.now());
let cameraYaw = 0;
let cameraViewYaw = 0;
let cameraPitch = -0.12;
let cameraTargetYaw = 0;
let cameraTargetPitch = -0.12;
let highest = 0;
let best = loadBest();
let elapsed = 0;
let running = false;
let paused = false;
let lastFrame = 0;
let platformIndex = 0;
let lastSafeHeight = 0;
let respawnTimer = 0;
let lastPointerX = 0;
let lastPointerY = 0;
let mouseLookTracking = false;
let mouseSensitivity = loadMouseSensitivity();
let spaceWasDown = false;
let landingTimer = 0;
let jumpBufferTimer = 0;
let coyoteTimer = 0;
let sprintStamina = 100;
let sprintExhausted = false;
let mantle = null;

const player = {
  x: 0, z: 0, y: 0, vx: 0, vz: 0, vy: 0,
  onGround: true, facing: 0, sprinting: false, animation: 'idle', currentPlatformIndex: 0,
};

function loadBest() {
  try {
    return Number(localStorage.getItem('only-up-best')) || 0;
  } catch (error) {
    console.warn('Could not read the ONLY UP best climb:', error);
    return 0;
  }
}

function loadMouseSensitivity() {
  try {
    const saved = Number(localStorage.getItem('only-up-mouse-sensitivity'));
    return Number.isFinite(saved) && saved >= 0.5 && saved <= 3 ? saved : 1;
  } catch (error) {
    console.warn('Could not read ONLY UP mouse sensitivity:', error);
    return 1;
  }
}

function saveMouseSensitivity() {
  try {
    localStorage.setItem('only-up-mouse-sensitivity', String(mouseSensitivity));
  } catch (error) {
    console.warn('Could not save ONLY UP mouse sensitivity:', error);
  }
}

function updateMouseSensitivitySetting() {
  mouseSensitivity = Number(mouseSensitivitySetting.value);
  mouseSensitivityValue.textContent = `${mouseSensitivity.toFixed(1)}x`;
  saveMouseSensitivity();
}

function saveBest() {
  try {
    localStorage.setItem('only-up-best', String(best));
  } catch (error) {
    console.warn('Could not save the ONLY UP best climb:', error);
  }
}

function buildAvatar() {
  const root = new THREE.Group();
  const torso = new THREE.Group();
  root.add(torso);

  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.27, 0.46, 5, 10), materials.hoodie);
  body.position.y = 1.08;
  body.castShadow = true;
  torso.add(body);

  const chest = new THREE.Mesh(new THREE.BoxGeometry(0.33, 0.16, 0.025), materials.hoodieLight);
  chest.position.set(0, 1.14, 0.257);
  chest.castShadow = true;
  torso.add(chest);

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.18, 16, 12), materials.skin);
  head.scale.set(0.88, 1.08, 0.9);
  head.position.y = 1.66;
  head.castShadow = true;
  torso.add(head);
  const hair = new THREE.Mesh(new THREE.SphereGeometry(0.184, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.48), new THREE.MeshStandardMaterial({ color: 0x45352b, roughness: 0.95 }));
  hair.position.y = 1.69;
  hair.castShadow = true;
  torso.add(hair);

  const pack = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.47, 0.19), materials.backpack);
  pack.position.set(0, 1.1, -0.31);
  pack.castShadow = true;
  torso.add(pack);
  for (const side of [-1, 1]) {
    const strap = new THREE.Mesh(new THREE.BoxGeometry(0.055, 0.48, 0.035), materials.rust);
    strap.position.set(side * 0.18, 1.11, 0.04);
    strap.rotation.z = side * -0.12;
    torso.add(strap);
  }

  const limbs = { leftArm: [], rightArm: [], leftLeg: [], rightLeg: [] };
  function makeLimb(name, side, isArm) {
    const group = new THREE.Group();
    group.position.set(side * (isArm ? 0.3 : 0.14), isArm ? 1.35 : 0.81, 0);
    torso.add(group);
    const length = isArm ? 0.34 : 0.39;
    const radius = isArm ? 0.085 : 0.105;
    const material = isArm ? materials.hoodieLight : materials.trousers;
    const upper = new THREE.Mesh(new THREE.CapsuleGeometry(radius, length, 4, 8), material);
    upper.position.y = -length * 0.48;
    upper.castShadow = true;
    group.add(upper);
    const joint = new THREE.Group();
    joint.position.y = -length * 0.93;
    group.add(joint);
    const lower = new THREE.Mesh(new THREE.CapsuleGeometry(radius * 0.85, length * 0.88, 4, 8), isArm ? materials.skin : materials.trousers);
    lower.position.y = -length * 0.44;
    lower.castShadow = true;
    joint.add(lower);
    if (!isArm) {
      const boot = new THREE.Mesh(new THREE.BoxGeometry(0.19, 0.12, 0.32), materials.boot);
      boot.position.set(0, -length * 0.9, 0.08);
      boot.castShadow = true;
      joint.add(boot);
    } else {
      const hand = new THREE.Mesh(new THREE.SphereGeometry(0.075, 10, 8), materials.skin);
      hand.position.y = -length * 0.86;
      hand.castShadow = true;
      joint.add(hand);
    }
    limbs[name].push(group, joint);
  }
  makeLimb('leftArm', -1, true);
  makeLimb('rightArm', 1, true);
  makeLimb('leftLeg', -1, false);
  makeLimb('rightLeg', 1, false);
  world.add(root);
  return { root, torso, limbs };
}

const avatar = buildAvatar();
bestElement.textContent = `${best} m`;

function buildAhead() {
  while (platformIndex < player.currentPlatformIndex + 12) {
    const index = ++platformIndex;
    const previous = platforms[platforms.length - 1];
    const position = routePoint(index);
    const kind = platformKind(index);
    const rise = kind === 'mantle' ? 2.7
      : index % 6 === 0 ? 1.42 + rng() * 0.16
        : 1.08 + rng() * 0.18;
    const width = Math.max(1.35, 1.85 - Math.floor(index / 20) * 0.05);
    createPlatform(position.x, position.z, previous.y + rise, width, index, rng);
  }
}

function findMantleTarget() {
  return platforms.find((platform) => {
    if (!platform.mantleRequired || platform.index <= player.currentPlatformIndex) return false;
    const heightToLedge = platform.y - player.y;
    if (heightToLedge < -1.25 || heightToLedge > 4.6) return false;
    return Math.hypot(player.x - platform.x, player.z - platform.z) <= 4.6;
  }) || null;
}

function positionOverlapsObstacle(platform, x, z) {
  const obstacle = platform.obstacle;
  if (!obstacle || player.y >= platform.collisionTopY - 0.06
    || player.y + PLAYER_HEIGHT <= platform.baseTopY) return false;
  const dx = x - platform.x;
  const dz = z - platform.z;
  const localX = Math.cos(platform.yaw) * dx - Math.sin(platform.yaw) * dz - obstacle.x;
  const localZ = Math.sin(platform.yaw) * dx + Math.cos(platform.yaw) * dz - obstacle.z;
  return Math.abs(localX) < obstacle.width / 2 + PLAYER_RADIUS
    && Math.abs(localZ) < obstacle.depth / 2 + PLAYER_RADIUS;
}

function resolveObstacleCollisions(previousX, previousZ) {
  const clearAt = (x, z) => platforms.every((platform) => !positionOverlapsObstacle(platform, x, z));
  if (!clearAt(player.x, player.z)) {
    const candidates = [
      [player.x, previousZ],
      [previousX, player.z],
      [previousX, previousZ],
    ];
    for (const [x, z] of candidates) {
      if (clearAt(x, z)) {
        player.x = x;
        player.z = z;
        break;
      }
    }
  }

  const towerX = 0;
  const towerZ = ROUTE_RADIUS;
  const towerRadius = 2.1 + 0.3;
  const towerDX = player.x - towerX;
  const towerDZ = player.z - towerZ;
  const towerDistance = Math.hypot(towerDX, towerDZ);
  if (player.y < 77 && player.y + 1.65 > -31 && towerDistance < towerRadius) {
    const direction = towerDistance || 1;
    player.x = towerX + towerDX / direction * towerRadius;
    player.z = towerZ + towerDZ / direction * towerRadius;
  }
}

function advanceMantle(delta) {
  mantle.elapsed = Math.min(MANTLE_DURATION, mantle.elapsed + delta);
  const progress = mantle.elapsed / MANTLE_DURATION;
  const target = mantle.target;
  const approachYaw = routeYaw(target.index);
  const approachX = target.x - Math.sin(approachYaw) * 0.88;
  const approachZ = target.z - Math.cos(approachYaw) * 0.88;
  const climbProgress = THREE.MathUtils.smoothstep(progress, 0, 0.72);
  const crossProgress = THREE.MathUtils.smoothstep(progress, 0.72, 1);
  const easedClimb = climbProgress * climbProgress * (3 - 2 * climbProgress);
  player.x = THREE.MathUtils.lerp(mantle.startX, approachX, easedClimb);
  player.z = THREE.MathUtils.lerp(mantle.startZ, approachZ, easedClimb);
  player.y = progress < 0.72
    ? THREE.MathUtils.lerp(mantle.startY, target.y + 0.22, easedClimb)
    : THREE.MathUtils.lerp(target.y + 0.22, target.y, crossProgress);
  player.x = THREE.MathUtils.lerp(player.x, target.x, crossProgress);
  player.z = THREE.MathUtils.lerp(player.z, target.z, crossProgress);
  player.y += Math.sin(progress * Math.PI) * 0.06;
  player.facing = approachYaw;
  player.animation = 'mantle';
  player.onGround = false;
  if (progress === 1) {
    player.x = target.x;
    player.y = target.y;
    player.z = target.z;
    player.vy = 0;
    player.onGround = true;
    landingTimer = 0.2;
    landOnPlatform(target.y + 0.001);
    mantle = null;
  }
}

function resetRoute() {
  for (const platform of platforms) world.remove(platform.group);
  platforms.length = 0;
  platformIndex = 0;
  createPlatform(0, 0, 0, 5, 0, rng);
  player.x = 0;
  player.z = 0;
  player.y = 0;
  player.vx = 0;
  player.vz = 0;
  player.vy = 0;
  player.onGround = true;
  player.currentPlatformIndex = 0;
  player.facing = routeYaw(0);
  player.sprinting = false;
  player.animation = 'idle';
  landingTimer = 0;
  jumpBufferTimer = 0;
  coyoteTimer = 0;
  spaceWasDown = false;
  mantle = null;
  sprintStamina = 100;
  sprintExhausted = false;
  sprintMeter.value = sprintStamina;
  highest = 0;
  lastSafeHeight = 0;
  scoreElement.textContent = '0 m';
  buildAhead();
}

function startGame() {
  rng = random((Date.now() ^ Math.floor(Math.random() * 0xffffffff)) >>> 0);
  cameraYaw = routeYaw(0);
  cameraViewYaw = cameraYaw;
  mouseLookTracking = false;
  cameraPitch = -0.12;
  cameraTargetYaw = cameraYaw;
  cameraTargetPitch = cameraPitch;
  respawnTimer = 0;
  resetRoute();
  elapsed = 0;
  running = true;
  paused = false;
  keys.clear();
  touchKeys.clear();
  runStatus.textContent = 'FIND YOUR NEXT STEP';
  hideOverlay();
}

function showOverlay(message, buttonLabel) {
  overlayCopy.textContent = message;
  startButton.textContent = buttonLabel;
  overlay.classList.add('visible');
}

function hideOverlay() {
  overlay.classList.remove('visible');
}

function fallAndRespawn() {
  if (respawnTimer > 0) return;
  keys.clear();
  touchKeys.clear();
  spaceWasDown = false;
  mantle = null;
  respawnTimer = 0.9;
  runStatus.textContent = 'FALLEN — BACK TO THE START';
  resetRoute();
}

function togglePause() {
  if (!running) return;
  paused = !paused;
  keys.clear();
  touchKeys.clear();
  mouseLookTracking = false;
  if (paused) showOverlay('Take a breath. Your climb is paused.', 'Resume climb');
  else hideOverlay();
}

function inputState() {
  const down = (...codes) => codes.some((code) => keys.has(code));
  return {
    left: down('ArrowLeft', 'KeyD') || touchKeys.has('left'),
    right: down('ArrowRight', 'KeyA') || touchKeys.has('right'),
    forward: down('ArrowUp', 'KeyW') || touchKeys.has('forward'),
    back: down('ArrowDown', 'KeyS') || touchKeys.has('back'),
    sprint: down('ShiftLeft', 'ShiftRight') || touchKeys.has('sprint'),
    jump: down('Space') || touchKeys.has('jump'),
  };
}

function landOnPlatform(previousY) {
  if (player.vy > 0) return false;
  let landing = null;
  const considerSurface = (platform, height, width, depth, advancesRoute) => {
    if (previousY < height || player.y > height) return;
    const dx = player.x - platform.x;
    const dz = player.z - platform.z;
    const localX = Math.cos(platform.yaw) * dx - Math.sin(platform.yaw) * dz;
    const localZ = Math.sin(platform.yaw) * dx + Math.cos(platform.yaw) * dz;
    if (Math.abs(localX) > width / 2 + PLAYER_RADIUS
      || Math.abs(localZ) > depth / 2 + PLAYER_RADIUS) return;
    if (!landing || height > landing.height) landing = { platform, height, advancesRoute };
  };

  for (const platform of platforms) {
    considerSurface(
      platform,
      platform.collisionTopY,
      platform.collisionTopWidth,
      platform.collisionTopDepth,
      true,
    );
    if (platform.baseTopY < platform.collisionTopY - 0.01) {
      considerSurface(platform, platform.baseTopY, platform.width + 0.14, platform.depth + 0.14, true);
    }
    if (platform.mantleRequired) {
      considerSurface(platform, platform.approachY, platform.approachWidth, 0.86, false);
    }
  }
  if (!landing) return false;

  const { platform, height, advancesRoute } = landing;
  if (advancesRoute && platform.index > player.currentPlatformIndex) {
    player.currentPlatformIndex = platform.index;
    player.facing = routeYaw(platform.index);
  }
  player.y = height;
  player.vy = 0;
  player.onGround = true;
  lastSafeHeight = Math.max(lastSafeHeight, height);
  landingTimer = 0.2;
  return true;
}

function updateAvatar() {
  const { leftArm, rightArm, leftLeg, rightLeg } = avatar.limbs;
  const stride = player.animation === 'run' ? Math.sin(elapsed * 15) * 0.68
    : player.animation === 'walk' ? Math.sin(elapsed * 9) * 0.48 : 0;
  const jump = player.animation === 'jump' || player.animation === 'fall';
  const mantle = player.animation === 'mantle';
  leftLeg[0].rotation.x = jump ? -0.5 : stride;
  leftLeg[1].rotation.x = jump ? 0.75 : Math.max(0, -stride) * 0.7;
  rightLeg[0].rotation.x = jump ? 0.35 : -stride;
  rightLeg[1].rotation.x = jump ? 0.45 : Math.max(0, stride) * 0.7;
  leftArm[0].rotation.x = mantle ? -2.35 : jump ? -2.4 : -stride * 0.7;
  leftArm[1].rotation.x = mantle ? 0.8 : -0.25 + stride * 0.35;
  rightArm[0].rotation.x = mantle ? -1.1 : jump ? -2.6 : stride * 0.7;
  rightArm[1].rotation.x = mantle ? -0.4 : -0.25 - stride * 0.35;
  avatar.torso.rotation.x = player.sprinting ? 0.16 : (player.animation === 'fall' ? -0.12 : 0);
  avatar.torso.position.y = player.animation === 'land'
    ? -Math.sin((landingTimer / 0.2) * Math.PI) * 0.12
    : player.animation === 'run' ? Math.abs(Math.sin(elapsed * 15)) * 0.055 : 0;
  avatar.root.position.set(player.x, player.y, player.z);
  avatar.root.rotation.y = player.facing;
}

function update(delta) {
  if (!running || paused) return;
  elapsed += delta;
  landingTimer = Math.max(0, landingTimer - delta);
  if (player.onGround) coyoteTimer = COYOTE_DURATION;
  else coyoteTimer = Math.max(0, coyoteTimer - delta);
  if (respawnTimer > 0) {
    respawnTimer = Math.max(0, respawnTimer - delta);
    if (respawnTimer === 0) runStatus.textContent = 'FIND YOUR NEXT STEP';
  }

  const yawDelta = Math.atan2(Math.sin(cameraTargetYaw - cameraYaw), Math.cos(cameraTargetYaw - cameraYaw));
  cameraYaw += yawDelta * Math.min(1, delta * 9);
  cameraPitch += (cameraTargetPitch - cameraPitch) * Math.min(1, delta * 9);
  const input = inputState();
  if (input.jump && !spaceWasDown) jumpBufferTimer = JUMP_BUFFER_DURATION;
  else jumpBufferTimer = Math.max(0, jumpBufferTimer - delta);
  const hasMoveInput = input.forward || input.back || input.left || input.right;
  player.sprinting = !mantle && input.sprint && hasMoveInput && !sprintExhausted && sprintStamina > 0;
  sprintStamina = player.sprinting
    ? Math.max(0, sprintStamina - SPRINT_DRAIN_RATE * delta)
    : Math.min(100, sprintStamina + (input.sprint && hasMoveInput ? 0 : SPRINT_RECOVERY_RATE * delta));
  if (sprintStamina === 0) sprintExhausted = true;
  if (!input.sprint && sprintStamina >= 25) sprintExhausted = false;
  sprintMeter.value = sprintStamina;
  const forward = Number(input.forward) - Number(input.back);
  const sideways = Number(input.right) - Number(input.left);
  const length = Math.hypot(forward, sideways) || 1;
  const moveSpeed = player.sprinting ? 8.5 : 5.1;
  const targetX = (Math.cos(cameraYaw) * sideways + Math.sin(cameraYaw) * forward) / length * moveSpeed;
  const targetZ = (-Math.sin(cameraYaw) * sideways + Math.cos(cameraYaw) * forward) / length * moveSpeed;
  const response = player.onGround ? 15 : 5;

  if (!mantle && (jumpBufferTimer > 0 || input.jump)) {
    const target = findMantleTarget();
    if (target) {
      mantle = { target, startX: player.x, startY: player.y, startZ: player.z, elapsed: 0 };
      player.vx = 0;
      player.vz = 0;
      player.onGround = false;
      player.sprinting = false;
      jumpBufferTimer = 0;
      coyoteTimer = 0;
    } else if (jumpBufferTimer > 0 && (player.onGround || coyoteTimer > 0)) {
      player.vy = JUMP_SPEED;
      player.onGround = false;
      jumpBufferTimer = 0;
      coyoteTimer = 0;
    }
  }
  spaceWasDown = input.jump;
  if (mantle) {
    advanceMantle(delta);
  } else {
    player.vx += (targetX - player.vx) * Math.min(1, response * delta);
    player.vz += (targetZ - player.vz) * Math.min(1, response * delta);
    const previousX = player.x;
    const previousZ = player.z;
    player.x += player.vx * delta;
    player.z += player.vz * delta;
    resolveObstacleCollisions(previousX, previousZ);

    const previousY = player.y;
    player.vy -= GRAVITY * delta;
    player.y += player.vy * delta;
    player.onGround = false;
    landOnPlatform(previousY);
    if (player.y < -8 || (player.y < lastSafeHeight - 9 && player.vy < -5)) {
      fallAndRespawn();
      return;
    }
  }

  if (!mantle && player.onGround && landingTimer > 0) player.animation = 'land';
  else if (player.onGround) player.animation = player.sprinting ? 'run'
    : (Math.abs(player.vx) + Math.abs(player.vz) > 0.18 ? 'walk' : 'idle');
  else if (!mantle) player.animation = player.vy < -0.5 ? 'fall' : 'jump';

  highest = Math.max(highest, player.y);
  const altitude = Math.max(0, Math.floor(highest * 10));
  scoreElement.textContent = `${altitude} m`;
  if (altitude > best) {
    best = altitude;
    bestElement.textContent = `${best} m`;
    saveBest();
  }
  buildAhead();
  while (platforms.length > 12 && platforms[0].index < player.currentPlatformIndex - 5) {
    const old = platforms.shift();
    world.remove(old.group);
  }
  const stage = Math.floor(Math.max(0, player.y) / 12);
  const region = stage === 0 ? 'THE STARTING RIDGE'
    : stage === 1 ? 'ABOVE THE TREELINE'
      : stage === 2 ? 'THE CLOUD BRIDGES' : 'THE SKYWARD RUINS';
  worldLabel.textContent = region;
  const nextPlatform = platforms.find((platform) => platform.index === player.currentPlatformIndex + 1);
  runStatus.textContent = mantle ? 'MANTLE — KEEP CLIMBING'
    : nextPlatform && nextPlatform.mantleRequired && findMantleTarget() ? 'HIGH LEDGE — SPACE TO MANTLE'
      : player.onGround ? 'FIND YOUR NEXT STEP' : 'KEEP CLIMBING';
}

function updateCamera(delta) {
  const distance = 6.2;
  cameraViewYaw = cameraYaw;
  cameraPosition.set(
    player.x - Math.sin(cameraViewYaw) * distance,
    player.y + 3.4,
    player.z - Math.cos(cameraViewYaw) * distance,
  );
  camera.position.lerp(cameraPosition, 1 - Math.exp(-4 * delta));
  cameraTarget.set(
    player.x,
    player.y + 1.15 + Math.sin(cameraPitch) * 2.4,
    player.z,
  );
  camera.lookAt(cameraTarget);
  sunlight.position.set(player.x - 38, player.y + 72, player.z - 28);
  sunlight.target.position.set(player.x, player.y, player.z);
}

function resize() {
  const width = Math.max(320, playfield.clientWidth);
  const height = width * 2 / 3;
  renderer.setSize(width, height, false);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
}

function frame(timestamp) {
  const delta = Math.min(0.032, (timestamp - (lastFrame || timestamp)) / 1000);
  lastFrame = timestamp;
  update(delta);
  updateAvatar();
  updateCamera(delta);
  renderer.render(scene, camera);
  requestAnimationFrame(frame);
}

startButton.addEventListener('click', () => {
  if (paused) {
    paused = false;
    hideOverlay();
    return;
  }
  startGame();
});

window.addEventListener('keydown', (event) => {
  if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Space'].includes(event.code)) event.preventDefault();
  if (event.code === 'Escape') {
    togglePause();
    return;
  }
  if (event.repeat && event.code === 'Space') return;
  if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Space', 'KeyW', 'KeyA', 'KeyS', 'KeyD', 'ShiftLeft', 'ShiftRight'].includes(event.code)) {
    keys.add(event.code);
  }
});

window.addEventListener('keyup', (event) => keys.delete(event.code));
window.addEventListener('blur', () => {
  keys.clear();
  touchKeys.clear();
  mouseLookTracking = false;
});

canvas.addEventListener('pointerenter', (event) => {
  if (event.pointerType !== 'mouse') return;
  lastPointerX = event.clientX;
  lastPointerY = event.clientY;
  mouseLookTracking = true;
});

canvas.addEventListener('pointermove', (event) => {
  if (event.pointerType !== 'mouse' || !running || paused) return;
  if (!mouseLookTracking) {
    lastPointerX = event.clientX;
    lastPointerY = event.clientY;
    mouseLookTracking = true;
    return;
  }
  const deltaX = event.clientX - lastPointerX;
  const deltaY = event.clientY - lastPointerY;
  lastPointerX = event.clientX;
  lastPointerY = event.clientY;
  const fullTurn = Math.PI * 2;
  player.facing = ((player.facing - deltaX * MOUSE_SENSITIVITY * mouseSensitivity + Math.PI) % fullTurn + fullTurn) % fullTurn - Math.PI;
  cameraTargetYaw = player.facing;
  cameraTargetPitch = Math.max(-0.88, Math.min(0.62, cameraTargetPitch - deltaY * MOUSE_SENSITIVITY * mouseSensitivity));
});

canvas.addEventListener('pointerleave', (event) => {
  if (event.pointerType === 'mouse') mouseLookTracking = false;
});

mouseSensitivitySetting.value = String(mouseSensitivity);
mouseSensitivityValue.textContent = `${mouseSensitivity.toFixed(1)}x`;
mouseSensitivitySetting.addEventListener('input', updateMouseSensitivitySetting);

for (const button of document.querySelectorAll('[data-control]')) {
  const control = button.dataset.control;
  const press = (event) => {
    event.preventDefault();
    touchKeys.add(control);
    button.setPointerCapture(event.pointerId);
  };
  const release = () => touchKeys.delete(control);
  button.addEventListener('pointerdown', press);
  button.addEventListener('pointerup', release);
  button.addEventListener('pointercancel', release);
  button.addEventListener('lostpointercapture', release);
}

const jumpButton = document.getElementById('jumpButton');
jumpButton.addEventListener('pointerdown', (event) => {
  event.preventDefault();
  touchKeys.add('jump');
  jumpButton.setPointerCapture(event.pointerId);
});
jumpButton.addEventListener('pointerup', () => touchKeys.delete('jump'));
jumpButton.addEventListener('pointercancel', () => touchKeys.delete('jump'));
jumpButton.addEventListener('lostpointercapture', () => touchKeys.delete('jump'));

window.addEventListener('resize', resize);
resize();
rng = random(Date.now());
createPlatform(0, 0, 0, 5, 0, rng);
buildAhead();
requestAnimationFrame(frame);
