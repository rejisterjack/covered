export type NavItem = {
  href: string;
  label: string;
  shortLabel: string;
  match: (pathname: string) => boolean;
};

export const PRIMARY_NAV: NavItem[] = [
  {
    href: "/",
    label: "Home",
    shortLabel: "Home",
    match: (p) => p === "/",
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
