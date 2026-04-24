"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { authApi } from "@/lib/api";
import { Loader2, Mail, Lock, ArrowRight, Building2, User } from "lucide-react";

type Tab = "login" | "register";

export default function LoginPage() {
    const router = useRouter();

    const { login, user, isLoading } = useAuth();

    const [tab, setTab] = useState<Tab>("login");

    const [form, setForm] = useState({
        email: "",
        password: "",
    });

    const [registerForm, setRegisterForm] = useState({
        name: "",
        email: "",
        password: "",
        organizationName: "",
    });

    const [error, setError] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [successMsg, setSuccessMsg] = useState("");

    const getDashboardRoute = (role?: string) =>
        role === "MEMBER" ? "/dashboard/member" : "/dashboard";

    useEffect(() => {
        if (user) {
            router.replace(getDashboardRoute(user.role));
        }
    }, [user, router]);

    async function handleLogin(e: React.FormEvent) {
        e.preventDefault();
        setError("");
        setSubmitting(true);

        try {
            await login({
                email: form.email,
                password: form.password,
            });
            const stored = localStorage.getItem("tf_user");
            const role = stored ? JSON.parse(stored).role : undefined;
            router.push(getDashboardRoute(role));
        } catch (err: any) {
            setError(
                err?.response?.data?.message || "Invalid credentials"
            );
        } finally {
            setSubmitting(false);
        }
    }

    async function handleRegister(e: React.FormEvent) {
        e.preventDefault();
        setError("");
        setSubmitting(true);

        try {
            await authApi.register({
                name: registerForm.name,
                email: registerForm.email,
                password: registerForm.password,
                organizationName: registerForm.organizationName,
            });

            setSuccessMsg("Organisation created! You can now log in.");
            setTab("login");
            setForm({ email: registerForm.email, password: "" });
            setRegisterForm({ name: "", email: "", password: "", organizationName: "" });
        } catch (err: any) {
            setError(
                err?.response?.data?.message || "Failed to create organisation"
            );
        } finally {
            setSubmitting(false);
        }
    }

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="min-h-screen grid lg:grid-cols-2 bg-background">
            {/* Left Side */}
            <div className="hidden lg:flex flex-col justify-center px-16 bg-primary text-primary-foreground">
                <h1 className="text-5xl font-bold mb-6">Taskora</h1>
                <p className="text-lg opacity-90 leading-relaxed max-w-md">
                    Less Mess, More Success!</p>

                <p className="text-lg opacity-90 leading-relaxed max-w-md">
                    Manage tasks, members, roles, logs and team workflow in one
                    modern system.
                </p>

                <div className="mt-10 space-y-3 text-sm opacity-90">
                    <p>✓ Role Based Access</p>
                    <p>✓ Activity Logs</p>
                    <p>✓ Team Management</p>
                    <p>✓ Trash Restore</p>
                </div>
            </div>

            {/* Right Side */}
            <div className="flex items-center justify-center px-6">
                <div className="w-full max-w-md">
                    <div className="mb-8 lg:hidden">
                        <h1 className="text-3xl font-bold">TaskFlow</h1>
                    </div>

                    {/* Tabs */}
                    <div className="flex rounded-xl border border-border mb-8 p-1 bg-muted">
                        <button
                            onClick={() => { setTab("login"); setError(""); setSuccessMsg(""); }}
                            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${tab === "login"
                                ? "bg-background shadow text-foreground"
                                : "text-muted-foreground hover:text-foreground"
                                }`}
                        >
                            Sign In
                        </button>
                        <button
                            onClick={() => { setTab("register"); setError(""); setSuccessMsg(""); }}
                            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${tab === "register"
                                ? "bg-background shadow text-foreground"
                                : "text-muted-foreground hover:text-foreground"
                                }`}
                        >
                            Create Organisation
                        </button>
                    </div>

                    {/* Success message */}
                    {successMsg && (
                        <div className="text-sm text-green-700 bg-green-50 border border-green-200 px-3 py-2 rounded-lg mb-4">
                            {successMsg}
                        </div>
                    )}

                    {/* LOGIN FORM */}
                    {tab === "login" && (
                        <>
                            <div className="mb-8">
                                <h2 className="text-3xl font-bold text-foreground">
                                    Welcome Back
                                </h2>
                                <p className="text-muted-foreground mt-2">
                                    Sign in to your workspace
                                </p>
                            </div>

                            <form onSubmit={handleLogin} className="space-y-5">
                                <div>
                                    <label className="text-sm font-medium mb-2 block">
                                        Email
                                    </label>
                                    <div className="relative">
                                        <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                                        <input
                                            type="email"
                                            required
                                            value={form.email}
                                            onChange={(e) => setForm({ ...form, email: e.target.value })}
                                            placeholder="Enter email"
                                            className="w-full pl-10 pr-4 py-3 rounded-xl border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="text-sm font-medium mb-2 block">
                                        Password
                                    </label>
                                    <div className="relative">
                                        <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                                        <input
                                            type="password"
                                            required
                                            value={form.password}
                                            onChange={(e) => setForm({ ...form, password: e.target.value })}
                                            placeholder="Enter password"
                                            className="w-full pl-10 pr-4 py-3 rounded-xl border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                                        />
                                    </div>
                                </div>

                                {error && (
                                    <div className="text-sm text-red-500 bg-red-50 border border-red-200 px-3 py-2 rounded-lg">
                                        {error}
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold hover:opacity-90 transition flex items-center justify-center gap-2 disabled:opacity-70"
                                >
                                    {submitting ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            Signing in...
                                        </>
                                    ) : (
                                        <>
                                            Login
                                            <ArrowRight className="w-4 h-4" />
                                        </>
                                    )}
                                </button>
                            </form>

                            <p className="text-xs text-muted-foreground mt-6 text-center">
                                Use your organisation credentials to continue.
                            </p>
                        </>
                    )}

                    {/* CREATE ORGANISATION FORM */}
                    {tab === "register" && (
                        <>
                            <div className="mb-8">
                                <h2 className="text-3xl font-bold text-foreground">
                                    Create Organisation
                                </h2>
                                <p className="text-muted-foreground mt-2">
                                    Set up your workspace and become the Owner
                                </p>
                            </div>

                            <form onSubmit={handleRegister} className="space-y-5">
                                <div>
                                    <label className="text-sm font-medium mb-2 block">
                                        Your Name
                                    </label>
                                    <div className="relative">
                                        <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                                        <input
                                            type="text"
                                            required
                                            value={registerForm.name}
                                            onChange={(e) => setRegisterForm({ ...registerForm, name: e.target.value })}
                                            placeholder="Enter your name"
                                            className="w-full pl-10 pr-4 py-3 rounded-xl border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="text-sm font-medium mb-2 block">
                                        Organisation Name
                                    </label>
                                    <div className="relative">
                                        <Building2 className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                                        <input
                                            type="text"
                                            required
                                            value={registerForm.organizationName}
                                            onChange={(e) => setRegisterForm({ ...registerForm, organizationName: e.target.value })}
                                            placeholder="Enter organisation name"
                                            className="w-full pl-10 pr-4 py-3 rounded-xl border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="text-sm font-medium mb-2 block">
                                        Email
                                    </label>
                                    <div className="relative">
                                        <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                                        <input
                                            type="email"
                                            required
                                            value={registerForm.email}
                                            onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })}
                                            placeholder="Enter email"
                                            className="w-full pl-10 pr-4 py-3 rounded-xl border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="text-sm font-medium mb-2 block">
                                        Password
                                    </label>
                                    <div className="relative">
                                        <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                                        <input
                                            type="password"
                                            required
                                            value={registerForm.password}
                                            onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })}
                                            placeholder="Create a password"
                                            className="w-full pl-10 pr-4 py-3 rounded-xl border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                                        />
                                    </div>
                                </div>

                                {error && (
                                    <div className="text-sm text-red-500 bg-red-50 border border-red-200 px-3 py-2 rounded-lg">
                                        {error}
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold hover:opacity-90 transition flex items-center justify-center gap-2 disabled:opacity-70"
                                >
                                    {submitting ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            Creating...
                                        </>
                                    ) : (
                                        <>
                                            Create Organisation
                                            <ArrowRight className="w-4 h-4" />
                                        </>
                                    )}
                                </button>
                            </form>

                            <p className="text-xs text-muted-foreground mt-6 text-center">
                                You will be set as the Owner of the organisation.
                            </p>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
