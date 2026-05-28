export default function AssistantLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-1 flex-col min-h-0 w-full overflow-hidden">
      {children}
    </div>
  );
}
