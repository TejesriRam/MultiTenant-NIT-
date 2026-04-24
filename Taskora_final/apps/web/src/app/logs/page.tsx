"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import AppShell from "@/components/layout/AppShell";
import { useLogs } from "@/hooks/queries";
import { useAuth } from "@/contexts/AuthContext";
import { cn, formatLogAction, getLogActionColor, getInitials, timeAgo } from "@/lib/utils";
import { ActivityLog, LogAction } from "@/types";
import { ScrollText, Loader2, Activity, RefreshCw } from "lucide-react";

/* ─────────────────────────────────────────────
   ACTION METADATA  (icons + semantic colours)
───────────────────────────────────────────── */
const ACTION_ICONS: Record<LogAction, string> = {
    TASK_CREATED: "✦",
    TASK_UPDATED: "✎",
    TASK_DELETED: "✗",
    TASK_RESTORED: "↩",
    MEMBER_ADDED: "+",
    ROLE_UPDATED: "⇄",
    MEMBER_REMOVED: "−",
};

const ACTION_COLORS: Record<LogAction, { bg: string; color: string; ring: string }> = {
    TASK_CREATED: { bg: "#ECFDF5", color: "#059669", ring: "#A7F3D0" },
    TASK_UPDATED: { bg: "#EFF6FF", color: "#2563EB", ring: "#BFDBFE" },
    TASK_DELETED: { bg: "#FFF1F2", color: "#E11D48", ring: "#FECDD3" },
    TASK_RESTORED: { bg: "#ECFDF5", color: "#047857", ring: "#6EE7B7" },
    MEMBER_ADDED: { bg: "#F0FDF4", color: "#16A34A", ring: "#BBF7D0" },
    ROLE_UPDATED: { bg: "#FFFBEB", color: "#D97706", ring: "#FDE68A" },
    MEMBER_REMOVED: { bg: "#FFF1F2", color: "#BE123C", ring: "#FECDD3" },
};

/* ─────────────────────────────────────────────
   LOG ROW
───────────────────────────────────────────── */
function LogRow({ log, index }: { log: ActivityLog; index: number }) {
    const actor = log.actorName || "Unknown User";
    const actionMeta = ACTION_COLORS[log.action] ?? { bg: "#F8FAFC", color: "#64748B", ring: "#E2E8F0" };

    return (
        <div
            className="log-row flex items-start gap-4 px-5 py-4 border-b last:border-0 group"
            style={{ borderColor: "#F1F5F9", animationDelay: `${index * 40}ms` }}
        >
            {/* Action icon bubble */}
            <div
                className="log-icon w-9 h-9 rounded-xl flex items-center justify-center text-[13px] font-bold flex-shrink-0 mt-0.5 transition-transform duration-200 group-hover:scale-110"
                style={{
                    background: actionMeta.bg,
                    color: actionMeta.color,
                    border: `1.5px solid ${actionMeta.ring}`,
                    boxShadow: `0 1px 3px ${actionMeta.ring}55`,
                }}
            >
                {ACTION_ICONS[log.action] ?? "•"}
            </div>

            {/* Main content */}
            <div className="flex-1 min-w-0">
                {/* Primary line */}
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    {/* Actor avatar */}
                    <div
                        className="w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0"
                        style={{ background: "#EEF3FF", border: "1px solid #C7D9FF" }}
                    >
                        <span className="text-[8px] font-bold" style={{ color: "#1B6EF3" }}>
                            {getInitials(actor)}
                        </span>
                    </div>

                    <span className="text-[13.5px] font-semibold text-slate-800 leading-snug">
                        {actor}
                    </span>

                    <span
                        className="text-[13px] font-medium leading-snug"
                        style={{ color: actionMeta.color }}
                    >
                        {formatLogAction(log.action).toLowerCase()}
                    </span>

                    {/* Entity type pill */}
                    <span
                        className="text-[11px] px-2 py-0.5 rounded-full font-medium leading-none"
                        style={{ background: "#F1F5F9", color: "#64748B", border: "1px solid #E2E8F0" }}
                    >
                        {log.entityType.toLowerCase()}
                    </span>
                </div>

                {/* Metadata tags */}
                {log.metadata && Object.keys(log.metadata).length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                        {Object.entries(log.metadata).slice(0, 3).map(([k, v]) => (
                            <span
                                key={k}
                                className="inline-flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-lg font-medium"
                                style={{ background: "#F8FAFC", border: "1px solid #E8EDF4", color: "#64748B" }}
                            >
                                <span style={{ color: "#94A3B8" }}>{k}</span>
                                <span style={{ color: "#0F172A" }}>{String(v)}</span>
                            </span>
                        ))}
                    </div>
                )}
            </div>

            {/* Timestamp */}
            <span
                className="text-[11.5px] flex-shrink-0 mt-1 font-medium tabular-nums"
                style={{ color: "#94A3B8" }}
            >
                {timeAgo(log.createdAt)}
            </span>
        </div>
    );
}

/* ─────────────────────────────────────────────
   EMPTY STATE
───────────────────────────────────────────── */
function EmptyState() {
    return (
        <div className="py-20 flex flex-col items-center text-center px-6">
            <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5"
                style={{
                    background: "linear-gradient(135deg, #EEF3FF 0%, #E0EAFF 100%)",
                    border: "1.5px solid #C7D9FF",
                    boxShadow: "0 4px 16px rgba(27,110,243,0.08)",
                }}
            >
                <ScrollText className="w-7 h-7" style={{ color: "#1B6EF3" }} />
            </div>
            <p className="font-semibold text-slate-700 text-[15px]">No activity yet</p>
            <p className="text-sm text-slate-400 mt-1.5 max-w-xs leading-relaxed">
                Logs will appear here as your team creates, updates, and manages tasks.
            </p>
        </div>
    );
}

/* ─────────────────────────────────────────────
   MAIN PAGE
───────────────────────────────────────────── */
export default function LogsPage() {
    const router = useRouter();
    const { canSeeLogs, isLoading: authLoading } = useAuth();
    const { data, isLoading, isError, refetch, isFetching } = useLogs({ page: 1, limit: 50 });

    // Backend returns: { data: ActivityLog[], total: number }
    // Guard against both paginated shape AND flat array (defensive)
    const logs: ActivityLog[] = Array.isArray(data) ? data : (data?.data ?? []);
    const total: number = Array.isArray(data) ? data.length : (data?.total ?? 0);

    useEffect(() => {
        if (!authLoading && !canSeeLogs) {
            router.replace("/dashboard");
        }
    }, [authLoading, canSeeLogs, router]);

    if (authLoading || !canSeeLogs) return null;

    return (
        <AppShell>
            {/* ── Scoped styles ── */}
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Barlow:wght@400;500;600;700&family=Barlow+Condensed:wght@600;700&display=swap');

                @keyframes rowIn {
                    from { opacity: 0; transform: translateY(6px); }
                    to   { opacity: 1; transform: translateY(0);   }
                }
                .log-row {
                    animation: rowIn 0.28s ease both;
                    transition: background 0.15s ease;
                }
                .log-row:hover { background: #FAFBFF; }

                .refresh-btn:not(:disabled):hover .refresh-icon { transform: rotate(45deg); }
                .refresh-icon { transition: transform 0.3s ease; }
                .refresh-btn.is-fetching .refresh-icon {
                    animation: spin 0.7s linear infinite;
                }
                @keyframes spin { to { transform: rotate(360deg); } }

                .legend-chip {
                    transition: transform 0.15s ease, box-shadow 0.15s ease;
                    cursor: default;
                }
                .legend-chip:hover {
                    transform: translateY(-1px);
                    box-shadow: 0 3px 8px rgba(0,0,0,0.08);
                }

                @keyframes pageIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to   { opacity: 1; transform: translateY(0);    }
                }
                .logs-page-root {
                    animation: pageIn 0.35s ease both;
                    font-family: 'Barlow', sans-serif;
                }
            `}</style>

            <div className="logs-page-root space-y-6">

                {/* ══ HEADER ══════════════════════════════════════════ */}
                <div className="flex items-start justify-between gap-4 flex-wrap">

                    {/* Left: title block */}
                    <div className="flex items-center gap-3.5">
                        <div
                            className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0"
                            style={{
                                background: "linear-gradient(135deg, #1B6EF3 0%, #0E47C9 100%)",
                                boxShadow: "0 4px 14px rgba(27,110,243,0.35)",
                            }}
                        >
                            <Activity className="w-5 h-5 text-white" />
                        </div>

                        <div>
                            <h1
                                className="text-[1.35rem] font-bold leading-tight"
                                style={{
                                    fontFamily: "'Barlow Condensed', sans-serif",
                                    letterSpacing: "0.05em",
                                    color: "#0A0E1A",
                                }}
                            >
                                Activity Logs
                            </h1>
                            <p
                                className="text-[12.5px] mt-0.5 font-medium"
                                style={{ color: "#94A3B8" }}
                            >
                                Organization audit trail · read-only
                            </p>
                        </div>
                    </div>

                    {/* Right: count badge + refresh */}
                    <div className="flex items-center gap-2.5">
                        {/* Event count badge */}
                        <div
                            className="flex items-center gap-2 px-3.5 py-2 rounded-xl"
                            style={{
                                background: "#EEF3FF",
                                border: "1px solid #C7D9FF",
                                boxShadow: "0 1px 4px rgba(27,110,243,0.08)",
                            }}
                        >
                            <span
                                className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                                style={{ background: "#1B6EF3" }}
                            />
                            <span
                                className="text-[12.5px] font-bold tabular-nums"
                                style={{ color: "#1B6EF3", fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "0.04em" }}
                            >
                                {total}
                            </span>
                            <span className="text-[11.5px] font-semibold" style={{ color: "#6B9FFF" }}>
                                event{total !== 1 ? "s" : ""}
                            </span>
                        </div>

                        {/* Refresh button */}
                        <button
                            onClick={() => refetch()}
                            disabled={isFetching}
                            title="Refresh logs"
                            className={cn(
                                "refresh-btn w-9 h-9 rounded-xl flex items-center justify-center",
                                "border transition-colors duration-150 disabled:opacity-40",
                                "hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400",
                                isFetching && "is-fetching"
                            )}
                            style={{ borderColor: "#E2E8F0", background: "#fff" }}
                        >
                            <RefreshCw className="refresh-icon w-4 h-4" style={{ color: "#64748B" }} />
                        </button>
                    </div>
                </div>

                {/* ══ LEGEND CHIPS ════════════════════════════════════ */}
                <div
                    className="flex flex-wrap gap-2 p-4 rounded-2xl"
                    style={{ background: "#FAFBFF", border: "1px solid #EEF2FB" }}
                >
                    {(Object.keys(ACTION_ICONS) as LogAction[]).map((action) => {
                        const meta = ACTION_COLORS[action] ?? { bg: "#F8FAFC", color: "#64748B", ring: "#E2E8F0" };
                        return (
                            <span
                                key={action}
                                className="legend-chip inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11.5px] font-semibold select-none"
                                style={{
                                    background: meta.bg,
                                    color: meta.color,
                                    border: `1px solid ${meta.ring}`,
                                    fontFamily: "'Barlow', sans-serif",
                                    letterSpacing: "0.01em",
                                }}
                            >
                                <span className="text-[12px]">{ACTION_ICONS[action]}</span>
                                {formatLogAction(action)}
                            </span>
                        );
                    })}
                </div>

                {/* ══ LOG CONTAINER ═══════════════════════════════════ */}
                <div
                    className="rounded-2xl overflow-hidden"
                    style={{
                        background: "#fff",
                        border: "1px solid #E8EDF5",
                        boxShadow: "0 2px 12px rgba(15,23,42,0.06), 0 1px 3px rgba(15,23,42,0.04)",
                    }}
                >
                    {/* Column header bar */}
                    <div
                        className="hidden sm:flex items-center gap-4 px-5 py-2.5 border-b"
                        style={{ background: "#F8FAFC", borderColor: "#EEF2F7" }}
                    >
                        <div className="w-9 flex-shrink-0" />
                        <span
                            className="flex-1 text-[11px] font-bold uppercase tracking-widest"
                            style={{ color: "#94A3B8", fontFamily: "'Barlow Condensed', sans-serif" }}
                        >
                            Actor · Action · Entity
                        </span>
                        <span
                            className="text-[11px] font-bold uppercase tracking-widest flex-shrink-0"
                            style={{ color: "#94A3B8", fontFamily: "'Barlow Condensed', sans-serif" }}
                        >
                            When
                        </span>
                    </div>

                    {/* Body states */}
                    {isLoading ? (
                        <div className="py-16 flex flex-col items-center gap-3">
                            <Loader2 className="w-6 h-6 animate-spin" style={{ color: "#1B6EF3" }} />
                            <span className="text-[12.5px] font-medium" style={{ color: "#94A3B8" }}>
                                Loading logs…
                            </span>
                        </div>
                    ) : isError ? (
                        <div className="py-16 text-center space-y-4">
                            <div
                                className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto"
                                style={{ background: "#FFF1F2", border: "1.5px solid #FECDD3" }}
                            >
                                <span className="text-lg" style={{ color: "#E11D48" }}>✗</span>
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-slate-700">Failed to load logs</p>
                                <p className="text-xs text-slate-400 mt-1">Check your connection and try again.</p>
                            </div>
                            <button
                                onClick={() => refetch()}
                                className="inline-flex items-center gap-2 text-xs px-4 py-2 rounded-xl font-semibold transition hover:bg-slate-50"
                                style={{ border: "1px solid #E2E8F0", color: "#475569" }}
                            >
                                <RefreshCw className="w-3.5 h-3.5" />
                                Try again
                            </button>
                        </div>
                    ) : logs.length === 0 ? (
                        <EmptyState />
                    ) : (
                        <div>
                            {logs.map((log: ActivityLog, i: number) => (
                                <LogRow key={log.id} log={log} index={i} />
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer count */}
                {logs.length > 0 && (
                    <p
                        className="text-center text-[11.5px] font-medium pb-2"
                        style={{ color: "#CBD5E1" }}
                    >
                        Showing {logs.length} of {total} event{total !== 1 ? "s" : ""}
                    </p>
                )}

            </div>
        </AppShell>
    );
}
