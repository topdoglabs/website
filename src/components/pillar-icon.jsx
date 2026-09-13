const paths = {
  privacy: <><rect x="6" y="11" width="20" height="17" rx="3" /><path d="M10 11V7a6 6 0 0 1 12 0v4M16 18v4" /></>,
  native: <><rect x="8" y="2" width="16" height="28" rx="3" /><path d="M14 6h4M14 26h4" /></>,
  offline: <><path d="M6 23a7 7 0 0 1 0-14 10 10 0 0 1 17-4M26 11a7 7 0 0 1 0 14H11M3 29 29 3" /></>,
};

export const PillarIcon = ({ name }) => paths[name] ? (
  <svg viewBox="0 0 32 32" width="36" height="36" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
    {paths[name]}
  </svg>
) : null;
