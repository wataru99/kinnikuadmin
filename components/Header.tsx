"use client";

export default function Header({ title }: { title: string }) {
  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="px-4 py-3 lg:px-8 lg:py-4">
        <h1 className="text-lg lg:text-2xl font-bold text-gray-900">{title}</h1>
      </div>
    </header>
  );
}
