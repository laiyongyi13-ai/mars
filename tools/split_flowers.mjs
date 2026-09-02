import { NodeIO } from "@gltf-transform/core";

const io = new NodeIO();
const doc = await io.read("../../素材/花朵.glb");
const root = doc.getRoot();
const mesh = root.listMeshes()[0];
const prim = mesh.listPrimitives()[0];
const material = prim.getMaterial();

const posAcc = prim.getAttribute("POSITION");
const idxAcc = prim.getIndices();
const vcount = posAcc.getCount();
const icount = idxAcc.getCount();
const pos = posAcc.getArray();
const idx = idxAcc.getArray();

// 属性列表（POSITION/NORMAL/TEXCOORD_0/...）
const semantics = prim.listSemantics();
const attrs = semantics.map((s) => {
  const a = prim.getAttribute(s);
  return { s, arr: a.getArray(), comp: a.getElementSize(), type: a.getType() };
});

// 1) 连通分量
const parent = new Int32Array(vcount);
for (let i = 0; i < vcount; i++) parent[i] = i;
const find = (a) => { while (parent[a] !== a) { parent[a] = parent[parent[a]]; a = parent[a]; } return a; };
const uni = (a, b) => { a = find(a); b = find(b); if (a !== b) parent[a] = b; };
for (let t = 0; t < icount; t += 3) { const a = idx[t], b = idx[t + 1], c = idx[t + 2]; uni(a, b); uni(b, c); }

// 2) 碎片质心
const cenMap = new Map();
for (let i = 0; i < vcount; i++) {
  const r = find(i);
  let c = cenMap.get(r); if (!c) { c = [0, 0, 0, 0]; cenMap.set(r, c); }
  c[0] += pos[i * 3]; c[1] += pos[i * 3 + 1]; c[2] += pos[i * 3 + 2]; c[3]++;
}
const islandRoots = [...cenMap.keys()].filter((r) => cenMap.get(r)[3] > 20);
const center = (r) => { const c = cenMap.get(r); return [c[0] / c[3], c[1] / c[3], c[2] / c[3]]; };

// 3) 聚类成 4 朵（TH=0.11）
const TH = 0.11;
const ci = islandRoots.map((_, i) => i);
const cf = (a) => { while (ci[a] !== a) { ci[a] = ci[ci[a]]; a = ci[a]; } return a; };
for (let i = 0; i < islandRoots.length; i++) {
  const pi = center(islandRoots[i]);
  for (let j = i + 1; j < islandRoots.length; j++) {
    const pj = center(islandRoots[j]);
    const dx = pi[0] - pj[0], dy = pi[1] - pj[1], dz = pi[2] - pj[2];
    if (Math.sqrt(dx * dx + dy * dy + dz * dz) < TH) { const a = cf(i), b = cf(j); if (a !== b) ci[a] = b; }
  }
}
const clusterOf = new Map(); // islandRoot -> clusterKey
for (let i = 0; i < islandRoots.length; i++) clusterOf.set(islandRoots[i], cf(i));
const clusterKeys = [...new Set([...clusterOf.values()])];
// 按碎片数排序，取前 4
const keyCount = new Map();
for (const k of clusterOf.values()) keyCount.set(k, (keyCount.get(k) || 0) + 1);
const top = clusterKeys.sort((a, b) => keyCount.get(b) - keyCount.get(a)).slice(0, 4);
console.log("clusters:", top.map((k) => keyCount.get(k)));

// vertexRoot -> clusterIndex(0..3) 或 -1
const vClu = new Int8Array(vcount).fill(-1);
for (let i = 0; i < vcount; i++) {
  const r = find(i);
  const ck = clusterOf.get(r);
  const ti = top.indexOf(ck);
  if (ti >= 0) vClu[i] = ti;
}

const buffer = root.listBuffers()[0];
const newNodes = [];

for (let g = 0; g < top.length; g++) {
  // 收集该组三角形与顶点重映射
  const remap = new Int32Array(vcount).fill(-1);
  const usedOld = [];
  const newIdx = [];
  for (let t = 0; t < icount; t += 3) {
    const a = idx[t];
    if (vClu[a] !== g) continue;
    for (let k = 0; k < 3; k++) {
      const oi = idx[t + k];
      if (remap[oi] === -1) { remap[oi] = usedOld.length; usedOld.push(oi); }
      newIdx.push(remap[oi]);
    }
  }
  const nv = usedOld.length;

  // 计算居中/贴地偏移
  let mnx = 1e9, mnz = 1e9, mny = 1e9, mxx = -1e9, mxz = -1e9;
  for (const oi of usedOld) {
    const x = pos[oi * 3], y = pos[oi * 3 + 1], z = pos[oi * 3 + 2];
    if (x < mnx) mnx = x; if (z < mnz) mnz = z; if (y < mny) mny = y;
    if (x > mxx) mxx = x; if (z > mxz) mxz = z;
  }
  const ox = (mnx + mxx) / 2, oy = mny, oz = (mnz + mxz) / 2;

  const newPrim = doc.createPrimitive().setMaterial(material);
  for (const { s, arr, comp, type } of attrs) {
    const out = new Float32Array(nv * comp);
    for (let n = 0; n < nv; n++) {
      const oi = usedOld[n];
      for (let c = 0; c < comp; c++) out[n * comp + c] = arr[oi * comp + c];
    }
    if (s === "POSITION") {
      for (let n = 0; n < nv; n++) { out[n * 3] -= ox; out[n * 3 + 1] -= oy; out[n * 3 + 2] -= oz; }
    }
    const acc = doc.createAccessor().setType(type).setArray(out).setBuffer(buffer);
    newPrim.setAttribute(s, acc);
  }
  const iacc = doc.createAccessor().setType("SCALAR").setArray(nv > 65535 ? new Uint32Array(newIdx) : new Uint16Array(newIdx)).setBuffer(buffer);
  newPrim.setIndices(iacc);

  const nMesh = doc.createMesh(`flower${g}`).addPrimitive(newPrim);
  const nNode = doc.createNode(`flower${g}`).setMesh(nMesh);
  newNodes.push(nNode);
  console.log(`flower${g}: verts=${nv} tris=${newIdx.length / 3}`);
}

// 重建场景：清空原内容，加入 4 朵
const scene = root.listScenes()[0];
for (const n of scene.listChildren()) scene.removeChild(n);
for (const n of newNodes) scene.addChild(n);
// 清理旧网格/节点
mesh.dispose();
for (const n of root.listNodes()) if (!newNodes.includes(n)) n.dispose();

await io.write("../public/models/flowers_split.glb", doc);
console.log("written flowers_split.glb");
