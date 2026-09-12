import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { createBandModel } from "./band-model";
import type { BandFinish } from "./colourways";

export type BandScene = ReturnType<typeof mountBandScene>;

export function mountBandScene(host: HTMLElement, finish: BandFinish, onFailure: () => void) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "low-power" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1;
  host.appendChild(renderer.domElement);
  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  const room = new RoomEnvironment(); const environment = pmrem.fromScene(room, 0.04);
  scene.environment = environment.texture; scene.environmentIntensity = 0.5;
  room.dispose(); pmrem.dispose();
  const model = createBandModel(finish); scene.add(model.group);
  const camera = new THREE.PerspectiveCamera(20, 1, 0.1, 60);
  camera.position.set(6.2, 1.5, 6.8);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true; controls.dampingFactor = 0.075;
  controls.enablePan = false; controls.enableZoom = false;
  controls.rotateSpeed = 0.65; controls.autoRotateSpeed = 0.65;
  controls.minPolarAngle = Math.PI * 0.16; controls.maxPolarAngle = Math.PI * 0.84;
  controls.minDistance = 6.5; controls.maxDistance = 14;
  controls.target.set(0, 0, 0); controls.update(); controls.saveState();
  // Vertical page scrolling remains available on touch screens.
  renderer.domElement.style.touchAction = "pan-y";
  renderer.domElement.setAttribute("aria-hidden", "true");
  const key = new THREE.DirectionalLight(0xfff8f0, 1.8); key.position.set(-3, 5, 4);
  key.shadow.mapSize.set(1024, 1024); key.shadow.camera.left = key.shadow.camera.bottom = -3; key.shadow.camera.right = key.shadow.camera.top = 3; key.shadow.normalBias = 0.025;
  scene.add(key, new THREE.HemisphereLight(0xffffff, 0x77706a, 0.6));
  const rim = new THREE.DirectionalLight(0xdde5ff, 0.8); rim.position.set(3, 2, -4); scene.add(rim);
  const shadow = document.createElement("canvas"); shadow.width = shadow.height = 128;
  const sc = shadow.getContext("2d")!, gradient = sc.createRadialGradient(64, 64, 4, 64, 64, 64);
  gradient.addColorStop(0, "rgba(0,0,0,.24)"); gradient.addColorStop(1, "rgba(0,0,0,0)"); sc.fillStyle = gradient; sc.fillRect(0, 0, 128, 128);
  const shadowTexture = new THREE.CanvasTexture(shadow);
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 2.4), new THREE.MeshBasicMaterial({ map: shadowTexture, transparent: true, depthWrite: false }));
  ground.rotation.x = -Math.PI / 2; ground.position.y = -1.43; ground.receiveShadow = true; scene.add(ground);

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
    ready: model.ready,
    setFinish: model.setFinish,
    setAuto(value: boolean) { auto = value; },
    rotate(direction: number) { interact(); controls.rotateLeft(direction * Math.PI / 8); controls.update(); },
    tilt(direction: number) { interact(); controls.rotateUp(direction * Math.PI / 12); controls.update(); },
    zoom(direction: number) { interact(); if (direction > 0) controls.dollyIn(1.16); else controls.dollyOut(1.16); controls.update(); },
    reset() { interact(); controls.reset(); },
    /**
     * Places the camera absolutely from a 0–1 story position.
     *
     * `rotate` and `tilt` are incremental, which is right for a button and
     * wrong for scroll: scrubbing needs the same input to give the same frame
     * every time, forwards or backwards. This interpolates spherical
     * coordinates instead, so scroll position maps to camera position.
     *
     * The path follows the product beats — three-quarter view, a slow
     * approach, around to the underside where the sensors are, then in close.
     */
    setShot(t: number) {
      const clamped = Math.min(1, Math.max(0, t));
      // Most of a turn, ending under the band rather than spinning past it.
      const azimuth = Math.PI * 0.28 + clamped * Math.PI * 1.35;
      // High three-quarter down to below the horizon, showing the underside.
      const polar = Math.PI * (0.44 - clamped * 0.26);
      // Pulls in, then holds so the macro beat is not distorted by dolly.
      const distance = 9.4 - Math.min(clamped, 0.82) * 3.6;

      const spherical = new THREE.Spherical(distance, Math.max(0.08, polar), azimuth);
      camera.position.setFromSpherical(spherical).add(controls.target);
      camera.lookAt(controls.target);
      controls.update();
      // Scroll is the interaction; auto-rotation must not fight it.
      auto = false;
      resume();
    },
    inside() { interact(); camera.position.set(4.5, 1.4, -2.8); controls.target.set(0, 0.12, 0.25); controls.update(); },
    dispose() {
      disposed = true; stop(); resize.disconnect(); observer.disconnect(); document.removeEventListener("visibilitychange", visibility);
      renderer.domElement.removeEventListener("webglcontextlost", lost); controls.dispose(); model.dispose();
      ground.geometry.dispose(); ground.material.dispose(); shadowTexture.dispose(); environment.dispose(); key.shadow.map?.dispose();
      renderer.dispose(); renderer.domElement.remove();
    },
  };
}
