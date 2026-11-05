import Image from "next/image";
import clsx from "clsx";

/** Same Covered icon as PWA / favicon — `/icons/icon-192.png`. */
export function CoveredMark({
  className,
  size = 28,
  title,
  rounded = true,
}: {
  className?: string;
  size?: number;
  /** Omit for decorative use next to visible “Covered” text. */
  title?: string;
  rounded?: boolean;
}) {
  return (
    <Image
      alt={title ?? ""}
      aria-hidden={title ? undefined : true}
      className={clsx(
        "shrink-0 object-cover",
        rounded ? "rounded-[22%]" : "rounded-none",
        className,
      )}
      height={size}
      src="/icons/icon-192.png"
      width={size}
    />
  );
}
