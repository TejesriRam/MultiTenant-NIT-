"use client";

import Link from "next/link";
import { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import {
    LayoutDashboard,
    CheckSquare,
    Trash2,
    Users,
    ScrollText,
} from "lucide-react";
import { Role } from "@/types";

type AppShellProps = {
    title?: string;
    children: ReactNode;
};

const navItems: {
    label: string;
    href: string;
    icon: React.ElementType;
    roles: Role[];
}[] = [
        { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, roles: ["OWNER", "ADMIN", "MEMBER"] },
        { label: "Tasks", href: "/tasks", icon: CheckSquare, roles: ["OWNER", "ADMIN", "MEMBER"] },
        { label: "Trash", href: "/tasks/trash", icon: Trash2, roles: ["OWNER", "ADMIN", "MEMBER"] },
        { label: "Members", href: "/members", icon: Users, roles: ["OWNER", "ADMIN"] },
        { label: "Logs", href: "/logs", icon: ScrollText, roles: ["OWNER", "ADMIN", "MEMBER"] },
    ];

// Correct active detection — no false positives between /tasks and /tasks/trash
function getActive(href: string, pathname: string): boolean {
    if (href === "/dashboard") {
        return pathname === "/dashboard" || pathname.startsWith("/dashboard/");
    }
    if (href === "/tasks") {
        return pathname.startsWith("/tasks") && !pathname.startsWith("/tasks/trash");
    }
    return pathname === href;
}

export default function AppShell({
    title = "Task Management System",
    children,
}: AppShellProps) {
    const pathname = usePathname();
    const { user } = useAuth();
    const role = user?.role;

    const visibleNav = navItems.filter(
        (item) => role && item.roles.includes(role)
    );

    const workspaceItems = visibleNav.filter((item) =>
        ["/dashboard", "/tasks"].includes(item.href)
    );
    const manageItems = visibleNav.filter((item) =>
        !["/dashboard", "/tasks"].includes(item.href)
    );

    return (
        <>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Barlow:wght@400;500;600;700&family=Barlow+Condensed:wght@600;700&display=swap');

                :root {
                    --taskora-blue: #1B6EF3;
                    --taskora-blue-bright: #3B82F6;
                    --taskora-sidebar: #0A0E1A;
                    --taskora-sidebar-border: rgba(255,255,255,0.06);
                    --taskora-nav-hover: rgba(27,110,243,0.12);
                    --taskora-nav-active: rgba(27,110,243,0.22);
                }

                * { font-family: 'Barlow', sans-serif; }

                .taskora-sidebar {
                    background: var(--taskora-sidebar);
                    border-right: 1px solid var(--taskora-sidebar-border);
                }

                .taskora-logo-text {
                    font-family: 'Barlow Condensed', sans-serif;
                    font-weight: 700;
                    letter-spacing: 0.12em;
                    font-size: 1.35rem;
                    color: #fff;
                }

                .taskora-tagline {
                    font-family: 'Barlow Condensed', sans-serif;
                    font-size: 0.6rem;
                    letter-spacing: 0.22em;
                    color: rgba(255,255,255,0.28);
                    text-transform: uppercase;
                    font-weight: 600;
                }

                .nav-item {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    padding: 9px 12px;
                    border-radius: 8px;
                    font-size: 0.85rem;
                    font-weight: 500;
                    color: rgba(255,255,255,0.5);
                    transition: all 0.18s ease;
                    border: 1px solid transparent;
                    text-decoration: none;
                    letter-spacing: 0.01em;
                }

                .nav-item:hover {
                    background: var(--taskora-nav-hover);
                    color: rgba(255,255,255,0.9);
                    border-color: rgba(27,110,243,0.2);
                }

                .nav-item.active {
                    background: var(--taskora-nav-active);
                    color: #fff;
                    border-color: rgba(27,110,243,0.45);
                    box-shadow: 0 0 12px rgba(27,110,243,0.15);
                }

                .nav-item svg {
                    width: 15px;
                    height: 15px;
                    flex-shrink: 0;
                    opacity: 0.7;
                    transition: opacity 0.18s;
                }

                .nav-item:hover svg,
                .nav-item.active svg {
                    opacity: 1;
                    color: var(--taskora-blue-bright);
                }

                .nav-section-label {
                    font-family: 'Barlow Condensed', sans-serif;
                    font-size: 0.6rem;
                    letter-spacing: 0.2em;
                    color: rgba(255,255,255,0.2);
                    font-weight: 700;
                    text-transform: uppercase;
                    padding: 0 12px;
                    margin-bottom: 6px;
                    margin-top: 18px;
                }

                .taskora-header {
                    background: #fff;
                    border-bottom: 1px solid rgba(0,0,0,0.07);
                }

                .taskora-header-title {
                    font-family: 'Barlow Condensed', sans-serif;
                    font-weight: 700;
                    font-size: 1.1rem;
                    letter-spacing: 0.06em;
                    color: #0A0E1A;
                    text-transform: uppercase;
                }

                .logo-icon-wrap {
                    width: 34px;
                    height: 34px;
                    border-radius: 8px;
                    background: rgba(27,110,243,0.15);
                    border: 1px solid rgba(27,110,243,0.3);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    flex-shrink: 0;
                }

                .sidebar-divider {
                    height: 1px;
                    background: var(--taskora-sidebar-border);
                    margin: 16px 0;
                }
            `}</style>

            {/*
                suppressHydrationWarning on the root div is required because:
                - useAuth() returns null on the server (no user yet)
                - On the client, user/role is populated → nav items differ
                - This causes a server/client HTML mismatch → hydration error
                suppressHydrationWarning tells React to accept the client tree
                without throwing, and re-renders correctly on the client.
            */}
            <div
                className="min-h-screen flex"
                style={{ background: "#F4F6FA" }}
                suppressHydrationWarning
            >
                {/* ── Sidebar ── */}
                <aside
                    className="taskora-sidebar w-60 hidden md:flex md:flex-col flex-shrink-0"
                    style={{ minHeight: "100vh" }}
                >
                    {/* Logo */}
                    <div className="px-5 pt-6 pb-2">
                        <div className="flex items-center gap-3">
                            <div className="logo-icon-wrap">
                                <svg width="22" height="22" viewBox="0 0 100 120" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <circle cx="50" cy="18" r="14" stroke="#1B6EF3" strokeWidth="9" />
                                    <path d="M36 18 L18 50 L36 82 L64 82 L82 50 L64 18 Z" stroke="#1B6EF3" strokeWidth="9" fill="none" />
                                    <path d="M60 72 Q72 88 68 102" stroke="#1B6EF3" strokeWidth="7" strokeLinecap="round" fill="none" />
                                </svg>
                            </div>
                            <div>
                                <div className="taskora-logo-text">TASKORA</div>
                                <div className="taskora-tagline">Less Mess, More Success</div>
                            </div>
                        </div>
                    </div>

                    <div className="sidebar-divider mx-4" />

                    {/* Nav */}
                    <nav className="flex-1 px-3 pb-6 space-y-1 overflow-y-auto">
                        {workspaceItems.length > 0 && (
                            <>
                                <div className="nav-section-label">Workspace</div>
                                {workspaceItems.map((item) => {
                                    const Icon = item.icon;
                                    return (
                                        <Link
                                            key={item.href}
                                            href={item.href}
                                            className={`nav-item ${getActive(item.href, pathname) ? "active" : ""}`}
                                        >
                                            <Icon />
                                            {item.label}
                                        </Link>
                                    );
                                })}
                            </>
                        )}

                        {manageItems.length > 0 && (
                            <>
                                <div className="nav-section-label">Manage</div>
                                {manageItems.map((item) => {
                                    const Icon = item.icon;
                                    return (
                                        <Link
                                            key={item.href}
                                            href={item.href}
                                            className={`nav-item ${getActive(item.href, pathname) ? "active" : ""}`}
                                        >
                                            <Icon />
                                            {item.label}
                                        </Link>
                                    );
                                })}
                            </>
                        )}
                    </nav>

                    {/* Footer */}
                    <div
                        className="px-4 py-4 border-t"
                        style={{ borderColor: "var(--taskora-sidebar-border)" }}
                    >
                        <div className="taskora-tagline" style={{ textAlign: "center" }}>
                            © 2025 Taskora
                        </div>
                    </div>
                </aside>

                {/* ── Main content ── */}
                <div className="flex-1 flex flex-col min-w-0">
                    <header
                        className="taskora-header px-6 py-3 flex items-center gap-3"
                        style={{ minHeight: "52px" }}
                    >
                        <div
                            className="w-1 h-5 rounded-full"
                            style={{ background: "var(--taskora-blue)", opacity: 0.7 }}
                        />
                        <h2 className="taskora-header-title">{title}</h2>
                    </header>

                    <main className="flex-1 p-6 overflow-auto">{children}</main>
                </div>
            </div>
        </>
    );
}
