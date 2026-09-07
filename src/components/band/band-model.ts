import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { BAND_PROFILE, wristFrame, bendToWrist } from "./band-profile";
import { createTextile } from "./band-textile";
import engravingPaths from "./engraving-paths.json";
import type { BandFinish } from "./colourways";

/** Reference-derived display geometry, not manufacturing CAD. */
export function createBandModel(finish: BandFinish) {
  const group = new THREE.Group();
  group.name = "Terrifit Band";
  group.rotation.z = -0.17;
  const textures: THREE.Texture[] = [];
  const fabric = new THREE.MeshPhysicalMaterial({ roughness: 0.92, metalness: 0, specularIntensity: 0.18, side: THREE.DoubleSide });
  const hardware = new THREE.MeshPhysicalMaterial({
  color: "#2d3034",          // slate black / dark grey
  roughness: 0.29,            // much more matte
  metalness: 0.06,           // barely metallic
  specularIntensity: 0.08,   // kills orange reflective bleed
  clearcoat: 0,
  clearcoatRoughness: 1,
  envMapIntensity: 0.18,     // reduce reflected environment / strap tint
  transparent: false,
  opacity: 1,
  transmission: 0,
  side: THREE.FrontSide,
});
  const rubber = new THREE.MeshStandardMaterial({ color: "#17181b", roughness: 0.72 });
  const silver = new THREE.MeshStandardMaterial({ color: "#c7c9cb", roughness: 0.36, metalness: 0.85 });
  const glass = new THREE.MeshStandardMaterial({ color: "#74777c", roughness: 0.22, metalness: 0.45 });

  // Shared circular wrist section: strap, shell and clasp use the same
  // radial construction, preventing gaps and a squared-off loop silhouette.
  const points: number[] = [], uv: number[] = [], indices: number[] = [];
  const segments = 640, cross = 128;
  const normal = new THREE.Vector3();
  for (let i = 0; i <= segments; i++) {
    const angle = i / segments * Math.PI * 2;
    const frame = wristFrame(angle);
    normal.copy(frame.normal);
    const centre = frame.position;
    for (let j = 0; j <= cross; j++) {
      const a = j / cross * Math.PI * 2;
      const x = Math.sign(Math.cos(a)) * Math.pow(Math.abs(Math.cos(a)), 0.16) * 0.5;
      const thickness = Math.sin(a) * (0.033 + (1 - (x / 0.5) ** 2) * 0.006);
      points.push(x, centre.y + normal.y * thickness, centre.z + normal.z * thickness);
      uv.push((x + 0.5) * 1.05, i / segments * 4.0);
      if (i < segments && j < cross) {
        const k = i * (cross + 1) + j;
        indices.push(k, k + 1, k + cross + 1, k + 1, k + cross + 2, k + cross + 1);
      }
    }
  }
  const ribbon = new THREE.BufferGeometry();
  ribbon.setAttribute("position", new THREE.Float32BufferAttribute(points, 3));
  ribbon.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  ribbon.setIndex(indices); ribbon.computeVertexNormals();
  const strap = new THREE.Mesh(ribbon, fabric);
  strap.name = "Woven strap"; strap.castShadow = true; strap.receiveShadow = true;
  group.add(strap);
  const textile = createTextile(); group.add(textile.group);

  function box(name: string, w: number, h: number, d: number, radius: number, x: number, y: number, z: number, material: THREE.Material) {
    const mesh = new THREE.Mesh(new RoundedBoxGeometry(w, h, d, 12, radius), material);
    mesh.name = name; mesh.position.set(x, y, z); mesh.castShadow = true; mesh.receiveShadow = true;
    group.add(mesh); return mesh;
  }
  // Bend a densely tessellated solid around the wrist. Both long edges
  // follow concentric arcs: the side is a crescent with rounded ends.
  // ---------------------------------------------------------------------------
// SENSOR HOUSING
//
// The reference has two identical full-length side shrouds.
// Both sides use the exact same geometry and extend around the strap edges.
//
// Keep the branded outer clasp aligned with the sensor housing instead of
// placing it ~23 degrees farther around the wrist.
// ---------------------------------------------------------------------------

const shellAngle = BAND_PROFILE.shellAngle;

// Lower than the housing, but not as far as your old 1.77 value.
const claspAngle = shellAngle + 0.32;


// Main wrist-curved sensor housing.
//
// Slightly wider than the 1.0-unit strap so the housing itself overlaps the
// textile rather than terminating exactly at the strap edges.
const housing = box(
  "Crescent sensor housing",
  1.11,   // slightly wider so it covers the strap edges more
  1.66,
  0.245,
  0.108,
  0,
  0,
  0,
  hardware,
);
bendToWrist(housing.geometry, -0.155, shellAngle);

// one base side-shroud geometry, used on both sides identically
const railBaseGeometry = new THREE.CapsuleGeometry(0.148, 1.42, 16, 32);
railBaseGeometry.scale(0.88, 1, 1);
bendToWrist(railBaseGeometry, -0.115, shellAngle);

const sideRailX = 0.47; // closer in so it overlaps the body and strap edges better

const leftRail = new THREE.Mesh(railBaseGeometry.clone(), hardware);
leftRail.name = "Left full-length housing side shroud";
leftRail.position.x = -sideRailX;
leftRail.castShadow = true;
leftRail.receiveShadow = true;
group.add(leftRail);

const rightRail = new THREE.Mesh(railBaseGeometry.clone(), hardware);
rightRail.name = "Right full-length housing side shroud";
rightRail.position.x = sideRailX;
rightRail.castShadow = true;
rightRail.receiveShadow = true;
group.add(rightRail);

railBaseGeometry.dispose();

// ---------------------------------------------------------------------------
// FRONT / OUTER TERRIFIT CLASP
// ---------------------------------------------------------------------------
//
// Now uses the SAME wrist angle as the sensor housing. This prevents its
// edge from appearing farther around the loop as the fake "short side" that
// is visible in your current render.
// ---------------------------------------------------------------------------

const clasp = box(
  "Curved folded metal clasp",
  1.075,
  0.62,
  0.14,
  0.067,
  0,
  0,
  0,
  hardware,
);

bendToWrist(
  clasp.geometry,
  0.096,
  claspAngle,
);

  // Reconstruct the oval plate, split metallic rails, end pads and six windows from sensors.avif.
  const sensorStart = group.children.length;
  const plate = new THREE.Mesh(new THREE.SphereGeometry(1, 48, 32), rubber);
  plate.name = "Oval sensor plate"; plate.scale.set(0.325, 0.49, 0.018); plate.position.set(0, 0.12, 0.654); group.add(plate);
  for (const side of [-1, 1]) {
    const railShape = new THREE.Shape();
    const start = -Math.PI / 2 + 0.29, end = Math.PI / 2 - 0.29;
    railShape.absellipse(0, 0, 0.312, 0.47, start, end, false, 0);
    railShape.lineTo(0.172 * Math.cos(end), 0.304 * Math.sin(end));
    railShape.absellipse(0, 0, 0.172, 0.304, end, start, true, 0); railShape.closePath();
    const rail = new THREE.Mesh(new THREE.ExtrudeGeometry(railShape, { depth: 0.003, bevelEnabled: true, bevelThickness: 0.002, bevelSize: 0.002, bevelSegments: 2, curveSegments: 32 }), silver);
    rail.name = "Curved metallic sensor contact"; rail.position.set(0, 0.12, 0.629); rail.rotation.y = side < 0 ? Math.PI : 0;
    // Both contacts face into the wrist cavity.
    silver.side = THREE.DoubleSide; group.add(rail);
    box("End contact", 0.145, 0.14, 0.019, 0.018, 0, 0.12 + side * 0.399, 0.634, glass);
  }
  [[-0.094, 0.23, -0.5], [0.094, 0.23, 0.5], [0, 0.082, 0], [0, -0.075, 0], [-0.094, -0.23, 0.5], [0.094, -0.23, -0.5]].forEach(([x, y, angle]) => {
    const window = box("Sensor window", 0.083, 0.089, 0.012, 0.008, x, 0.12 + y, 0.629, glass);
    window.rotation.z = angle;
  });

  // Seat the underside assembly on the shell's concave face.
  group.children.slice(sensorStart).forEach(object => {
    if (!(object instanceof THREE.Mesh)) return;
    object.updateMatrix(); object.geometry.applyMatrix4(object.matrix);
    object.geometry.translate(0, -0.12, -0.654);
    object.position.set(0, 0, 0); object.rotation.set(0, 0, 0); object.scale.set(1, 1, 1);
    bendToWrist(object.geometry, -0.274, shellAngle);
  });

  // Actual shallow pockets: letter outlines are holes in a thin curved
  // face skin, with the solid clasp 0.006 units below them as the pocket floor.
  const lettering = new THREE.ShapePath();
  for (const command of engravingPaths) {
    const [op, ...values] = command;
    const n = values as number[];
    if (op === "M") lettering.moveTo(n[0], n[1]);
    else if (op === "L") lettering.lineTo(n[0], n[1]);
    else if (op === "Q") lettering.quadraticCurveTo(n[0], n[1], n[2], n[3]);
    else if (op === "C") lettering.bezierCurveTo(n[0], n[1], n[2], n[3], n[4], n[5]);
    else lettering.currentPath?.closePath();
  }
  const letters = lettering.toShapes();
  const face = new THREE.Shape();
  face.moveTo(-0.465, -0.21); face.lineTo(0.465, -0.21); face.lineTo(0.465, 0.21); face.lineTo(-0.465, 0.21); face.closePath();
  letters.forEach(letter => face.holes.push(letter));
  const skin = new THREE.ExtrudeGeometry(
  [face, ...letters.flatMap(letter => letter.holes.map(hole => {
    const counter = new THREE.Shape(hole.getPoints());
    return counter;
  }))],
  {
    depth: 0.01,          // deeper pocket
    bevelEnabled: false,
    curveSegments: 18,
  },
);

// slightly lower on the clasp face
skin.translate(0, -0.09, 0.166);
  bendToWrist(skin, 0, claspAngle);
    const engravingFillMaterial = new THREE.MeshPhysicalMaterial({
    color: "#7c838b",       // brighter gunmetal / steel-grey
    roughness: 0.28,
    metalness: 0.88,
    specularIntensity: 0.7,
    clearcoat: 0.06,
    clearcoatRoughness: 0.3,
    envMapIntensity: 0.55,
    transparent: false,
    opacity: 1,
    transmission: 0,
    side: THREE.FrontSide,
  });
  const engraving = new THREE.Mesh(skin, hardware); engraving.name = "Recessed TERRIFIT engraving"; group.add(engraving);

  // shiny inset lettering visible inside the engraved recess
const insetLettersGeo = new THREE.ExtrudeGeometry(letters, {
  depth: 0.004,
  bevelEnabled: true,
  bevelThickness: 0.0015,
  bevelSize: 0.0015,
  bevelSegments: 2,
  curveSegments: 18,
});

// place slightly behind the front skin so it remains engraved/inset
insetLettersGeo.translate(0, -0.09, 0.154);
bendToWrist(insetLettersGeo, 0, claspAngle);

const insetLetters = new THREE.Mesh(insetLettersGeo, engravingFillMaterial);
insetLetters.name = "Shiny inset TERRIFIT logo";
insetLetters.castShadow = true;
insetLetters.receiveShadow = true;
group.add(insetLetters);

  let disposed = false, selection = 0;
  const cache = new Map<string, THREE.Texture>();
  const loader = new THREE.TextureLoader();
  // Height data must not use the albedo's sRGB decoding. Reusing one texture
  // for both flattened the black threads into a smooth-looking grey fabric.
  const heightMap = loader.load("/media/band/materials-v1/black.png");
  heightMap.wrapS = heightMap.wrapT = THREE.RepeatWrapping; heightMap.anisotropy = 8;
  heightMap.colorSpace = THREE.NoColorSpace; textures.push(heightMap);
  fabric.bumpMap = heightMap; fabric.bumpScale = 0.001;
  fabric.displacementMap = heightMap; fabric.displacementScale = 0.002; fabric.displacementBias = -0.001;

  function dress(map: THREE.Texture) {
    map.wrapS = map.wrapT = THREE.RepeatWrapping;
    map.colorSpace = THREE.SRGBColorSpace;
    map.anisotropy = 8;
    return map;
  }

  /** Every colour has its own reference-derived yarn tile. */
  function setFinish(next: BandFinish): Promise<void> {
    const request = ++selection;
    textile.setFinish(next);
    const apply = (map: THREE.Texture) => {
      if (disposed || request !== selection) return;
      fabric.map = map; fabric.bumpMap = heightMap;
      // Albedo under the raised yarn supplies colour between individual strands.
      fabric.color.set(next.id === "black" ? "#808080" : "#ffffff"); fabric.needsUpdate = true;
    };

    const cached = cache.get(next.id);
    if (cached) { apply(cached); return Promise.resolve(); }

    return new Promise(resolve => {
    loader.load(
      `/media/band/materials-v1/${next.id}.png`,
      map => {
        if (disposed) { map.dispose(); resolve(); return; }
        cache.set(next.id, dress(map));
        apply(map);
        resolve();
      },
      undefined,
      () => {
        // Every colourway ships a yarn tile, so this only fires on a genuine
        // network failure. Tint the strap with the finish's own yarn so it is
        // at least the right colour rather than the previous one — the error
        // callback used to be absent entirely, which left Olive showing Ember.
        if (disposed || request !== selection) { resolve(); return; }
        fabric.map = null; fabric.bumpMap = null;
        fabric.color.set(next.yarn); fabric.needsUpdate = true;
        resolve();
      },
    );
    });
  }
  const ready = setFinish(finish);
  return {
    group, setFinish, ready,
    dispose() {
      disposed = true;
      cache.forEach(texture => texture.dispose());
      const materials = new Set<THREE.Material>();
      group.traverse(object => { if (object instanceof THREE.Mesh) { object.geometry.dispose(); (Array.isArray(object.material) ? object.material : [object.material]).forEach(m => materials.add(m)); } });
      materials.forEach(m => m.dispose()); textures.forEach(t => t.dispose());
    },
  };
}
