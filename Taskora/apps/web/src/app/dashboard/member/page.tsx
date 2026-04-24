"use client";

import AppShell from "@/components/layout/AppShell";
import { useAuth } from "@/contexts/AuthContext";
import { useTasks, useLogs } from "@/hooks/queries";
import { cn, getLogActionColor, formatLogAction, timeAgo } from "@/lib/utils";
import {
    CheckSquare,
    Clock,
    CheckCircle2,
    TrendingUp,
    Circle,
    Loader2,
    LogOut,
    ListTodo,
    Flame,
    Star,
    ClipboardList,
    Target,
    Zap,
} from "lucide-react";
import { Task, ActivityLog } from "@/types";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { authApi } from "@/lib/api";

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({
    label,
    sublabel,
    value,
    icon: Icon,
    topColor,
    iconBg,
    iconColor,
    valueColor,
}: {
    label: string;
    sublabel: string;
    value: string | number;
    icon: React.ElementType;
    topColor: string;
    iconBg: string;
    iconColor: string;
    valueColor: string;
}) {
    return (
        <div
            className="group relative overflow-hidden rounded-2xl bg-white border border-slate-200/80 flex flex-col gap-5 p-6 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-default"
            style={{ borderTop: `3px solid ${topColor}` }}
        >
            <div className="absolute inset-0 bg-gradient-to-br from-white via-white to-slate-50/60 pointer-events-none" />

            <div className={cn("relative w-11 h-11 rounded-xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110", iconBg)}>
                <Icon className={cn("w-5 h-5", iconColor)} />
            </div>

            <div className="relative">
                <p className={cn("text-4xl font-bold tracking-tight tabular-nums", valueColor)}>
                    {value}
                </p>
                <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-500 mt-1.5">
                    {label}
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">{sublabel}</p>
            </div>
        </div>
    );
}

// ─── Task Item ────────────────────────────────────────────────────────────────

const statusConfig: Record<string, { label: string; dot: string; badge: string }> = {
    TODO: {
        label: "To Do",
        dot: "bg-slate-300",
        badge: "bg-slate-100 text-slate-600 border border-slate-200",
    },
    IN_PROGRESS: {
        label: "In Progress",
        dot: "bg-amber-400",
        badge: "bg-amber-50 text-amber-700 border border-amber-200",
    },
    DONE: {
        label: "Done",
        dot: "bg-emerald-400",
        badge: "bg-emerald-50 text-emerald-700 border border-emerald-200",
    },
};

function TaskItem({ task }: { task: Task }) {
    const cfg = statusConfig[task.status] ?? statusConfig.TODO;
    return (
        <div className="group/row flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-slate-50 transition-colors duration-150 -mx-3">
            <div className={cn("w-2 h-2 rounded-full flex-shrink-0", cfg.dot)} />
            <div className="flex-1 min-w-0">
                <p
                    className={cn(
                        "text-sm font-medium truncate transition-colors",
                        task.status === "DONE"
                            ? "line-through text-slate-400"
                            : "text-slate-700 group-hover/row:text-slate-900"
                    )}
                >
                    {task.title}
                </p>
                {task.description && (
                    <p className="text-xs text-slate-400 truncate mt-0.5">
                        {task.description}
                    </p>
                )}
            </div>
            <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0 uppercase tracking-wide", cfg.badge)}>
                {cfg.label}
            </span>
        </div>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function MemberDashboardPage() {
    const { user } = useAuth();
    const router = useRouter();
    const [loggingOut, setLoggingOut] = useState(false);

    async function handleLogout() {
        setLoggingOut(true);
        try {
            await authApi.logout();
        } catch {
            // proceed even if API call fails
        } finally {
            localStorage.removeItem("tf_token");
            localStorage.removeItem("tf_user");
            localStorage.removeItem("tf_org_id");
            router.replace("/login");
        }
    }

    // ── Data fetching — reuses existing hooks, no new API calls ───────────────
    const tasksQuery = useTasks({ limit: 100 });

    const tasks: Task[] = tasksQuery.data?.data ?? [];

    // Filter to only MY tasks (member scope)
    const myTasks = tasks.filter((t) => t.createdById === user?.id);

    const myTodo = myTasks.filter((t) => t.status === "TODO").length;
    const myInProgress = myTasks.filter((t) => t.status === "IN_PROGRESS").length;
    const myDone = myTasks.filter((t) => t.status === "DONE").length;

    const recentTasks = [...myTasks]
        .sort(
            (a, b) =>
                new Date(b.createdAt ?? 0).getTime() -
                new Date(a.createdAt ?? 0).getTime()
        )
        .slice(0, 8);

    const completionPct =
        myTasks.length > 0
            ? Math.round((myDone / myTasks.length) * 100)
            : 0;

    const R = 34;
    const circumference = 2 * Math.PI * R;

    if (tasksQuery.isLoading) {
        return (
            <AppShell>
                <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                    <p className="text-sm text-slate-400 font-medium">Loading your workspace…</p>
                </div>
            </AppShell>
        );
    }

    return (
        <AppShell>
            <div className="px-1 py-2 sm:px-2 space-y-6 max-w-6xl">

                {/* ── Hero Welcome Card ──────────────────────────────────────────── */}
                <div
                    className="relative overflow-hidden rounded-3xl px-8 py-7 shadow-xl"
                    style={{
                        background: "linear-gradient(135deg, #0c1527 0%, #0f2044 40%, #102a5c 70%, #0e3568 100%)",
                    }}
                >
                    {/* Glow orbs */}
                    <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full opacity-[0.12]"
                        style={{ background: "radial-gradient(circle, #3b82f6, transparent 65%)" }} />
                    <div className="absolute top-4 right-48 w-32 h-32 rounded-full opacity-[0.07]"
                        style={{ background: "radial-gradient(circle, #818cf8, transparent 65%)" }} />
                    <div className="absolute -bottom-12 left-1/4 w-40 h-40 rounded-full opacity-[0.06]"
                        style={{ background: "radial-gradient(circle, #60a5fa, transparent 65%)" }} />

                    {/* Dot grid */}
                    <div
                        className="absolute inset-0 opacity-[0.07]"
                        style={{
                            backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.8) 1px, transparent 1px)",
                            backgroundSize: "24px 24px",
                        }}
                    />

                    {/* Content */}
                    <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-5">
                        <div className="space-y-2">
                            <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight leading-none">
                                Hey, {user?.name?.split(" ")[0]} 👋
                            </h1>
                            <div className="flex items-center gap-2.5 flex-wrap">
                                <span className="text-sm text-blue-200/70 font-medium">
                                    {user?.organizationName}
                                </span>
                                <span className="text-blue-500/40 text-xs">•</span>
                                <span
                                    className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest"
                                    style={{
                                        background: "rgba(59,130,246,0.18)",
                                        color: "#93c5fd",
                                        border: "1px solid rgba(59,130,246,0.28)",
                                    }}
                                >
                                    <span className="w-1.5 h-1.5 rounded-full bg-blue-400 inline-block" />
                                    Member
                                </span>
                            </div>
                            <p className="text-sm text-blue-300/50 font-normal">
                                Stay focused and complete your assigned tasks.
                            </p>
                        </div>

                        <button
                            onClick={handleLogout}
                            disabled={loggingOut}
                            className="self-start sm:self-center flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 disabled:opacity-50 flex-shrink-0 hover:scale-[1.02] active:scale-[0.98]"
                            style={{
                                background: "rgba(255,255,255,0.07)",
                                color: "rgba(255,255,255,0.65)",
                                border: "1px solid rgba(255,255,255,0.10)",
                                backdropFilter: "blur(8px)",
                            }}
                            onMouseEnter={(e) => {
                                (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.13)";
                                (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,255,255,0.9)";
                            }}
                            onMouseLeave={(e) => {
                                (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.07)";
                                (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,255,255,0.65)";
                            }}
                        >
                            {loggingOut ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogOut className="w-4 h-4" />}
                            {loggingOut ? "Signing out…" : "Logout"}
                        </button>
                    </div>
                </div>

                {/* ── Stat Cards ─────────────────────────────────────────────────── */}
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                    <StatCard
                        label="My Tasks"
                        sublabel="Assigned now"
                        value={myTasks.length}
                        icon={CheckSquare}
                        topColor="#6366f1"
                        iconBg="bg-indigo-50"
                        iconColor="text-indigo-600"
                        valueColor="text-indigo-600"
                    />
                    <StatCard
                        label="To Do"
                        sublabel="Pending work"
                        value={myTodo}
                        icon={ListTodo}
                        topColor="#94a3b8"
                        iconBg="bg-slate-100"
                        iconColor="text-slate-500"
                        valueColor="text-slate-600"
                    />
                    <StatCard
                        label="In Progress"
                        sublabel="Currently active"
                        value={myInProgress}
                        icon={Flame}
                        topColor="#f59e0b"
                        iconBg="bg-amber-50"
                        iconColor="text-amber-600"
                        valueColor="text-amber-600"
                    />
                    <StatCard
                        label="Completed"
                        sublabel="Finished tasks"
                        value={myDone}
                        icon={CheckCircle2}
                        topColor="#10b981"
                        iconBg="bg-emerald-50"
                        iconColor="text-emerald-600"
                        valueColor="text-emerald-600"
                    />
                </div>

                {/* ── Lower Grid ─────────────────────────────────────────────────── */}
                <div className="grid lg:grid-cols-2 gap-5">

                    {/* ── Progress Card ───────────────────────────────────────────── */}
                    <div className="bg-white border border-slate-200/80 rounded-3xl p-7 shadow-sm space-y-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-xl font-semibold text-slate-800 tracking-tight">My Progress</h2>
                                <p className="text-xs text-slate-400 mt-0.5">Overall task completion</p>
                            </div>
                            <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center">
                                <TrendingUp className="w-4 h-4 text-blue-500" />
                            </div>
                        </div>

                        {myTasks.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-10 gap-3 text-center">
                                <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center">
                                    <Target className="w-6 h-6 text-slate-300" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-slate-500">No tasks assigned yet</p>
                                    <p className="text-xs text-slate-400 mt-0.5">Your progress will appear here</p>
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-center gap-7">
                                {/* Ring */}
                                <div className="relative flex-shrink-0 w-28 h-28">
                                    <svg className="w-28 h-28 -rotate-90" viewBox="0 0 88 88">
                                        <defs>
                                            <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                                                <stop offset="0%" stopColor="#3b82f6" />
                                                <stop offset="100%" stopColor="#6366f1" />
                                            </linearGradient>
                                        </defs>
                                        <circle cx="44" cy="44" r={R} fill="none" stroke="#f1f5f9" strokeWidth="7" />
                                        <circle
                                            cx="44" cy="44" r={R}
                                            fill="none"
                                            stroke="url(#ringGrad)"
                                            strokeWidth="7"
                                            strokeLinecap="round"
                                            strokeDasharray={circumference}
                                            strokeDashoffset={circumference * (1 - completionPct / 100)}
                                            style={{ transition: "stroke-dashoffset 0.8s cubic-bezier(0.4,0,0.2,1)" }}
                                        />
                                    </svg>
                                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                                        <span className="text-2xl font-bold text-slate-800 leading-none tabular-nums">
                                            {completionPct}%
                                        </span>
                                        <span className="text-[9px] text-slate-400 uppercase tracking-widest mt-1 font-semibold">
                                            done
                                        </span>
                                    </div>
                                </div>

                                {/* Bars */}
                                <div className="flex-1 space-y-4">
                                    {(
                                        [
                                            ["To Do", myTodo, "#94a3b8", "text-slate-500"],
                                            ["In Progress", myInProgress, "#f59e0b", "text-amber-500"],
                                            ["Done", myDone, "#10b981", "text-emerald-500"],
                                        ] as [string, number, string, string][]
                                    ).map(([label, count, color, textColor]) => (
                                        <div key={label}>
                                            <div className="flex justify-between items-center mb-1.5">
                                                <span className="text-xs font-medium text-slate-500">{label}</span>
                                                <span className={cn("text-xs font-bold tabular-nums", textColor)}>
                                                    {count}
                                                    <span className="text-slate-300 font-normal ml-0.5">/{myTasks.length}</span>
                                                </span>
                                            </div>
                                            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full rounded-full transition-all duration-700"
                                                    style={{
                                                        width: myTasks.length > 0
                                                            ? `${Math.round((count / myTasks.length) * 100)}%`
                                                            : "0%",
                                                        background: color,
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* ── Recent Tasks Card ────────────────────────────────────────── */}
                    <div className="bg-white border border-slate-200/80 rounded-3xl p-7 shadow-sm flex flex-col">
                        <div className="flex items-center justify-between mb-5">
                            <div>
                                <h2 className="text-xl font-semibold text-slate-800 tracking-tight">Recent Tasks</h2>
                                <p className="text-xs text-slate-400 mt-0.5">Your latest activity</p>
                            </div>
                            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 border border-blue-100">
                                <Clock className="w-3 h-3 text-blue-400" />
                                <span className="text-[10px] font-semibold text-blue-500 uppercase tracking-wide">Latest</span>
                            </div>
                        </div>

                        {recentTasks.length === 0 ? (
                            <div className="flex-1 flex flex-col items-center justify-center py-12 gap-4 text-center">
                                <div className="relative">
                                    <div className="w-16 h-16 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center">
                                        <ClipboardList className="w-7 h-7 text-slate-300" />
                                    </div>
                                    <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-blue-100 border-2 border-white flex items-center justify-center">
                                        <Zap className="w-2.5 h-2.5 text-blue-500" />
                                    </div>
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-slate-600">No tasks yet</p>
                                    <p className="text-xs text-slate-400 mt-1 max-w-[180px] mx-auto leading-relaxed">
                                        Tasks assigned to you will appear here
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-0.5">
                                {recentTasks.map((task) => (
                                    <TaskItem key={task.id} task={task} />
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AppShell>
    );
}