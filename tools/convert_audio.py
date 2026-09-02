# -*- coding: utf-8 -*-
import subprocess, imageio_ffmpeg
ff = imageio_ffmpeg.get_ffmpeg_exe()
base = "../assets/music/"
for n in (1, 2, 3):
    src = f"{base}track{n}.m4a"
    for ext, args in (("ogg", ["-c:a", "libvorbis", "-q:a", "4"]),
                      ("mp3", ["-c:a", "libmp3lame", "-b:a", "192k"])):
        out = f"{base}track{n}.{ext}"
        cmd = [ff, "-y", "-i", src, "-vn", *args, out]
        print(">>", " ".join(cmd))
        r = subprocess.run(cmd, capture_output=True, text=True)
        print("  ok" if r.returncode == 0 else "  FAIL\n" + r.stderr[-500:])
print("done")
