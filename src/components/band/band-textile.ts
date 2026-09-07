import * as THREE from "three";
import { wristFrame } from "./band-profile";
import type { BandFinish } from "./colourways";

/** Instanced interlocking yarn, including an inner weave and bound selvages. */
export function createTextile() {
  const group = new THREE.Group();
  group.name = "Interlocking technical textile";
  const yarn = new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: 0.83, metalness: 0, specularIntensity: 0.3, sheen: 0.08, sheenRoughness: 0.9 });
  const path = new THREE.CatmullRomCurve3([
    [-0.43, -0.5, -0.05], [-0.31, -0.12, 0.08], [-0.18, 0.32, 0.16],
    [0, 0.51, 0.13], [0.18, 0.28, 0.08], [0.30, -0.13, -0.02],
    [0.43, -0.5, -0.12], [0, -0.30, -0.2],
  ].map(p => new THREE.Vector3(...p)), true, "centripetal");
  const stitch = new THREE.TubeGeometry(path, 16, 0.125, 5, true);
  const columns = 34, rows = 176;
  const weave = new THREE.InstancedMesh(stitch, yarn, columns * rows * 2);
  weave.name = "Raised knitted yarn loops";
  const matrix = new THREE.Matrix4(), basis = new THREE.Matrix4(), rotation = new THREE.Quaternion();
  const xAxis = new THREE.Vector3(1, 0, 0), scale = new THREE.Vector3(1 / columns, 0.047, 0.038);
  let index = 0;
  for (const side of [1, -1]) {
    for (let row = 0; row < rows; row++) {
      const angle = row / rows * Math.PI * 2;
      const f = wristFrame(angle);
      basis.makeBasis(xAxis, f.tangent.clone().multiplyScalar(-side), f.normal.clone().multiplyScalar(side));
      rotation.setFromRotationMatrix(basis);
      for (let column = 0; column < columns; column++) {
        const p = f.position.clone().addScaledVector(f.normal, side * 0.039);
        p.x = (column + 0.5) / columns - 0.5;
        matrix.compose(p, rotation, scale); weave.setMatrixAt(index++, matrix);
      }
    }
  }
  weave.instanceMatrix.needsUpdate = true;
  weave.computeBoundingSphere(); group.add(weave);

  // Close-spaced loops wrapped over both fabric edges, not a smooth rubber rim.
  const bindingGeometry = new THREE.TorusGeometry(0.031, 0.005, 5, 10);
  const binding = new THREE.InstancedMesh(bindingGeometry, yarn, rows * 2);
  binding.name = "Reinforced woven edges";
  index = 0;
  for (const edge of [-1, 1]) {
    for (let row = 0; row < rows; row++) {
      const f = wristFrame(row / rows * Math.PI * 2);
      basis.makeBasis(xAxis, f.normal, f.tangent); rotation.setFromRotationMatrix(basis);
      f.position.x = edge * 0.48;
      matrix.compose(f.position, rotation, new THREE.Vector3(0.78, 1.1, 1));
      binding.setMatrixAt(index++, matrix);
    }
  }
  binding.instanceMatrix.needsUpdate = true; binding.computeBoundingSphere(); group.add(binding);

  function setFinish(finish: BandFinish) {
    const light = new THREE.Color(finish.id === "black" ? "#171819" : finish.yarn);
    const dark = new THREE.Color(finish.id === "black" ? "#090a0b" : finish.weave);
    const colour = new THREE.Color();
    for (const mesh of [weave, binding]) {
      for (let i = 0; i < mesh.count; i++) {
        const variation = ((i * 73 + 19) % 101) / 100;
        colour.copy(light).lerp(dark, variation ** 2 * 0.8);
        mesh.setColorAt(i, colour);
      }
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    }
  }
  return { group, setFinish };
}
