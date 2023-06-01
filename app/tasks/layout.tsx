export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto h-screen w-screen max-w-4xl overflow-auto bg-slate-400 p-5 text-black">
      {children}
    </div>
  );
}
