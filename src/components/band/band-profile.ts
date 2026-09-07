import * as THREE from "three";
import { TessellateModifier } from "three/addons/modifiers/TessellateModifier.js";
import { mergeVertices } from "three/addons/utils/BufferGeometryUtils.js";

// Display proportions derived from rendered-V1.png, in strap-width units.
// All surfaces share this profile; changing a finish cannot change geometry.
export const BAND_PROFILE = {
  height: 1.35,
  depth: 0.97,
  strapWidth: 1,
  shellAngle: 1.36,
  claspAngle: 1.36,
} as const;

export function wristFrame(angle: number) {
  const { height, depth } = BAND_PROFILE;
  const position = new THREE.Vector3(0, height * Math.cos(angle), depth * Math.sin(angle));
  const normal = new THREE.Vector3(0, Math.cos(angle) / height, Math.sin(angle) / depth).normalize();
  const tangent = new THREE.Vector3(0, -height * Math.sin(angle), depth * Math.cos(angle)).normalize();
  return { position, normal, tangent };
}

export function bendToWrist(geometry: THREE.BufferGeometry, offset: number, centreAngle: number) {
  // RoundedBox subdivides corners but leaves long flat spans as large triangles.
  // Subdivide those spans BEFORE bending so the long side is genuinely curved.
  const divided = new TessellateModifier(0.055, 8).modify(geometry);
  divided.deleteAttribute("normal"); divided.deleteAttribute("uv");
  const smooth = mergeVertices(divided, 0.00001);
  geometry.copy(smooth); divided.dispose(); smooth.dispose();
  const vertices = geometry.attributes.position;
  for (let i = 0; i < vertices.count; i++) {
    const frame = wristFrame(centreAngle - vertices.getY(i) / 1.27);
    const p = frame.position.addScaledVector(frame.normal, offset + vertices.getZ(i));
    vertices.setXYZ(i, vertices.getX(i), p.y, p.z);
  }
  vertices.needsUpdate = true;
  geometry.computeVertexNormals();
}
