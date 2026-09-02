import { NodeIO } from "@gltf-transform/core";

const io = new NodeIO();
const doc = await io.read(process.argv[2] || "../../素材/花朵.glb");
const root = doc.getRoot();
const meshes = root.listMeshes();
console.log("meshes:", meshes.length);
for (const mesh of meshes) {
  for (const prim of mesh.listPrimitives()) {
    const pos = prim.getAttribute("POSITION");
    const idx = prim.getIndices();
    const vcount = pos.getCount();
    const icount = idx ? idx.getCount() : vcount;
    console.log("  prim: verts", vcount, "indexed:", !!idx, "tris", icount / 3);

    // union-find over vertices via triangle sharing
    const parent = new Int32Array(vcount);
    for (let i = 0; i < vcount; i++) parent[i] = i;
    const find = (a) => { while (parent[a] !== a) { parent[a] = parent[parent[a]]; a = parent[a]; } return a; };
    const uni = (a, b) => { a = find(a); b = find(b); if (a !== b) parent[a] = b; };

    const getI = idx ? (k) => idx.getScalar(k) : (k) => k;
    for (let t = 0; t < icount; t += 3) {
      const a = getI(t), b = getI(t + 1), c = getI(t + 2);
      uni(a, b); uni(b, c);
    }
    const roots = new Map();
    for (let i = 0; i < vcount; i++) {
      const r = find(i);
      roots.set(r, (roots.get(r) || 0) + 1);
    }
    const islands = [...roots.entries()].filter(([, n]) => n > 20).map(([r]) => r);
    console.log("  islands(>20 verts):", islands.length);

    // 每个碎片质心
    const p = pos.getArray();
    const cen = new Map();
    for (const r of islands) cen.set(r, [0, 0, 0, 0]);
    for (let i = 0; i < vcount; i++) {
      const r = find(i);
      const c = cen.get(r);
      if (!c) continue;
      c[0] += p[i * 3]; c[1] += p[i * 3 + 1]; c[2] += p[i * 3 + 2]; c[3]++;
    }
    const centers = islands.map((r) => {
      const c = cen.get(r);
      return [c[0] / c[3], c[1] / c[3], c[2] / c[3]];
    });

    // 按质心距离聚类（多阈值扫描）
    for (const TH of [0.06, 0.08, 0.1, 0.12, 0.15, 0.18]) {
      const cp = centers.map((_, i) => i);
      const cf = (a) => { while (cp[a] !== a) { cp[a] = cp[cp[a]]; a = cp[a]; } return a; };
      for (let i = 0; i < centers.length; i++) {
        for (let j = i + 1; j < centers.length; j++) {
          const dx = centers[i][0] - centers[j][0], dy = centers[i][1] - centers[j][1], dz = centers[i][2] - centers[j][2];
          if (Math.sqrt(dx * dx + dy * dy + dz * dz) < TH) { const a = cf(i), b = cf(j); if (a !== b) cp[a] = b; }
        }
      }
      const clusters = new Map();
      for (let i = 0; i < centers.length; i++) {
        const r = cf(i);
        if (!clusters.has(r)) clusters.set(r, []);
        clusters.get(r).push(i);
      }
      const big = [...clusters.values()].filter((a) => a.length >= 4).sort((a, b) => b.length - a.length);
      console.log(`  TH=${TH} → flowers(>=4 shards): ${big.length}  sizes=[${big.slice(0, 12).map((a) => a.length).join(",")}]`);
    }
  }
}
