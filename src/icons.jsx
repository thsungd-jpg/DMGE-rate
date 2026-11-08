import React from "react";

// Sorbet Ink line icons: 24px grid, 1.75 stroke, round caps. Same export names and (size, color) props as the old
// pixel set, so every call site upgrades automatically. `color` defaults to currentColor.
const Icon = ({ children, size = 20, color = "currentColor", strokeWidth = 1.75, fill = "none", style }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill={fill}
    stroke={color}
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{ flexShrink: 0, pointerEvents: "none", ...style }}
    aria-hidden="true"
    focusable="false"
  >
    {children}
  </svg>
);

// ── tiers ──
export const IconStar = (p) => (
  <Icon {...p}><path d="M12 3.2l2.5 5.2 5.7.8-4.1 4 1 5.7L12 16.2 6.9 18.9l1-5.7-4.1-4 5.7-.8z" /></Icon>
);
export const IconTierPro = IconStar;
export const IconTierFree = (p) => (
  <Icon {...p}><path d="M12 3c3 4 6 6.6 6 10.2a6 6 0 0 1-12 0C6 9.600 9 7 12 3z" /></Icon>
);
export const IconTierAgency = (p) => (
  <Icon {...p}><path d="M4 8l4 3 4-6 4 6 4-3-1.6 9H5.600z" /><path d="M5.600 20h12.800" /></Icon>
);

// ── general ──
export const IconHelp = (p) => (
  <Icon {...p}><circle cx="12" cy="12" r="9" /><path d="M9.500 9.300a2.600 2.600 0 0 1 5 .9c0 1.800-2.500 2.200-2.500 3.800" /><path d="M12 17.300h.01" /></Icon>
);
export const IconArrowLeft = (p) => (<Icon {...p}><path d="M19 12H5" /><path d="M11 6l-6 6 6 6" /></Icon>);
export const IconArrowRight = (p) => (<Icon {...p}><path d="M5 12h14" /><path d="M13 6l6 6-6 6" /></Icon>);
export const IconArrowDown = (p) => (<Icon {...p}><path d="M12 5v14" /><path d="M6 13l6 6 6-6" /></Icon>);
export const IconEdit = (p) => (<Icon {...p}><path d="M4 20h4L19 9a2.800 2.800 0 0 0-4-4L4 16z" /><path d="M13.500 6.500l4 4" /></Icon>);
export const IconDelete = (p) => (<Icon {...p}><path d="M4 7h16" /><path d="M9 7V4.500h6V7" /><path d="M6.500 7l.8 12.500h9.400L17.500 7" /><path d="M10 11v5M14 11v5" /></Icon>);
export const IconMenu = (p) => (<Icon {...p}><path d="M4 7h16M4 12h16M4 17h16" /></Icon>);
export const IconMoney = (p) => (<Icon {...p}><circle cx="12" cy="12" r="9" /><path d="M14.800 9.200c-.5-1-1.600-1.500-2.800-1.500-1.500 0-2.700.8-2.700 2 0 2.800 5.600 1.400 5.600 4.200 0 1.300-1.300 2.100-2.900 2.100-1.300 0-2.500-.6-3-1.700" /><path d="M12 6v1.700M12 16.300V18" /></Icon>);
export const IconBigMoney = ({ size = 28, color = "currentColor" }) => <IconMoney size={size} color={color} strokeWidth={1.5} />;
export const IconLock = (p) => (<Icon {...p}><rect x="5" y="10.500" width="14" height="9.500" rx="2.500" /><path d="M8 10.500V8a4 4 0 0 1 8 0v2.500" /></Icon>);
export const IconCheck = (p) => (<Icon {...p}><path d="M5 12.500l4.500 4.500L19 7.500" /></Icon>);
export const IconCross = (p) => (<Icon {...p}><path d="M6 6l12 12M18 6L6 18" /></Icon>);
export const IconPending = (p) => (<Icon {...p}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></Icon>);
export const IconInProgress = (p) => (<Icon {...p}><path d="M6 3.500h12M6 20.500h12" /><path d="M7 3.500c0 4 3 5 5 8.500-2 3.500-5 4.500-5 8.500M17 3.500c0 4-3 5-5 8.500 2 3.500 5 4.500 5 8.500" /></Icon>);
export const IconUpload = (p) => (<Icon {...p}><path d="M12 16V5" /><path d="M7 9.500l5-5 5 5" /><path d="M4.500 15v3.500a1.500 1.500 0 0 0 1.500 1.500h12a1.500 1.500 0 0 0 1.500-1.500V15" /></Icon>);
export const IconCopy = (p) => (<Icon {...p}><rect x="8.500" y="8.500" width="11" height="11" rx="2.500" /><path d="M15.500 8.500V6A1.500 1.500 0 0 0 14 4.500H6A1.500 1.500 0 0 0 4.500 6v8A1.500 1.500 0 0 0 6 15.500h2.500" /></Icon>);
export const IconGoogle = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden="true" focusable="false" style={{ flexShrink: 0 }}>
    <path fill="#FFC107" d="M43.6 20.1H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 8 3l5.700-5.700C34 6.100 29.300 4 24 4 13 4 4 13 4 24s9 20 20 20 20-9 20-20c0-1.300-.1-2.400-.4-3.900z" />
    <path fill="#FF3D00" d="M6.300 14.700l6.600 4.800C14.700 15.100 19 12 24 12c3.100 0 5.800 1.200 8 3l5.700-5.700C34 6.100 29.300 4 24 4 16.300 4 9.700 8.300 6.300 14.700z" />
    <path fill="#4CAF50" d="M24 44c5.200 0 9.900-2 13.400-5.200l-6.200-5.200C29.200 35.100 26.700 36 24 36c-5.200 0-9.600-3.300-11.300-8l-6.500 5C9.500 39.600 16.200 44 24 44z" />
    <path fill="#1976D2" d="M43.600 20.100H42V20H24v8h11.300c-.8 2.200-2.200 4.200-4.100 5.600l6.200 5.200C37 39.200 44 34 44 24c0-1.300-.1-2.400-.4-3.900z" />
  </svg>
);

// ── dock / navigation ──
export const IconCalc = (p) => (<Icon {...p}><rect x="5" y="3.500" width="14" height="17" rx="3" /><path d="M8.500 8h7" /><path d="M8.500 12.500h.01M12 12.500h.01M15.500 12.500h.01M8.500 16.500h.01M12 16.500h.01M15.500 16.500h.01" strokeWidth="2.400" /></Icon>);
export const IconJobs = (p) => (<Icon {...p}><rect x="3.500" y="7" width="17" height="12.500" rx="2.500" /><path d="M9 7V5.500A1.500 1.500 0 0 1 10.500 4h3A1.500 1.500 0 0 1 15 5.500V7" /><path d="M3.500 12.500h17" /></Icon>);
export const IconTemplates = (p) => (<Icon {...p}><path d="M12 4l8 4.200-8 4.200L4 8.200z" /><path d="M4 12.200l8 4.200 8-4.200" /><path d="M4 16.200l8 4.200 8-4.200" /></Icon>);
export const IconClients = (p) => (<Icon {...p}><circle cx="9" cy="8.500" r="3.200" /><path d="M3.500 19.500c0-3 2.500-5 5.500-5s5.500 2 5.500 5" /><path d="M16 5.700a3.200 3.200 0 0 1 0 5.600" /><path d="M17.500 14.800c2 .5 3.500 2.200 3.500 4.700" /></Icon>);
export const IconInsights = (p) => (<Icon {...p}><path d="M4 20h16" /><rect x="5.500" y="11" width="3" height="6.500" rx="1" /><rect x="10.500" y="6" width="3" height="11.500" rx="1" /><rect x="15.500" y="9" width="3" height="8.500" rx="1" /></Icon>);
export const IconProfile = (p) => (<Icon {...p}><circle cx="12" cy="8.500" r="3.500" /><path d="M5 20c.5-3.600 3.400-5.500 7-5.500s6.500 1.900 7 5.500" /></Icon>);
export const IconMore = (p) => (<Icon {...p}><circle cx="5.500" cy="12" r=".8" fill="currentColor" /><circle cx="12" cy="12" r=".8" fill="currentColor" /><circle cx="18.500" cy="12" r=".8" fill="currentColor" /></Icon>);
export const IconBook = (p) => (<Icon {...p}><path d="M5 5.500A2 2 0 0 1 7 3.500h11.500v15.500H7a2 2 0 0 0-2 2z" /><path d="M5 5.500v15" /><path d="M9 8h6" /></Icon>);
export const IconTag = (p) => (<Icon {...p}><path d="M4 12.500V5.500A1.500 1.500 0 0 1 5.500 4h7L20 11.500 12.500 19 4 12.500z" /><circle cx="8.500" cy="8.500" r="1" /></Icon>);
export const IconLogout = (p) => (<Icon {...p}><path d="M9.500 4.500H6A1.500 1.500 0 0 0 4.500 6v12A1.500 1.500 0 0 0 6 19.500h3.500" /><path d="M14 8l4 4-4 4" /><path d="M18 12H9.500" /></Icon>);
export const IconPlus = (p) => (<Icon {...p}><path d="M12 5v14M5 12h14" /></Icon>);
export const IconSearch = (p) => (<Icon {...p}><circle cx="11" cy="11" r="6.500" /><path d="M16 16l4 4" /></Icon>);
export const IconSend = (p) => (<Icon {...p}><path d="M20.500 3.500L10 14" /><path d="M20.500 3.500l-6.500 17-3.500-6.500L4 10.500z" /></Icon>);
export const IconDownload = (p) => (<Icon {...p}><path d="M12 4.500V15" /><path d="M7 10.500l5 5 5-5" /><path d="M4.500 19.500h15" /></Icon>);
export const IconVolume = (p) => (<Icon {...p}><path d="M4 9.500v5h3.500L12 18.500v-13L7.500 9.500z" /><path d="M15.500 9a4 4 0 0 1 0 6" /><path d="M18 6.500a7.500 7.500 0 0 1 0 11" /></Icon>);
export const IconVolumeOff = (p) => (<Icon {...p}><path d="M4 9.500v5h3.500L12 18.500v-13L7.500 9.500z" /><path d="M16 9.500l5 5M21 9.500l-5 5" /></Icon>);

// ── craft families ──
export const IconMusic = (p) => (<Icon {...p}><path d="M9 18V6l10-2v12" /><circle cx="6.500" cy="18" r="2.500" /><circle cx="16.500" cy="16" r="2.500" /></Icon>);
export const IconFilm = (p) => (<Icon {...p}><rect x="4" y="5" width="16" height="14" rx="2.500" /><path d="M8 5v14M16 5v14M4 9.500h4M4 14.500h4M16 9.500h4M16 14.500h4" /></Icon>);
export const IconTalent = (p) => (<Icon {...p}><path d="M12 3.500l2.200 4.500 5 .7-3.600 3.500.9 5L12 14.800 7.500 17.200l.9-5L4.800 8.700l5-.7z" /></Icon>);
export const IconVisual = (p) => (<Icon {...p}><path d="M12 4a8 8 0 1 0 0 16c1.500 0 2-1 1.500-2.200-.5-1.200.2-2.300 1.500-2.300H17a3 3 0 0 0 3-3A8 8 0 0 0 12 4z" /><circle cx="8" cy="11" r=".9" fill="currentColor" /><circle cx="11" cy="7.800" r=".9" fill="currentColor" /><circle cx="15" cy="8.500" r=".9" fill="currentColor" /></Icon>);
export const IconTech = (p) => (<Icon {...p}><path d="M8.500 8L4.500 12l4 4M15.500 8l4 4-4 4" /><path d="M13.500 5.500l-3 13" /></Icon>);
export const IconWrite = (p) => (<Icon {...p}><path d="M5 19.500l1-4L16.500 5a2.100 2.100 0 0 1 3 3L9 18.500z" /><path d="M14.500 7l3 3" /></Icon>);
export const IconBiz = (p) => (<Icon {...p}><rect x="4" y="9" width="16" height="10.500" rx="2" /><path d="M9 9V6.500A1.500 1.500 0 0 1 10.500 5h3A1.500 1.500 0 0 1 15 6.500V9" /></Icon>);
export const IconEdu = (p) => (<Icon {...p}><path d="M3 9.500l9-4.500 9 4.500-9 4.500z" /><path d="M7 11.800V16c0 1.300 2.200 2.500 5 2.500s5-1.200 5-2.500v-4.200" /></Icon>);
export const IconFashion = (p) => (<Icon {...p}><path d="M9 4l-5 3.500 2 3 2-1V20h8V9.500l2 1 2-3L15 4a3 3 0 0 1-6 0z" /></Icon>);
export const IconLive = (p) => (<Icon {...p}><path d="M4 18.500c0-5 3-8 8-8s8 3 8 8" /><path d="M12 10.500V4M6 12.500L4.500 11M18 12.500l1.500-1.500" /></Icon>);
export const IconLegacy = (p) => (<Icon {...p}><path d="M12 3.500l1.800 4.700 4.700.5-3.500 3.200 1 4.800L12 14.300 8 16.700l1-4.800L5.500 8.700l4.700-.5z" /></Icon>);

// Fields added later (checked first: some of their names also contain a word the older checks below look for).
export const IconCreator = (p) => (<Icon {...p}><rect x="3.500" y="5.500" width="17" height="13" rx="3.500" /><path d="M10.500 9.500l4.500 2.500-4.500 2.500z" /></Icon>);
export const IconDesign = (p) => (<Icon {...p}><rect x="4" y="4" width="16" height="16" rx="2.500" /><path d="M4 9.500h16M9.500 9.500V20" /></Icon>);
export const IconGames = (p) => (<Icon {...p}><path d="M7 8h10a4 4 0 0 1 3.900 4.900l-.9 3.600a2.200 2.200 0 0 1-3.800.9L14.500 15h-5l-1.700 2.400a2.200 2.200 0 0 1-3.800-.9l-.9-3.600A4 4 0 0 1 7 8z" /><path d="M8 10.500v3M6.500 12h3" /><circle cx="15.500" cy="11.200" r=".8" fill="currentColor" /><circle cx="17.500" cy="13" r=".8" fill="currentColor" /></Icon>);
export const IconAudio = (p) => (<Icon {...p}><rect x="9" y="3.500" width="6" height="10.500" rx="3" /><path d="M5.500 11.500a6.500 6.500 0 0 0 13 0M12 18v2.500M9 20.500h6" /></Icon>);
export const IconMakers = (p) => (<Icon {...p}><circle cx="6.500" cy="17" r="2.500" /><circle cx="6.500" cy="7" r="2.500" /><path d="M8.500 8.500L20 18M8.500 15.500L20 6" /></Icon>);
export const IconBody = (p) => (<Icon {...p}><path d="M12 3.500l1.800 5.200 5.200 1.800-5.200 1.800L12 17.500l-1.800-5.200L5 10.500l5.200-1.800z" /><path d="M19 3.500v3M17.500 5h3M5 17.500v3M3.500 19h3" /></Icon>);
export const IconHome = (p) => (<Icon {...p}><path d="M4 11l8-6.500 8 6.500" /><path d="M6 9.500V20h12V9.500" /><path d="M10 20v-5.500h4V20" /></Icon>);
export const IconRings = (p) => (<Icon {...p}><circle cx="9" cy="14" r="4.500" /><circle cx="15" cy="14" r="4.500" /><path d="M12 3v3M10.500 4.500h3" /></Icon>);
export const IconCamera = (p) => (<Icon {...p}><path d="M4 8.500A1.500 1.500 0 0 1 5.500 7H8l1.200-2h5.600L16 7h2.500A1.500 1.500 0 0 1 20 8.500v9a1.500 1.500 0 0 1-1.500 1.500h-13A1.500 1.500 0 0 1 4 17.500z" /><circle cx="12" cy="12.800" r="3.400" /></Icon>);
export const IconHeart = (p) => (<Icon {...p}><path d="M12 20s-7-4.400-7-10a4 4 0 0 1 7-2.600A4 4 0 0 1 19 10c0 5.600-7 10-7 10z" /></Icon>);

export const IconPenNib = (p) => (<Icon {...p}><path d="M12 21v-7.500" /><path d="M12 13.500c-3.200 0-5.500-2.600-5.500-6.300L12 3l5.500 4.200c0 3.700-2.300 6.300-5.500 6.300z" /><circle cx="12" cy="8.800" r="1.100" fill="currentColor" /></Icon>);
export const IconPrinter = (p) => (<Icon {...p}><path d="M7 9V4h10v5" /><rect x="4" y="9" width="16" height="8" rx="2" /><path d="M7 14h10v6H7z" /><circle cx="16.500" cy="11.500" r=".7" fill="currentColor" /></Icon>);
export const IconMegaphone = (p) => (<Icon {...p}><path d="M4 10v4a1 1 0 0 0 1 1h2.500l7 4V5l-7 4H5a1 1 0 0 0-1 1z" /><path d="M18 9.500a3.500 3.500 0 0 1 0 5" /><path d="M8 15l1 4.500h2L10.500 16" /></Icon>);

export const getCategoryIcon = (name) => {
  const n = name.toLowerCase();
  if (n.includes("print services")) return IconPrinter;
  if (n.includes("marketing")) return IconMegaphone;
  if (n.includes("graphic design")) return IconPenNib;
  if (n.includes("creator")) return IconCreator;
  if (n.includes("design and ux")) return IconDesign;
  if (n.includes("games")) return IconGames;
  if (n.includes("audio")) return IconAudio;
  if (n.includes("makers")) return IconMakers;
  if (n.includes("body art")) return IconBody;
  if (n.includes("architecture")) return IconHome;
  if (n.includes("wedding")) return IconRings;
  if (n.includes("photo and video")) return IconCamera;
  if (n.includes("my crafts")) return IconHeart;
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
