export function PageHeader({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="border-b border-[#2f3336] px-4 py-3.5">
      <h1 className="truncate text-[19px] font-bold leading-6 tracking-tight text-[#e7e9ea] sm:text-[20px]">
        {title}
      </h1>
      {subtitle ? (
        <p className="mt-0.5 truncate text-[13px] leading-4 text-[#71767b]">
          {subtitle}
        </p>
      ) : null}
    </div>
  );
}
