# -*- coding: utf-8 -*-
import os, subprocess, imageio_ffmpeg
ff = imageio_ffmpeg.get_ffmpeg_exe()
base = "../assets/"
files = ["华晨宇 - 向阳而生.mp3", "华晨宇 - 忧伤的巨人.mp3"]
for f in files:
    src = os.path.join(base, f)
    tmp = os.path.join(base, "_tmp_" + f)
    before = os.path.getsize(src)
    cmd = [ff, "-y", "-i", src, "-vn", "-c:a", "libmp3lame", "-b:a", "128k", tmp]
    print(">>", f)
    r = subprocess.run(cmd, capture_output=True, text=True, encoding="utf-8", errors="ignore")
    if r.returncode != 0:
        print("  FAIL\n" + (r.stderr or "")[-800:])
        continue
    os.replace(tmp, src)
    after = os.path.getsize(src)
    print(f"  ok  {before/1e6:.1f}MB -> {after/1e6:.1f}MB")
print("done")
