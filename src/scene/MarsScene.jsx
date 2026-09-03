import { useMemo, useRef, useEffect, useState, Suspense } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Html, useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { WORKS } from "../data/works.js";

const TYPE_COLORS = {
  red: { petal: 0xdc0000, core: 0x72b4d9 },
  blue: { petal: 0x72b4d9, core: 0xf4a827 },
  orange: { petal: 0xf4a827, core: 0xdc0000 },
};

/* 移动端降载：减少粒子/几何细节/像素比，避免手机卡顿掉帧 */
const MOBILE =
  typeof window !== "undefined" &&
  Math.min(window.innerWidth, window.innerHeight) < 768;

/* ---------- Value noise ---------- */
const _P = new Uint8Array(512);
for (let i = 0; i < 256; i++) _P[i] = _P[i + 256] = (i * 167 + 53) & 255;
const _fade = (t) => t * t * t * (t * (t * 6 - 15) + 10);
const _lerp = (a, b, t) => a + t * (b - a);
function _hash2(ix, iy) {
  const h = _P[(_P[ix & 255] + iy) & 255];
  return (h / 255) * 2 - 1;
}
function noise2(x, y) {
  const ix = Math.floor(x), iy = Math.floor(y);
  const fx = x - ix, fy = y - iy;
  const u = _fade(fx), v = _fade(fy);
  return _lerp(
    _lerp(_hash2(ix, iy), _hash2(ix + 1, iy), u),
    _lerp(_hash2(ix, iy + 1), _hash2(ix + 1, iy + 1), u),
    v
  );
}
function fbm(x, y, oct) {
  let v = 0, a = 0.5, f = 1;
  for (let i = 0; i < oct; i++) { v += a * noise2(x * f, y * f); a *= 0.5; f *= 2.1; }
  return v;
}

const SIZE = 80, DEPTH = 150, SEG = MOBILE ? 150 : 256;
const FIELD_Z = -42;
// 挂到 globalThis：HMR 热更新会复制模块，若各组件引用不同 view 副本会不同步
// （表现：星球该隐藏却常驻天空）。全局单例确保所有副本共享同一状态。
const view = (globalThis.__marsView ||= { p: 0, mx: 0, my: 0, sun: 0 });
function terrainRaw(lx, lz) {
  let h = fbm(lx * 0.06 + 7, lz * 0.06 + 7, 7) * 5;
  const side = Math.abs(lx) / (SIZE / 2);
  h += Math.pow(side, 2.5) * 10;
  h -= Math.exp(-(lx * lx) / 50) * 2.5;
  h += fbm(lx * 0.25 + 3, lz * 0.25 + 3, 3) * 0.8;
  /* 花园区域压平：椭圆范围内地面趋于平整 */
  const gd = Math.sqrt(lx * lx * 0.32 + (lz - FIELD_Z) * (lz - FIELD_Z));
  const k = Math.min(1, Math.max(0, (gd - 13) / 16));
  const flat = 0.4 + fbm(lx * 0.05, lz * 0.05, 2) * 0.45;
  return flat + (h - flat) * k;
}
function terrainH(lx, lz) {
  return terrainRaw(lx, lz) - 2;
}

/* ---------- Terrain ---------- */
function Terrain() {
  const geo = useMemo(() => {
    const g = new THREE.PlaneGeometry(SIZE, DEPTH, SEG, SEG);
    g.rotateX(-Math.PI / 2);
    const pos = g.attributes.position;
    const colors = new Float32Array(pos.count * 3);
    const base = new THREE.Color(0xa8845a);
    const dark = new THREE.Color(0x5a3218);
    const light = new THREE.Color(0xc9a882);
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i), z = pos.getZ(i);
      const h = terrainRaw(x, z);
      pos.setY(i, h);
      const t = THREE.MathUtils.clamp((h + 1) / 12, 0, 1);
      const n = noise2(x * 0.4 + 5, z * 0.4 + 5) * 0.12;
      const c = new THREE.Color().copy(base);
      if (t > 0.5) c.lerp(dark, (t - 0.5) * 2);
      else c.lerp(light, (0.5 - t) * 1.5);
      colors[i * 3] = Math.max(0, c.r + n);
      colors[i * 3 + 1] = Math.max(0, c.g + n * 0.7);
      colors[i * 3 + 2] = Math.max(0, c.b + n * 0.4);
    }
    g.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    g.computeVertexNormals();
    return g;
  }, []);

  return (
    <mesh geometry={geo} position={[0, -2, 0]} receiveShadow>
      <meshStandardMaterial vertexColors roughness={0.92} metalness={0.03} />
    </mesh>
  );
}

const ROCK_COLORS = [0x5a3e28, 0x6b4a2a, 0x8b6b4a];
function useRockMaterials() {
  return useMemo(
    () => [
      new THREE.MeshStandardMaterial({ color: ROCK_COLORS[0], roughness: 0.95, metalness: 0.02 }),
      new THREE.MeshStandardMaterial({ color: ROCK_COLORS[1], roughness: 0.93, metalness: 0.02 }),
      new THREE.MeshStandardMaterial({ color: ROCK_COLORS[2], roughness: 0.9, metalness: 0.04 }),
    ],
    []
  );
}

/* ---------- Ground rocks ---------- */
function Rocks() {
  const mats = useRockMaterials();
  const rocks = useMemo(() => {
    const list = [];
    for (let i = 0; i < 30; i++) {
      const detail = Math.random() > 0.6 ? 1 : 0;
      const g = new THREE.DodecahedronGeometry(0.2 + Math.random() * 0.9, detail);
      const rp = g.attributes.position;
      for (let j = 0; j < rp.count; j++) {
        const rx = rp.getX(j), ry = rp.getY(j), rz = rp.getZ(j);
        const n = 1 + noise2(rx * 3 + i * 7, rz * 3 + i * 3) * 0.35;
        rp.setXYZ(j, rx * n, ry * (0.4 + Math.random() * 0.5), rz * n);
      }
      g.computeVertexNormals();
      const angle = (Math.random() - 0.5) * Math.PI * 0.9;
      const dist = 2 + Math.random() * 25;
      const wx = Math.sin(angle) * dist;
      const wz = -Math.random() * 35 - 3;
      list.push({
        geometry: g,
        mat: i % 3,
        position: [wx, terrainH(wx, wz) - 0.1, wz],
        rotation: [Math.random() * 0.4, Math.random() * Math.PI, Math.random() * 0.3],
      });
    }
    return list;
  }, []);

  return rocks.map((r, i) => (
    <mesh key={i} geometry={r.geometry} material={mats[r.mat]} position={r.position} rotation={r.rotation} castShadow receiveShadow />
  ));
}

/* ---------- Floating rocks ---------- */
function Floaters() {
  const mats = useRockMaterials();
  const refs = useRef([]);
  const data = useMemo(() => {
    const list = [];
    for (let i = 0; i < 6; i++) {
      const g = new THREE.DodecahedronGeometry(0.15 + Math.random() * 0.4, 0);
      const rp = g.attributes.position;
      for (let j = 0; j < rp.count; j++) {
        rp.setXYZ(j, rp.getX(j) * (0.8 + Math.random() * 0.4), rp.getY(j) * (0.6 + Math.random() * 0.4), rp.getZ(j) * (0.8 + Math.random() * 0.4));
      }
      g.computeVertexNormals();
      const baseY = 5 + Math.random() * 8;
      list.push({
        geometry: g,
        mat: i % 3,
        position: [(Math.random() - 0.5) * 20, baseY, -5 - Math.random() * 20],
        baseY,
        speed: 0.3 + Math.random() * 0.5,
        phase: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.01,
      });
    }
    return list;
  }, []);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    data.forEach((d, i) => {
      const m = refs.current[i];
      if (!m) return;
      m.position.y = d.baseY + Math.sin(t * d.speed + d.phase) * 0.5;
      m.rotation.y += d.rotSpeed;
      m.rotation.x += d.rotSpeed * 0.3;
    });
  });

  return data.map((d, i) => (
    <mesh key={i} ref={(el) => (refs.current[i] = el)} geometry={d.geometry} material={mats[d.mat]} position={d.position} />
  ));
}

/* ---------- Dust ---------- */
const DUST_N = MOBILE ? 500 : 1200;
function Dust() {
  const ref = useRef();
  const { positions, vel } = useMemo(() => {
    const positions = new Float32Array(DUST_N * 3);
    const vel = new Float32Array(DUST_N * 3);
    for (let i = 0; i < DUST_N; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 50;
      positions[i * 3 + 1] = Math.random() * 20;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 50 - 10;
      vel[i * 3] = (Math.random() - 0.5) * 0.01;
      vel[i * 3 + 1] = 0.002 + Math.random() * 0.008;
      vel[i * 3 + 2] = (Math.random() - 0.5) * 0.01;
    }
    return { positions, vel };
  }, []);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    const attr = ref.current.geometry.attributes.position;
    for (let i = 0; i < DUST_N; i++) {
      let y = attr.getY(i) + vel[i * 3 + 1];
      let x = attr.getX(i) + vel[i * 3] + Math.sin(t * 0.5 + i) * 0.002;
      if (y > 20) { y = 0; x = (Math.random() - 0.5) * 50; }
      attr.setX(i, x);
      attr.setY(i, y);
    }
    attr.needsUpdate = true;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" array={positions} count={DUST_N} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial color={0xc9a882} size={0.06} transparent opacity={0.5} sizeAttenuation depthWrite={false} />
    </points>
  );
}

/* ---------- Stars ---------- */
const STAR_N = MOBILE ? 180 : 300;
function Stars() {
  const positions = useMemo(() => {
    const p = new Float32Array(STAR_N * 3);
    for (let i = 0; i < STAR_N; i++) {
      p[i * 3] = (Math.random() - 0.5) * 100;
      p[i * 3 + 1] = 15 + Math.random() * 40;
      p[i * 3 + 2] = -20 - Math.random() * 60;
    }
    return p;
  }, []);
  return (
    <points>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" array={positions} count={STAR_N} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial color={0xfff5eb} size={0.04} transparent opacity={0.6} sizeAttenuation depthWrite={false} />
    </points>
  );
}

/* ---------- Glow (nebula light) ---------- */
function Glow() {
  const meshRef = useRef();
  const lightRef = useRef();
  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (meshRef.current) meshRef.current.scale.setScalar(1 + Math.sin(t * 0.8) * 0.05);
    if (lightRef.current) lightRef.current.intensity = 1.5 + Math.sin(t * 0.5) * 0.3;
  });
  return (
    <group position={[0, 16, -25]}>
      <mesh ref={meshRef}>
        <sphereGeometry args={[3, 32, 32]} />
        <meshBasicMaterial color={0xffeedd} transparent opacity={0.08} />
      </mesh>
      <pointLight ref={lightRef} color={0xffeedd} intensity={1.5} distance={60} decay={1.5} />
    </group>
  );
}

/* 地面场景门：太空俯冲段隐藏，进入火星表面时显现（转场） */
function GroundGate({ children }) {
  const ref = useRef();
  useFrame(() => {
    if (ref.current) ref.current.visible = view.p > 0.066;
  });
  return <group ref={ref}>{children}</group>;
}

/* ---------- 开屏宏观火星（随滚动淡出 + 交互） ---------- */
const PLANET_R = 150, PLANET_Z = -260;
const INTRO_MAX = 0.05;  // 火星交互仅在开场太空段生效

/* 点击在火星表面播种的小花（随星球一起转，破土绽放） */
function PlantedFlower({ position, quaternion, variant }) {
  const ref = useRef();
  const t0 = useRef(null);
  useFrame((state) => {
    const now = state.clock.getElapsedTime();
    if (t0.current === null) t0.current = now;
    const s = THREE.MathUtils.clamp((now - t0.current) / 0.6, 0, 1);
    const eased = 1 - Math.pow(1 - s, 3);
    if (ref.current) ref.current.scale.setScalar(eased * 16);
  });
  return (
    <group ref={ref} position={position} quaternion={quaternion} scale={0}>
      <FlowerGLB variant={variant} h={1} noFog />
    </group>
  );
}

function MarsPlanet() {
  const grp = useRef();
  const matRef = useRef();
  const vel = useRef({ x: 0, y: 0 });
  const drag = useRef({ on: false, lx: 0, ly: 0, moved: 0 });
  const [plants, setPlants] = useState([]);

  const geo = useMemo(() => {
    const R = PLANET_R;
    const g = new THREE.SphereGeometry(R, 128, 128);
    const pos = g.attributes.position;
    const colors = new Float32Array(pos.count * 3);
    const base = new THREE.Color(0xb26138);
    const dark = new THREE.Color(0x4a2410);
    const light = new THREE.Color(0xd99a63);
    const ice = new THREE.Color(0xcbb69c);   // 冰盖调暗，避免顶部过曝白茫茫
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
      const lat = y / R;
      const n1 = fbm(x * 0.02, z * 0.02 + y * 0.012, 6);
      const n2 = fbm(x * 0.07 + 50, z * 0.07 + 50, 4);
      const n3 = fbm(x * 0.16 + 90, z * 0.16 + 20, 3);
      const c = base.clone();
      if (n1 < -0.12) c.lerp(dark, Math.min(1, (-0.12 - n1) * 2.2));
      else c.lerp(light, Math.min(1, n1 * 0.9));
      c.offsetHSL(0, n3 * 0.03, (n2 * 0.05 + n3 * 0.03));
      const cr = noise2(x * 0.55 + 11, z * 0.55 + 4);
      if (cr > 0.72) c.lerp(dark, Math.min(1, (cr - 0.72) * 2.4));
      else if (cr > 0.6) c.lerp(light, (cr - 0.6) * 1.2);
      const al = Math.abs(lat);
      if (al > 0.88) c.lerp(ice, Math.min(1, (al - 0.88) / 0.12) * 0.5);   // 缩小极冠 + 降低白度
      colors[i * 3] = c.r; colors[i * 3 + 1] = c.g; colors[i * 3 + 2] = c.b;
    }
    g.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    g.computeVertexNormals();
    return g;
  }, []);

  /* 拖拽旋转（窗口级监听，指针离开球体也能继续） */
  useEffect(() => {
    const onMove = (e) => {
      if (!drag.current.on || !grp.current) return;
      const dx = e.clientX - drag.current.lx;
      const dy = e.clientY - drag.current.ly;
      drag.current.lx = e.clientX; drag.current.ly = e.clientY;
      drag.current.moved += Math.abs(dx) + Math.abs(dy);
      const ry = dx * 0.006, rx = dy * 0.006;
      grp.current.rotation.y += ry;
      grp.current.rotation.x += rx;
      vel.current.y = ry; vel.current.x = rx;
    };
    const onUp = () => { drag.current.on = false; document.body.classList.remove("grabbing"); };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => { window.removeEventListener("pointermove", onMove); window.removeEventListener("pointerup", onUp); };
  }, []);

  useFrame(() => {
    const p = view.p;
    const vis = 1 - THREE.MathUtils.clamp((p - 0.035) / 0.027, 0, 1);
    if (grp.current) {
      grp.current.visible = p < 0.066 && vis > 0.002;   // 地面门开启前必然隐藏，杜绝残留灰圆
      if (!drag.current.on) {
        grp.current.rotation.y += vel.current.y + 0.0016;
        grp.current.rotation.x += vel.current.x;
        vel.current.y *= 0.94; vel.current.x *= 0.94;
      }
    }
    if (matRef.current) matRef.current.opacity = vis;
  });

  const onDown = (e) => {
    if (view.p > INTRO_MAX) return;
    e.stopPropagation();
    drag.current.on = true;
    drag.current.lx = e.clientX; drag.current.ly = e.clientY; drag.current.moved = 0;
    document.body.classList.add("grabbing");
  };
  const onClick = (e) => {
    if (view.p > INTRO_MAX || !grp.current) return;
    e.stopPropagation();
    if (drag.current.moved > 6) return;   // 是拖拽而非点击
    const local = grp.current.worldToLocal(e.point.clone());
    const n = local.normalize();
    const posv = n.clone().multiplyScalar(PLANET_R);
    /* 沿球面法线向外直立，再叠加随机自转 + 轻微倾斜 → 自然生长感 */
    const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), n);
    const roll = new THREE.Quaternion().setFromAxisAngle(n, Math.random() * Math.PI * 2);
    const tiltAxis = new THREE.Vector3(Math.random() - 0.5, 0, Math.random() - 0.5).normalize();
    const tilt = new THREE.Quaternion().setFromAxisAngle(tiltAxis, (Math.random() - 0.5) * 0.28);
    q.premultiply(roll).premultiply(tilt);
    setPlants((arr) => [...arr, {
      id: Math.random(),
      pos: [posv.x, posv.y, posv.z],
      quat: [q.x, q.y, q.z, q.w],
      variant: Math.floor(Math.random() * 3),
    }]);
  };

  return (
    <group ref={grp} position={[0, 0, PLANET_Z]}>
      <mesh geometry={geo} onPointerDown={onDown} onClick={onClick}>
        <meshStandardMaterial ref={matRef} vertexColors roughness={0.96} metalness={0.02} emissive={0x2a0f06} emissiveIntensity={0.18} transparent fog={false} />
      </mesh>
      <Suspense fallback={null}>
        {plants.map((f) => (
          <PlantedFlower key={f.id} position={f.pos} quaternion={f.quat} variant={f.variant} />
        ))}
      </Suspense>
    </group>
  );
}

/* 光标引力星尘（开场太空段，铺满全屏，被光标吸引汇聚） */
const SPACEDUST_N = MOBILE ? 400 : 900;
const DUST_TEX = (() => {
  if (typeof document === "undefined") return null;
  const c = document.createElement("canvas");
  c.width = c.height = 64;
  const ctx = c.getContext("2d");
  const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  g.addColorStop(0, "rgba(255,255,255,1)");
  g.addColorStop(0.25, "rgba(255,228,196,0.85)");
  g.addColorStop(0.55, "rgba(255,190,140,0.35)");
  g.addColorStop(1, "rgba(255,170,120,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 64, 64);
  const t = new THREE.CanvasTexture(c);
  t.needsUpdate = true;
  return t;
})();
function SpaceDust() {
  const ref = useRef();
  const { camera } = useThree();
  const ray = useMemo(() => new THREE.Raycaster(), []);
  const target = useMemo(() => new THREE.Vector3(), []);
  const data = useMemo(() => {
    const home = new Float32Array(SPACEDUST_N * 3);
    const pos = new Float32Array(SPACEDUST_N * 3);
    const vel = new Float32Array(SPACEDUST_N * 3);
    const rc = new THREE.Raycaster();
    const v = new THREE.Vector3();
    for (let i = 0; i < SPACEDUST_N; i++) {
      // 按屏幕 NDC 反投影，随机深度 → 铺满整个视野
      const nx = Math.random() * 2 - 1;
      const ny = Math.random() * 2 - 1;
      const dist = 60 + Math.random() * 440;
      rc.setFromCamera({ x: nx, y: ny }, camera);
      rc.ray.at(dist, v);
      home[i * 3] = pos[i * 3] = v.x;
      home[i * 3 + 1] = pos[i * 3 + 1] = v.y;
      home[i * 3 + 2] = pos[i * 3 + 2] = v.z;
    }
    return { home, pos, vel };
  }, [camera]);

  useFrame((state) => {
    const vis = view.p < INTRO_MAX;
    if (ref.current) ref.current.visible = vis;
    if (!vis || !ref.current) return;
    /* 手机端无鼠标：让排斥点缓慢画圈，粒子自动漂动 */
    const t = state.clock.getElapsedTime();
    const mx = MOBILE ? Math.cos(t * 0.28) * 0.65 : view.mx;
    const my = MOBILE ? Math.sin(t * 0.22) * 0.5 : view.my;
    ray.setFromCamera({ x: mx, y: -my }, camera);
    ray.ray.at(camera.position.z + 160, target);
    const attr = ref.current.geometry.attributes.position;
    const { home, pos, vel } = data;
    const R = 110;
    for (let i = 0; i < SPACEDUST_N; i++) {
      const ix = i * 3;
      const dx = target.x - pos[ix], dy = target.y - pos[ix + 1], dz = target.z - pos[ix + 2];
      const d2 = dx * dx + dy * dy + dz * dz;
      if (d2 < R * R) {
        const d = Math.sqrt(d2) || 1;
        const f = (1 - d / R) * 0.8;
        vel[ix] += (dx / d) * f; vel[ix + 1] += (dy / d) * f; vel[ix + 2] += (dz / d) * f;
      }
      vel[ix] += (home[ix] - pos[ix]) * 0.012;
      vel[ix + 1] += (home[ix + 1] - pos[ix + 1]) * 0.012;
      vel[ix + 2] += (home[ix + 2] - pos[ix + 2]) * 0.012;
      vel[ix] *= 0.9; vel[ix + 1] *= 0.9; vel[ix + 2] *= 0.9;
      pos[ix] += vel[ix]; pos[ix + 1] += vel[ix + 1]; pos[ix + 2] += vel[ix + 2];
      attr.array[ix] = pos[ix]; attr.array[ix + 1] = pos[ix + 1]; attr.array[ix + 2] = pos[ix + 2];
    }
    attr.needsUpdate = true;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" array={data.pos} count={SPACEDUST_N} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial map={DUST_TEX} color={0xffd9b0} size={2.6} transparent opacity={0.85} sizeAttenuation depthWrite={false} blending={THREE.AdditiveBlending} fog={false} alphaTest={0.01} />
    </points>
  );
}

/* ---------- 3D 花田（滚到作品区抵达） ---------- */

/* 一圈花瓣 */
function PetalRing({ count, radius, tilt, scale, color, emissive = 0.22, y = 0 }) {
  const petals = [];
  for (let i = 0; i < count; i++) {
    const a = (i / count) * Math.PI * 2;
    petals.push(
      <mesh key={i} position={[Math.cos(a) * radius, y, Math.sin(a) * radius]} rotation={[tilt, -a, 0]} scale={scale}>
        <sphereGeometry args={[0.14, 16, 12]} />
        <meshStandardMaterial color={color} roughness={0.38} metalness={0.04} emissive={color} emissiveIntensity={emissive} flatShading={false} />
      </mesh>
    );
  }
  return <group>{petals}</group>;
}

/* 花头（三层错位花瓣 + 隆起花芯） */
function FlowerHead({ color, core, big = false }) {
  const s = big ? 1.12 : 1;
  return (
    <group scale={s}>
      {/* 外层：舒展大花瓣 */}
      <PetalRing count={9} radius={0.24} tilt={-0.4} scale={[0.4, 0.09, 1.3]} color={color} emissive={0.16} y={0} />
      {/* 中层：错位半开 */}
      <group rotation={[0, Math.PI / 9, 0]}>
        <PetalRing count={8} radius={0.16} tilt={-0.72} scale={[0.34, 0.09, 1.0]} color={color} emissive={0.26} y={0.05} />
      </group>
      {/* 内层：含苞小瓣 */}
      <PetalRing count={6} radius={0.085} tilt={-1.05} scale={[0.28, 0.08, 0.68]} color={color} emissive={0.36} y={0.1} />
      {/* 花芯圆盘 */}
      <mesh position={[0, 0.12, 0]}>
        <sphereGeometry args={[big ? 0.13 : 0.1, 18, 16]} />
        <meshStandardMaterial color={core} emissive={core} emissiveIntensity={0.65} roughness={0.28} metalness={0.1} />
      </mesh>
      {/* 花芯高光 */}
      <mesh position={[0, 0.17, 0]}>
        <sphereGeometry args={[big ? 0.055 : 0.042, 12, 12]} />
        <meshStandardMaterial color={0xfff2d8} emissive={0xfff2d8} emissiveIntensity={0.5} roughness={0.2} />
      </mesh>
    </group>
  );
}

/* ---------- 花朵模型（红/蓝/黄 三色） ---------- */
const FLOWER_URLS = ["/models/red.glb", "/models/blue.glb", "/models/yellow.glb"];
const FLOWER_TINT = [0xe23a2c, 0x3f83d6, 0xf4b41e];
FLOWER_URLS.forEach((u) => useGLTF.preload(u));

function FlowerGLB({ variant = 0, h = 1, noFog = false }) {
  const { scene } = useGLTF(FLOWER_URLS[variant % 3]);
  const model = useMemo(() => {
    const s = scene.clone(true);
    s.position.set(0, 0, 0);
    s.rotation.set(0, 0, 0);
    s.scale.set(1, 1, 1);
    const box = new THREE.Box3().setFromObject(s);
    const size = new THREE.Vector3(); box.getSize(size);
    const k = h / (size.y || 1);
    s.scale.setScalar(k);
    s.position.set(
      -((box.min.x + box.max.x) / 2) * k,
      -box.min.y * k,
      -((box.min.z + box.max.z) / 2) * k
    );
    s.traverse((o) => {
      if (o.isMesh) {
        o.castShadow = true;
        o.receiveShadow = false;
        if (o.material) {
          const m = o.material.clone();  // 克隆材质：避免多实例共享同一材质互相污染
          m.metalness = 0;              // 去金属：无环境贴图时金属材质会渲染成黑色
          m.roughness = Math.max(0.55, m.roughness ?? 0.7);
          m.envMapIntensity = 0;
          m.fog = !noFog;               // 远处（种在星球上）关雾，否则被雾染成背景暗色 = 没颜色
          m.needsUpdate = true;
          o.material = m;               // 保留原模型贴图与配色，不再强制纯色
        }
      }
    });
    return s;
  }, [scene, h, variant, noFog]);
  return <primitive object={model} />;
}

/* 普通装饰花 */
function Flower({ position, scale = 1, sway, variant = 0 }) {
  const head = useRef();
  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (head.current) head.current.rotation.z = Math.sin(t * 0.8 + sway) * 0.06;
  });
  return (
    <group position={position} scale={scale}>
      <group rotation={[0, -Math.PI / 2, 0]}>
        <group ref={head}>
          <FlowerGLB variant={variant} h={1} />
        </group>
      </group>
    </group>
  );
}

/* 特写作品花（滚到作品区后才发光/可点/可预览） */
function FeatureFlower({ position, color, core, work, onOpen, onHover, active, variant = 0 }) {
  const head = useRef();
  const halo = useRef();
  const ring = useRef();
  const [hover, setHover] = useState(false);

  useEffect(() => {
    if (!active && hover) {
      setHover(false);
      document.body.classList.remove("cursor-hover");
      onHover && onHover(null);
    }
  }, [active]);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (head.current) head.current.rotation.z = Math.sin(t * 0.9) * 0.06;
    if (ring.current) ring.current.rotation.z = t * 0.6;
    if (halo.current) {
      const base = 1 + Math.sin(t * 2) * 0.08;
      const s = hover ? base * 1.35 : base;
      halo.current.scale.setScalar(s);
      halo.current.material.opacity = hover ? 0.32 : 0.18;
    }
  });

  const onOver = (e) => { if (!active) return; e.stopPropagation(); setHover(true); document.body.classList.add("cursor-hover"); onHover && onHover(); };
  const onOut = (e) => { if (!active) return; e.stopPropagation(); setHover(false); document.body.classList.remove("cursor-hover"); onHover && onHover(null); };

  return (
    <group position={position} scale={active ? (hover ? 1.55 : 1.35) : 1.1}>
      {/* 花头模型 */}
      <group rotation={[0, -Math.PI / 2, 0]}>
        <group ref={head}>
          <FlowerGLB variant={variant} h={1.3} />
        </group>
      </group>

      {/* 发光 / 交互 —— 仅作品区激活后出现 */}
      {active && (
        <>
          <mesh
            position={[0, 0.7, 0]}
            visible={false}
            onClick={(e) => { e.stopPropagation(); onOpen(); }}
            onPointerOver={onOver}
            onPointerOut={onOut}
          >
            <sphereGeometry args={[0.8, 8, 8]} />
          </mesh>

          <mesh ref={halo} position={[0, 0.7, 0]}>
            <sphereGeometry args={[0.6, 16, 16]} />
            <meshBasicMaterial color={color} transparent opacity={0.18} depthWrite={false} />
          </mesh>
          <pointLight color={color} intensity={hover ? 2.4 : 1.5} distance={7} position={[0, 0.8, 0]} />

          <mesh ref={ring} position={[0, 0.03, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.5, 0.025, 8, 40]} />
            <meshBasicMaterial color={core} transparent opacity={0.7} />
          </mesh>

          <Html position={[0, 1.55, 0]} center distanceFactor={9} zIndexRange={[20, 0]} pointerEvents="none">
            <div className={"flower-label" + (hover ? " on" : "")}>
              <span className="fl-title">{work.title}</span>
              <span className="fl-hint">查看作品</span>
            </div>
          </Html>
        </>
      )}
    </group>
  );
}

/* 花园氛围：漂浮萤火 + 地面柔光 */
const FIREFLY_N = MOBILE ? 45 : 90;
function Fireflies() {
  const ref = useRef();
  const base = useMemo(() => {
    const p = new Float32Array(FIREFLY_N * 3);
    const ph = new Float32Array(FIREFLY_N);
    for (let i = 0; i < FIREFLY_N; i++) {
      const x = (Math.random() - 0.5) * 30;
      const z = FIELD_Z + (Math.random() - 0.5) * 24;
      p[i * 3] = x;
      p[i * 3 + 1] = terrainH(x, z) + 0.4 + Math.random() * 3.2;
      p[i * 3 + 2] = z;
      ph[i] = Math.random() * Math.PI * 2;
    }
    return { p, ph };
  }, []);
  const positions = useMemo(() => base.p.slice(), [base]);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    const attr = ref.current.geometry.attributes.position;
    for (let i = 0; i < FIREFLY_N; i++) {
      attr.setX(i, base.p[i * 3] + Math.sin(t * 0.5 + base.ph[i]) * 0.6);
      attr.setY(i, base.p[i * 3 + 1] + Math.sin(t * 0.8 + base.ph[i] * 1.7) * 0.4);
      attr.setZ(i, base.p[i * 3 + 2] + Math.cos(t * 0.4 + base.ph[i]) * 0.6);
    }
    attr.needsUpdate = true;
    if (ref.current) ref.current.material.opacity = 0.55 + Math.sin(t * 1.5) * 0.2;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" array={positions} count={FIREFLY_N} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial color={0xffdfa0} size={0.16} transparent opacity={0.6} sizeAttenuation depthWrite={false} blending={THREE.AdditiveBlending} />
    </points>
  );
}

function GardenGlow() {
  const ref = useRef();
  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (ref.current) ref.current.material.opacity = 0.12 + Math.sin(t * 0.7) * 0.04;
  });
  return (
    <mesh ref={ref} position={[0, terrainH(0, FIELD_Z) + 0.05, FIELD_Z]} rotation={[-Math.PI / 2, 0, 0]}>
      <circleGeometry args={[22, 48]} />
      <meshBasicMaterial color={0xff8a4a} transparent opacity={0.12} depthWrite={false} blending={THREE.AdditiveBlending} />
    </mesh>
  );
}

/* 草丛点缀 */
function GrassTufts() {
  const mat = useMemo(() => new THREE.MeshStandardMaterial({ color: 0x4a7a45, roughness: 0.9 }), []);
  const blades = useMemo(() => {
    const g = new THREE.ConeGeometry(0.03, 0.5, 4);
    const arr = [];
    for (let i = 0; i < 120; i++) {
      const x = (Math.random() - 0.5) * 32;
      const z = FIELD_Z + (Math.random() - 0.5) * 24;
      arr.push({
        position: [x, terrainH(x, z) + 0.22, z],
        rotation: [0, Math.random() * Math.PI, (Math.random() - 0.5) * 0.3],
        scale: 0.6 + Math.random() * 0.9,
      });
    }
    return { g, arr };
  }, []);
  return blades.arr.map((b, i) => (
    <mesh key={i} geometry={blades.g} material={mat} position={b.position} rotation={b.rotation} scale={b.scale} />
  ));
}

/* 花园小木屋 */
function Cabin() {
  const x = 9, z = -35;
  const y = terrainH(x, z);
  return (
    <group position={[x, y, z]} rotation={[0, -0.6, 0]} scale={1.15}>
      {/* 墙体 */}
      <mesh position={[0, 1, 0]} castShadow receiveShadow>
        <boxGeometry args={[2.6, 2, 2.1]} />
        <meshStandardMaterial color={0x9a6238} roughness={0.9} metalness={0.02} />
      </mesh>
      {/* 屋顶（四坡） */}
      <mesh position={[0, 2.55, 0]} rotation={[0, Math.PI / 4, 0]} castShadow>
        <coneGeometry args={[2.15, 1.4, 4]} />
        <meshStandardMaterial color={0x5a2f1c} roughness={0.85} />
      </mesh>
      {/* 门 */}
      <mesh position={[0, 0.72, 1.06]}>
        <boxGeometry args={[0.72, 1.44, 0.08]} />
        <meshStandardMaterial color={0x3a2012} roughness={0.8} />
      </mesh>
      {/* 暖光小窗 */}
      <mesh position={[0.85, 1.25, 1.06]}>
        <boxGeometry args={[0.5, 0.5, 0.06]} />
        <meshStandardMaterial color={0xffd9a0} emissive={0xffb060} emissiveIntensity={0.8} roughness={0.4} />
      </mesh>
      {/* 烟囱 */}
      <mesh position={[-0.7, 3.0, -0.3]} castShadow>
        <boxGeometry args={[0.4, 0.9, 0.4]} />
        <meshStandardMaterial color={0x6b4a2a} roughness={0.9} />
      </mesh>
      <pointLight color={0xffb060} intensity={0.9} distance={9} position={[0, 1.5, 1.8]} />
    </group>
  );
}

function FlowerField({ onOpenWork, onHoverWork }) {
  const [active, setActive] = useState(false);

  useEffect(() => {
    const el = document.getElementById("garden");
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => setActive(entries[0].isIntersecting && entries[0].intersectionRatio > 0.25),
      { threshold: [0, 0.25, 0.6] }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  /* 特写作品花的位置（更远的花田深处，突出） */
  const features = useMemo(() => {
    const xs = MOBILE ? [-4.3, -1.5, 1.5, 4.3] : [-8, -2.8, 2.8, 8];
    const zs = [-40, -43, -42.5, -40];
    return WORKS.map((w, i) => {
      const c = TYPE_COLORS[w.type] || TYPE_COLORS.red;
      const x = xs[i], z = zs[i];
      return { position: [x, terrainH(x, z) + 0.05, z], color: c.petal, core: c.core, work: w, idx: i };
    });
  }, []);

  /* 普通装饰花（避开特写花） */
  const flowers = useMemo(() => {
    const cols = [
      [0xdc0000, 0x72b4d9],
      [0x72b4d9, 0xf4a827],
      [0xf4a827, 0xdc0000],
    ];
    const arr = [];
    for (let i = 0; i < (MOBILE ? 28 : 50); i++) {
      const x = (Math.random() - 0.5) * 18;
      const z = FIELD_Z + (Math.random() - 0.5) * 13;
      const c = cols[i % 3];
      arr.push({
        position: [x, terrainH(x, z) + 0.05, z],
        scale: 0.7 + Math.random() * 0.6,
        color: c[0],
        core: c[1],
        sway: Math.random() * 6,
      });
    }
    return arr;
  }, []);

  return (
    <group>
      <pointLight color={0xffd9a0} intensity={1.1} distance={34} position={[0, 5, FIELD_Z]} />
      <GardenGlow />
      <Cabin />
      <GrassTufts />
      <Fireflies />
      <Suspense fallback={null}>
        {flowers.map((f, i) => (
          <Flower key={i} {...f} variant={i % 3} />
        ))}
        {features.map((f) => (
          <FeatureFlower key={f.idx} position={f.position} color={f.color} core={f.core} work={f.work} active={active} variant={f.idx % 3} onOpen={() => onOpenWork(f.idx)} onHover={(v) => onHoverWork(v === null ? null : f.idx)} />
        ))}
      </Suspense>
    </group>
  );
}

/* ---------- Camera rig — 全页滚动向前飞行 ---------- */
const smooth = (k) => { const t = Math.min(1, Math.max(0, k)); return t * t * (3 - 2 * t); };
function keyframe(p, stops) {
  if (p <= stops[0][0]) return stops[0][1];
  for (let i = 1; i < stops.length; i++) {
    if (p <= stops[i][0]) {
      const [pa, va] = stops[i - 1], [pb, vb] = stops[i];
      const k = pb === pa ? 1 : (p - pa) / (pb - pa);
      return va + (vb - va) * smooth(k);
    }
  }
  return stops[stops.length - 1][1];
}

function CameraRig() {
  const { camera } = useThree();
  const scroll = useRef(0);
  const gp = useRef(0.62);
  const aStart = useRef(0.14);
  const aEnd = useRef(0.32);
  const mouse = useRef({ x: 0, y: 0 });
  const target = useRef(new THREE.Vector3(0, 1.5, -20));

  /* 黑煤球机位 */
  const mBaseY = terrainH(MASCOT_X, MASCOT_Z) + 0.05;
  const mLookY = mBaseY + MASCOT_H * 0.72;      // 头部高度
  const FOCUS = { x: 1.2, y: mLookY + 0.4, z: MASCOT_Z + 9 };

  useEffect(() => {
    const recalc = () => {
      const max = document.body.scrollHeight - window.innerHeight;
      if (max <= 0) return;
      const g = document.getElementById("garden");
      const a = document.getElementById("about");
      const h = document.getElementById("hobbies");
      if (g) gp.current = Math.min(0.95, Math.max(0.1, g.offsetTop / max));
      if (a) {
        aStart.current = Math.max(0.05, (a.offsetTop + a.offsetHeight * 0.18) / max);
        const regionBottom = h ? h.offsetTop + h.offsetHeight * 0.72 : a.offsetTop + a.offsetHeight * 0.82;
        aEnd.current = Math.min(gp.current - 0.05, regionBottom / max);
      }
    };
    const onScroll = () => {
      const max = document.body.scrollHeight - window.innerHeight;
      scroll.current = max > 0 ? window.pageYOffset / max : 0;
    };
    const onMove = (e) => {
      mouse.current.x = (e.clientX / window.innerWidth - 0.5) * 2;
      mouse.current.y = (e.clientY / window.innerHeight - 0.5) * 2;
      view.mx = mouse.current.x;
      view.my = mouse.current.y;
    };
    /* 手机端：横滑环视花园（竖滑仍正常滚动），跳过开场分镜 */
    const onTouch = (e) => {
      if (scroll.current < 0.14) return;
      const t = e.touches[0];
      if (!t) return;
      mouse.current.x = (t.clientX / window.innerWidth - 0.5) * 2;
      view.mx = mouse.current.x;
    };
    recalc();
    onScroll();
    const timer = setTimeout(recalc, 600);
    window.addEventListener("scroll", onScroll);
    window.addEventListener("resize", recalc);
    window.addEventListener("mousemove", onMove);
    window.addEventListener("touchmove", onTouch, { passive: true });
    return () => {
      clearTimeout(timer);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", recalc);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("touchmove", onTouch);
    };
  }, []);

  useFrame(() => {
    const p = scroll.current;
    view.p = p;
    const aS = aStart.current, aE = aEnd.current, g = gp.current;
    const INTRO = 0.14;  // 开场分镜结束：远眺火星→放大→俯瞰→落地

    /* 相机位置关键帧
       0    远眺整颗火星
       0.05 迅速冲近（火星放大占满画面）
       0.09 拉升到花园正上方（俯瞰视角）
       INTRO 落到地面起点
       之后  对准黑煤球 → 花田前 → 花田深处 */
    const cx = keyframe(p, [[0, 0], [0.05, 0], [0.09, 0], [INTRO, 0], [aS, FOCUS.x], [aE, FOCUS.x], [g, 0], [1, 0]]);
    const cy = keyframe(p, [[0, 12], [0.05, 10], [0.09, 58], [INTRO, 4], [aS, FOCUS.y], [aE, FOCUS.y], [g, 2.5], [1, 4.4]]);
    const cz = keyframe(p, [[0, 230], [0.05, 42], [0.09, -18], [INTRO, 14], [aS, FOCUS.z], [aE, FOCUS.z], [g, -26], [1, -44]]);

    /* 关注权重：About 区间内看向黑煤球 */
    const r = 0.05;
    let focus = 0;
    if (p > aS - r && p < aE + r) {
      focus = Math.max(0, Math.min(1, (p - (aS - r)) / r, ((aE + r) - p) / r));
    }

    const swayX = mouse.current.x * (MOBILE ? 6 : 1.4);
    const swayY = mouse.current.y * 0.55;
    camera.position.x += ((cx + swayX) - camera.position.x) * 0.06;
    camera.position.y += ((cy - swayY) - camera.position.y) * 0.06;
    camera.position.z += (cz - camera.position.z) * 0.06;

    const fwdX = camera.position.x * 0.3, fwdY = cy - 1.0, fwdZ = camera.position.z - 12;
    let lx = THREE.MathUtils.lerp(fwdX, MASCOT_X - 1.8, focus);
    let ly = THREE.MathUtils.lerp(fwdY, mLookY, focus);
    let lz = THREE.MathUtils.lerp(fwdZ, MASCOT_Z, focus);

    /* 开场分镜视线：先盯火星 → 俯视花园 → 收回前方 */
    if (p < INTRO) {
      lx = keyframe(p, [[0, 0], [0.09, 0], [INTRO, fwdX]]);
      ly = keyframe(p, [[0, 0], [0.05, 0], [0.09, -6], [INTRO, fwdY]]);
      lz = keyframe(p, [[0, -260], [0.05, -160], [0.09, -42], [INTRO, fwdZ]]);
    }

    /* 场景 4 上摇：花园末段起，视线缓缓抬升追随太阳（越到底越慢 = 仰望的重量感） */
    const sunGaze = g + (1 - g) * 0.45;
    view.sun = smooth((p - sunGaze) / Math.max(0.001, 1 - sunGaze));
    if (view.sun > 0) {
      const k = view.sun;
      lx = THREE.MathUtils.lerp(lx, SUN_GAZE[0], k);
      ly = THREE.MathUtils.lerp(ly, SUN_GAZE[1], k);
      lz = THREE.MathUtils.lerp(lz, SUN_GAZE[2], k);
    }

    target.current.x += (lx - target.current.x) * 0.09;
    target.current.y += (ly - target.current.y) * 0.09;
    target.current.z += (lz - target.current.z) * 0.09;
    camera.lookAt(target.current);
  });

  return null;
}

/* ---------- 火星居民吉祥物（GLB 模型） ---------- */
const MASCOT_X = 5.5, MASCOT_Z = -15;
const MASCOT_H = 3.8;            // 目标世界身高
const MASCOT_YAW = Math.PI + Math.PI / 2;  // 朝向微调（背对相机则改 Math.PI）
const MASCOT_URL = "/models/heimeiqiu.glb";
useGLTF.preload(MASCOT_URL);

function MascotModel() {
  const { scene } = useGLTF(MASCOT_URL);
  const model = useMemo(() => {
    const s = scene.clone(true);
    const box = new THREE.Box3().setFromObject(s);
    const size = new THREE.Vector3(); box.getSize(size);
    const center = new THREE.Vector3(); box.getCenter(center);
    const k = MASCOT_H / (size.y || 1);
    s.scale.setScalar(k);
    s.position.set(-center.x * k, -box.min.y * k, -center.z * k);
    s.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = false; } });
    return s;
  }, [scene]);
  return <primitive object={model} />;
}

function Mascot() {
  const root = useRef();
  const greet = useRef();
  const active = useRef(false);
  const wave = useRef(0);

  const px = MASCOT_X, pz = MASCOT_Z;
  const py = terrainH(px, pz) + 0.05;

  useEffect(() => {
    const el = document.getElementById("about");
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => { active.current = entries[0].isIntersecting && entries[0].intersectionRatio > 0.35; },
      { threshold: [0, 0.35, 0.7] }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (root.current) {
      root.current.position.y = py + Math.sin(t * 1.5) * 0.05;
      root.current.rotation.y = -0.46 + MASCOT_YAW + Math.sin(t * 0.6) * 0.04;
    }
    /* 打招呼：进入 About 区时活泼摆动 —— 跳 + 摆身 + 点头 + 挤压拉伸 */
    const target = active.current ? 1 : 0;
    wave.current += (target - wave.current) * 0.07;
    const w = wave.current;
    const g = greet.current;
    if (g) {
      const hop = Math.abs(Math.sin(t * 3)) * 0.2;
      g.position.y = w * hop;
      g.rotation.z = w * Math.sin(t * 5.5) * 0.2;         // 左右摆身（挥手感）
      g.rotation.x = w * (0.05 + Math.sin(t * 5.5) * 0.04); // 轻点头
      const squash = w * Math.sin(t * 6) * 0.06;           // 起跳挤压
      g.scale.set(1 + squash * 0.5, 1 - squash, 1 + squash * 0.5);
    }
  });

  return (
    <group ref={root} position={[px, py, pz]}>
      <group ref={greet}>
        <MascotModel />
      </group>
      <pointLight color={0xffd9a0} intensity={0.9} distance={9} position={[2, 3, 2.5]} />
    </group>
  );
}

/* ---------- 场景 4：太阳（仰望 / 多层同心光晕 + 脉动） ---------- */
const SUN_POS = [0, 44, -96];
const SUN_GAZE = [0, 26, -96];   // 相机视线落点：低于太阳，使太阳退到画面上方，中心留白给文字

function Sun() {
  const grp = useRef();
  const lightRef = useRef();
  const { camera } = useThree();
  const [hover, setHover] = useState(false);

  /* 各层材质：加色混合，关雾，确保穿透暗背景发亮 */
  const mats = useMemo(() => {
    const mk = (color, opacity) =>
      new THREE.MeshBasicMaterial({ color, transparent: true, opacity, fog: false, depthWrite: false, depthTest: false, blending: THREE.AdditiveBlending });
    return {
      outer: mk(0xff7a1e, 0.0),
      halo: mk(0xffa63c, 0.0),
      inner: mk(0xffd27a, 0.0),
      core: mk(0xfff3d6, 0.0),
    };
  }, []);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    const o = view.sun;                       // 0→1 淡入（相机上摇进入太阳幕）
    if (grp.current) {
      grp.current.visible = o > 0.001;
      grp.current.lookAt(camera.position);    // billboard 始终正对相机
      const speed = hover ? 3.4 : 1.5;        // 悬停：脉动加快，像被激活
      grp.current.scale.setScalar(1 + Math.sin(t * speed) * 0.05);
    }
    mats.core.opacity = 0.55 * o;
    mats.inner.opacity = 0.26 * o;
    mats.halo.opacity = 0.14 * o;
    mats.outer.opacity = 0.07 * o;
    if (lightRef.current) lightRef.current.intensity = (hover ? 1.8 : 1.2) * o;
  });

  return (
    <group ref={grp} position={SUN_POS} renderOrder={2}>
      <mesh material={mats.outer} position={[0, 0, 0]}><circleGeometry args={[18, 64]} /></mesh>
      <mesh material={mats.halo} position={[0, 0, 0.1]}><circleGeometry args={[12, 64]} /></mesh>
      <mesh material={mats.inner} position={[0, 0, 0.2]}><circleGeometry args={[7.5, 64]} /></mesh>
      <mesh material={mats.core} position={[0, 0, 0.3]}><circleGeometry args={[4, 64]} /></mesh>
      {/* 悬停热区（透明但可被射线命中） */}
      <mesh
        position={[0, 0, 0.4]}
        onPointerOver={(e) => { if (view.sun > 0.15) { e.stopPropagation(); setHover(true); document.body.classList.add("cursor-hover"); } }}
        onPointerOut={() => { setHover(false); document.body.classList.remove("cursor-hover"); }}
      >
        <circleGeometry args={[10, 32]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} fog={false} />
      </mesh>
      <pointLight ref={lightRef} color={0xffcf8a} intensity={0} distance={220} decay={1.2} />
    </group>
  );
}

/* 大气：随滚动进度渐变背景/雾色（转场不硬切）——太空冷暗 → 地表暖 → 太阳明亮开阔 */
function SceneAtmosphere() {
  const { scene } = useThree();
  const space = useMemo(() => new THREE.Color(0x1a0a06), []);
  const ground = useMemo(() => new THREE.Color(0x2a1208), []);
  const sunny = useMemo(() => new THREE.Color(0xffb066), []);
  const tmp = useMemo(() => new THREE.Color(), []);
  useFrame(() => {
    const p = view.p;
    const s = view.sun;
    const tg = THREE.MathUtils.clamp((p - 0.066) / 0.06, 0, 1);
    tmp.copy(space).lerp(ground, tg * 0.7);
    tmp.lerp(sunny, s * 0.22);
    if (scene.background && scene.background.isColor) scene.background.copy(tmp);
    if (scene.fog) {
      scene.fog.color.copy(tmp);
      scene.fog.density = THREE.MathUtils.lerp(0.028, 0.02, s);  // 太阳幕仍保留暗度，文字可读
    }
  });
  return null;
}

export default function MarsScene({ onOpenWork, onHoverWork }) {
  return (
    <Canvas
      className="mars-canvas"
      shadows={!MOBILE}
      dpr={[1, MOBILE ? 1.5 : 2]}
      camera={{ fov: MOBILE ? 66 : 50, position: [0, 12, 230], near: 0.1, far: 900 }}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = 1.2;
      }}
    >
      <color attach="background" args={[0x1a0a06]} />
      <fogExp2 attach="fog" args={[0x1a0a06, 0.028]} />

      <ambientLight color={0x3a2010} intensity={0.6} />
      <directionalLight
        color={0xffe0b2}
        intensity={2.2}
        position={[-8, 15, 5]}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-near={0.5}
        shadow-camera-far={60}
        shadow-camera-left={-30}
        shadow-camera-right={30}
        shadow-camera-top={20}
        shadow-camera-bottom={-10}
      />
      <directionalLight color={0xdc0000} intensity={0.4} position={[10, 5, -10]} />
      <directionalLight color={0x72b4d9} intensity={0.2} position={[-5, 2, 10]} />

      <MarsPlanet />
      <SpaceDust />
      <GroundGate>
        <Terrain />
        <Rocks />
        <Floaters />
        <Suspense fallback={null}>
          <Mascot />
        </Suspense>
        <FlowerField onOpenWork={onOpenWork} onHoverWork={onHoverWork} />
        <Dust />
        <Glow />
      </GroundGate>
      <Stars />
      <Sun />
      <SceneAtmosphere />
      <CameraRig />
    </Canvas>
  );
}
