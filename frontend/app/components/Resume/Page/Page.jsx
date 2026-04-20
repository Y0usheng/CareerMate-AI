"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import {
    clearAuth,
    deleteResume,
    fetchProfile,
    fetchResumes,
    getStoredUser,
    getToken,
    resumeDownloadUrl,
    uploadResume,
} from "../../../lib/api";

const navItems = [
    { label: "Home", href: "/dashboard" },
    { label: "Resume", href: "/resume" },
    { label: "Settings", href: "/settings" },
];

const viewModes = [
    { id: "grid", label: "Grid" },
    { id: "list", label: "List" },
];

const fileTypeMeta = {
    pdf: { label: "PDF", color: "bg-rose-50 text-rose-500 border-rose-100" },
    doc: { label: "DOC", color: "bg-sky-50 text-sky-500 border-sky-100" },
    docx: { label: "DOCX", color: "bg-indigo-50 text-indigo-500 border-indigo-100" },
};

const getExt = (filename) => {
    const idx = filename.lastIndexOf(".");
    return idx === -1 ? "" : filename.slice(idx + 1).toLowerCase();
};

const getMeta = (filename) => {
    const ext = getExt(filename);
    return fileTypeMeta[ext] || { label: ext.toUpperCase() || "FILE", color: "bg-slate-100 text-slate-500 border-slate-200" };
};

const formatBytes = (bytes) => {
    if (!bytes && bytes !== 0) return "—";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const formatDate = (raw) => {
    if (!raw) return "";
    const d = new Date(raw.replace(" ", "T") + "Z");
    if (Number.isNaN(d.getTime())) return raw;
    return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
};

const getInitial = (name) => (name ? name.trim().charAt(0).toUpperCase() : "?");

const Page = () => {
    const router = useRouter();
    const [user, setUser] = useState(null);
    const [resumes, setResumes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [uploadError, setUploadError] = useState("");
    const [search, setSearch] = useState("");
    const [viewMode, setViewMode] = useState("grid");
    const [confirmDeleteId, setConfirmDeleteId] = useState(null);
    const [toast, setToast] = useState("");
    const fileInputRef = useRef(null);

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

        loadResumes();
    }, [router]);

    const loadResumes = async () => {
        setLoading(true);
        try {
            const list = await fetchResumes();
            setResumes(Array.isArray(list) ? list : []);
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

    const handlePickFile = () => fileInputRef.current?.click();

    const handleFileChange = async (event) => {
        const file = event.target.files?.[0];
        event.target.value = "";
        if (!file) return;

        setUploadError("");
        setUploading(true);
        try {
            const created = await uploadResume(file);
            setResumes((current) => [created, ...current]);
            showToast("Resume uploaded.");
        } catch (err) {
            setUploadError(err.message || "Upload failed.");
        } finally {
            setUploading(false);
        }
    };

    const handleDelete = async (id) => {
        try {
            await deleteResume(id);
            setResumes((current) => current.filter((r) => r.id !== id));
            setConfirmDeleteId(null);
            showToast("Resume deleted.");
        } catch (err) {
            showToast(err.message || "Delete failed.");
        }
    };

    const handleDownload = (id) => {
        const token = getToken();
        if (!token) return;
        // Use a temporary form to submit token-authorized download
        fetch(resumeDownloadUrl(id), { headers: { Authorization: `Bearer ${token}` } })
            .then((res) => {
                if (!res.ok) throw new Error("Download failed");
                return res.blob().then((blob) => ({ blob, res }));
            })
            .then(({ blob, res }) => {
                const disposition = res.headers.get("Content-Disposition") || "";
                const match = disposition.match(/filename\*?=(?:UTF-8'')?"?([^";]+)"?/i);
                const filename = match ? decodeURIComponent(match[1]) : "resume";
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = filename;
                document.body.appendChild(a);
                a.click();
                a.remove();
                URL.revokeObjectURL(url);
            })
            .catch((err) => showToast(err.message || "Download failed."));
    };

    const filteredResumes = useMemo(() => {
        const q = search.trim().toLowerCase();
        if (!q) return resumes;
        return resumes.filter((r) => r.filename.toLowerCase().includes(q));
    }, [resumes, search]);

    const displayName = user?.full_name || "";
    const displayEmail = user?.email || "";
    const initial = getInitial(displayName || displayEmail);
    const totalSize = resumes.reduce((acc, r) => acc + (r.file_size || 0), 0);

    return (
        <div className="min-h-screen overflow-x-auto bg-white text-slate-950">
            <div className="mx-auto flex min-h-screen min-w-[1180px] max-w-[1600px]">
                <aside className="flex w-[220px] flex-col border-r border-slate-100 bg-slate-50/60 px-5 py-6">
                    <Link href="/" className="inline-flex items-center gap-2.5">
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

                    <nav className="mt-10 flex flex-col gap-1">
                        {navItems.map((item) => {
                            const active = item.label === "Resume";
                            return (
                                <Link
                                    key={item.label}
                                    href={item.href}
                                    className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm transition ${
                                        active
                                            ? "bg-white font-semibold text-[#4f6bff] shadow-[0_4px_12px_rgba(79,107,255,0.08)]"
                                            : "text-slate-500 hover:bg-white hover:text-slate-900"
                                    }`}
                                >
                                    <span
                                        className={`size-1.5 rounded-full ${active ? "bg-[#4f6bff]" : "bg-slate-300"}`}
                                    />
                                    {item.label}
                                </Link>
                            );
                        })}
                    </nav>

                    <button
                        type="button"
                        onClick={handleLogout}
                        className="mt-auto inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-semibold text-slate-500 transition hover:border-slate-300 hover:text-slate-900"
                    >
                        Log out
                    </button>
                </aside>

                <main className="flex flex-1 flex-col px-10 py-5">
                    <div className="flex items-start justify-end">
                        <Link
                            href="/settings"
                            className="flex items-center gap-3 rounded-full border border-slate-200 bg-white px-3 py-2 shadow-sm transition hover:border-slate-300"
                        >
                            <div className="text-right">
                                <p className="text-xs font-semibold text-slate-900">{displayName || "Loading..."}</p>
                                <p className="mt-0.5 text-[11px] text-slate-400">{displayEmail || ""}</p>
                            </div>
                            <div className="flex size-9 items-center justify-center rounded-full bg-slate-950 text-xs font-bold text-white">
                                {initial}
                            </div>
                        </Link>
                    </div>

                    <div className="mt-6 flex flex-col">
                        <div className="flex items-end justify-between gap-6">
                            <div>
                                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">My Resumes</p>
                                <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-900">Resume Drive</h1>
                                <p className="mt-2 text-sm text-slate-500">
                                    Store, manage, and revisit every version of your resume in one place.
                                </p>
                            </div>
                            <div className="flex items-center gap-3">
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept=".pdf,.doc,.docx"
                                    className="hidden"
                                    onChange={handleFileChange}
                                />
                                <button
                                    type="button"
                                    onClick={handlePickFile}
                                    disabled={uploading}
                                    className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-[linear-gradient(98deg,#504ffd_12%,#40c3fb_91%)] px-6 text-sm font-bold text-white shadow-[0_10px_24px_rgba(79,107,255,0.25)] transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    <span className="text-base leading-none">+</span>
                                    {uploading ? "Uploading..." : "Upload Resume"}
                                </button>
                            </div>
                        </div>

                        <div className="mt-6 flex items-center justify-between gap-4 rounded-[1.5rem] border border-slate-200 bg-white px-4 py-3 shadow-sm">
                            <div className="flex items-center gap-3">
                                <div className="flex size-9 items-center justify-center rounded-full bg-slate-50 text-slate-400">
                                    🔍
                                </div>
                                <input
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="Search in your resumes..."
                                    className="h-9 w-[360px] border-none bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400"
                                />
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="text-xs text-slate-400">
                                    {resumes.length} {resumes.length === 1 ? "file" : "files"} · {formatBytes(totalSize)}
                                </div>
                                <div className="flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 p-1">
                                    {viewModes.map((mode) => (
                                        <button
                                            key={mode.id}
                                            type="button"
                                            onClick={() => setViewMode(mode.id)}
                                            className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                                                viewMode === mode.id
                                                    ? "bg-white text-slate-900 shadow-sm"
                                                    : "text-slate-400 hover:text-slate-700"
                                            }`}
                                        >
                                            {mode.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {uploadError ? (
                            <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-500">
                                {uploadError}
                            </div>
                        ) : null}

                        <div className="mt-6 min-h-[320px]">
                            {loading ? (
                                <div className="flex h-60 items-center justify-center text-sm text-slate-400">
                                    Loading your resumes...
                                </div>
                            ) : filteredResumes.length === 0 ? (
                                <EmptyState
                                    hasQuery={!!search.trim()}
                                    onUpload={handlePickFile}
                                    uploading={uploading}
                                />
                            ) : viewMode === "grid" ? (
                                <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-4">
                                    {filteredResumes.map((resume) => (
                                        <ResumeCard
                                            key={resume.id}
                                            resume={resume}
                                            onDownload={() => handleDownload(resume.id)}
                                            onDelete={() => setConfirmDeleteId(resume.id)}
                                        />
                                    ))}
                                </div>
                            ) : (
                                <div className="overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white shadow-sm">
                                    <div className="grid grid-cols-[minmax(0,1fr)_140px_120px_160px] items-center gap-4 border-b border-slate-100 px-6 py-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                                        <div>Name</div>
                                        <div>Uploaded</div>
                                        <div>Size</div>
                                        <div className="text-right">Actions</div>
                                    </div>
                                    <ul>
                                        {filteredResumes.map((resume) => (
                                            <ResumeRow
                                                key={resume.id}
                                                resume={resume}
                                                onDownload={() => handleDownload(resume.id)}
                                                onDelete={() => setConfirmDeleteId(resume.id)}
                                            />
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    </div>
                </main>

                {confirmDeleteId ? (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/25 px-6">
                        <div className="w-full max-w-sm rounded-[1.75rem] bg-white p-8 text-center shadow-2xl">
                            <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-rose-50 text-rose-500">
                                ⚠
                            </div>
                            <h3 className="mt-4 text-base font-semibold text-slate-900">Delete this resume?</h3>
                            <p className="mt-2 text-sm text-slate-500">
                                This action is permanent. The file will be removed from your storage.
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

const EmptyState = ({ hasQuery, onUpload, uploading }) => (
    <div className="flex min-h-[320px] flex-col items-center justify-center rounded-[1.75rem] border border-dashed border-slate-200 bg-slate-50/60 px-6 py-16 text-center">
        <div className="flex size-16 items-center justify-center rounded-[1.25rem] bg-[linear-gradient(135deg,#eef1ff,#e0f2fe)] text-2xl">
            📄
        </div>
        <h3 className="mt-5 text-base font-semibold text-slate-900">
            {hasQuery ? "No matches found" : "No resumes yet"}
        </h3>
        <p className="mt-2 max-w-sm text-sm text-slate-500">
            {hasQuery
                ? "Try a different keyword, or upload a new version of your resume."
                : "Upload your first resume to get AI-powered feedback and unlock the chat coach."}
        </p>
        {!hasQuery ? (
            <button
                type="button"
                onClick={onUpload}
                disabled={uploading}
                className="mt-6 inline-flex h-11 items-center justify-center gap-2 rounded-full bg-[linear-gradient(98deg,#504ffd_12%,#40c3fb_91%)] px-6 text-sm font-bold text-white transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60"
            >
                <span className="text-base leading-none">+</span>
                {uploading ? "Uploading..." : "Upload Resume"}
            </button>
        ) : null}
    </div>
);

const ResumeCard = ({ resume, onDownload, onDelete }) => {
    const meta = getMeta(resume.filename);
    return (
        <div className="group relative flex flex-col overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white shadow-sm transition hover:border-[#b8c2ff] hover:shadow-[0_16px_40px_rgba(79,107,255,0.12)]">
            <div className="flex aspect-[4/3] items-center justify-center bg-[linear-gradient(135deg,#eef1ff,#e0f2fe)]">
                <div
                    className={`flex h-24 w-20 items-center justify-center rounded-xl border text-sm font-bold shadow-sm ${meta.color}`}
                >
                    {meta.label}
                </div>
            </div>
            <div className="flex flex-col gap-1 px-4 py-3">
                <p className="truncate text-sm font-semibold text-slate-900" title={resume.filename}>
                    {resume.filename}
                </p>
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span>{formatDate(resume.created_at)}</span>
                    <span>{formatBytes(resume.file_size)}</span>
                </div>
            </div>
            <div className="flex gap-2 border-t border-slate-100 px-4 py-2.5">
                <button
                    type="button"
                    onClick={onDownload}
                    className="flex-1 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-[#4f6bff] hover:text-[#4f6bff]"
                >
                    Download
                </button>
                <button
                    type="button"
                    onClick={onDelete}
                    className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-500 transition hover:border-rose-300 hover:text-rose-500"
                >
                    Delete
                </button>
            </div>
        </div>
    );
};

const ResumeRow = ({ resume, onDownload, onDelete }) => {
    const meta = getMeta(resume.filename);
    return (
        <li className="grid grid-cols-[minmax(0,1fr)_140px_120px_160px] items-center gap-4 border-b border-slate-100 px-6 py-3 text-sm text-slate-700 last:border-b-0 hover:bg-slate-50/60">
            <div className="flex min-w-0 items-center gap-3">
                <div
                    className={`flex size-10 shrink-0 items-center justify-center rounded-lg border text-[10px] font-bold ${meta.color}`}
                >
                    {meta.label}
                </div>
                <span className="truncate font-medium text-slate-900" title={resume.filename}>
                    {resume.filename}
                </span>
            </div>
            <div className="text-xs text-slate-400">{formatDate(resume.created_at)}</div>
            <div className="text-xs text-slate-400">{formatBytes(resume.file_size)}</div>
            <div className="flex justify-end gap-2">
                <button
                    type="button"
                    onClick={onDownload}
                    className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-[#4f6bff] hover:text-[#4f6bff]"
                >
                    Download
                </button>
                <button
                    type="button"
                    onClick={onDelete}
                    className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-500 transition hover:border-rose-300 hover:text-rose-500"
                >
                    Delete
                </button>
            </div>
        </li>
    );
};

export default Page;
