import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import type { BandFinish } from "./colourways";

/** Reference-derived display geometry, not manufacturing CAD. */
export function createBandModel(finish: BandFinish) {
  const group = new THREE.Group();
  group.name = "Terrifit Band";
  const textures: THREE.Texture[] = [];
  const fabric = new THREE.MeshStandardMaterial({ roughness: 0.84, metalness: 0, side: THREE.DoubleSide });
  const hardware = new THREE.MeshStandardMaterial({ color: "#343538", roughness: 0.38, metalness: 0.78 });
  const rubber = new THREE.MeshStandardMaterial({ color: "#17181b", roughness: 0.72 });
  const silver = new THREE.MeshStandardMaterial({ color: "#c7c9cb", roughness: 0.36, metalness: 0.85 });
  const glass = new THREE.MeshStandardMaterial({ color: "#74777c", roughness: 0.22, metalness: 0.45 });

  // A closed ribbon, including its inner face and rounded woven edges.
  const points: number[] = [], uv: number[] = [], indices: number[] = [];
  const segments = 320, cross = 48;
  for (let i = 0; i <= segments; i++) {
    const t = i / segments * Math.PI * 2;
    for (let j = 0; j <= cross; j++) {
      const a = j / cross * Math.PI * 2;
      const x = Math.sign(Math.cos(a)) * Math.pow(Math.abs(Math.cos(a)), 0.16) * 0.43;
      const r = Math.sin(a) * 0.024;
      points.push(x, (1.35 + r) * Math.cos(t), (0.87 + r) * Math.sin(t));
      uv.push((x / 0.86 + 0.5) * 1.1, i / segments * 7.5);
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

  function box(name: string, w: number, h: number, d: number, radius: number, x: number, y: number, z: number, material: THREE.Material) {
    const mesh = new THREE.Mesh(new RoundedBoxGeometry(w, h, d, 4, radius), material);
    mesh.name = name; mesh.position.set(x, y, z); mesh.castShadow = true; mesh.receiveShadow = true;
    group.add(mesh); return mesh;
  }
  const housing = box("Sensor housing", 0.90, 1.5, 0.115, 0.052, 0, 0.12, 0, hardware);
  const hp = housing.geometry.attributes.position;
  for (let i = 0; i < hp.count; i++) {
    const y = hp.getY(i) + 0.12;
    hp.setZ(i, hp.getZ(i) + 0.87 * Math.sqrt(Math.max(0, 1 - (y / 1.35) ** 2)) - 0.076);
  }
  hp.needsUpdate = true; housing.geometry.computeVertexNormals();
  box("Front clasp", 0.90, 0.56, 0.065, 0.027, 0, -0.22, 0.894, hardware);
  box("Clasp side return", 0.055, 0.56, 0.13, 0.026, 0.441, -0.22, 0.85, hardware);

  // Reconstruct the oval plate, split metallic rails, end pads and six windows from sensors.avif.
  const plate = new THREE.Mesh(new THREE.SphereGeometry(1, 48, 32), rubber);
  plate.name = "Oval sensor plate"; plate.scale.set(0.325, 0.49, 0.018); plate.position.set(0, 0.12, 0.705); group.add(plate);
  for (const side of [-1, 1]) {
    const rail = box("Metallic side contact", 0.105, 0.71, 0.022, 0.045, side * 0.236, 0.12, 0.682, silver);
    rail.rotation.z = side * -0.02;
    box("End contact", 0.145, 0.14, 0.019, 0.018, 0, 0.12 + side * 0.399, 0.685, glass);
  }
  [[-0.094, 0.23, -0.5], [0.094, 0.23, 0.5], [0, 0.082, 0], [0, -0.075, 0], [-0.094, -0.23, 0.5], [0.094, -0.23, -0.5]].forEach(([x, y, angle]) => {
    const window = box("Sensor window", 0.083, 0.089, 0.012, 0.008, x, 0.12 + y, 0.68, glass);
    window.rotation.z = angle;
  });

  const label = document.createElement("canvas"); label.width = 1024; label.height = 220;
  const ctx = label.getContext("2d")!;
  ctx.font = "600 128px Arial, sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
  ctx.fillStyle = "#454649"; ctx.fillText("TERRIFIT", 512, 114);
  ctx.fillStyle = "#101113"; ctx.fillText("TERRIFIT", 512, 110);
  const labelTexture = new THREE.CanvasTexture(label); labelTexture.colorSpace = THREE.SRGBColorSpace; textures.push(labelTexture);
  // Inset within the keeper, which is now 0.71 rather than 0.90 wide — at the
  // old 0.74 the wordmark would have overhung the plate it is debossed into.
  const mark = new THREE.Mesh(new THREE.PlaneGeometry(0.74, 0.16), new THREE.MeshStandardMaterial({ map: labelTexture, transparent: true, roughness: 0.62, polygonOffset: true, polygonOffsetFactor: -1 }));
  mark.name = "TERRIFIT engraving"; mark.position.set(0, -0.3, 0.928); group.add(mark);

  let disposed = false, selection = 0;
  const cache = new Map<string, THREE.Texture>();
  const loader = new THREE.TextureLoader();

  function dress(map: THREE.Texture) {
    map.wrapS = map.wrapT = THREE.RepeatWrapping;
    map.colorSpace = THREE.SRGBColorSpace;
    map.anisotropy = 8;
    return map;
  }

  /**
   * Which colourways have a photographed material.
   *
   * Only four of the seven were ever shot. `TextureLoader.load` takes its error
   * callback as the *fourth* argument and the call here passed none, so the
   * three without a photograph failed silently: the swatch showed as selected
   * and the band on screen kept the previous colour. Picking Olive left you
   * looking at Ember.
   */
  function setFinish(next: BandFinish) {
    const request = ++selection;
    const apply = (map: THREE.Texture) => {
      if (disposed || request !== selection) return;
      fabric.map = map;
      // Photographic yarn relief, not the former geometric loop approximation.
      fabric.bumpMap = map; fabric.bumpScale = 0.014;
      fabric.color.set("#ffffff"); fabric.needsUpdate = true;
    };

    const cached = cache.get(next.id);
    if (cached) { apply(cached); return; }

    loader.load(
      `/media/band/materials-v1/${next.id}.png`,
      map => {
        if (disposed) { map.dispose(); return; }
        cache.set(next.id, dress(map));
        apply(map);
      },
      undefined,
      () => {
        // Every colourway ships a yarn tile, so this only fires on a genuine
        // network failure. Tint the strap with the finish's own yarn so it is
        // at least the right colour rather than the previous one — the error
        // callback used to be absent entirely, which left Olive showing Ember.
        if (disposed) return;
        fabric.map = null; fabric.bumpMap = null;
        fabric.color.set(next.yarn); fabric.needsUpdate = true;
      },
    );
  }
  setFinish(finish);
  return {
    group, setFinish,
    dispose() {
      disposed = true;
      cache.forEach(texture => texture.dispose());
      const materials = new Set<THREE.Material>();
      group.traverse(object => { if (object instanceof THREE.Mesh) { object.geometry.dispose(); (Array.isArray(object.material) ? object.material : [object.material]).forEach(m => materials.add(m)); } });
      materials.forEach(m => m.dispose()); textures.forEach(t => t.dispose());
    },
  };
}
