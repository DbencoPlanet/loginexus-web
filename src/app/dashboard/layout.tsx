"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Truck,
  Map,
  FileText,
  Settings,
  LogOut,
  Menu,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Simple logout function
  const handleLogout = () => {
    localStorage.removeItem("token");
    router.push("/login");
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* 1. Sidebar */}
      <aside
        className={`${
          isSidebarOpen ? "w-64" : "w-20"
        } bg-slate-900 text-white transition-all duration-300 flex flex-col fixed h-full z-10`}
      >
        <div className="p-4 flex items-center justify-between border-b border-slate-800">
          {isSidebarOpen && (
            <span className="font-bold text-xl tracking-tight">LogiNexus</span>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="text-slate-400 hover:text-white"
          >
            <Menu className="h-5 w-5" />
          </Button>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          <NavItem
            href="/dashboard"
            icon={<LayoutDashboard />}
            label="Overview"
            isOpen={isSidebarOpen}
          />
          <NavItem
            href="/dashboard/shipments"
            icon={<Truck />}
            label="Shipments"
            isOpen={isSidebarOpen}
          />
          <NavItem
            href="/dashboard/planning"
            icon={<Map />}
            label="Planning"
            isOpen={isSidebarOpen}
          />
          <NavItem
            href="/dashboard/quotes"
            icon={<FileText />}
            label="Quotes"
            isOpen={isSidebarOpen}
          />
        </nav>

        <div className="p-4 border-t border-slate-800">
          <Button
            variant="ghost"
            className={`w-full justify-start text-red-400 hover:text-red-300 hover:bg-slate-800 ${
              !isSidebarOpen && "justify-center px-2"
            }`}
            onClick={handleLogout}
          >
            <LogOut className="h-5 w-5 mr-2" />
            {isSidebarOpen && "Sign Out"}
          </Button>
        </div>
      </aside>

      {/* 2. Main Content Area */}
      <main
        className={`flex-1 transition-all duration-300 ${
          isSidebarOpen ? "ml-64" : "ml-20"
        }`}
      >
        <div className="p-8">{children}</div>
      </main>
    </div>
  );
}

// Helper Component for Menu Items
function NavItem({
  href,
  icon,
  label,
  isOpen,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  isOpen: boolean;
}) {
  return (
    <Link href={href}>
      <Button
        variant="ghost"
        className={`w-full justify-start text-slate-300 hover:text-white hover:bg-slate-800 mb-1 ${
          !isOpen && "justify-center px-2"
        }`}
      >
        <span className="mr-2">{icon}</span>
        {isOpen && <span>{label}</span>}
      </Button>
    </Link>
  );
}
