# -*- coding: utf-8 -*-
"""从 作品集0825.pdf 渲染各项目分节页面为高清 JPG。
输出：assets/works/pages/<n>/pNN.jpg （n=1..4）"""
import glob, os, pymupdf

paths = glob.glob("../../*.pdf")
target = [p for p in paths if "0825" in p][0]
doc = pymupdf.open(target)

# 每个作品对应的页码区间（0-based, 含首含尾）
SECTIONS = {
    1: (3, 10),    # Canine Woo
    2: (11, 18),   # UP智汇
    3: (19, 26),   # 魔法觉醒
    4: (27, 30),   # 其他
}

ZOOM = 2.0  # 渲染倍率，1920x1080 -> 3840x2160，放大查看清晰
mat = pymupdf.Matrix(ZOOM, ZOOM)

out_root = "../assets/works/pages"
os.makedirs(out_root, exist_ok=True)

for n, (a, b) in SECTIONS.items():
    d = os.path.join(out_root, str(n))
    os.makedirs(d, exist_ok=True)
    idx = 1
    for pno in range(a, b + 1):
        pix = doc[pno].get_pixmap(matrix=mat)
        fp = os.path.join(d, f"p{idx:02d}.jpg")
        pix.save(fp, jpg_quality=82)
        print(f"work{n} <- pdf p{pno} -> {fp}  {pix.width}x{pix.height}")
        idx += 1

print("done")
