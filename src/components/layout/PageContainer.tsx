export function PageContainer({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <main className={`flex-1 px-4 py-6 md:px-8 md:py-8 ${className}`}>
      <div className="mx-auto w-full max-w-6xl">{children}</div>
    </main>
  );
}
