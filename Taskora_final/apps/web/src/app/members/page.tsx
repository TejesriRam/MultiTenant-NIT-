"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import AppShell from "@/components/layout/AppShell";
import {
    useMembers,
    useCreateMember,
    useAddMember,
    useUpdateMemberRole,
    useRemoveMember,
} from "@/hooks/queries";
import { useAuth } from "@/contexts/AuthContext";
import { Member, Role } from "@/types";
import { cn, formatRole, getRoleClass, getInitials, timeAgo } from "@/lib/utils";
import {
    UserPlus, MoreHorizontal, Loader2, ShieldCheck,
    Trash2, Crown, X, Search, Users, ChevronDown,
    Shield, User as UserIcon,
} from "lucide-react";

const ROLES: Role[] = ["ADMIN", "MEMBER"];

/* ─── Colour tokens ──────────────────────────────────────────────────────── */
const ROLE_STYLE: Record<string, { bg: string; color: string; border: string; dot: string }> = {
    OWNER: { bg: "#FFFBEB", color: "#B45309", border: "#FDE68A", dot: "#F59E0B" },
    ADMIN: { bg: "#EFF6FF", color: "#1D4ED8", border: "#BFDBFE", dot: "#3B82F6" },
    MEMBER: { bg: "#F8FAFC", color: "#475569", border: "#E2E8F0", dot: "#94A3B8" },
};

/* ─── Add Member Modal ───────────────────────────────────────────────────── */
function AddMemberModal({
    open,
    onClose,
    onSubmit,
}: {
    open: boolean;
    onClose: () => void;
    onSubmit: (name: string, email: string, password: string, role: Role) => Promise<void>;
}) {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [role, setRole] = useState<Role>("MEMBER");
    const [loading, setLoading] = useState(false);

    if (!open) return null;

    const canSubmit = name.trim() && email.trim() && password.trim();

    async function handleSubmit() {
        if (!canSubmit) return;
        setLoading(true);
        try {
            await onSubmit(name.trim(), email.trim(), password, role);
            setName("");
            setEmail("");
            setPassword("");
            setRole("MEMBER");
            onClose();
        } finally {
            setLoading(false);
        }
    }

    const inputStyle = {
        width: "100%", border: "1.5px solid #e2e8f0", borderRadius: 12,
        padding: "10px 14px", fontSize: 14, outline: "none",
        fontFamily: "'DM Sans', sans-serif", boxSizing: "border-box" as const,
        transition: "border-color 0.15s", color: "#0f172a",
    };

    return (
        <div style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
            <div
                style={{ position: "absolute", inset: 0, background: "rgba(10,14,36,0.55)", backdropFilter: "blur(6px)" }}
                onClick={onClose}
            />
            <div style={{
                position: "relative", width: "100%", maxWidth: 440,
                background: "#fff", borderRadius: 24, padding: 28,
                boxShadow: "0 32px 80px rgba(10,14,36,0.18)",
                border: "1px solid #e8edf5",
                animation: "modalIn 0.22s ease",
            }}>
                {/* Modal header */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{
                            width: 36, height: 36, borderRadius: 10,
                            background: "linear-gradient(135deg, #eff6ff, #dbeafe)",
                            border: "1px solid #bfdbfe",
                            display: "flex", alignItems: "center", justifyContent: "center",
                        }}>
                            <UserPlus style={{ width: 16, height: 16, color: "#2563eb" }} />
                        </div>
                        <div>
                            <h2 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "#0f172a", fontFamily: "'DM Sans', sans-serif" }}>
                                Create Member
                            </h2>
                            <p style={{ margin: 0, fontSize: 12, color: "#94a3b8", fontFamily: "'DM Sans', sans-serif" }}>
                                Create a new account for your team
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        style={{
                            width: 28, height: 28, borderRadius: 8, border: "1px solid #e2e8f0",
                            background: "#f8fafc", display: "flex", alignItems: "center",
                            justifyContent: "center", cursor: "pointer",
                        }}
                    >
                        <X style={{ width: 14, height: 14, color: "#64748b" }} />
                    </button>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    {/* Name */}
                    <div>
                        <label style={{ display: "block", fontSize: 11.5, fontWeight: 600, color: "#64748b", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.06em", fontFamily: "'DM Sans', sans-serif" }}>
                            Full Name
                        </label>
                        <input
                            type="text"
                            placeholder="Jane Smith"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            style={inputStyle}
                            onFocus={(e) => { e.target.style.borderColor = "#3b82f6"; }}
                            onBlur={(e) => { e.target.style.borderColor = "#e2e8f0"; }}
                        />
                    </div>

                    {/* Email */}
                    <div>
                        <label style={{ display: "block", fontSize: 11.5, fontWeight: 600, color: "#64748b", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.06em", fontFamily: "'DM Sans', sans-serif" }}>
                            Email Address
                        </label>
                        <input
                            type="email"
                            placeholder="jane@company.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            style={inputStyle}
                            onFocus={(e) => { e.target.style.borderColor = "#3b82f6"; }}
                            onBlur={(e) => { e.target.style.borderColor = "#e2e8f0"; }}
                        />
                    </div>

                    {/* Password */}
                    <div>
                        <label style={{ display: "block", fontSize: 11.5, fontWeight: 600, color: "#64748b", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.06em", fontFamily: "'DM Sans', sans-serif" }}>
                            Password
                        </label>
                        <input
                            type="password"
                            placeholder="Set a login password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                            style={inputStyle}
                            onFocus={(e) => { e.target.style.borderColor = "#3b82f6"; }}
                            onBlur={(e) => { e.target.style.borderColor = "#e2e8f0"; }}
                        />
                    </div>

                    {/* Role */}
                    <div>
                        <label style={{ display: "block", fontSize: 11.5, fontWeight: 600, color: "#64748b", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.06em", fontFamily: "'DM Sans', sans-serif" }}>
                            Role
                        </label>
                        <div style={{ display: "flex", gap: 8 }}>
                            {ROLES.map((r) => {
                                const rs = ROLE_STYLE[r];
                                const active = role === r;
                                return (
                                    <button
                                        key={r}
                                        onClick={() => setRole(r)}
                                        style={{
                                            flex: 1, padding: "10px 0", borderRadius: 12,
                                            border: active ? `2px solid ${rs.border}` : "2px solid #e2e8f0",
                                            background: active ? rs.bg : "#f8fafc",
                                            color: active ? rs.color : "#64748b",
                                            fontSize: 13, fontWeight: 600, cursor: "pointer",
                                            fontFamily: "'DM Sans', sans-serif",
                                            transition: "all 0.15s",
                                        }}
                                    >
                                        {formatRole(r)}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>

                <div style={{ display: "flex", gap: 10, marginTop: 24 }}>
                    <button
                        onClick={onClose}
                        style={{
                            flex: 1, padding: "11px 0", borderRadius: 13,
                            border: "1.5px solid #e2e8f0", background: "#f8fafc",
                            color: "#475569", fontSize: 13.5, fontWeight: 600, cursor: "pointer",
                            fontFamily: "'DM Sans', sans-serif", transition: "background 0.15s",
                        }}
                        onMouseEnter={(e) => { (e.target as HTMLElement).style.background = "#f1f5f9"; }}
                        onMouseLeave={(e) => { (e.target as HTMLElement).style.background = "#f8fafc"; }}
                    >
                        Cancel
                    </button>
                    <button
                        disabled={loading || !canSubmit}
                        onClick={handleSubmit}
                        style={{
                            flex: 1, padding: "11px 0", borderRadius: 13,
                            background: loading || !canSubmit ? "#93c5fd" : "linear-gradient(135deg, #2563eb, #1d4ed8)",
                            color: "#fff", fontSize: 13.5, fontWeight: 700, cursor: loading || !canSubmit ? "not-allowed" : "pointer",
                            fontFamily: "'DM Sans', sans-serif", border: "none",
                            boxShadow: loading || !canSubmit ? "none" : "0 4px 14px rgba(37,99,235,0.35)",
                            transition: "all 0.15s",
                        }}
                    >
                        {loading ? "Creating…" : "Create Member"}
                    </button>
                </div>
            </div>
        </div>
    );
}

/* ─── Member Row ─────────────────────────────────────────────────────────── */
function MemberRow({ member, index, openMenuId, setOpenMenuId }: {
    member: Member; index: number;
    openMenuId: string | null;
    setOpenMenuId: (id: string | null) => void;
}) {
    const { user, isOwner, isAdmin } = useAuth();
    const updateRole = useUpdateMemberRole();
    const removeMember = useRemoveMember();
    const open = openMenuId === member.id;
    const setOpen = (v: boolean) => setOpenMenuId(v ? member.id : null);
    const [hovered, setHovered] = useState(false);

    const isSelf = member.userId === user?.id;
    const canModify = (isOwner || isAdmin) && !isSelf && member.role !== "OWNER";
    const rs = ROLE_STYLE[member.role] ?? ROLE_STYLE.MEMBER;

    // Staggered entrance
    const delay = `${index * 0.045}s`;

    return (
        <div
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            style={{
                display: "flex", alignItems: "center", gap: 14,
                padding: "14px 20px",
                borderBottom: "1px solid #f1f5f9",
                background: hovered ? "#f8fafc" : "transparent",
                transition: "background 0.15s",
                animation: `rowIn 0.32s ease both`,
                animationDelay: delay,
                cursor: "default",
            }}
        >
            {/* Avatar with status dot */}
            <div style={{ position: "relative", flexShrink: 0 }}>
                <div style={{
                    width: 40, height: 40, borderRadius: 13,
                    background: `linear-gradient(135deg, ${rs.bg}, ${rs.border})`,
                    border: `1.5px solid ${rs.border}`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontWeight: 700, fontSize: 13.5,
                    color: rs.color, fontFamily: "'DM Sans', sans-serif",
                }}>
                    {getInitials(member.user.name)}
                </div>
                {/* Status dot */}
                <div style={{
                    position: "absolute", bottom: -1, right: -1,
                    width: 10, height: 10, borderRadius: "50%",
                    background: "#10b981",
                    border: "2px solid #fff",
                }} />
            </div>

            {/* Name + email */}
            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                    <p style={{
                        margin: 0, fontSize: 13.5, fontWeight: 600, color: "#0f172a",
                        fontFamily: "'DM Sans', sans-serif",
                        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                    }}>
                        {member.user.name}
                    </p>
                    {isSelf && (
                        <span style={{
                            padding: "1px 7px", borderRadius: 6,
                            background: "#eff6ff", color: "#2563eb",
                            fontSize: 10.5, fontWeight: 600,
                            fontFamily: "'DM Mono', monospace",
                            border: "1px solid #bfdbfe", flexShrink: 0,
                        }}>
                            you
                        </span>
                    )}
                </div>
                <p style={{
                    margin: 0, fontSize: 12, color: "#94a3b8",
                    fontFamily: "'DM Sans', sans-serif",
                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                }}>
                    {member.user.email}
                </p>
            </div>

            {/* Role badge */}
            <span style={{
                display: "inline-flex", alignItems: "center", gap: 5,
                padding: "4px 10px", borderRadius: 8,
                background: rs.bg, color: rs.color,
                border: `1px solid ${rs.border}`,
                fontSize: 11.5, fontWeight: 700,
                fontFamily: "'DM Mono', monospace",
                letterSpacing: "0.04em", flexShrink: 0,
            }}>
                {member.role === "OWNER" && <Crown style={{ width: 11, height: 11 }} />}
                {member.role === "ADMIN" && <Shield style={{ width: 11, height: 11 }} />}
                {member.role === "MEMBER" && <UserIcon style={{ width: 11, height: 11 }} />}
                {member.role}
            </span>

            {/* Joined time */}
            <span style={{
                fontSize: 11.5, color: "#b0bec5", width: 72, textAlign: "right",
                flexShrink: 0, display: "none",
                fontFamily: "'DM Mono', monospace",
            }}
                className="sm-show"
            >
                {member.createdAt ? timeAgo(member.createdAt) : "—"}
            </span>

            {/* Actions */}
            {canModify ? (
                <div style={{ position: "relative", flexShrink: 0 }}>
                    <button
                        onClick={() => setOpen(!open)}
                        style={{
                            width: 30, height: 30, borderRadius: 9,
                            border: open ? "1px solid #bfdbfe" : "1px solid #e2e8f0",
                            background: open ? "#eff6ff" : (hovered ? "#f1f5f9" : "transparent"),
                            display: "flex", alignItems: "center", justifyContent: "center",
                            cursor: "pointer", transition: "all 0.15s",
                        }}
                    >
                        <MoreHorizontal style={{ width: 15, height: 15, color: "#64748b" }} />
                    </button>

                    {open && (
                        <>
                            <div style={{ position: "fixed", inset: 0, zIndex: 20 }} onClick={() => setOpen(false)} />
                            <div style={{
                                position: "absolute", right: 0, top: 36, width: 188, zIndex: 30,
                                background: "#fff", border: "1px solid #e2e8f0",
                                borderRadius: 14, padding: 6,
                                boxShadow: "0 12px 36px rgba(10,14,36,0.12)",
                                animation: "dropIn 0.15s ease",
                            }}>
                                <p style={{ margin: "0 0 4px", padding: "4px 10px", fontSize: 10.5, fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.07em", fontFamily: "'DM Mono', monospace" }}>
                                    Change Role
                                </p>
                                {ROLES.map((r) => (
                                    <button
                                        key={r}
                                        onClick={() => { updateRole.mutate({ id: member.id, payload: { role: r } }); setOpen(false); }}
                                        style={{
                                            width: "100%", textAlign: "left", padding: "8px 10px",
                                            borderRadius: 9, fontSize: 13, fontWeight: 600,
                                            color: "#334155", display: "flex", alignItems: "center", gap: 8,
                                            background: "transparent", border: "none", cursor: "pointer",
                                            fontFamily: "'DM Sans', sans-serif",
                                            transition: "background 0.12s",
                                        }}
                                        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "#f1f5f9"; }}
                                        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
                                    >
                                        <ShieldCheck style={{ width: 13.5, height: 13.5, color: "#3b82f6" }} />
                                        Set as {formatRole(r)}
                                    </button>
                                ))}
                                <div style={{ height: 1, background: "#f1f5f9", margin: "4px 0" }} />
                                <button
                                    onClick={() => { removeMember.mutate(member.id); setOpen(false); }}
                                    style={{
                                        width: "100%", textAlign: "left", padding: "8px 10px",
                                        borderRadius: 9, fontSize: 13, fontWeight: 600,
                                        color: "#e11d48", display: "flex", alignItems: "center", gap: 8,
                                        background: "transparent", border: "none", cursor: "pointer",
                                        fontFamily: "'DM Sans', sans-serif",
                                        transition: "background 0.12s",
                                    }}
                                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "#fff1f2"; }}
                                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
                                >
                                    <Trash2 style={{ width: 13.5, height: 13.5 }} />
                                    Remove Member
                                </button>
                            </div>
                        </>
                    )}
                </div>
            ) : (
                <div style={{ width: 30, flexShrink: 0 }} />
            )}
        </div>
    );
}

/* ─── Main Page ──────────────────────────────────────────────────────────── */
export default function MembersPage() {
    const router = useRouter();
    const { canManageMembers, isLoading: authLoading } = useAuth();
    const { data: members = [], isLoading } = useMembers();
    const createMember = useCreateMember();
    const [open, setOpen] = useState(false);
    const [openMenuId, setOpenMenuId] = useState<string | null>(null);

    // Toolbar state (UI only — no API changes)
    const [search, setSearch] = useState("");
    const [filterRole, setFilterRole] = useState<"ALL" | "OWNER" | "ADMIN" | "MEMBER">("ALL");
    const [sort, setSort] = useState<"newest" | "oldest" | "role">("newest");
    const [sortOpen, setSortOpen] = useState(false);

    useEffect(() => {
        if (!authLoading && !canManageMembers) {
            router.replace("/dashboard");
        }
    }, [authLoading, canManageMembers, router]);

    if (authLoading || !canManageMembers) return null;

    // Client-side filter + sort (no API impact)
    const filtered = useMemo(() => {
        let list = [...members] as Member[];
        if (search.trim()) {
            const q = search.toLowerCase();
            list = list.filter(
                (m) =>
                    m.user.name.toLowerCase().includes(q) ||
                    m.user.email.toLowerCase().includes(q)
            );
        }
        if (filterRole !== "ALL") {
            list = list.filter((m) => m.role === filterRole);
        }
        list.sort((a, b) => {
            if (sort === "oldest")
                return new Date(a.createdAt ?? 0).getTime() - new Date(b.createdAt ?? 0).getTime();
            if (sort === "role") {
                const order = { OWNER: 0, ADMIN: 1, MEMBER: 2 };
                return (order[a.role as keyof typeof order] ?? 2) - (order[b.role as keyof typeof order] ?? 2);
            }
            return new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime();
        });
        return list;
    }, [members, search, filterRole, sort]);

    const FILTER_PILLS: { label: string; value: typeof filterRole }[] = [
        { label: "All", value: "ALL" },
        { label: "Owners", value: "OWNER" },
        { label: "Admins", value: "ADMIN" },
        { label: "Members", value: "MEMBER" },
    ];

    const SORT_LABELS: Record<string, string> = {
        newest: "Newest first",
        oldest: "Oldest first",
        role: "By role",
    };

    return (
        <AppShell>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700&family=DM+Mono:wght@400;500&display=swap');

                .members-root { font-family: 'DM Sans', sans-serif; max-width: 900px; margin: 0 auto; }

                @keyframes rowIn {
                    from { opacity: 0; transform: translateX(-6px); }
                    to   { opacity: 1; transform: translateX(0); }
                }
                @keyframes modalIn {
                    from { opacity: 0; transform: scale(0.96) translateY(8px); }
                    to   { opacity: 1; transform: scale(1) translateY(0); }
                }
                @keyframes dropIn {
                    from { opacity: 0; transform: translateY(-4px); }
                    to   { opacity: 1; transform: translateY(0); }
                }

                .add-btn {
                    display: inline-flex; align-items: center; gap: 7px;
                    padding: 10px 18px; border-radius: 14px; border: none;
                    background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
                    color: #fff; font-size: 13.5px; font-weight: 700;
                    font-family: 'DM Sans', sans-serif; cursor: pointer;
                    box-shadow: 0 4px 16px rgba(37,99,235,0.32);
                    transition: box-shadow 0.2s, transform 0.2s;
                }
                .add-btn:hover {
                    box-shadow: 0 8px 28px rgba(37,99,235,0.40);
                    transform: translateY(-2px);
                }

                .filter-pill {
                    padding: 5px 14px; border-radius: 20px;
                    font-size: 12.5px; font-weight: 600; cursor: pointer;
                    font-family: 'DM Sans', sans-serif; border: 1.5px solid transparent;
                    transition: all 0.15s;
                }
                .filter-pill-active {
                    background: #eff6ff; color: #1d4ed8; border-color: #bfdbfe;
                }
                .filter-pill-inactive {
                    background: transparent; color: #64748b; border-color: #e2e8f0;
                }
                .filter-pill-inactive:hover {
                    background: #f8fafc; border-color: #cbd5e1; color: #334155;
                }

                /* show joined col on wider screens */
                @media (min-width: 640px) { .sm-show { display: block !important; } }
            `}</style>

            <div className="members-root">

                {/* ── Header ── */}
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 14, marginBottom: 24 }}>
                    <div>
                        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                            <div style={{
                                width: 38, height: 38, borderRadius: 11,
                                background: "linear-gradient(135deg, #eff6ff, #dbeafe)",
                                border: "1px solid #bfdbfe",
                                display: "flex", alignItems: "center", justifyContent: "center",
                                boxShadow: "0 2px 8px rgba(37,99,235,0.10)",
                            }}>
                                <Users style={{ width: 17, height: 17, color: "#2563eb" }} />
                            </div>
                            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: "#0f172a", letterSpacing: "-0.3px" }}>
                                Members
                            </h1>
                            {!isLoading && (
                                <span style={{
                                    padding: "3px 10px", borderRadius: 20,
                                    background: "#eff6ff", color: "#1d4ed8",
                                    border: "1px solid #bfdbfe",
                                    fontSize: 11.5, fontWeight: 700,
                                    fontFamily: "'DM Mono', monospace",
                                }}>
                                    {members.length}
                                </span>
                            )}
                        </div>
                        <p style={{ margin: 0, fontSize: 13, color: "#64748b", paddingLeft: 48 }}>
                            Manage team members and their permissions
                        </p>
                    </div>

                    <button className="add-btn" onClick={() => setOpen(true)}>
                        <UserPlus style={{ width: 15, height: 15 }} />
                        Create Member
                    </button>
                </div>

                {/* ── Toolbar ── */}
                <div style={{
                    background: "#fff", border: "1px solid #e8edf5", borderRadius: 18,
                    padding: "12px 16px", marginBottom: 16,
                    boxShadow: "0 1px 6px rgba(10,14,36,0.04)",
                    display: "flex", alignItems: "center", flexWrap: "wrap", gap: 10,
                }}>
                    {/* Search */}
                    <div style={{ position: "relative", flex: "1 1 180px", minWidth: 160 }}>
                        <Search style={{
                            position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)",
                            width: 13.5, height: 13.5, color: "#94a3b8",
                        }} />
                        <input
                            type="text"
                            placeholder="Search members…"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            style={{
                                width: "100%", padding: "7px 12px 7px 32px",
                                borderRadius: 10, border: "1.5px solid #e2e8f0",
                                fontSize: 13, color: "#0f172a", outline: "none",
                                fontFamily: "'DM Sans', sans-serif",
                                background: "#f8fafc", boxSizing: "border-box",
                                transition: "border-color 0.15s",
                            }}
                            onFocus={(e) => { e.target.style.borderColor = "#93c5fd"; e.target.style.background = "#fff"; }}
                            onBlur={(e) => { e.target.style.borderColor = "#e2e8f0"; e.target.style.background = "#f8fafc"; }}
                        />
                    </div>

                    {/* Filter pills */}
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                        {FILTER_PILLS.map((p) => (
                            <button
                                key={p.value}
                                onClick={() => setFilterRole(p.value)}
                                className={`filter-pill ${filterRole === p.value ? "filter-pill-active" : "filter-pill-inactive"}`}
                            >
                                {p.label}
                            </button>
                        ))}
                    </div>

                    {/* Sort dropdown */}
                    <div style={{ position: "relative", marginLeft: "auto" }}>
                        <button
                            onClick={() => setSortOpen(!sortOpen)}
                            style={{
                                display: "inline-flex", alignItems: "center", gap: 6,
                                padding: "6px 12px", borderRadius: 10,
                                border: "1.5px solid #e2e8f0", background: "#f8fafc",
                                fontSize: 12.5, fontWeight: 600, color: "#475569",
                                cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
                                transition: "all 0.15s",
                            }}
                        >
                            {SORT_LABELS[sort]}
                            <ChevronDown style={{ width: 13, height: 13, color: "#94a3b8" }} />
                        </button>
                        {sortOpen && (
                            <>
                                <div style={{ position: "fixed", inset: 0, zIndex: 10 }} onClick={() => setSortOpen(false)} />
                                <div style={{
                                    position: "absolute", right: 0, top: 38, zIndex: 20,
                                    background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12,
                                    padding: 6, boxShadow: "0 8px 24px rgba(10,14,36,0.1)",
                                    minWidth: 148, animation: "dropIn 0.14s ease",
                                }}>
                                    {(["newest", "oldest", "role"] as const).map((s) => (
                                        <button
                                            key={s}
                                            onClick={() => { setSort(s); setSortOpen(false); }}
                                            style={{
                                                width: "100%", textAlign: "left", padding: "7px 10px",
                                                borderRadius: 8, border: "none",
                                                background: sort === s ? "#eff6ff" : "transparent",
                                                color: sort === s ? "#1d4ed8" : "#334155",
                                                fontSize: 13, fontWeight: sort === s ? 700 : 500,
                                                cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
                                                transition: "background 0.12s",
                                            }}
                                            onMouseEnter={(e) => { if (sort !== s) (e.currentTarget as HTMLElement).style.background = "#f8fafc"; }}
                                            onMouseLeave={(e) => { if (sort !== s) (e.currentTarget as HTMLElement).style.background = "transparent"; }}
                                        >
                                            {SORT_LABELS[s]}
                                        </button>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {/* ── Member List ── */}
                <div style={{
                    background: "#fff", border: "1px solid #e8edf5",
                    borderRadius: 20, overflow: "hidden",
                    boxShadow: "0 2px 12px rgba(10,14,36,0.05)",
                }}>
                    {/* Table header */}
                    <div style={{
                        display: "flex", alignItems: "center", gap: 14,
                        padding: "10px 20px",
                        borderBottom: "1px solid #f1f5f9",
                        background: "#fafbfe",
                    }}>
                        <div style={{ width: 40, flexShrink: 0 }} />
                        <div style={{ flex: 1, fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.07em", fontFamily: "'DM Mono', monospace" }}>
                            Name
                        </div>
                        <div style={{ width: 90, fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.07em", fontFamily: "'DM Mono', monospace" }}>
                            Role
                        </div>
                        <div className="sm-show" style={{ display: "none", width: 72, textAlign: "right", fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.07em", fontFamily: "'DM Mono', monospace" }}>
                            Joined
                        </div>
                        <div style={{ width: 30, flexShrink: 0 }} />
                    </div>

                    {isLoading ? (
                        <div style={{ padding: "64px 0", display: "flex", justifyContent: "center" }}>
                            <Loader2 style={{ width: 22, height: 22, color: "#2563eb", animation: "spin 1s linear infinite" }} />
                        </div>

                    ) : filtered.length === 0 ? (
                        /* Empty state */
                        <div style={{
                            padding: "72px 24px", display: "flex", flexDirection: "column",
                            alignItems: "center", textAlign: "center",
                        }}>
                            <div style={{
                                width: 64, height: 64, borderRadius: 20, marginBottom: 18,
                                background: "linear-gradient(135deg, #eff6ff, #dbeafe)",
                                border: "1px solid #bfdbfe",
                                display: "flex", alignItems: "center", justifyContent: "center",
                                boxShadow: "0 4px 14px rgba(37,99,235,0.1)",
                            }}>
                                <Users style={{ width: 28, height: 28, color: "#2563eb" }} />
                            </div>
                            <p style={{ margin: "0 0 6px", fontSize: 15, fontWeight: 700, color: "#1e293b" }}>
                                {search || filterRole !== "ALL" ? "No matching members" : "No members yet"}
                            </p>
                            <p style={{ margin: "0 0 20px", fontSize: 13, color: "#94a3b8", maxWidth: 240, lineHeight: 1.65 }}>
                                {search || filterRole !== "ALL"
                                    ? "Try adjusting your search or filters."
                                    : "Invite teammates to start collaborating together."}
                            </p>
                            {!(search || filterRole !== "ALL") && (
                                <button className="add-btn" onClick={() => setOpen(true)} style={{ fontSize: 13 }}>
                                    <UserPlus style={{ width: 14, height: 14 }} />
                                    Add First Member
                                </button>
                            )}
                        </div>

                    ) : (
                        filtered.map((m: Member, i: number) => (
                            <MemberRow key={m.id} member={m} index={i} openMenuId={openMenuId} setOpenMenuId={setOpenMenuId} />
                        ))
                    )}
                </div>

                {/* Result count when filtering */}
                {!isLoading && (search || filterRole !== "ALL") && filtered.length > 0 && (
                    <p style={{ marginTop: 10, fontSize: 12, color: "#94a3b8", textAlign: "center", fontFamily: "'DM Mono', monospace" }}>
                        Showing {filtered.length} of {members.length} member{members.length !== 1 ? "s" : ""}
                    </p>
                )}
            </div>

            <AddMemberModal
                open={open}
                onClose={() => setOpen(false)}
                onSubmit={async (name, email, password, role) => {
                    await createMember.mutateAsync({ name, email, password, role });
                }}
            />
        </AppShell>
    );
}