import { useCallback, useState } from "react";
import MarsScene from "./scene/MarsScene.jsx";
import Loader from "./components/Loader.jsx";
import Nav from "./components/Nav.jsx";
import Dust from "./components/Dust.jsx";
import Hero from "./components/Hero.jsx";
import About from "./components/About.jsx";
import Timeline from "./components/Timeline.jsx";
import Garden from "./components/Garden.jsx";
import Contact from "./components/Contact.jsx";
import Progress from "./components/Progress.jsx";
import Lightbox from "./components/Lightbox.jsx";
import Cursor from "./components/Cursor.jsx";
import ClickEffect from "./components/ClickEffect.jsx";
import WorkPreview from "./components/WorkPreview.jsx";
import Player from "./components/Player.jsx";
import { WORKS } from "./data/works.js";
import { useReveal, useParallax } from "./hooks/useReveal.js";

export default function App() {
  const [workIdx, setWorkIdx] = useState(null);
  const [hoverIdx, setHoverIdx] = useState(null);
  useReveal();
  useParallax();

  const openWork = useCallback((idx) => setWorkIdx(idx), []);
  const closeWork = useCallback(() => setWorkIdx(null), []);
  const hoverWork = useCallback((idx) => setHoverIdx(idx), []);

  return (
    <>
      <Cursor />
      <ClickEffect />
      <MarsScene onOpenWork={openWork} onHoverWork={hoverWork} />
      <Loader />
      <Nav />
      <Dust />
      <main>
        <Hero />
        <About />
        <Timeline />
        <Garden />
        <Contact />
      </main>
      <Progress />
      <Player />
      <WorkPreview work={hoverIdx != null ? WORKS[hoverIdx] : null} />
      <Lightbox work={workIdx != null ? WORKS[workIdx] : null} onClose={closeWork} />
    </>
  );
}
