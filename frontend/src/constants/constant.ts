// Prescott National Bank Design System Constants
 
export const COLORS = {
  // Core Prescott National Bank Emerald Theme Colors
  PRIMARY: "#059669",       // Emerald Green (Key CTAs, active states)
  PRIMARY_DARK: "#047857",  // Darker Emerald (hovering primary)
  PRIMARY_LIGHT: "#10B981", // Mint Green (Info elements, highlights)
  PRIMARY_MUTED: "#64748B", // Slate Gray (Descriptions, subtitles)

  // Semantic Validation Colors
  SUCCESS: "#10B981",
  SUCCESS_LIGHT: "#ECFDF5",
  ERROR: "#EF4444",
  ERROR_LIGHT: "#FEF2F2",
  WARNING: "#F59E0B",
  WARNING_LIGHT: "#FEF3C7",

  // Base Neutrals (Prescott National Bank Light Theme)
  BACKGROUND: "#F8F9FC",    // Light blue-gray canvas
  SURFACE: "#FFFFFF",       // Pure White Card Surfaces
  BORDER: "rgba(15, 23, 42, 0.08)", // Thin gray border
  INPUT: "rgba(15, 23, 42, 0.05)",
  RING: "#059669"
};

export const FONTS = {
  SANS: "var(--font-pjs)",     // Plus Jakarta Sans (body, paragraphs)
  HEADING: "var(--font-outfit)", // Outfit (titles, headings)
  MONO: "var(--font-jbm)"      // JetBrains Mono (monospaced metrics, balance)
};

export const SPACING = {
  BASE: "4px",
  SPACE_1: "4px",
  SPACE_2: "8px",
  SPACE_3: "12px",
  SPACE_4: "16px",
  SPACE_5: "20px",
  SPACE_6: "24px",
  SPACE_8: "32px",
  SPACE_10: "40px",
  SPACE_12: "48px",
  SPACE_16: "64px"
};

export const RADIUS = {
  SM: "6px",
  MD: "8px",
  LG: "12px",
  XL: "16px",
  FULL: "9999px"
};

export const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: "$",
  CAD: "$",
  GBP: "£",
};
