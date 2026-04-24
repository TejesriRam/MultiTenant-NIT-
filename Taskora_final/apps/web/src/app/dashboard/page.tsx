"use client";

import AppShell from "@/components/layout/AppShell";
import { useAuth } from "@/contexts/AuthContext";
import {
    useTasks,
    useMembers,
    useLogs,
} from "@/hooks/queries";

import {
    cn,
    formatRole,
    getRoleClass,
    getLogActionColor,
    formatLogAction,
    timeAgo,
    getInitials,
} from "@/lib/utils";

import {
    CheckSquare,
    Users,
    ScrollText,
    TrendingUp,
    Clock,
    CheckCircle2,
    Circle,
    Loader2,
    LogOut,
    ArrowUpRight,
    Sparkles,
    ListChecks,
    Activity,
} from "lucide-react";

import {
    Task,
    ActivityLog,
    Role,
} from "@/types";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { authApi } from "@/lib/api";

/* ── KPI Card ──────────────────────────────────────────────────────────────── */
function KpiCard({
    label,
    value,
    icon: Icon,
    gradient,
    iconBg,
    iconColor,
    trend,
}: {
    label: string;
    value: string | number;
    icon: React.ElementType;
    gradient: string;
    iconBg: string;
    iconColor: string;
    trend?: string;
}) {
    return (
        <div
            className="relative overflow-hidden rounded-2xl p-5 flex flex-col gap-3 group cursor-default"
            style={{
                background: "#fff",
                border: "1px solid rgba(15,23,42,0.07)",
                boxShadow: "0 1px 3px rgba(15,23,42,0.06), 0 4px 16px rgba(15,23,42,0.04)",
                transition: "box-shadow 0.2s ease, transform 0.2s ease",
            }}
            onMouseEnter={e => {
                (e.currentTarget as HTMLDivElement).style.boxShadow = "0 4px 12px rgba(15,23,42,0.1), 0 12px 32px rgba(15,23,42,0.08)";
                (e.currentTarget as HTMLDivElement).style.transform = "translateY(-1px)";
            }}
            onMouseLeave={e => {
                (e.currentTarget as HTMLDivElement).style.boxShadow = "0 1px 3px rgba(15,23,42,0.06), 0 4px 16px rgba(15,23,42,0.04)";
                (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)";
            }}
        >
            {/* gradient accent strip */}
            <div className="absolute inset-x-0 top-0 h-[2px] rounded-t-2xl" style={{ background: gradient }} />

            {/* top row */}
            <div className="flex items-start justify-between">
                <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ background: iconBg }}
                >
                    <Icon className="w-4.5 h-4.5" style={{ color: iconColor, width: 18, height: 18 }} />
                </div>
                <ArrowUpRight
                    className="w-3.5 h-3.5 opacity-0 group-hover:opacity-40 transition-opacity"
                    style={{ color: iconColor }}
                />
            </div>

            {/* value */}
            <div>
                <p
                    className="text-3xl font-black tracking-tight text-slate-900"
                    style={{ fontFamily: "'DM Sans', 'Barlow Condensed', sans-serif", lineHeight: 1 }}
                >
                    {value}
                </p>
                <p className="text-xs font-semibold uppercase tracking-widest mt-1.5" style={{ color: "#94A3B8", letterSpacing: "0.08em" }}>
                    {label}
                </p>
                {trend && (
                    <p className="text-xs mt-1 font-medium" style={{ color: iconColor }}>
                        {trend}
                    </p>
                )}
            </div>
        </div>
    );
}

/* ── Activity Tab Button ───────────────────────────────────────────────────── */
function TabBtn({
    active,
    onClick,
    children,
}: {
    active: boolean;
    onClick: () => void;
    children: React.ReactNode;
}) {
    return (
        <button
            onClick={onClick}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-all"
            style={{
                background: active ? "#0F172A" : "transparent",
                color: active ? "#fff" : "#94A3B8",
            }}
        >
            {children}
        </button>
    );
}

/* ── Main Page ─────────────────────────────────────────────────────────────── */
export default function DashboardPage() {
    const {
        user,
        canSeeAllTasks,
        canSeeLogs,
        canManageMembers,
        isLoading: authLoading,
    } = useAuth();

    const router = useRouter();
    const [loggingOut, setLoggingOut] = useState(false);
    const [activityTab, setActivityTab] = useState<"today" | "week" | "all">("all");

    useEffect(() => {
        if (!authLoading && (user?.role as string) === "MEMBER") {
            router.replace("/dashboard/member");
        }
    }, [authLoading, user, router]);

    async function handleLogout() {
        setLoggingOut(true);
        try {
            await authApi.logout();
        } catch {
            // proceed even if logout API fails
        } finally {
            localStorage.removeItem("tf_token");
            localStorage.removeItem("tf_user");
            localStorage.removeItem("tf_org_id");
            router.replace("/login");
        }
    }

    const tasksQuery = useTasks({ limit: 100 });
    const logsQuery = useLogs({ limit: 20 });

    const loading = tasksQuery.isLoading || logsQuery.isLoading;

    const tasks = tasksQuery.data?.data ?? [];
    const members: any[] = [];
    const allLogs: ActivityLog[] = logsQuery.data?.data ?? [];

    const todoCount = tasks.filter((t: Task) => t.status === "TODO").length;
    const inProgressCount = tasks.filter((t: Task) => t.status === "IN_PROGRESS").length;
    const doneCount = tasks.filter((t: Task) => t.status === "DONE").length;
    const myTasks = tasks.filter((t: Task) => t.createdById === user?.id);

    const userRole = (user?.role ?? "OWNER") as Role;

    // Filter logs by tab
    const now = new Date();
    const filteredLogs = allLogs.filter((log) => {
        if (activityTab === "all") return true;
        const d = new Date(log.createdAt);
        if (activityTab === "today") {
            return d.toDateString() === now.toDateString();
        }
        if (activityTab === "week") {
            const weekAgo = new Date(now);
            weekAgo.setDate(now.getDate() - 7);
            return d >= weekAgo;
        }
        return true;
    }).slice(0, 8);

    // Progress percentages
    const pct = (n: number) =>
        tasks.length > 0 ? Math.round((n / tasks.length) * 100) : 0;

    if (loading) {
        return (
            <AppShell>
                <div className="py-24 flex justify-center">
                    <Loader2 className="w-5 h-5 animate-spin" style={{ color: "#3B82F6" }} />
                </div>
            </AppShell>
        );
    }

    return (
        <AppShell>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800;900&display=swap');
                * { font-family: 'DM Sans', system-ui, sans-serif; }
                .dash-card {
                    background: #fff;
                    border: 1px solid rgba(15,23,42,0.07);
                    box-shadow: 0 1px 3px rgba(15,23,42,0.05), 0 4px 16px rgba(15,23,42,0.03);
                    border-radius: 18px;
                }
                .section-label {
                    font-size: 0.7rem;
                    font-weight: 700;
                    letter-spacing: 0.1em;
                    text-transform: uppercase;
                    color: #94A3B8;
                }
                .bar-rail {
                    height: 7px;
                    background: #F1F5F9;
                    border-radius: 99px;
                    overflow: hidden;
                }
                .bar-fill {
                    height: 100%;
                    border-radius: 99px;
                    transition: width 0.7s cubic-bezier(0.4,0,0.2,1);
                }
                .log-chip {
                    width: 30px;
                    height: 30px;
                    border-radius: 9px;
                    background: #EFF6FF;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 10px;
                    font-weight: 800;
                    color: #3B82F6;
                    flex-shrink: 0;
                }
                .hero-card {
                    background: linear-gradient(135deg, #0A0F1E 0%, #0D1730 60%, #0A1628 100%);
                    border: 1px solid rgba(59,130,246,0.15);
                    box-shadow: 0 8px 32px rgba(10,15,30,0.3), inset 0 1px 0 rgba(255,255,255,0.04);
                    border-radius: 20px;
                    position: relative;
                    overflow: hidden;
                }
                .hero-card::before {
                    content: '';
                    position: absolute;
                    top: -60px;
                    right: -40px;
                    width: 200px;
                    height: 200px;
                    background: radial-gradient(circle, rgba(59,130,246,0.12) 0%, transparent 70%);
                    pointer-events: none;
                }
                .hero-card::after {
                    content: '';
                    position: absolute;
                    bottom: -40px;
                    left: 30%;
                    width: 160px;
                    height: 160px;
                    background: radial-gradient(circle, rgba(99,102,241,0.08) 0%, transparent 70%);
                    pointer-events: none;
                }
                .logout-btn {
                    background: rgba(255,255,255,0.06);
                    border: 1px solid rgba(255,255,255,0.1);
                    color: rgba(255,255,255,0.5);
                    transition: all 0.15s ease;
                    border-radius: 10px;
                    padding: 8px 14px;
                    font-size: 13px;
                    display: flex;
                    align-items: center;
                    gap: 7px;
                    cursor: pointer;
                }
                .logout-btn:hover {
                    background: rgba(255,255,255,0.1);
                    color: #fff;
                    border-color: rgba(255,255,255,0.18);
                }
                .logout-btn:disabled { opacity: 0.5; }
                .pill-role {
                    font-size: 10px;
                    font-weight: 700;
                    letter-spacing: 0.1em;
                    text-transform: uppercase;
                    padding: 3px 9px;
                    border-radius: 6px;
                    background: rgba(59,130,246,0.18);
                    color: #93C5FD;
                    border: 1px solid rgba(59,130,246,0.25);
                }
            `}</style>

            <div className="space-y-5">

                {/* ── PAGE TITLE ──────────────────────────────────────────── */}
                <div>
                    <h1 className="text-xl font-bold text-slate-900" style={{ letterSpacing: "-0.01em" }}>
                        Dashboard
                    </h1>
                    <p className="text-sm text-slate-400 mt-0.5">
                        Manage tasks, progress and team activity
                    </p>
                </div>

                {/* ── HERO CARD ────────────────────────────────────────────── */}
                <div className="hero-card px-6 py-5">
                    <div className="relative z-10 flex items-start justify-between">
                        <div>
                            {/* Welcome line */}
                            <div className="flex items-center gap-2 mb-1">
                                <Sparkles className="w-4 h-4" style={{ color: "#FCD34D" }} />
                                <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.35)" }}>
                                    Welcome back
                                </span>
                            </div>

                            <h2
                                className="text-2xl font-black text-white"
                                style={{ letterSpacing: "-0.02em", lineHeight: 1.15 }}
                            >
                                {user?.name?.split(" ")[0]} 👋
                            </h2>

                            {/* today summary */}
                            <p className="text-sm mt-2" style={{ color: "rgba(255,255,255,0.45)" }}>
                                <span style={{ color: "rgba(255,255,255,0.75)" }} className="font-semibold">
                                    {canSeeAllTasks ? tasks.length : myTasks.length}
                                </span>{" "}tasks
                                {" · "}
                                <span style={{ color: "#FCD34D" }} className="font-semibold">
                                    {inProgressCount}
                                </span>{" "}in progress
                                {" · "}
                                <span style={{ color: "#34D399" }} className="font-semibold">
                                    {doneCount}
                                </span>{" "}completed
                            </p>

                            {/* org + role */}
                            <div className="flex items-center gap-2 mt-3">
                                <span className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>
                                    {user?.organizationName}
                                </span>
                                <span style={{ color: "rgba(255,255,255,0.15)" }}>·</span>
                                <span className="pill-role">{formatRole(userRole)}</span>
                            </div>
                        </div>

                        {/* Logout */}
                        <button
                            className="logout-btn"
                            onClick={handleLogout}
                            disabled={loggingOut}
                        >
                            {loggingOut ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <LogOut className="w-4 h-4" />
                            )}
                            {loggingOut ? "Signing out…" : "Logout"}
                        </button>
                    </div>
                </div>

                {/* ── KPI CARDS ────────────────────────────────────────────── */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    <KpiCard
                        label={canSeeAllTasks ? "Total Tasks" : "My Tasks"}
                        value={canSeeAllTasks ? tasks.length : myTasks.length}
                        icon={ListChecks}
                        gradient="linear-gradient(90deg,#3B82F6,#6366F1)"
                        iconBg="#EFF6FF"
                        iconColor="#3B82F6"
                        trend={tasks.length > 0 ? `${pct(doneCount)}% done` : undefined}
                    />
                    <KpiCard
                        label="In Progress"
                        value={inProgressCount}
                        icon={TrendingUp}
                        gradient="linear-gradient(90deg,#F59E0B,#F97316)"
                        iconBg="#FFFBEB"
                        iconColor="#F59E0B"
                        trend={inProgressCount > 0 ? "Active now" : "None active"}
                    />
                    <KpiCard
                        label="Completed"
                        value={doneCount}
                        icon={CheckCircle2}
                        gradient="linear-gradient(90deg,#10B981,#06B6D4)"
                        iconBg="#F0FDF4"
                        iconColor="#10B981"
                        trend={doneCount > 0 ? `${pct(doneCount)}% of total` : undefined}
                    />
                    <KpiCard
                        label={canManageMembers ? "Members" : "To Do"}
                        value={canManageMembers ? members.length : todoCount}
                        icon={canManageMembers ? Users : Circle}
                        gradient="linear-gradient(90deg,#8B5CF6,#EC4899)"
                        iconBg="#F5F3FF"
                        iconColor="#8B5CF6"
                        trend={!canManageMembers && todoCount > 0 ? "Pending tasks" : undefined}
                    />
                </div>

                {/* ── LOWER GRID ───────────────────────────────────────────── */}
                <div className="grid lg:grid-cols-2 gap-4">

                    {/* Task Breakdown */}
                    <div className="dash-card p-6">
                        <div className="flex items-center gap-2 mb-5">
                            <Activity className="w-4 h-4 text-slate-400" />
                            <span className="section-label">Task Breakdown</span>
                        </div>

                        {tasks.length === 0 ? (
                            <p className="text-sm text-slate-400 text-center py-6">No tasks yet</p>
                        ) : (
                            <div className="space-y-5">
                                {[
                                    {
                                        label: "To Do",
                                        count: todoCount,
                                        color: "#64748B",
                                        fill: "linear-gradient(90deg,#94A3B8,#64748B)",
                                        bg: "#F8FAFC",
                                    },
                                    {
                                        label: "In Progress",
                                        count: inProgressCount,
                                        color: "#F59E0B",
                                        fill: "linear-gradient(90deg,#FCD34D,#F59E0B)",
                                        bg: "#FFFBEB",
                                    },
                                    {
                                        label: "Done",
                                        count: doneCount,
                                        color: "#10B981",
                                        fill: "linear-gradient(90deg,#34D399,#10B981)",
                                        bg: "#F0FDF4",
                                    },
                                ].map((item) => {
                                    const percent = pct(item.count);
                                    return (
                                        <div key={item.label}>
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="flex items-center gap-2">
                                                    <div
                                                        className="w-2 h-2 rounded-full"
                                                        style={{ background: item.color }}
                                                    />
                                                    <span className="text-sm font-medium text-slate-700">
                                                        {item.label}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span
                                                        className="text-xs font-bold px-2 py-0.5 rounded-md"
                                                        style={{ background: item.bg, color: item.color }}
                                                    >
                                                        {item.count}
                                                    </span>
                                                    <span className="text-xs font-semibold w-8 text-right" style={{ color: "#CBD5E1" }}>
                                                        {percent}%
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="bar-rail">
                                                <div
                                                    className="bar-fill"
                                                    style={{
                                                        background: item.fill,
                                                        width: `${percent}%`,
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Activity / My Tasks */}
                    <div className="dash-card p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                {canSeeLogs ? (
                                    <ScrollText className="w-4 h-4 text-slate-400" />
                                ) : (
                                    <Clock className="w-4 h-4 text-slate-400" />
                                )}
                                <span className="section-label">
                                    {canSeeLogs ? "Recent Activity" : "My Recent Tasks"}
                                </span>
                            </div>

                            {/* Tabs — only shown for logs */}
                            {canSeeLogs && (
                                <div
                                    className="flex items-center gap-0.5 p-0.5 rounded-xl"
                                    style={{ background: "#F1F5F9" }}
                                >
                                    {(["today", "week", "all"] as const).map((tab) => (
                                        <TabBtn
                                            key={tab}
                                            active={activityTab === tab}
                                            onClick={() => setActivityTab(tab)}
                                        >
                                            {tab.charAt(0).toUpperCase() + tab.slice(1)}
                                        </TabBtn>
                                    ))}
                                </div>
                            )}
                        </div>

                        {canSeeLogs ? (
                            filteredLogs.length === 0 ? (
                                <div className="py-8 text-center">
                                    <p className="text-sm text-slate-400">No activity in this period</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {filteredLogs.map((log: ActivityLog) => (
                                        <div key={log.id} className="flex gap-3 items-start py-1">
                                            <div className="log-chip">
                                                {getInitials(log.actorName || "?")}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm leading-snug text-slate-800">
                                                    <span className="font-semibold">{log.actorName}</span>
                                                    {" "}
                                                    <span className={cn("font-medium", getLogActionColor(log.action))}>
                                                        {formatLogAction(log.action).toLowerCase()}
                                                    </span>
                                                </p>
                                                <p className="text-xs mt-0.5 font-medium" style={{ color: "#CBD5E1" }}>
                                                    {timeAgo(log.createdAt)}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )
                        ) : myTasks.length === 0 ? (
                            <div className="py-8 text-center">
                                <p className="text-sm text-slate-400">No tasks yet</p>
                            </div>
                        ) : (
                            <div className="space-y-1">
                                {myTasks.slice(0, 6).map((task: Task) => (
                                    <div
                                        key={task.id}
                                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors"
                                        style={{ cursor: "default" }}
                                        onMouseEnter={e => {
                                            (e.currentTarget as HTMLDivElement).style.background = "#F8FAFC";
                                        }}
                                        onMouseLeave={e => {
                                            (e.currentTarget as HTMLDivElement).style.background = "transparent";
                                        }}
                                    >
                                        <div
                                            className="w-2 h-2 rounded-full flex-shrink-0"
                                            style={{
                                                background:
                                                    task.status === "DONE"
                                                        ? "#10B981"
                                                        : task.status === "IN_PROGRESS"
                                                            ? "#F59E0B"
                                                            : "#CBD5E1",
                                            }}
                                        />
                                        <p
                                            className={cn(
                                                "text-sm flex-1 truncate",
                                                task.status === "DONE"
                                                    ? "line-through text-slate-400"
                                                    : "text-slate-700 font-medium"
                                            )}
                                        >
                                            {task.title}
                                        </p>
                                        <span
                                            className="text-xs font-semibold px-2 py-0.5 rounded-md flex-shrink-0"
                                            style={{
                                                background:
                                                    task.status === "DONE"
                                                        ? "#F0FDF4"
                                                        : task.status === "IN_PROGRESS"
                                                            ? "#FFFBEB"
                                                            : "#F8FAFC",
                                                color:
                                                    task.status === "DONE"
                                                        ? "#10B981"
                                                        : task.status === "IN_PROGRESS"
                                                            ? "#F59E0B"
                                                            : "#94A3B8",
                                            }}
                                        >
                                            {task.status === "IN_PROGRESS"
                                                ? "Active"
                                                : task.status === "DONE"
                                                    ? "Done"
                                                    : "To Do"}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AppShell>
    );
}
