import React from 'react';

const PixelIcon = ({ children, size = 40, color = "#2a2a2a" }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill={color} style={{ flexShrink: 0, pointerEvents: "none" }}>
    {children}
  </svg>
);

export const IconStar = (props) => (
  <PixelIcon {...props}>
    <path d="M7 1h2v2H7zM4 3h2v2H4zM10 3h2v2h-2zM1 7h2v2H1zM13 7h2v2h-2zM4 11h2v2H4zM10 11h2v2h-2zM7 13h2v2H7z" />
    <rect x="7" y="5" width="2" height="6" />
    <rect x="5" y="7" width="6" height="2" />
  </PixelIcon>
);

export const IconHelp = (props) => (
  <PixelIcon {...props}>
    <path d="M6 2h4v2H6V2zm-2 2h2v2H4V4zm6 0h2v2h-2V4zm-2 2h2v2h-2V6zm-2 2h2v2H6V8zm0 2h2v2H6v-2zm0 4h2v2H6v-2z" />
  </PixelIcon>
);

export const IconTierPro = IconStar;

export const IconTierFree = (props) => (
  <PixelIcon {...props}>
    <path d="M3 5h10v6H3zM2 6h1v4H2zM13 6h1v4h-1zM5 7h2v2H5zM10 7h1v1h-1zM10 9h1v1h-1z" />
  </PixelIcon>
);

export const IconTierAgency = (props) => (
  <PixelIcon {...props}>
    <path d="M2 11h12v3H2zM2 5h2v6H2zM12 5h2v6h-2zM7 4h2v7H7zM4 8h2v3H4zM10 8h2v3h-2z" />
  </PixelIcon>
);

export const IconMusic = (props) => (
  <PixelIcon {...props}>
    <path d="M9 1h5v2H9zM8 3h1v10H8zM4 9h4v4H4zM9 3h3v2H9z" />
  </PixelIcon>
);

export const IconFilm = (props) => (
  <PixelIcon {...props}>
    <path d="M1 3h14v10H1zM3 5h2v2H3zM7 5h2v2H7zM11 5h2v2H11zM3 9h10v2H3z" />
  </PixelIcon>
);

export const IconTalent = (props) => (
  <PixelIcon {...props}>
    <path d="M4 3h8v2H4zM3 5h10v6H3zM5 7h2v2H5zM9 7h2v2H9zM6 11h4v2H6z" />
  </PixelIcon>
);

export const IconVisual = (props) => (
  <PixelIcon {...props}>
    <path d="M3 3h10v10H3zM5 5h2v2H5zM9 5h2v2H9zM5 9h6v2H5z" />
  </PixelIcon>
);

export const IconTech = (props) => (
  <PixelIcon {...props}>
    <path d="M2 2h12v12H2zM4 4h2v2H4zM10 4h2v2H10zM4 10h2v2H4zM10 10h2v2H10zM7 7h2v2H7z" />
  </PixelIcon>
);

export const IconWrite = (props) => (
  <PixelIcon {...props}>
    <path d="M2 12h10l2-2V2H4L2 4v8zM4 4h8v6H4V4z" />
  </PixelIcon>
);

export const IconBiz = (props) => (
  <PixelIcon {...props}>
    <path d="M2 4h12v10H2zM6 2h4v2H6zM4 6h8v2H4V6z" />
  </PixelIcon>
);

export const IconEdu = (props) => (
  <PixelIcon {...props}>
    <path d="M1 8l7-5 7 5-7 5-7-5zM4 10v3l4 2 4-2v-3" />
  </PixelIcon>
);

export const IconFashion = (props) => (
  <PixelIcon {...props}>
    <path d="M8 2l6 10H2L8 2zm0 3L5 10h6L8 5z" />
  </PixelIcon>
);

export const IconLive = (props) => (
  <PixelIcon {...props}>
    <path d="M7 2h2v4H7zM3 8h10v6H3zM5 10h6v2H5z" />
  </PixelIcon>
);

export const IconLegacy = (props) => (
  <PixelIcon {...props}>
    <path d="M3 3h10v10H3zM5 5h2v2H5zM9 5h1v1H9zM5 9h6v2H5z" />
  </PixelIcon>
);

export const IconArrowLeft = (props) => (
  <PixelIcon size={30} {...props}>
    <path d="M10 2h2v12h-2zM8 4h2v8H8zM6 6h2v4H6zM4 7h2v2H4z" />
  </PixelIcon>
);

export const IconArrowRight = (props) => (
  <PixelIcon size={30} {...props}>
    <path d="M4 2h2v12h-2zM6 4h2v8H6zM8 6h2v4H8zM10 7h2v2H10z" />
  </PixelIcon>
);

export const IconArrowDown = (props) => (
  <PixelIcon size={35} {...props}>
    <path d="M2 4h12v2H2zM4 6h8v2H4zM6 8h4v2H6zM7 10h2v2H7z" />
  </PixelIcon>
);

export const IconEdit = (props) => (
  <PixelIcon size={20} {...props}>
    <path d="M11 1h4v4h-4zM9 3h4v4H9zM7 5h4v4H7zM5 7h4v4H5zM3 9h4v4H3zM1 11h4v4H1z" />
  </PixelIcon>
);

export const IconDelete = (props) => (
  <PixelIcon size={20} {...props}>
    <path d="M2 2h3v2H2zM11 2h3v2h-3zM4 4h8v2H4zM6 6h4v8H6zM3 4h2v10H3zM11 4h2v10h-2zM5 14h6v2H5z" />
  </PixelIcon>
);

export const IconMenu = (props) => (
  <PixelIcon size={24} {...props}>
    <path d="M2 2h12v2H2V2zm0 5h12v2H2V7zm0 5h12v2H2v-2z" />
  </PixelIcon>
);

export const IconMoney = (props) => (
  <PixelIcon size={24} {...props}>
    <path d="M7 0h2v2H7V0zM4 2h8v2H4V2zM2 4h3v4H2V4zM5 7h6v2H5V7zM11 9h3v4h-3V9zM4 12h8v2H4v-2zM7 14h2v2H7v-2z" />
  </PixelIcon>
);

export const IconLock = (props) => (
  <PixelIcon {...props}>
    <path d="M6 2h4v2H6z M4 4h2v2H4z M10 4h2v2H10z M3 6h4v8H3z M9 6h4v8H9z M7 6h2v3H7z M7 11h2v3H7z" />
  </PixelIcon>
);

export const IconCheck = (props) => (
  <PixelIcon {...props}>
    <path d="M2 7h2v2H2z M4 9h2v2H4z M6 11h2v3H6z M8 9h2v3H8z M10 7h2v3H10z M12 5h2v3H12z" />
  </PixelIcon>
);

export const IconCross = (props) => (
  <PixelIcon {...props}>
    <path d="M2 2h3v3H2z M11 2h3v3H11z M4 4h3v3H4z M9 4h3v3H9z M6 6h4v4H6z M4 9h3v3H4z M9 9h3v3H9z M2 11h3v3H2z M11 11h3v3H11z" />
  </PixelIcon>
);

export const IconPending = (props) => (
  <PixelIcon {...props}>
    <path d="M3 3h3v10H3z M10 3h3v10H10z" />
  </PixelIcon>
);

export const IconInProgress = (props) => (
  <PixelIcon {...props}>
    <path d="M3 1h10v2H3z M4 3h8v2H4z M6 5h4v2H6z M7 7h2v2H7z M6 9h4v2H6z M4 11h8v2H4z M3 13h10v2H3z" />
  </PixelIcon>
);

export const getCategoryIcon = (name) => {
  const n = name.toLowerCase();
  if (n.includes("music")) return IconMusic;
  if (n.includes("film") || n.includes("tv")) return IconFilm;
  if (n.includes("talent") || n.includes("performance")) return IconTalent;
  if (n.includes("graphic") || n.includes("visual")) return IconVisual;
  if (n.includes("tech") || n.includes("digital")) return IconTech;
  if (n.includes("writing") || n.includes("content")) return IconWrite;
  if (n.includes("biz") || n.includes("business") || n.includes("mgmt")) return IconBiz;
  if (n.includes("edu") || n.includes("coach") || n.includes("learn")) return IconEdu;
  if (n.includes("fashion") || n.includes("style")) return IconFashion;
  if (n.includes("live") || n.includes("event") || n.includes("prod")) return IconLive;
  if (n.includes("featured") || n.includes("legacy")) return IconLegacy;
  return IconStar;
};

export const IconBigMoney = ({ size = 48 }) => (
  <svg width={size} height={size} viewBox="0 0 18 18" style={{ flexShrink: 0 }}>
    {/* Shadow Layer */}
    <path 
      d="M9 2h2v2h3v2H7v3h6v2h3v4h-2v1h-3v2H9v-2H6v-2h7V11H7V9H4V6h2v-2h3z" 
      fill="#E91E63" 
    />
    {/* Main Layer */}
    <path 
      d="M7 0h2v2h3v2H5v3h6v2h3v4h-2v1h-3v2H7v-2H4v-2h7V9H5V7H2V4h2v-2h3z" 
      fill="#FFB347" 
      stroke="#000" 
      strokeWidth="0.5" 
    />
  </svg>
);

export const IconUpload = (props) => (
  <PixelIcon {...props}>
    <path d="M7 8V4H4l4-4 4 4H9v4H7zM3 10h10v2H3z" />
  </PixelIcon>
);

export const IconCopy = (props) => (
  <PixelIcon {...props}>
    <path d="M4 2h8v2H4V2zm10 2v10h-2V4h2zM2 4v8h2V4H2zm2 10h8v2H4v-2z M7 5h4v2H7V5zm0 3h4v4H7V8z" />
  </PixelIcon>
);

export const IconGoogle = (props) => (
  <PixelIcon {...props}>
    <path d="M4 2h10v2H6v8h8v2H4zM10 7h4v2h-4zM12 9h2v2h-2z" />
  </PixelIcon>
);
