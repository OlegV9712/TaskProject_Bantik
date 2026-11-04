const iconShapes = {
  bow: <>
    <path d="M12 12c-2.2-3.1-5.3-5.2-8-5.2-.9 2.5.1 5.2 3.2 6.7-3.1 1.5-4.1 4.2-3.2 6.7 2.7 0 5.8-2.1 8-5.2" />
    <path d="M12 12c2.2-3.1 5.3-5.2 8-5.2.9 2.5-.1 5.2-3.2 6.7 3.1 1.5 4.1 4.2 3.2 6.7-2.7 0-5.8-2.1-8-5.2" />
    <circle cx="12" cy="13" r="1.8" />
  </>,
  tasks: <>
    <rect x="4" y="4" width="16" height="17" rx="2.5" />
    <path d="M9 4.5h6M8 10h8M8 14h8M8 18h5" />
  </>,
  projects: <>
    <rect x="3.5" y="5" width="17" height="15" rx="2.5" />
    <path d="M8 5V3.5h8V5M3.5 10h17M9 10v2h6v-2" />
  </>,
  schedule: <>
    <rect x="3.5" y="5" width="17" height="16" rx="2.5" />
    <path d="M7.5 3.5v3M16.5 3.5v3M3.5 9.5h17M8 13h2M14 13h2M8 17h2" />
  </>,
  settings: <>
    <path d="M12 8.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7Z" />
    <path d="m19.4 15 .1.1a1.8 1.8 0 0 1-2.5 2.5l-.1-.1a1.8 1.8 0 0 0-3 .9v.2a1.8 1.8 0 0 1-3.6 0v-.2a1.8 1.8 0 0 0-3-.9l-.1.1a1.8 1.8 0 0 1-2.5-2.5l.1-.1a1.8 1.8 0 0 0-.9-3H3.8a1.8 1.8 0 0 1 0-3.6H4a1.8 1.8 0 0 0 .9-3l-.1-.1a1.8 1.8 0 0 1 2.5-2.5l.1.1a1.8 1.8 0 0 0 3-.9v-.2a1.8 1.8 0 0 1 3.6 0V2a1.8 1.8 0 0 0 3 .9l.1-.1a1.8 1.8 0 0 1 2.5 2.5l-.1.1a1.8 1.8 0 0 0 .9 3h.2a1.8 1.8 0 0 1 0 3.6H20a1.8 1.8 0 0 0-.6 3Z" transform="translate(0 2)" />
  </>,
  workload: <>
    <path d="M4 19.5h16M6.5 17V11M11.5 17V5M16.5 17v-8" />
  </>,
  directory: <>
    <rect x="3.5" y="4" width="17" height="16" rx="2.5" />
    <path d="M8 4v16M11.5 8h5M11.5 12h5M11.5 16h3" />
  </>,
  adminTasks: <>
    <path d="M8 4H5.5A2.5 2.5 0 0 0 3 6.5v12A2.5 2.5 0 0 0 5.5 21h13a2.5 2.5 0 0 0 2.5-2.5V9l-5-5H11" />
    <path d="M15 4v5h5M7 13h10M7 17h10M7 9h3M3 4l1.5 1.5L7 3" />
  </>,
  users: <>
    <path d="M16 20v-1.5a3.5 3.5 0 0 0-3.5-3.5h-5A3.5 3.5 0 0 0 4 18.5V20M10 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7ZM16 4.3a3.5 3.5 0 0 1 0 6.7M17 15h.5a3.5 3.5 0 0 1 3.5 3.5V20" />
  </>,
  fun: <>
    <path d="m12 3 1.7 5.3L19 10l-5.3 1.7L12 17l-1.7-5.3L5 10l5.3-1.7L12 3ZM19 16l.8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8L19 16Z" />
  </>,
  logout: <>
    <path d="M10 4H5.5A2.5 2.5 0 0 0 3 6.5v11A2.5 2.5 0 0 0 5.5 20H10M14 16l4-4-4-4M18 12H9" />
  </>,
  arrow: <path d="M5 12h14M13 6l6 6-6 6" />,
};

export default function Icon({ name, className = '', size = 20, strokeWidth = 1.8 }) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {iconShapes[name]}
    </svg>
  );
}
