"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { MobileNavDrawer, MobileTopBar } from "../../Shared/MobileShell";
import {
    addJob,
    clearAuth,
    deleteJob,
    fetchJobs,
    fetchProfile,
    getStoredUser,
    getToken,
} from "../../../lib/api";

const navItems = [
    { label: "Home", href: "/dashboard" },
    { label: "Resume", href: "/resume" },
    { label: "Jobs", href: "/jobs" },
    { label: "Settings", href: "/settings" },
];

const formatDate = (raw) => {
    if (!raw) return "";
    const d = new Date(raw);
    if (Number.isNaN(d.getTime())) return "";
    return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
};

const getInitial = (name) => (name ? name.trim().charAt(0).toUpperCase() : "?");

const emptyForm = { title: "", company: "", location: "", description: "", source: "" };

const Page = () => {
    const router = useRouter();
    const [user, setUser] = useState(null);
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState(emptyForm);
    const [saving, setSaving] = useState(false);
    const [formError, setFormError] = useState("");
    const [confirmDeleteId, setConfirmDeleteId] = useState(null);
    const [toast, setToast] = useState("");
    const [mobileNavOpen, setMobileNavOpen] = useState(false);

    useEffect(() => {
        const token = getToken();
        if (!token) {
            router.replace("/login");
            return;
        }
        const cached = getStoredUser();
        if (cached) setUser(cached);

        fetchProfile()
            .then(setUser)
            .catch((err) => {
                if (err.status === 401) {
                    clearAuth();
                    router.replace("/login");
                }
            });

        loadJobs();
    }, [router]);

    const loadJobs = async () => {
        setLoading(true);
        try {
            const list = await fetchJobs();
            setJobs(Array.isArray(list) ? list : []);
        } catch (err) {
            if (err.status === 401) {
                clearAuth();
                router.replace("/login");
            }
        } finally {
            setLoading(false);
        }
    };

    const showToast = (message) => {
        setToast(message);
        setTimeout(() => setToast(""), 2500);
    };

    const handleLogout = () => {
        clearAuth();
        router.replace("/login");
    };

    const openForm = () => {
        setForm(emptyForm);
        setFormError("");
        setShowForm(true);
    };

    const handleField = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.title.trim() || !form.description.trim()) {
            setFormError("Title and description are required.");
            return;
        }
        setSaving(true);
        setFormError("");
        try {
            const created = await addJob({
                title: form.title.trim(),
                description: form.description.trim(),
                company: form.company.trim() || undefined,
                location: form.location.trim() || undefined,
                source: form.source.trim() || undefined,
            });
            setJobs((current) => [created, ...current]);
            setShowForm(false);
            showToast(
                typeof created.indexed_chunks === "number"
                    ? `Job added · indexed ${created.indexed_chunks} chunk${created.indexed_chunks === 1 ? "" : "s"}.`
                    : "Job added."
            );
        } catch (err) {
            setFormError(err.message || "Failed to add job.");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id) => {
        try {
            await deleteJob(id);
            setJobs((current) => current.filter((j) => j.id !== id));
            setConfirmDeleteId(null);
            showToast("Job deleted.");
        } catch (err) {
            showToast(err.message || "Delete failed.");
        }
    };

    const filteredJobs = useMemo(() => {
        const q = search.trim().toLowerCase();
        if (!q) return jobs;
        return jobs.filter((j) =>
            [j.title, j.company, j.location].filter(Boolean).join(" ").toLowerCase().includes(q)
        );
    }, [jobs, search]);

    const displayName = user?.full_name || "";
    const displayEmail = user?.email || "";
    const initial = getInitial(displayName || displayEmail);

    return (
        <div className="min-h-screen bg-white text-slate-950">
            <MobileTopBar
                onOpenMenu={() => setMobileNavOpen(true)}
                displayName={displayName}
                displayEmail={displayEmail}
                initial={initial}
            />
            <MobileNavDrawer
                open={mobileNavOpen}
                onClose={() => setMobileNavOpen(false)}
                navItems={navItems}
                activeLabel="Jobs"
                onLogout={handleLogout}
            />
            <div className="mx-auto flex min-h-screen max-w-[1600px] flex-col lg:flex-row">
                <aside className="hidden w-[280px] shrink-0 flex-col border-r border-slate-200 bg-white px-4 py-5 lg:flex">
                    <Link href="/" className="inline-flex items-center gap-2.5 px-2">
                        <Image src="/landing/13.svg" alt="CareerMate AI logo" width={28} height={28} priority />
                        <Image
                            src="/landing/career-mate-ai-2.svg"
                            alt="CareerMate AI"
                            width={132}
                            height={22}
                            className="h-auto w-auto"
                            priority
                        />
                    </Link>

                    <div className="flex-1" />

                    <nav className="flex flex-col gap-0.5 border-t border-slate-100 pt-3">
                        {navItems.map((item) => {
                            const active = item.label === "Jobs";
                            return (
                                <Link
                                    key={item.label}
                                    href={item.href}
                                    className={`flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition ${
                                        active
                                            ? "bg-slate-100 font-semibold text-slate-900"
                                            : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                                    }`}
                                >
                                    <NavIcon label={item.label} />
                                    {item.label}
                                </Link>
                            );
                        })}
                    </nav>

                    <div className="mt-3 flex items-center gap-2.5 rounded-xl border border-slate-100 bg-slate-50/60 px-2.5 py-2">
                        <div className="flex size-8 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white">
                            {initial}
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="truncate text-xs font-semibold text-slate-900">{displayName || "—"}</p>
                            <p className="truncate text-[11px] text-slate-500">{displayEmail || ""}</p>
                        </div>
                        <button
                            type="button"
                            onClick={handleLogout}
                            title="Log out"
                            aria-label="Log out"
                            className="flex size-7 shrink-0 items-center justify-center rounded-lg text-slate-400 transition hover:bg-rose-50 hover:text-rose-500"
                        >
                            <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                <path
                                    fillRule="evenodd"
                                    d="M3 4.75A2.75 2.75 0 015.75 2h4.5a.75.75 0 010 1.5h-4.5c-.69 0-1.25.56-1.25 1.25v10.5c0 .69.56 1.25 1.25 1.25h4.5a.75.75 0 010 1.5h-4.5A2.75 2.75 0 013 15.25V4.75zm10.47 2.22a.75.75 0 011.06 0l2.5 2.5a.75.75 0 010 1.06l-2.5 2.5a.75.75 0 11-1.06-1.06L14.69 10.5H8.75a.75.75 0 010-1.5h5.94l-1.22-1.22a.75.75 0 010-1.06z"
                                    clipRule="evenodd"
                                />
                            </svg>
                        </button>
                    </div>
                </aside>

                <main className="flex flex-1 flex-col px-4 py-5 sm:px-6 lg:px-10">
                    <div className="mt-2 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end sm:gap-6">
                        <div>
                            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Job Library</p>
                            <h1 className="mt-2 text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
                                Target Roles
                            </h1>
                            <p className="mt-2 max-w-xl text-sm text-slate-500">
                                Paste job descriptions you&apos;re targeting. The coach retrieves them to score fit,
                                find gaps, and tailor interview prep against your resume.
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={openForm}
                            className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-slate-900 px-6 text-sm font-bold text-white shadow-sm transition hover:bg-slate-800"
                        >
                            <span className="text-base leading-none">+</span>
                            Add Job
                        </button>
                    </div>

                    <div className="mt-6 flex items-center gap-3 rounded-[1.5rem] border border-slate-200 bg-white px-4 py-3 shadow-sm">
                        <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-slate-50 text-slate-400">
                            🔍
                        </div>
                        <input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search by title, company, or location..."
                            className="h-9 w-full border-none bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400"
                        />
                        <div className="hidden shrink-0 text-xs text-slate-400 sm:block">
                            {jobs.length} {jobs.length === 1 ? "role" : "roles"}
                        </div>
                    </div>

                    <div className="mt-6 min-h-[320px]">
                        {loading ? (
                            <div className="flex h-60 items-center justify-center text-sm text-slate-400">
                                Loading your job library...
                            </div>
                        ) : filteredJobs.length === 0 ? (
                            <EmptyState hasQuery={!!search.trim()} onAdd={openForm} />
                        ) : (
                            <div className="flex flex-col gap-3">
                                {filteredJobs.map((job) => (
                                    <JobCard key={job.id} job={job} onDelete={() => setConfirmDeleteId(job.id)} />
                                ))}
                            </div>
                        )}
                    </div>
                </main>

                {showForm ? (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/30 px-4 py-8">
                        <div className="max-h-full w-full max-w-lg overflow-y-auto rounded-[1.75rem] bg-white p-6 shadow-2xl sm:p-8">
                            <div className="flex items-start justify-between">
                                <div>
                                    <h3 className="text-lg font-bold text-slate-900">Add a job description</h3>
                                    <p className="mt-1 text-sm text-slate-500">
                                        It&apos;s indexed immediately for matching against your resume.
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setShowForm(false)}
                                    aria-label="Close"
                                    className="flex size-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                                >
                                    <svg className="h-5 w-5" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M5 5l10 10M15 5L5 15" strokeLinecap="round" />
                                    </svg>
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="mt-5 flex flex-col gap-4">
                                <Field label="Job title" required>
                                    <input
                                        value={form.title}
                                        onChange={handleField("title")}
                                        placeholder="Senior Frontend Engineer"
                                        className={inputClass}
                                    />
                                </Field>
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <Field label="Company">
                                        <input
                                            value={form.company}
                                            onChange={handleField("company")}
                                            placeholder="Acme Inc."
                                            className={inputClass}
                                        />
                                    </Field>
                                    <Field label="Location">
                                        <input
                                            value={form.location}
                                            onChange={handleField("location")}
                                            placeholder="Remote · Berlin"
                                            className={inputClass}
                                        />
                                    </Field>
                                </div>
                                <Field label="Description" required>
                                    <textarea
                                        value={form.description}
                                        onChange={handleField("description")}
                                        rows={7}
                                        placeholder="Paste the full job description here..."
                                        className={`${inputClass} resize-y leading-6`}
                                    />
                                </Field>
                                <Field label="Source link">
                                    <input
                                        value={form.source}
                                        onChange={handleField("source")}
                                        placeholder="https://… (optional)"
                                        className={inputClass}
                                    />
                                </Field>

                                {formError ? (
                                    <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-500">
                                        {formError}
                                    </p>
                                ) : null}

                                <div className="mt-1 flex justify-end gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setShowForm(false)}
                                        className="inline-flex h-10 items-center justify-center rounded-full border border-slate-200 px-5 text-sm font-semibold text-slate-500 transition hover:border-slate-300 hover:text-slate-900"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={saving}
                                        className="inline-flex h-10 items-center justify-center rounded-full bg-slate-900 px-5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                                    >
                                        {saving ? "Adding..." : "Add job"}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                ) : null}

                {confirmDeleteId ? (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/25 px-6">
                        <div className="w-full max-w-sm rounded-[1.75rem] bg-white p-8 text-center shadow-2xl">
                            <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-rose-50 text-rose-500">
                                ⚠
                            </div>
                            <h3 className="mt-4 text-base font-semibold text-slate-900">Delete this job?</h3>
                            <p className="mt-2 text-sm text-slate-500">
                                It will be removed from the library and its indexed chunks cleared.
                            </p>
                            <div className="mt-6 flex justify-center gap-3">
                                <button
                                    type="button"
                                    onClick={() => setConfirmDeleteId(null)}
                                    className="inline-flex h-10 items-center justify-center rounded-full border border-slate-200 px-5 text-sm font-semibold text-slate-500 transition hover:border-slate-300 hover:text-slate-900"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleDelete(confirmDeleteId)}
                                    className="inline-flex h-10 items-center justify-center rounded-full bg-rose-500 px-5 text-sm font-semibold text-white transition hover:bg-rose-600"
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    </div>
                ) : null}

                {toast ? (
                    <div className="fixed right-6 top-6 z-50 rounded-[1.15rem] bg-slate-900 px-4 py-3 text-sm text-white shadow-2xl">
                        {toast}
                    </div>
                ) : null}
            </div>
        </div>
    );
};

const inputClass =
    "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-[#4f6bff] focus:ring-2 focus:ring-[#4f6bff]/20";

const Field = ({ label, required, children }) => (
    <label className="flex flex-col gap-1.5">
        <span className="text-xs font-semibold text-slate-600">
            {label}
            {required ? <span className="text-rose-500"> *</span> : null}
        </span>
        {children}
    </label>
);

const NavIcon = ({ label }) => (
    <svg className="h-4 w-4 shrink-0 text-slate-500" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
        {label === "Home" ? (
            <path d="M10 2.5a1 1 0 01.7.29l7 6.5a1 1 0 01-.7 1.71H16v6a1 1 0 01-1 1h-3v-5H8v5H5a1 1 0 01-1-1v-6H3a1 1 0 01-.7-1.71l7-6.5A1 1 0 0110 2.5z" />
        ) : label === "Resume" ? (
            <path d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V7.41a2 2 0 00-.59-1.41l-3.41-3.41A2 2 0 0010.59 2H6zm1 7a1 1 0 011-1h4a1 1 0 110 2H8a1 1 0 01-1-1zm0 3a1 1 0 011-1h4a1 1 0 110 2H8a1 1 0 01-1-1zm0 3a1 1 0 011-1h2a1 1 0 110 2H8a1 1 0 01-1-1z" />
        ) : label === "Jobs" ? (
            <path d="M7 5V4a2 2 0 012-2h2a2 2 0 012 2v1h3a2 2 0 012 2v3H1V7a2 2 0 012-2h4zm2-1v1h2V4H9zM1 11h18v5a2 2 0 01-2 2H3a2 2 0 01-2-2v-5zm8 1a1 1 0 100 2h2a1 1 0 100-2H9z" />
        ) : (
            <path
                fillRule="evenodd"
                d="M11.49 2.17a1 1 0 00-1.98 0l-.17 1.04a6.9 6.9 0 00-1.7.7l-.87-.61a1 1 0 00-1.4 1.4l.6.87a6.9 6.9 0 00-.7 1.7l-1.04.17a1 1 0 000 1.98l1.04.17a6.9 6.9 0 00.7 1.7l-.6.87a1 1 0 001.4 1.4l.87-.6a6.9 6.9 0 001.7.7l.17 1.04a1 1 0 001.98 0l.17-1.04a6.9 6.9 0 001.7-.7l.87.6a1 1 0 001.4-1.4l-.6-.87a6.9 6.9 0 00.7-1.7l1.04-.17a1 1 0 000-1.98l-1.04-.17a6.9 6.9 0 00-.7-1.7l.6-.87a1 1 0 00-1.4-1.4l-.87.6a6.9 6.9 0 00-1.7-.7l-.17-1.04zM10 12.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z"
                clipRule="evenodd"
            />
        )}
    </svg>
);

const EmptyState = ({ hasQuery, onAdd }) => (
    <div className="flex min-h-[320px] flex-col items-center justify-center rounded-[1.75rem] border border-dashed border-slate-200 bg-slate-50/60 px-6 py-16 text-center">
        <div className="flex size-16 items-center justify-center rounded-[1.25rem] bg-[linear-gradient(135deg,#eef1ff,#e0f2fe)] text-2xl">
            💼
        </div>
        <h3 className="mt-5 text-base font-semibold text-slate-900">
            {hasQuery ? "No matches found" : "No jobs yet"}
        </h3>
        <p className="mt-2 max-w-sm text-sm text-slate-500">
            {hasQuery
                ? "Try a different keyword, or add a new target role."
                : "Add the job descriptions you're targeting so the coach can score fit and tailor advice."}
        </p>
        {!hasQuery ? (
            <button
                type="button"
                onClick={onAdd}
                className="mt-6 inline-flex h-11 items-center justify-center gap-2 rounded-full bg-slate-900 px-6 text-sm font-bold text-white transition hover:bg-slate-800"
            >
                <span className="text-base leading-none">+</span>
                Add Job
            </button>
        ) : null}
    </div>
);

const JobCard = ({ job, onDelete }) => (
    <div className="group rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm transition hover:border-[#b8c2ff] hover:shadow-[0_16px_40px_rgba(79,107,255,0.10)]">
        <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
                <h3 className="truncate text-base font-bold text-slate-900" title={job.title}>
                    {job.title}
                </h3>
                <p className="mt-0.5 truncate text-sm text-slate-500">
                    {[job.company, job.location].filter(Boolean).join(" · ") || "—"}
                </p>
            </div>
            <div className="flex shrink-0 items-center gap-3">
                {job.created_at ? (
                    <span className="hidden text-[11px] text-slate-400 sm:block">{formatDate(job.created_at)}</span>
                ) : null}
                <button
                    type="button"
                    onClick={onDelete}
                    aria-label="Delete job"
                    className="flex size-8 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-400 transition hover:border-rose-300 hover:text-rose-500"
                >
                    <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path
                            fillRule="evenodd"
                            d="M8 3a1 1 0 00-1 1v1H4a1 1 0 100 2h12a1 1 0 100-2h-3V4a1 1 0 00-1-1H8zM5 8a1 1 0 011 1v7a2 2 0 002 2h4a2 2 0 002-2V9a1 1 0 112 0v7a4 4 0 01-4 4H8a4 4 0 01-4-4V9a1 1 0 011-1z"
                            clipRule="evenodd"
                        />
                    </svg>
                </button>
            </div>
        </div>
        {job.description ? (
            <p className="mt-3 line-clamp-3 whitespace-pre-wrap text-sm leading-6 text-slate-600">
                {job.description}
            </p>
        ) : null}
        {job.source ? (
            <a
                href={job.source}
                target="_blank"
                rel="noreferrer"
                className="mt-3 inline-block max-w-full truncate text-xs font-medium text-[#4f6bff] hover:underline"
            >
                {job.source}
            </a>
        ) : null}
    </div>
);

export default Page;
