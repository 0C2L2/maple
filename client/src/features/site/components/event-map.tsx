import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';

import { REGION_LABELS, type Region } from '@/constants/taxonomy';
import { supabase } from '@/lib/supabase';

// The home page's "Events happening across Korea" map, website only (the landing never renders in the apps):
// a dot map of South Korea with a pulsing pin for each region that has open events, sized by how many, and
// made-up sponsors on both sides sending proposals along arcs that draw in one after another.
// Motion lives in src/global.css ([data-map] rules) and stops for visitors who ask for reduced motion.

const W = 1000;
const H = 600;
// Longitude/latitude to the SVG box: centered on 127.8°E, longitude squeezed by cos(36°) so Korea keeps its shape.
const K = 100;
const px = (lon: number) => W / 2 + (lon - 127.8) * 0.809 * K;
const py = (lat: number) => 26 + (38.7 - lat) * K;

// A simplified outline of mainland South Korea, clockwise from Ganghwa: the DMZ, the straight east coast, the
// jagged south coast, and the west coast with the Taean peninsula. Jeju is an ellipse.
const MAINLAND: [number, number][] = [
  [126.1, 37.75],
  [126.55, 37.78],
  [126.68, 37.95],
  [127.05, 38.1],
  [127.3, 38.3],
  [127.75, 38.32],
  [128.1, 38.33],
  [128.37, 38.62],
  [128.55, 38.3],
  [128.72, 38.05],
  [128.95, 37.75],
  [129.1, 37.55],
  [129.35, 37.25],
  [129.42, 36.95],
  [129.42, 36.55],
  [129.4, 36.3],
  [129.57, 36.07],
  [129.45, 35.85],
  [129.45, 35.55],
  [129.3, 35.33],
  [129.1, 35.1],
  [128.85, 35.05],
  [128.6, 34.88],
  [128.4, 34.83],
  [128.05, 34.9],
  [127.85, 34.72],
  [127.6, 34.72],
  [127.4, 34.6],
  [127.1, 34.55],
  [126.9, 34.4],
  [126.55, 34.3],
  [126.3, 34.45],
  [126.35, 34.75],
  [126.3, 35.0],
  [126.45, 35.25],
  [126.4, 35.55],
  [126.6, 35.85],
  [126.55, 36.05],
  [126.5, 36.35],
  [126.2, 36.6],
  [126.15, 36.85],
  [126.4, 36.95],
  [126.55, 37.0],
  [126.8, 37.05],
  [126.7, 37.25],
  [126.6, 37.45],
  [126.4, 37.55],
].map(([lon, lat]) => [px(lon), py(lat)]);
const JEJU = { x: px(126.55), y: py(33.38), rx: 0.33 * 0.809 * K, ry: 0.15 * K };

function inMainland(x: number, y: number) {
  let inside = false;
  for (let i = 0, j = MAINLAND.length - 1; i < MAINLAND.length; j = i++) {
    const [xi, yi] = MAINLAND[i];
    const [xj, yj] = MAINLAND[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

const STEP = 7.5;
const LAND: [number, number][] = [];
for (let y = STEP / 2; y < H; y += STEP) {
  for (let x = STEP / 2; x < W; x += STEP) {
    const jeju = ((x - JEJU.x) / JEJU.rx) ** 2 + ((y - JEJU.y) / JEJU.ry) ** 2 <= 1;
    if (jeju || inMainland(x, y)) LAND.push([x, y]);
  }
}

// Where each region's pin sits: its main city.
const CITIES: Record<Exclude<Region, 'online'>, [number, number]> = {
  seoul: [126.98, 37.57],
  incheon: [126.7, 37.46],
  gyeonggi: [127.03, 37.26],
  gangwon: [127.9, 37.8],
  chungbuk: [127.49, 36.64],
  chungnam: [126.75, 36.6],
  sejong: [127.29, 36.48],
  daejeon: [127.38, 36.35],
  jeonbuk: [127.15, 35.82],
  gwangju: [126.85, 35.16],
  jeonnam: [126.55, 34.8],
  gyeongbuk: [128.73, 36.57],
  daegu: [128.6, 35.87],
  ulsan: [129.31, 35.54],
  gyeongnam: [128.68, 35.23],
  busan: [129.08, 35.18],
  jeju: [126.53, 33.42],
};
type MapRegion = keyof typeof CITIES;

// Filled in (small) until at least six regions have real events, so the map never looks empty.
const SAMPLE: MapRegion[] = ['seoul', 'busan', 'daejeon', 'gwangju', 'daegu', 'jeju'];

// Made-up sponsors (the same names as the home page's example proposals), placed around the map.
const SPONSORS = [
  { name: 'Nuri Labs', x: 180, y: 120 },
  { name: 'Hanbit Coffee', x: 120, y: 300 },
  { name: 'Blue Wave Studio', x: 200, y: 480 },
  { name: 'Daon Cloud', x: 820, y: 120 },
  { name: 'Pixel Bank', x: 880, y: 300 },
  { name: 'Maru Games', x: 810, y: 480 },
];
const STATUSES = ['New proposal', 'In talks', 'Won'];
const TICK_MS = 2600;

// Open events per region, counted from the posts anyone can read.
function useRegionCounts() {
  return useQuery({
    queryKey: ['landing', 'region-counts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('posts')
        .select('regions')
        .eq('kind', 'event')
        .eq('status', 'open')
        .is('removed_at', null)
        .limit(1000);
      if (error) throw error;
      const counts: Partial<Record<MapRegion, number>> = {};
      for (const post of data ?? []) {
        for (const r of post.regions as string[])
          if (r in CITIES) counts[r as MapRegion] = (counts[r as MapRegion] ?? 0) + 1;
      }
      return counts;
    },
  });
}

function prefersReducedMotion() {
  return typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
}

// `compact` (phones): zoom in on Korea; the sponsors sit outside the view, so their arcs fly in from the edges.
export function EventMap({ compact = false }: { compact?: boolean }) {
  const { data: counts } = useRegionCounts();
  const liveRegions = Object.keys(counts ?? {}) as MapRegion[];
  const live = liveRegions.length > 0;
  const regions = [...liveRegions, ...SAMPLE.filter((r) => !liveRegions.includes(r))].slice(
    0,
    Math.max(6, liveRegions.length),
  );
  const [tick, setTick] = useState(3);

  useEffect(() => {
    if (prefersReducedMotion()) return;
    const id = setInterval(() => setTick((t) => t + 1), TICK_MS);
    return () => clearInterval(id);
  }, []);

  // Connection n: sponsor n, to a region picked by a fixed stride so it wanders across the map.
  const connection = (n: number) => {
    const sponsor = SPONSORS[n % SPONSORS.length];
    const region = regions[(n * 5 + 1) % regions.length];
    const [lon, lat] = CITIES[region];
    const x = px(lon);
    const y = py(lat);
    // Bow the arc upward, a little more for longer ones.
    const cx = (sponsor.x + x) / 2;
    const cy = Math.min(sponsor.y, y) - 40 - Math.abs(sponsor.x - x) * 0.12;
    return {
      n,
      sponsor,
      region,
      x,
      y,
      d: `M${sponsor.x},${sponsor.y} Q${cx},${cy} ${x},${y}`,
      mid: { x: cx, y: (cy + (sponsor.y + y) / 2) / 2 - 24 },
    };
  };
  const current = connection(tick);
  const trail = [1, 2, 3].map((i) => connection(tick - i));
  const chip = `${REGION_LABELS[current.region]} · ${STATUSES[tick % STATUSES.length]}`;
  const chipWidth = chip.length * 7.2 + 28;
  // The visible part of the drawing, and where a drawing point lands on the page, as a percentage of the box.
  const box = compact ? { x: 320, y: 10, w: 360, h: 575 } : { x: 0, y: 0, w: W, h: H };
  const at = (x: number, y: number) => ({
    left: `${((x - box.x) / box.w) * 100}%`,
    top: `${((y - box.y) / box.h) * 100}%`,
  });
  // In the compact view, keep the chip inside the visible box (320–680).
  const chipX = compact ? Math.min(Math.max(current.mid.x, 326 + chipWidth / 2), 674 - chipWidth / 2) : current.mid.x;

  return (
    // The names and the status chip are page text laid over the drawing (not SVG text), so they stay crisp at any
    // size; each sits in a zero-size anchor at its map point and centers itself without a sub-pixel transform.
    <div data-map-wrap="">
      <svg
        data-map=""
        viewBox={`${box.x} ${box.y} ${box.w} ${box.h}`}
        role="img"
        aria-label={
          live
            ? `Map of South Korea with open events in ${liveRegions.map((r) => REGION_LABELS[r]).join(', ')}`
            : 'Map of South Korea with sponsors sending proposals to events'
        }
        style={{ width: '100%', height: 'auto', display: 'block' }}>
        <defs>
          <linearGradient id="maple-arc" x1="0" x2="1" y1="0" y2="0">
            <stop offset="0" stopColor="#f4b95a" />
            <stop offset="1" stopColor="#e2482c" />
          </linearGradient>
        </defs>

        <g className="land">
          {LAND.map(([x, y]) => (
            <circle key={`${x},${y}`} cx={x} cy={y} r={1.5} />
          ))}
        </g>

        <g className="trail">
          {trail.map((c) => (
            <path key={c.n} d={c.d} />
          ))}
        </g>
        <path key={`arc${tick}`} className="arc" d={current.d} pathLength={1} />

        {regions.map((r) => {
          const [lon, lat] = CITIES[r];
          const size = 5 + Math.min(counts?.[r] ?? 1, 8) * 1.2;
          const active = r === current.region;
          return (
            <g key={r} transform={`translate(${px(lon)} ${py(lat)})`} className={active ? 'pin on' : 'pin'}>
              <circle className="ring" r={size} />
              <circle className="dot" r={size / 2 + 1} />
            </g>
          );
        })}
      </svg>
      {!compact &&
        SPONSORS.map((s) => (
          <div key={s.name} className="map-anchor" style={at(s.x, s.y)} aria-hidden>
            <span className={s === current.sponsor ? 'map-sponsor on' : 'map-sponsor'}>{s.name}</span>
          </div>
        ))}
      <div key={`chip${tick}`} className="map-anchor" style={at(chipX, current.mid.y)} aria-hidden>
        <span className="map-chip">{chip}</span>
      </div>
    </div>
  );
}
