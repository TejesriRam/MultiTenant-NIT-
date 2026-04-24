"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import AppShell from "@/components/layout/AppShell";
import { useTrash, useRestoreTask, usePurgeTask } from "@/hooks/queries";
import { useAuth } from "@/contexts/AuthContext";
import { timeAgo, getInitials } from "@/lib/utils";
import { Trash2, RotateCcw, Flame, Loader2, ShieldAlert, FileX } from "lucide-react";
import { Task } from "@/types";

export default function TrashPage() {
    const router = useRouter();
    const { canPurgeTasks, canSeeAllTasks, isLoading: authLoading } = useAuth();
    const { data, isLoading, isError } = useTrash();
    const restore = useRestoreTask();
    const purge = usePurgeTask();

    const tasks: Task[] = Array.isArray(data) ? data : (data?.data ?? []);

    useEffect(() => {
        // no redirect — all authenticated members can access trash
    }, []);

    if (authLoading) return null;

    function handleRestore(id: string, title: string) {
        if (confirm(`Restore "${title}"?`)) restore.mutate(id);
    }

    function handlePurge(id: string, title: string) {
        if (confirm(`Permanently delete "${title}"? This cannot be undone.`)) purge.mutate(id);
    }

    return (
        <AppShell>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&family=DM+Mono:wght@400;500&display=swap');

                .trash-wrap { font-family: 'DM Sans', sans-serif; max-width: 840px; margin: 0 auto; }

                .trash-card {
                    background: #fff;
                    border: 1px solid #e8edf5;
                    border-radius: 20px;
                    padding: 18px 20px;
                    transition: box-shadow 0.2s ease, transform 0.2s ease, border-color 0.2s ease;
                    animation: cardIn 0.3s ease both;
                }
                .trash-card:hover {
                    box-shadow: 0 8px 28px rgba(15,23,58,0.08);
                    border-color: #c7d2e8;
                    transform: translateY(-1px);
                }
                @keyframes cardIn {
                    from { opacity: 0; transform: translateY(8px); }
                    to   { opacity: 1; transform: translateY(0); }
                }
                .trash-card:nth-child(1) { animation-delay: 0.04s }
                .trash-card:nth-child(2) { animation-delay: 0.08s }
                .trash-card:nth-child(3) { animation-delay: 0.12s }
                .trash-card:nth-child(4) { animation-delay: 0.16s }
                .trash-card:nth-child(n+5) { animation-delay: 0.20s }

                .btn-restore {
                    display: inline-flex; align-items: center; gap: 5px;
                    padding: 7px 14px; border-radius: 11px;
                    font-size: 12px; font-weight: 600; font-family: 'DM Sans', sans-serif;
                    background: #ecfdf5; color: #059669; border: 1.5px solid #6ee7b7;
                    cursor: pointer; white-space: nowrap;
                    transition: background 0.15s, box-shadow 0.15s, transform 0.15s;
                }
                .btn-restore:hover:not(:disabled) {
                    background: #d1fae5;
                    box-shadow: 0 3px 10px rgba(5,150,105,0.18);
                    transform: translateY(-1px);
                }
                .btn-restore:disabled { opacity: 0.5; cursor: not-allowed; }

                .btn-purge {
                    display: inline-flex; align-items: center; gap: 5px;
                    padding: 7px 14px; border-radius: 11px;
                    font-size: 12px; font-weight: 600; font-family: 'DM Sans', sans-serif;
                    background: transparent; color: #e11d48; border: 1.5px solid #fda4af;
                    cursor: pointer; white-space: nowrap;
                    transition: background 0.15s, box-shadow 0.15s, transform 0.15s;
                }
                .btn-purge:hover:not(:disabled) {
                    background: #fff1f2;
                    box-shadow: 0 3px 10px rgba(225,29,72,0.14);
                    transform: translateY(-1px);
                }
                .btn-purge:disabled { opacity: 0.5; cursor: not-allowed; }
            `}</style>

            <div className="trash-wrap">

                {/* ── Header ── */}
                <div style={{ marginBottom: 28 }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                            {/* Icon block */}
                            <div style={{
                                width: 44, height: 44, borderRadius: 13, flexShrink: 0,
                                background: "linear-gradient(145deg, #fff1f2, #ffe4e6)",
                                border: "1px solid #fecdd3",
                                display: "flex", alignItems: "center", justifyContent: "center",
                                boxShadow: "0 2px 8px rgba(225,29,72,0.10)",
                            }}>
                                <Trash2 style={{ width: 20, height: 20, color: "#e11d48" }} />
                            </div>

                            <div>
                                <h1 style={{
                                    margin: 0, fontSize: 22, fontWeight: 700,
                                    color: "#0f172a", letterSpacing: "-0.3px",
                                    fontFamily: "'DM Sans', sans-serif",
                                }}>
                                    Trash
                                </h1>
                                <p style={{ margin: 0, fontSize: 13, color: "#64748b", marginTop: 2 }}>
                                    Restore deleted tasks or remove permanently
                                </p>
                            </div>
                        </div>

                        {/* Count badge */}
                        {tasks.length > 0 && (
                            <div style={{
                                display: "inline-flex", alignItems: "center",
                                padding: "4px 12px", borderRadius: 20,
                                background: "#fef2f2", border: "1px solid #fecdd3",
                                fontSize: 11, fontWeight: 600, color: "#be123c",
                                fontFamily: "'DM Mono', monospace",
                            }}>
                                {tasks.length}&nbsp;{tasks.length === 1 ? "item" : "items"}
                            </div>
                        )}
                    </div>

                    {/* Divider */}
                    <div style={{
                        height: 1, marginTop: 20,
                        background: "linear-gradient(90deg, #e8edf5 0%, #f8fafc 100%)",
                    }} />
                </div>

                {/* ── Permission warning ── */}
                {!canPurgeTasks && (
                    <div style={{
                        display: "flex", alignItems: "flex-start", gap: 10,
                        padding: "12px 16px", borderRadius: 14, marginBottom: 24,
                        background: "#fffbeb", border: "1px solid #fde68a",
                    }}>
                        <ShieldAlert style={{ width: 15, height: 15, color: "#d97706", marginTop: 1.5, flexShrink: 0 }} />
                        <p style={{ fontSize: 12.5, color: "#78350f", margin: 0, lineHeight: 1.55 }}>
                            Only <strong>Owners</strong> and <strong>Admins</strong> can permanently purge tasks.
                            You can still restore them.
                        </p>
                    </div>
                )}

                {/* ── States ── */}
                {isLoading ? (
                    <div style={{ padding: "80px 0", display: "flex", justifyContent: "center" }}>
                        <Loader2 style={{ width: 24, height: 24, color: "#3b5bdb", animation: "spin 1s linear infinite" }} />
                    </div>

                ) : isError ? (
                    <div style={{ padding: "72px 0", textAlign: "center", fontSize: 13, color: "#94a3b8" }}>
                        Failed to load trash
                    </div>

                ) : tasks.length === 0 ? (

                    /* ── Empty State ── */
                    <div style={{
                        display: "flex", flexDirection: "column", alignItems: "center",
                        padding: "72px 24px", textAlign: "center",
                        background: "#fff", border: "1.5px dashed #e2e8f0", borderRadius: 24,
                    }}>
                        <div style={{
                            width: 68, height: 68, borderRadius: 22, marginBottom: 20,
                            background: "linear-gradient(145deg, #fef2f2, #fff1f2)",
                            border: "1px solid #fecdd3",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            boxShadow: "0 4px 14px rgba(225,29,72,0.08)",
                        }}>
                            <FileX style={{ width: 30, height: 30, color: "#f43f5e" }} />
                        </div>
                        <p style={{ fontSize: 15, fontWeight: 600, color: "#1e293b", margin: "0 0 6px" }}>
                            No deleted tasks
                        </p>
                        <p style={{ fontSize: 13, color: "#94a3b8", margin: 0, maxWidth: 260, lineHeight: 1.65 }}>
                            Tasks you delete will appear here. Restore them or purge permanently.
                        </p>
                    </div>

                ) : (

                    /* ── Task Cards ── */
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                        {tasks.map((task: Task) => (
                            <div key={task.id} className="trash-card">

                                {/* Row 1: icon + title + buttons */}
                                <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>

                                    {/* Trash icon */}
                                    <div style={{
                                        width: 34, height: 34, borderRadius: 10, flexShrink: 0,
                                        background: "#fef2f2", border: "1px solid #fecdd3",
                                        display: "flex", alignItems: "center", justifyContent: "center",
                                    }}>
                                        <Trash2 style={{ width: 14, height: 14, color: "#f43f5e" }} />
                                    </div>

                                    {/* Title + description */}
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <h3 style={{
                                            margin: 0, fontSize: 13.5, fontWeight: 600,
                                            color: "#94a3b8",
                                            textDecoration: "line-through",
                                            textDecorationColor: "#cbd5e1",
                                            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                                        }}>
                                            {task.title}
                                        </h3>

                                        {task.description && (
                                            <p style={{
                                                margin: "4px 0 0", fontSize: 12, color: "#b0bec5",
                                                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                                            }}>
                                                {task.description}
                                            </p>
                                        )}
                                    </div>

                                    {/* Action buttons */}
                                    <div style={{ display: "flex", gap: 7, flexShrink: 0, alignItems: "center" }}>
                                        <button
                                            className="btn-restore"
                                            onClick={() => handleRestore(task.id, task.title)}
                                            disabled={restore.isPending}
                                        >
                                            <RotateCcw style={{ width: 12, height: 12 }} />
                                            Restore
                                        </button>

                                        {canPurgeTasks && (
                                            <button
                                                className="btn-purge"
                                                onClick={() => handlePurge(task.id, task.title)}
                                                disabled={purge.isPending}
                                            >
                                                <Flame style={{ width: 12, height: 12 }} />
                                                Purge
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {/* Row 2: metadata */}
                                <div style={{
                                    display: "flex", alignItems: "center", flexWrap: "wrap", gap: 10,
                                    marginTop: 12, paddingTop: 10,
                                    borderTop: "1px solid #f1f5f9",
                                }}>
                                    {/* Creator */}
                                    <div style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                                        <div style={{
                                            width: 22, height: 22, borderRadius: 7,
                                            background: "#eff3ff", color: "#3b5bdb",
                                            fontSize: 9, fontWeight: 700,
                                            display: "flex", alignItems: "center", justifyContent: "center",
                                            fontFamily: "'DM Sans', sans-serif",
                                        }}>
                                            {getInitials(task.createdBy?.name ?? "?")}
                                        </div>
                                        <span style={{ fontSize: 12, color: "#64748b" }}>
                                            {task.createdBy?.name ?? "Unknown"}
                                        </span>
                                    </div>

                                    {/* Dot separator */}
                                    <span style={{ width: 3, height: 3, borderRadius: "50%", background: "#cbd5e1", display: "inline-block" }} />

                                    {/* Deleted timestamp */}
                                    {task.deletedAt && (
                                        <span style={{
                                            display: "inline-flex", alignItems: "center", gap: 4,
                                            padding: "2px 8px", borderRadius: 6,
                                            fontSize: 11, fontWeight: 500,
                                            fontFamily: "'DM Mono', monospace",
                                            background: "#fff1f2", color: "#be123c",
                                            border: "1px solid #fecdd3",
                                        }}>
                                            Deleted {timeAgo(task.deletedAt)}
                                        </span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </AppShell>
    );
}
