import { useEffect, useRef, useState } from "react";
import src1 from "../../assets/华晨宇 - 向阳而生.mp3";
import src2 from "../../assets/华晨宇 - 忧伤的巨人.mp3";

const TRACKS = [
  { title: "向阳而生", artist: "华晨宇", src: src1 },
  { title: "忧伤的巨人", artist: "华晨宇", src: src2 },
];

const fmt = (s) => {
  if (!Number.isFinite(s)) return "0:00";
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
};

export default function Player() {
  const audioRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [idx, setIdx] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [cur, setCur] = useState(0);
  const [dur, setDur] = useState(0);

  const track = TRACKS[idx];

  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    const onTime = () => setCur(a.currentTime);
    const onMeta = () => setDur(a.duration);
    const onEnd = () => setIdx((i) => (i + 1) % TRACKS.length);
    a.addEventListener("timeupdate", onTime);
    a.addEventListener("loadedmetadata", onMeta);
    a.addEventListener("ended", onEnd);
    return () => {
      a.removeEventListener("timeupdate", onTime);
      a.removeEventListener("loadedmetadata", onMeta);
      a.removeEventListener("ended", onEnd);
    };
  }, []);

  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    if (playing) a.play().catch(() => setPlaying(false));
    else a.pause();
  }, [playing, idx]);

  const prev = () => setIdx((i) => (i - 1 + TRACKS.length) % TRACKS.length);
  const next = () => setIdx((i) => (i + 1) % TRACKS.length);

  const seek = (e) => {
    const a = audioRef.current;
    if (!a || !dur) return;
    const rect = e.currentTarget.getBoundingClientRect();
    a.currentTime = ((e.clientX - rect.left) / rect.width) * dur;
  };

  const pct = dur ? (cur / dur) * 100 : 0;

  return (
    <div className={"player" + (open ? " open" : "") + (playing ? " playing" : "")}>
      <audio ref={audioRef} src={track.src} preload="metadata" />

      <div className="player-panel">
        <div className={"vinyl" + (playing ? " spin" : "")}>
          <span className="vinyl-center" />
        </div>
        <div className="player-info">
          <div className="track-name">
            <span className="track-title">{track.title}</span>
            <span className="track-artist">{track.artist}</span>
          </div>
          <div className="progress" onClick={seek}>
            <div className="progress-fill" style={{ width: `${pct}%` }}>
              <span className="progress-knob" />
            </div>
          </div>
          <div className="player-controls">
            <button className="ctrl-btn" aria-label="上一首" onClick={prev}>◀◀</button>
            <button className="play-btn" aria-label="播放/暂停" onClick={() => setPlaying((p) => !p)}>
              {playing ? "❚❚" : "▶"}
            </button>
            <button className="ctrl-btn" aria-label="下一首" onClick={next}>▶▶</button>
            <span className="time">{fmt(cur)} / {fmt(dur)}</span>
          </div>
        </div>
      </div>

      <button className="player-toggle" aria-label="音乐" onClick={() => setOpen((o) => !o)}>
        <span className={"player-icon" + (playing ? "" : " beat")}>♪</span>
        <span className="eq"><i /><i /><i /><i /></span>
      </button>
    </div>
  );
}
