/** Small stroke icon set (24px grid). Icons always sit beside a word; they never carry meaning alone. */
const PATHS = {
  layers: 'M12 3 3 8l9 5 9-5-9-5ZM3 13l9 5 9-5M3 17.5l9 5 9-5',
  alert: 'M12 3.5 2.5 20h19L12 3.5ZM12 10v4.5M12 17.5v.01',
  gauge: 'M4.5 17a8 8 0 1 1 15 0M12 13l4-4M12 13v.01',
  scale: 'M12 4v16M5 20h14M6 8h12M6 8l-3 6a3 3 0 0 0 6 0L6 8ZM18 8l-3 6a3 3 0 0 0 6 0l-3-6Z',
  clock: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18ZM12 7v5l3 2',
  truck: 'M2.5 6.5h11v9h-11zM13.5 9.5h4l3 3.5v2.5h-7M6.5 18.5a2 2 0 1 0 0-4 2 2 0 0 0 0 4ZM17 18.5a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z',
  bolt: 'M13 2.5 4.5 13.5H12L11 21.5l8.5-11H12l1-8Z',
  box: 'M21 7.5 12 3 3 7.5v9L12 21l9-4.5v-9ZM3 7.5l9 4.5 9-4.5M12 12v9',
  chart: 'M4 19h16M7 15l3.5-4 3 2.5L18 8',
  list: 'M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01',
  pin: 'M12 21s-6.5-6-6.5-11a6.5 6.5 0 1 1 13 0c0 5-6.5 11-6.5 11ZM12 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z',
  pie: 'M12 3a9 9 0 1 0 9 9h-9V3ZM15 3.5A8 8 0 0 1 20.5 9H15V3.5Z',
  calendar: 'M4 6.5h16v14H4zM4 10.5h16M8.5 3.5v5M15.5 3.5v5',
  sun: 'M12 16.5a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9ZM12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4',
  moon: 'M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5Z',
  prev: 'M15 5.5 8.5 12l6.5 6.5',
  next: 'M9 5.5l6.5 6.5L9 18.5',
  pause: 'M8.5 5.5v13M15.5 5.5v13',
  play: 'M7.5 5v14l11-7-11-7Z',
  arrow: 'M5 12h14M13 6l6 6-6 6',
  back: 'M19 12H5M11 6l-6 6 6 6',
  check: 'M4.5 12.5l4.5 4.5L19.5 6.5',
  bang: 'M12 4.5v9M12 18.5v.5',
  dash: 'M6 12h12',
} as const;

export type IconName = keyof typeof PATHS;

export function Icon({ name, size = 24, strokeWidth = 2.2 }: { name: IconName; size?: number; strokeWidth?: number }) {
  return (
    <svg className="icon" viewBox="0 0 24 24" width={size} height={size} aria-hidden="true">
      <path d={PATHS[name]} fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
