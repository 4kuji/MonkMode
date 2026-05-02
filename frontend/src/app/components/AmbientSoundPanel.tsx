import { useState, useEffect, useRef, useCallback } from "react";
import { Volume2, VolumeX, ChevronDown, ChevronUp, CloudRain, Waves, Coffee, Brain } from "lucide-react";

// ─── Noise Generators ────────────────────────────────────────────

function fillWhiteNoise(data: Float32Array) {
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
}

function fillPinkNoise(data: Float32Array) {
  let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
  for (let i = 0; i < data.length; i++) {
    const w = Math.random() * 2 - 1;
    b0 = 0.99886 * b0 + w * 0.0555179;
    b1 = 0.99332 * b1 + w * 0.0750759;
    b2 = 0.96900 * b2 + w * 0.1538520;
    b3 = 0.86650 * b3 + w * 0.3104856;
    b4 = 0.55000 * b4 + w * 0.5329522;
    b5 = -0.7616 * b5 - w * 0.0168980;
    data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + w * 0.5362) * 0.11;
    b6 = w * 0.115926;
  }
}

function fillBrownNoise(data: Float32Array) {
  let last = 0;
  for (let i = 0; i < data.length; i++) {
    const w = Math.random() * 2 - 1;
    last = (last + 0.02 * w) / 1.02;
    data[i] = last * 3.5;
  }
}

// ─── Sound Definitions ──────────────────────────────────────────

const SOUNDS = [
  { id: "rain-forest", name: "Yağmur & Orman", desc: "Doğa ve yağmur ambiyansı", icon: CloudRain, color: "#22c55e" },
  { id: "pink-noise", name: "Pembe Gürültü", desc: "Dengeli ve yumuşak", icon: Waves, color: "#ec4899" },
  { id: "cafe-ambience", name: "Kafe Ambiyansı", desc: "Hafif kafe ortamı", icon: Coffee, color: "#f59e0b" },
  { id: "adhd-white-noise", name: "ADHD Odak", desc: "Beyaz gürültü ile odaklanma", icon: Brain, color: "#8b5cf6" },
] as const;

type SoundId = typeof SOUNDS[number]["id"];

// ─── Buffer creation ─────────────────────────────────────────────

async function createBuffer(ctx: AudioContext, id: SoundId): Promise<AudioBuffer> {
  // Try MP3 file first for rain & cafe
  if (id === "rain-forest" || id === "cafe-ambience") {
    try {
      const res = await fetch(`/sounds/${id}.mp3`);
      if (res.ok) return ctx.decodeAudioData(await res.arrayBuffer());
    } catch { /* fallback to generated */ }
  }

  const dur = 10;
  const buf = ctx.createBuffer(2, ctx.sampleRate * dur, ctx.sampleRate);
  const L = buf.getChannelData(0);
  const R = buf.getChannelData(1);

  switch (id) {
    case "rain-forest": fillBrownNoise(L); fillBrownNoise(R); break;
    case "pink-noise": fillPinkNoise(L); fillPinkNoise(R); break;
    case "cafe-ambience": fillPinkNoise(L); fillBrownNoise(R); break;
    case "adhd-white-noise": fillWhiteNoise(L); fillWhiteNoise(R); break;
  }
  return buf;
}

// ─── Component ───────────────────────────────────────────────────

interface Props { isDarkMode: boolean; }

export function AmbientSoundPanel({ isDarkMode }: Props) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedId, setSelectedId] = useState<SoundId | null>(
    () => (localStorage.getItem("selectedFocusSound") as SoundId) || null
  );
  const [volume, setVolume] = useState(
    () => parseInt(localStorage.getItem("focusSoundVolume") || "35")
  );

  // ─── Drag state ──────────────────────────────────────────────
  const [pos, setPos] = useState(() => {
    try {
      const saved = localStorage.getItem("ambientPanelPos");
      if (saved) return JSON.parse(saved) as { x: number; y: number };
    } catch {}
    return { x: 20, y: 120 };
  });
  const dragRef = useRef<{ startX: number; startY: number; origX: number; origY: number } | null>(null);
  const didDragRef = useRef(false);

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    // Only drag from header area
    dragRef.current = { startX: e.clientX, startY: e.clientY, origX: pos.x, origY: pos.y };
    didDragRef.current = false;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, [pos]);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragRef.current) return;
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) didDragRef.current = true;
    const newX = Math.max(0, Math.min(window.innerWidth - 100, dragRef.current.origX + dx));
    const newY = Math.max(0, Math.min(window.innerHeight - 50, dragRef.current.origY + dy));
    setPos({ x: newX, y: newY });
  }, []);

  const onPointerUp = useCallback(() => {
    if (dragRef.current) {
      // Save position
      localStorage.setItem("ambientPanelPos", JSON.stringify(pos));
    }
    dragRef.current = null;
  }, [pos]);

  const handleHeaderClick = useCallback(() => {
    // Only toggle if user didn't drag
    if (!didDragRef.current) setIsExpanded(prev => !prev);
  }, []);
  const [isPlaying, setIsPlaying] = useState(false);

  const ctxRef = useRef<AudioContext | null>(null);
  const gainRef = useRef<GainNode | null>(null);
  const srcRef = useRef<AudioBufferSourceNode | null>(null);
  const cacheRef = useRef<Map<string, AudioBuffer>>(new Map());

  // Persist preferences
  useEffect(() => {
    if (selectedId) localStorage.setItem("selectedFocusSound", selectedId);
    localStorage.setItem("focusSoundVolume", String(volume));
  }, [selectedId, volume]);

  // Update gain in real time
  useEffect(() => {
    if (gainRef.current) gainRef.current.gain.value = volume / 100;
  }, [volume]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      srcRef.current?.stop();
      ctxRef.current?.close();
    };
  }, []);

  const stopSound = useCallback(() => {
    if (srcRef.current) {
      try { srcRef.current.stop(); } catch {}
      srcRef.current = null;
    }
    setIsPlaying(false);
  }, []);

  const playSound = useCallback(async (id: SoundId) => {
    stopSound();

    if (!ctxRef.current || ctxRef.current.state === "closed") {
      ctxRef.current = new AudioContext();
    }
    const ctx = ctxRef.current;
    if (ctx.state === "suspended") await ctx.resume();

    // Get or create buffer
    let buffer = cacheRef.current.get(id);
    if (!buffer) {
      buffer = await createBuffer(ctx, id);
      cacheRef.current.set(id, buffer);
    }

    const gain = ctx.createGain();
    gain.gain.value = volume / 100;
    gain.connect(ctx.destination);
    gainRef.current = gain;

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;
    source.connect(gain);
    source.start();
    srcRef.current = source;
    setIsPlaying(true);
  }, [volume, stopSound]);

  const handleSelect = useCallback((id: SoundId) => {
    setSelectedId(id);
    if (isPlaying) playSound(id);
  }, [isPlaying, playSound]);

  const handlePlayStop = useCallback(() => {
    if (isPlaying) {
      stopSound();
    } else if (selectedId) {
      playSound(selectedId);
    }
  }, [isPlaying, selectedId, playSound, stopSound]);

  const selectedSound = SOUNDS.find(s => s.id === selectedId);

  return (
    <div
      style={{
        position: "fixed", top: pos.y, left: pos.x, zIndex: 60,
        width: isExpanded ? 280 : "auto",
        maxWidth: "calc(100vw - 40px)",
      }}
      className={`rounded-2xl shadow-2xl border backdrop-blur-xl transition-all duration-300 ${
        isDarkMode
          ? "bg-slate-900/90 border-white/10 text-white"
          : "bg-white/90 border-slate-200 text-slate-900"
      }`}
    >
      {/* Header — drag handle + expand toggle */}
      <div
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onClick={handleHeaderClick}
        className={`flex items-center gap-2 w-full px-3 py-2.5 rounded-2xl transition-all select-none ${
          isDarkMode ? "hover:bg-white/5" : "hover:bg-slate-50"
        }`}
        style={{ cursor: "grab", touchAction: "none" }}
      >
        {isPlaying ? (
          <Volume2 className="w-4 h-4 text-green-400 flex-shrink-0" />
        ) : (
          <VolumeX className="w-4 h-4 opacity-40 flex-shrink-0" />
        )}
        <span className="text-xs font-semibold tracking-wide flex-1 text-left truncate">
          {isExpanded ? "Ortam Sesleri" : (isPlaying && selectedSound ? selectedSound.name : "Ortam Sesleri")}
        </span>
        {isPlaying && !isExpanded && (
          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse flex-shrink-0" />
        )}
        {isExpanded ? <ChevronUp className="w-3.5 h-3.5 opacity-40" /> : <ChevronDown className="w-3.5 h-3.5 opacity-40" />}
      </div>

      {/* Expanded content */}
      {isExpanded && (
        <div className="px-3 pb-3 space-y-2">
          {/* Sound list */}
          <div className="space-y-1">
            {SOUNDS.map((s) => {
              const Icon = s.icon;
              const active = selectedId === s.id;
              return (
                <button
                  key={s.id}
                  onClick={() => handleSelect(s.id)}
                  className={`flex items-center gap-2.5 w-full px-2.5 py-2 rounded-xl transition-all text-left ${
                    active
                      ? isDarkMode ? "bg-white/10 ring-1 ring-white/20" : "bg-slate-100 ring-1 ring-slate-300"
                      : isDarkMode ? "hover:bg-white/5" : "hover:bg-slate-50"
                  }`}
                >
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: active ? s.color + "25" : "transparent" }}
                  >
                    <Icon className="w-3.5 h-3.5" style={{ color: active ? s.color : "inherit", opacity: active ? 1 : 0.5 }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium truncate">{s.name}</div>
                    <div className={`text-[10px] truncate ${isDarkMode ? "text-white/40" : "text-slate-400"}`}>{s.desc}</div>
                  </div>
                  {active && isPlaying && <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse flex-shrink-0" />}
                </button>
              );
            })}
          </div>

          {/* Volume slider */}
          <div className="flex items-center gap-2 px-1">
            <span className={`text-[10px] ${isDarkMode ? "text-white/40" : "text-slate-400"}`}>Ses</span>
            <input
              type="range" min="0" max="100" value={volume}
              onChange={(e) => setVolume(parseInt(e.target.value))}
              className="flex-1 h-1 accent-green-500 cursor-pointer"
              style={{ accentColor: selectedSound?.color || "#22c55e" }}
            />
            <span className={`text-[10px] w-7 text-right tabular-nums ${isDarkMode ? "text-white/40" : "text-slate-400"}`}>
              {volume}%
            </span>
          </div>

          {/* Play / Stop */}
          <button
            onClick={handlePlayStop}
            disabled={!selectedId}
            className={`w-full flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold transition-all ${
              !selectedId
                ? "opacity-30 cursor-not-allowed bg-white/5"
                : isPlaying
                ? "bg-red-500/15 text-red-400 hover:bg-red-500/25"
                : "bg-green-500/15 text-green-400 hover:bg-green-500/25"
            }`}
          >
            {isPlaying ? (
              <><VolumeX className="w-3.5 h-3.5" /> Durdur</>
            ) : (
              <><Volume2 className="w-3.5 h-3.5" /> Çal</>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
