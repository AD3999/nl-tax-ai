import type { SVGProps } from "react";

type P = SVGProps<SVGSVGElement>;

const base: P = { fill: "none", stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round" };

export const Icon = {
  arrow:    (p: P = {}) => <svg {...base} {...p} width="14" height="14" viewBox="0 0 24 24" strokeWidth="1.8"><path d="M5 12h14M13 6l6 6-6 6"/></svg>,
  check:    (p: P = {}) => <svg {...base} {...p} width="14" height="14" viewBox="0 0 24 24" strokeWidth="2"><path d="M4 12l5 5L20 6"/></svg>,
  x:        (p: P = {}) => <svg {...base} {...p} width="14" height="14" viewBox="0 0 24 24" strokeWidth="1.8"><path d="M6 6l12 12M6 18L18 6"/></svg>,
  chev:     (p: P = {}) => <svg {...base} {...p} width="14" height="14" viewBox="0 0 24 24" strokeWidth="1.8"><path d="M9 6l6 6-6 6"/></svg>,
  edit:     (p: P = {}) => <svg {...base} {...p} width="14" height="14" viewBox="0 0 24 24" strokeWidth="1.6"><path d="M14 4l6 6L8 22H2v-6z"/></svg>,
  info:     (p: P = {}) => <svg {...base} {...p} width="14" height="14" viewBox="0 0 24 24" strokeWidth="1.6"><circle cx="12" cy="12" r="9"/><path d="M12 8h.01M11 12h1v5h1"/></svg>,
  external: (p: P = {}) => <svg {...base} {...p} width="12" height="12" viewBox="0 0 24 24" strokeWidth="1.8"><path d="M14 4h6v6M10 14L20 4M19 13v6a1 1 0 01-1 1H5a1 1 0 01-1-1V6a1 1 0 011-1h6"/></svg>,
  spark:    (p: P = {}) => <svg {...base} {...p} width="14" height="14" viewBox="0 0 24 24" strokeWidth="1.6"><path d="M12 3v6M12 15v6M3 12h6M15 12h6M5.6 5.6l4.2 4.2M14.2 14.2l4.2 4.2M18.4 5.6l-4.2 4.2M9.8 14.2l-4.2 4.2"/></svg>,
};
