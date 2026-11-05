export type NavItem = {
  href: string;
  label: string;
  shortLabel: string;
  match: (pathname: string) => boolean;
};

export const PRIMARY_NAV: NavItem[] = [
  {
    href: "/app",
    label: "Home",
    shortLabel: "Home",
    match: (p) => p === "/app" || p.startsWith("/bills"),
  },
  {
    href: "/leaderboard",
    label: "Leaderboard",
    shortLabel: "Ranks",
    match: (p) => p.startsWith("/leaderboard"),
  },
  {
    href: "/bills/new",
    label: "Post",
    shortLabel: "Post",
    match: (p) => p.startsWith("/bills/new"),
  },
  {
    href: "/profile",
    label: "Profile",
    shortLabel: "Profile",
    match: (p) => p.startsWith("/profile") || p.startsWith("/u/"),
  },
];

export const MARKETING_PATHS = new Set(["/", "/install"]);

export function isMarketingPath(pathname: string) {
  return MARKETING_PATHS.has(pathname);
}

export function isBarePath(pathname: string) {
  return pathname.startsWith("/embed");
}
