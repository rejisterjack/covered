export type SiteConfig = typeof siteConfig;

export const siteConfig = {
  name: "Covered",
  fullName: "Covered / X",
  description: "Covered from X — post a bill. Someone's got it.",
  tagline: "Covered from X — post a bill. Someone's got it.",
  url: "https://covered.rejisterjack.com",
  navItems: [
    { label: "Home", href: "/" },
    { label: "Leaderboard", href: "/leaderboard" },
    { label: "Post", href: "/bills/new" },
    { label: "Profile", href: "/profile" },
  ],
  links: {
    terms: "/terms",
    privacy: "/privacy",
    x: "https://x.com",
  },
};
