export type SiteConfig = typeof siteConfig;

export const siteConfig = {
  name: "Covered",
  fullName: "Covered",
  description: "Post your bill. Someone's got it.",
  tagline: "Post your bill. Someone's got it.",
  url: "https://covered.rejisterjack.com",
  navItems: [
    { label: "Home", href: "/app" },
    { label: "Leaderboard", href: "/leaderboard" },
    { label: "Post", href: "/bills/new" },
    { label: "Profile", href: "/profile" },
  ],
  links: {
    terms: "/terms",
    privacy: "/privacy",
    install: "/install",
    app: "/app",
    x: "https://x.com",
  },
};
