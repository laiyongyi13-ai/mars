"""将作品图片 JPG 转为 WebP（保持原分辨率，视觉近无损）以加快加载。
用法： python tools/optimize_images.py
生成同名 .webp，原 .jpg 保留作为高质量母版（不会被打包，除非被引用）。
"""
import glob
import os
from PIL import Image

Q_PAGE = 88
Q_COVER = 90
files = glob.glob("assets/works/**/*.jpg", recursive=True)

before = after = 0
for f in files:
    q = Q_COVER if "cover" in os.path.basename(f) else Q_PAGE
    out = os.path.splitext(f)[0] + ".webp"
    im = Image.open(f).convert("RGB")
    im.save(out, "WEBP", quality=q, method=6)
    b = os.path.getsize(f)
    a = os.path.getsize(out)
    before += b
    after += a
    print(f"{os.path.relpath(f):40s} {b//1024:5d}KB -> {a//1024:5d}KB  (-{100-a*100//b}%)")

print(f"\nTOTAL  {before//1024//1024}MB -> {after//1024//1024}MB  (-{100-after*100//before}%)  {len(files)} files")
