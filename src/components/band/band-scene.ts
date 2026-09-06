import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { createBandModel } from "./band-model";
import type { BandFinish } from "./colourways";

export type BandScene = ReturnType<typeof mountBandScene>;

export function mountBandScene(host: HTMLElement, finish: BandFinish, onFailure: () => void) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "low-power" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 0.85;
  host.appendChild(renderer.domElement);
  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  const room = new RoomEnvironment(); const environment = pmrem.fromScene(room, 0.04);
  scene.environment = environment.texture; scene.environmentIntensity = 0.55;
  room.dispose(); pmrem.dispose();
  const model = createBandModel(finish); scene.add(model.group);
  const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 40);
  camera.position.set(3.6, 1.7, 5.1);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true; controls.dampingFactor = 0.075;
  controls.enablePan = false; controls.enableZoom = false;
  controls.rotateSpeed = 0.65; controls.autoRotateSpeed = 0.65;
  controls.minPolarAngle = Math.PI * 0.16; controls.maxPolarAngle = Math.PI * 0.84;
  controls.minDistance = 3.8; controls.maxDistance = 8;
  controls.target.set(0, 0, 0); controls.update(); controls.saveState();
  // Vertical page scrolling remains available on touch screens.
  renderer.domElement.style.touchAction = "pan-y";
  renderer.domElement.setAttribute("aria-hidden", "true");
  const key = new THREE.DirectionalLight(0xffffff, 2); key.position.set(-3, 5, 4);
  key.shadow.mapSize.set(1024, 1024); key.shadow.camera.left = key.shadow.camera.bottom = -3; key.shadow.camera.right = key.shadow.camera.top = 3; key.shadow.normalBias = 0.025;
  scene.add(key, new THREE.HemisphereLight(0xffffff, 0x77706a, 0.8));
  const rim = new THREE.DirectionalLight(0xdde5ff, 1.4); rim.position.set(3, 2, -4); scene.add(rim);
  const shadow = document.createElement("canvas"); shadow.width = shadow.height = 128;
  const sc = shadow.getContext("2d")!, gradient = sc.createRadialGradient(64, 64, 4, 64, 64, 64);
  gradient.addColorStop(0, "rgba(0,0,0,.24)"); gradient.addColorStop(1, "rgba(0,0,0,0)"); sc.fillStyle = gradient; sc.fillRect(0, 0, 128, 128);
  const shadowTexture = new THREE.CanvasTexture(shadow);
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 2.4), new THREE.MeshBasicMaterial({ map: shadowTexture, transparent: true, depthWrite: false }));
  ground.rotation.x = -Math.PI / 2; ground.position.y = -1.4; ground.receiveShadow = true; scene.add(ground);

  let auto = true, dragging = false, lastInteraction = 0, visible = true, disposed = false, frame = 0, previous = 0;
  const interact = () => { lastInteraction = performance.now(); };
  const start = () => { dragging = true; interact(); };
  const end = () => { dragging = false; interact(); };
  controls.addEventListener("start", start); controls.addEventListener("end", end);
  const lost = (event: Event) => { event.preventDefault(); stop(); onFailure(); };
  renderer.domElement.addEventListener("webglcontextlost", lost);

  function draw(now: number) {
    frame = 0;
    if (disposed || !visible || document.hidden) return;
    const delta = previous ? Math.min((now - previous) / 1000, 0.05) : 0;
    previous = now;
    controls.autoRotate = auto && !dragging && now - lastInteraction > 6000;
    controls.update(delta); renderer.render(scene, camera);
    frame = requestAnimationFrame(draw);
  }
  function stop() { if (frame) cancelAnimationFrame(frame); frame = 0; previous = 0; }
  function resume() { if (!frame && !disposed && visible && !document.hidden) frame = requestAnimationFrame(draw); }
  const visibility = () => { if (document.hidden) stop(); else resume(); };
  document.addEventListener("visibilitychange", visibility);
  const resize = new ResizeObserver(() => {
    const { width, height } = host.getBoundingClientRect();
    if (!width || !height) return;
    camera.aspect = width / height; camera.updateProjectionMatrix(); renderer.setSize(width, height); resume();
  }); resize.observe(host);
  const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; if (visible) resume(); else stop(); }); observer.observe(host);
  resume();
  return {
    setFinish: model.setFinish,
    setAuto(value: boolean) { auto = value; },
    rotate(direction: number) { interact(); controls.rotateLeft(direction * Math.PI / 8); controls.update(); },
    tilt(direction: number) { interact(); controls.rotateUp(direction * Math.PI / 12); controls.update(); },
    zoom(direction: number) { interact(); if (direction > 0) controls.dollyIn(1.16); else controls.dollyOut(1.16); controls.update(); },
    reset() { interact(); controls.reset(); },
    inside() { interact(); camera.position.set(4.5, 1.4, -2.8); controls.target.set(0, 0.12, 0.25); controls.update(); },
    dispose() {
      disposed = true; stop(); resize.disconnect(); observer.disconnect(); document.removeEventListener("visibilitychange", visibility);
      renderer.domElement.removeEventListener("webglcontextlost", lost); controls.dispose(); model.dispose();
      ground.geometry.dispose(); ground.material.dispose(); shadowTexture.dispose(); environment.dispose(); key.shadow.map?.dispose();
      renderer.dispose(); renderer.domElement.remove();
    },
  };
}
