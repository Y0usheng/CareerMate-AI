"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { MobileNavDrawer, MobileTopBar } from "../../Shared/MobileShell";
import {
    clearAuth,
    deleteResume,
    fetchProfile,
    fetchResumes,
    getStoredUser,
    getToken,
    sendChatMessage,
    uploadResume,
} from "../../../lib/api";

const CHAT_STORAGE_KEY = "careermate_chats";

const starterPrompts = [
    "Summarize my resume and suggest three improvements.",
    "Help me tailor my resume for a frontend developer role.",
    "Turn my internship experience into stronger bullet points.",
];

const navItems = [
    { label: "Home", href: "/dashboard" },
    { label: "Resume", href: "/resume" },
    { label: "Settings", href: "/settings" },
];

const getInitial = (name) => (name ? name.trim().charAt(0).toUpperCase() : "?");

const makeId = () => `c_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

const titleFromMessages = (messages) => {
    const firstUser = messages.find((m) => m.role === "user");
    if (!firstUser) return "New chat";
    const text = firstUser.text.trim().replace(/\s+/g, " ");
    return text.length > 36 ? `${text.slice(0, 36)}…` : text;
};

const createEmptyConversation = () => ({
    id: makeId(),
    title: "New chat",
    messages: [],
    updatedAt: Date.now(),
});

const loadConversations = () => {
    if (typeof window === "undefined") return [];
    try {
        const raw = window.localStorage.getItem(CHAT_STORAGE_KEY);
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
};

const saveConversations = (list) => {
    if (typeof window === "undefined") return;
    try {
        window.localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(list));
    } catch {
        // quota or serialization — ignore
    }
};

const Page = () => {
    const router = useRouter();
    const [user, setUser] = useState(null);
    const [resumeStatus, setResumeStatus] = useState("idle");
    const [resumeName, setResumeName] = useState("");
    const [resumeId, setResumeId] = useState(null);
    const [input, setInput] = useState("");
    const [conversations, setConversations] = useState([]);
    const [activeId, setActiveId] = useState(null);
    const [isReplying, setIsReplying] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");
    const [mobileNavOpen, setMobileNavOpen] = useState(false);
    const [accountMenuOpen, setAccountMenuOpen] = useState(false);
    const fileInputRef = useRef(null);
    const accountMenuRef = useRef(null);
    const messagesEndRef = useRef(null);

    useEffect(() => {
        const token = getToken();
        if (!token) {
            router.replace("/login");
            return;
        }

        const cached = getStoredUser();
        if (cached) setUser(cached);

        fetchProfile()
            .then((profile) => {
                setUser({
                    id: profile.id,
                    full_name: profile.full_name,
                    email: profile.email,
                });
            })
            .catch((err) => {
                if (err.status === 401) {
                    clearAuth();
                    router.replace("/login");
                }
            });

        fetchResumes()
            .then((list) => {
                if (Array.isArray(list) && list.length > 0) {
                    setResumeName(list[0].filename || "");
                    setResumeId(list[0].id);
                    setResumeStatus("uploaded");
                }
            })
            .catch(() => {});
    }, [router]);

    useEffect(() => {
        const loaded = loadConversations();
        if (loaded.length > 0) {
            setConversations(loaded);
            setActiveId(loaded[0].id);
        } else {
            const fresh = createEmptyConversation();
            setConversations([fresh]);
            setActiveId(fresh.id);
        }
    }, []);

    useEffect(() => {
        if (conversations.length > 0) saveConversations(conversations);
    }, [conversations]);

    useEffect(() => {
        if (!accountMenuOpen) return;
        const handle = (e) => {
            if (accountMenuRef.current && !accountMenuRef.current.contains(e.target)) {
                setAccountMenuOpen(false);
            }
        };
        document.addEventListener("mousedown", handle);
        return () => document.removeEventListener("mousedown", handle);
    }, [accountMenuOpen]);

    const activeConversation = useMemo(
        () => conversations.find((c) => c.id === activeId) || null,
        [conversations, activeId]
    );
    const messages = activeConversation?.messages || [];

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    }, [messages.length, isReplying]);

    const handleLogout = () => {
        clearAuth();
        router.replace("/login");
    };

    const displayName = user?.full_name || "";
    const displayEmail = user?.email || "";
    const initial = getInitial(displayName || displayEmail);
    const firstName = displayName.split(/\s+/)[0] || "there";

    const updateActive = (updater) => {
        setConversations((list) =>
            list.map((c) => (c.id === activeId ? { ...updater(c), updatedAt: Date.now() } : c))
        );
    };

    const handleNewChat = () => {
        const existingEmpty = conversations.find((c) => c.messages.length === 0);
        if (existingEmpty) {
            setActiveId(existingEmpty.id);
            return;
        }
        const fresh = createEmptyConversation();
        setConversations((list) => [fresh, ...list]);
        setActiveId(fresh.id);
        setInput("");
        setErrorMessage("");
    };

    const handleDeleteChat = (id, e) => {
        e.stopPropagation();
        setConversations((list) => {
            const filtered = list.filter((c) => c.id !== id);
            if (filtered.length === 0) {
                const fresh = createEmptyConversation();
                setActiveId(fresh.id);
                return [fresh];
            }
            if (id === activeId) setActiveId(filtered[0].id);
            return filtered;
        });
    };

    const openPicker = () => fileInputRef.current?.click();

    const handleFileChange = async (event) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setResumeName(file.name);
        setErrorMessage("");
        setResumeStatus("uploading");

        try {
            const uploaded = await uploadResume(file);
            setResumeStatus("uploaded");
            if (uploaded?.id) setResumeId(uploaded.id);
        } catch (err) {
            setResumeStatus("error");
            setErrorMessage(err.message || "We failed to upload your resume. Please try again.");
        } finally {
            event.target.value = "";
        }
    };

    const handleRemoveResume = async () => {
        if (!resumeId) {
            setResumeStatus("idle");
            setResumeName("");
            return;
        }
        try {
            await deleteResume(resumeId);
        } catch {
            // ignore — still clear locally
        }
        setResumeId(null);
        setResumeName("");
        setResumeStatus("idle");
        setErrorMessage("");
    };

    const handleSend = async () => {
        if (!input.trim() || resumeStatus !== "uploaded" || isReplying) return;

        const question = input.trim();
        const history = messages.map((m) => ({ role: m.role, content: m.text }));
        const userMessage = {
            id: Date.now(),
            role: "user",
            text: question,
            attachment: resumeName ? { name: resumeName } : null,
        };
        updateActive((c) => {
            const nextMessages = [...c.messages, userMessage];
            return {
                ...c,
                messages: nextMessages,
                title: c.messages.length === 0 ? titleFromMessages(nextMessages) : c.title,
            };
        });
        setInput("");
        setIsReplying(true);
        setErrorMessage("");

        try {
            const { reply } = await sendChatMessage(question, history);
            updateActive((c) => ({
                ...c,
                messages: [
                    ...c.messages,
                    { id: Date.now() + 1, role: "assistant", text: reply || "(no response)" },
                ],
            }));
        } catch (err) {
            setErrorMessage(err.message || "AI service failed. Please try again.");
        } finally {
            setIsReplying(false);
        }
    };

    const isEmpty = messages.length === 0;

    return (
        <div className="h-screen overflow-hidden bg-slate-50 text-slate-950">
            <MobileTopBar
                onOpenMenu={() => setMobileNavOpen(true)}
                displayName={displayName}
                displayEmail={displayEmail}
                initial={initial}
            />
            <MobileNavDrawer
                open={mobileNavOpen}
                onClose={() => setMobileNavOpen(false)}
                navItems={navItems.map((n) => ({ ...n, active: n.label === "Home" }))}
                activeLabel="Home"
                onLogout={handleLogout}
            />

            <div className="mx-auto flex h-full max-w-[1600px] flex-col lg:flex-row">
                {/* Sidebar — history */}
                <aside className="hidden h-full w-[280px] shrink-0 flex-col overflow-hidden border-r border-slate-200 bg-white px-4 py-5 lg:flex">
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

                    <button
                        type="button"
                        onClick={handleNewChat}
                        className="mt-6 inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
                    >
                        <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                            <path d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" />
                        </svg>
                        New chat
                    </button>

                    <p className="mt-6 px-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                        Recent
                    </p>

                    <div className="mt-2 flex flex-1 flex-col gap-1 overflow-y-auto pr-1">
                        {conversations.length === 0 ||
                        (conversations.length === 1 && conversations[0].messages.length === 0) ? (
                            <div className="mt-2 rounded-xl border border-dashed border-slate-200 bg-slate-50/60 px-3 py-5 text-center">
                                <p className="text-[13px] font-semibold text-slate-700">
                                    No conversations yet
                                </p>
                                <p className="mt-1 text-[11px] text-slate-500">
                                    Upload a resume and start chatting to create your first resume suggestion.
                                </p>
                            </div>
                        ) : (
                            conversations.map((c) => {
                                const active = c.id === activeId;
                                return (
                                    <button
                                        key={c.id}
                                        type="button"
                                        onClick={() => setActiveId(c.id)}
                                        className={`group flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm transition ${
                                            active
                                                ? "bg-[#eef1ff] font-semibold text-slate-900"
                                                : "text-slate-600 hover:bg-slate-50"
                                        }`}
                                    >
                                        <svg
                                            className={`h-4 w-4 shrink-0 ${
                                                active ? "text-[#4f6bff]" : "text-slate-400"
                                            }`}
                                            viewBox="0 0 20 20"
                                            fill="currentColor"
                                            aria-hidden="true"
                                        >
                                            <path d="M2 5a3 3 0 013-3h10a3 3 0 013 3v7a3 3 0 01-3 3H8l-4 3v-3H5a3 3 0 01-3-3V5z" />
                                        </svg>
                                        <span className="flex-1 truncate">{c.title || "New chat"}</span>
                                        <span
                                            role="button"
                                            tabIndex={0}
                                            onClick={(e) => handleDeleteChat(c.id, e)}
                                            onKeyDown={(e) => {
                                                if (e.key === "Enter" || e.key === " ") handleDeleteChat(c.id, e);
                                            }}
                                            aria-label="Delete conversation"
                                            className="opacity-0 transition group-hover:opacity-100"
                                        >
                                            <svg
                                                className="h-4 w-4 text-slate-400 hover:text-rose-500"
                                                viewBox="0 0 20 20"
                                                fill="currentColor"
                                            >
                                                <path
                                                    fillRule="evenodd"
                                                    d="M8 3a1 1 0 00-1 1v1H4a1 1 0 100 2h12a1 1 0 100-2h-3V4a1 1 0 00-1-1H8zM5 8a1 1 0 011 1v7a2 2 0 002 2h4a2 2 0 002-2V9a1 1 0 112 0v7a4 4 0 01-4 4H8a4 4 0 01-4-4V9a1 1 0 011-1z"
                                                    clipRule="evenodd"
                                                />
                                            </svg>
                                        </span>
                                    </button>
                                );
                            })
                        )}
                    </div>

                    <nav className="mt-3 flex flex-col gap-0.5 border-t border-slate-100 pt-3">
                        {navItems.map((item) => {
                            const active = item.label === "Home";
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
                                    <svg
                                        className="h-4 w-4 shrink-0 text-slate-500"
                                        viewBox="0 0 20 20"
                                        fill="currentColor"
                                        aria-hidden="true"
                                    >
                                        {item.label === "Home" ? (
                                            <path d="M10 2.5a1 1 0 01.7.29l7 6.5a1 1 0 01-.7 1.71H16v6a1 1 0 01-1 1h-3v-5H8v5H5a1 1 0 01-1-1v-6H3a1 1 0 01-.7-1.71l7-6.5A1 1 0 0110 2.5z" />
                                        ) : item.label === "Resume" ? (
                                            <path d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V7.41a2 2 0 00-.59-1.41l-3.41-3.41A2 2 0 0010.59 2H6zm1 7a1 1 0 011-1h4a1 1 0 110 2H8a1 1 0 01-1-1zm0 3a1 1 0 011-1h4a1 1 0 110 2H8a1 1 0 01-1-1zm0 3a1 1 0 011-1h2a1 1 0 110 2H8a1 1 0 01-1-1z" />
                                        ) : (
                                            <path
                                                fillRule="evenodd"
                                                d="M11.49 2.17a1 1 0 00-1.98 0l-.17 1.04a6.9 6.9 0 00-1.7.7l-.87-.61a1 1 0 00-1.4 1.4l.6.87a6.9 6.9 0 00-.7 1.7l-1.04.17a1 1 0 000 1.98l1.04.17a6.9 6.9 0 00.7 1.7l-.6.87a1 1 0 001.4 1.4l.87-.6a6.9 6.9 0 001.7.7l.17 1.04a1 1 0 001.98 0l.17-1.04a6.9 6.9 0 001.7-.7l.87.6a1 1 0 001.4-1.4l-.6-.87a6.9 6.9 0 00.7-1.7l1.04-.17a1 1 0 000-1.98l-1.04-.17a6.9 6.9 0 00-.7-1.7l.6-.87a1 1 0 00-1.4-1.4l-.87.6a6.9 6.9 0 00-1.7-.7l-.17-1.04zM10 12.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z"
                                                clipRule="evenodd"
                                            />
                                        )}
                                    </svg>
                                    {item.label}
                                </Link>
                            );
                        })}
                    </nav>
                </aside>

                {/* Main */}
                <main className="flex h-full flex-1 flex-col overflow-hidden min-w-0">
                    {/* Top bar with avatar menu */}
                    <div className="hidden items-center justify-between border-b border-slate-200 bg-white px-6 py-3 lg:flex">
                        <div className="flex items-center gap-2 min-w-0">
                            <svg className="h-4 w-4 shrink-0 text-slate-400" viewBox="0 0 20 20" fill="currentColor">
                                <path d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm2 4a1 1 0 100 2h8a1 1 0 100-2H6zm0 3a1 1 0 100 2h8a1 1 0 100-2H6zm0 3a1 1 0 100 2h5a1 1 0 100-2H6z" />
                            </svg>
                            <p className="truncate text-sm font-semibold text-slate-900">
                                {activeConversation?.title || "New chat"}
                            </p>
                        </div>
                        <div className="relative" ref={accountMenuRef}>
                            <button
                                type="button"
                                onClick={() => setAccountMenuOpen((o) => !o)}
                                className="flex items-center gap-3 rounded-full border border-slate-200 bg-white py-1.5 pl-1.5 pr-4 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
                                aria-haspopup="menu"
                                aria-expanded={accountMenuOpen}
                            >
                                <div className="flex size-9 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white">
                                    {initial}
                                </div>
                                <div className="text-left">
                                    <p className="text-xs font-semibold text-slate-900">
                                        {displayName || "Loading..."}
                                    </p>
                                    <p className="text-[11px] text-slate-400">{displayEmail}</p>
                                </div>
                                <svg
                                    className={`h-4 w-4 text-slate-400 transition ${
                                        accountMenuOpen ? "rotate-180" : ""
                                    }`}
                                    viewBox="0 0 20 20"
                                    fill="currentColor"
                                >
                                    <path
                                        fillRule="evenodd"
                                        d="M5.23 7.21a.75.75 0 011.06.02L10 11.06l3.71-3.83a.75.75 0 111.08 1.04l-4.24 4.38a.75.75 0 01-1.08 0L5.21 8.27a.75.75 0 01.02-1.06z"
                                        clipRule="evenodd"
                                    />
                                </svg>
                            </button>

                            {accountMenuOpen ? (
                                <div
                                    role="menu"
                                    className="absolute right-0 mt-2 w-60 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_20px_50px_rgba(15,23,42,0.12)]"
                                >
                                    <div className="border-b border-slate-100 px-4 py-3">
                                        <p className="text-xs uppercase tracking-wide text-slate-400">
                                            Signed in as
                                        </p>
                                        <p className="mt-1 truncate text-sm font-semibold text-slate-900">
                                            {displayName || firstName}
                                        </p>
                                        {displayEmail ? (
                                            <p className="truncate text-xs text-slate-500">{displayEmail}</p>
                                        ) : null}
                                    </div>
                                    <button
                                        type="button"
                                        onClick={handleLogout}
                                        className="flex w-full items-center gap-3 border-t border-slate-100 px-4 py-3 text-left text-sm font-medium text-rose-600 transition hover:bg-rose-50"
                                        role="menuitem"
                                    >
                                        <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                            <path
                                                fillRule="evenodd"
                                                d="M3 4.75A2.75 2.75 0 015.75 2h4.5a.75.75 0 010 1.5h-4.5c-.69 0-1.25.56-1.25 1.25v10.5c0 .69.56 1.25 1.25 1.25h4.5a.75.75 0 010 1.5h-4.5A2.75 2.75 0 013 15.25V4.75zm10.47 2.22a.75.75 0 011.06 0l2.5 2.5a.75.75 0 010 1.06l-2.5 2.5a.75.75 0 11-1.06-1.06L14.69 10.5H8.75a.75.75 0 010-1.5h5.94l-1.22-1.22a.75.75 0 010-1.06z"
                                                clipRule="evenodd"
                                            />
                                        </svg>
                                        Log out
                                    </button>
                                </div>
                            ) : null}
                        </div>
                    </div>

                    {/* Chat area */}
                    <div className="flex flex-1 flex-col overflow-y-auto bg-slate-50 px-4 py-5 sm:px-6 lg:px-8">
                        <div className="mx-auto flex w-full max-w-[820px] flex-1 flex-col">
                            {isEmpty ? (
                                <div className="flex flex-1 flex-col items-center justify-center py-10 text-center">
                                    <div className="flex size-14 items-center justify-center rounded-2xl bg-slate-900 shadow-[0_12px_30px_rgba(15,23,42,0.18)]">
                                        <svg className="h-7 w-7 text-white" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M7 2a2 2 0 00-2 2v16a2 2 0 002 2h10a2 2 0 002-2V8l-6-6H7zm6 1.5V8h4.5L13 3.5zM8 13a1 1 0 011-1h6a1 1 0 110 2H9a1 1 0 01-1-1zm1 3a1 1 0 100 2h4a1 1 0 100-2H9z" />
                                        </svg>
                                    </div>
                                    <p className="mt-4 text-xs uppercase tracking-[0.22em] text-slate-400">
                                        Resume Coach
                                    </p>
                                    <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-900 sm:text-4xl lg:text-[44px]">
                                        {displayName ? `Hi, ${firstName}` : "Hi there"}
                                    </h1>
                                    <p className="mt-3 max-w-md text-sm text-slate-500">
                                        {resumeStatus === "uploaded"
                                            ? "Your resume is ready. Ask a question below or pick a prompt to start."
                                            : "Upload your resume to create your first resume suggestion."}
                                    </p>

                                    {resumeStatus === "uploaded" ? (
                                        <div className="mt-8 grid w-full max-w-2xl gap-2.5 sm:grid-cols-3">
                                            {starterPrompts.map((p) => (
                                                <button
                                                    key={p}
                                                    type="button"
                                                    onClick={() => setInput(p)}
                                                    className="rounded-2xl border border-slate-200 bg-white p-4 text-left text-[13px] text-slate-600 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-400 hover:text-slate-900"
                                                >
                                                    {p}
                                                </button>
                                            ))}
                                        </div>
                                    ) : null}
                                </div>
                            ) : (
                                <div className="flex flex-1 flex-col gap-3 py-6">
                                    {messages.map((message) => (
                                        <div
                                            key={message.id}
                                            className={`flex gap-3 ${
                                                message.role === "assistant" ? "" : "flex-row-reverse"
                                            }`}
                                        >
                                            <div
                                                className={`flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                                                    message.role === "assistant"
                                                        ? "bg-slate-900 text-white"
                                                        : "bg-slate-200 text-slate-700"
                                                }`}
                                            >
                                                {message.role === "assistant" ? (
                                                    <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                                        <path d="M13.5 2a1.5 1.5 0 00-1.06.44L3.2 11.68a1 1 0 00-.26.46l-.9 3.6a1 1 0 001.21 1.21l3.6-.9a1 1 0 00.46-.26l9.24-9.24a1.5 1.5 0 000-2.12L14.56 2.44A1.5 1.5 0 0013.5 2z" />
                                                    </svg>
                                                ) : (
                                                    initial
                                                )}
                                            </div>
                                            <div
                                                className={`max-w-[82%] rounded-2xl px-4 py-3 text-[13px] leading-6 shadow-sm ${
                                                    message.role === "assistant"
                                                        ? "border border-slate-200 bg-white text-slate-700"
                                                        : "bg-[#eef1ff] text-slate-900"
                                                }`}
                                            >
                                                {message.role === "assistant" ? (
                                                    <div className="prose-chat">
                                                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                                            {message.text}
                                                        </ReactMarkdown>
                                                    </div>
                                                ) : (
                                                    <div className="flex flex-col gap-2">
                                                        {message.attachment ? (
                                                            <div className="inline-flex w-fit items-center gap-1.5 self-end rounded-full border border-slate-200 bg-white/70 py-1 pl-2 pr-3 text-slate-700">
                                                                <svg className="h-3.5 w-3.5 text-slate-500" viewBox="0 0 20 20" fill="currentColor">
                                                                    <path
                                                                        fillRule="evenodd"
                                                                        d="M8 4a3 3 0 00-3 3v6a5 5 0 0010 0V8a1 1 0 112 0v5a7 7 0 11-14 0V7a5 5 0 0110 0v6a3 3 0 11-6 0V8a1 1 0 112 0v5a1 1 0 102 0V7a3 3 0 00-3-3z"
                                                                        clipRule="evenodd"
                                                                    />
                                                                </svg>
                                                                <span className="max-w-[200px] truncate text-[11px] font-medium">
                                                                    {message.attachment.name}
                                                                </span>
                                                            </div>
                                                        ) : null}
                                                        <p className="whitespace-pre-wrap">{message.text}</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                    {isReplying ? (
                                        <div className="flex gap-3">
                                            <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-slate-900 text-white">
                                                <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                                    <path d="M13.5 2a1.5 1.5 0 00-1.06.44L3.2 11.68a1 1 0 00-.26.46l-.9 3.6a1 1 0 001.21 1.21l3.6-.9a1 1 0 00.46-.26l9.24-9.24a1.5 1.5 0 000-2.12L14.56 2.44A1.5 1.5 0 0013.5 2z" />
                                                </svg>
                                            </div>
                                            <div className="flex items-center gap-1.5 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-[13px] text-slate-400 shadow-sm">
                                                <span className="size-1.5 animate-pulse rounded-full bg-slate-400" />
                                                <span className="size-1.5 animate-pulse rounded-full bg-slate-400 [animation-delay:120ms]" />
                                                <span className="size-1.5 animate-pulse rounded-full bg-slate-400 [animation-delay:240ms]" />
                                            </div>
                                        </div>
                                    ) : null}
                                    <div ref={messagesEndRef} />
                                </div>
                            )}

                            {errorMessage ? (
                                <div className="mb-3 self-center rounded-full bg-slate-900 px-5 py-2.5 text-xs text-white shadow-lg">
                                    {errorMessage}
                                </div>
                            ) : null}

                            {/* Composer */}
                            <div className="sticky bottom-0 mt-4 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-[0_16px_32px_rgba(15,23,42,0.06)]">
                                <div className="flex items-center gap-3">
                                    <button
                                        type="button"
                                        onClick={openPicker}
                                        title="Upload resume"
                                        className="flex size-9 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-slate-500 transition hover:border-slate-400 hover:text-slate-900"
                                    >
                                        <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                            <path d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" />
                                        </svg>
                                    </button>

                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept=".pdf,.doc,.docx"
                                        className="hidden"
                                        onChange={handleFileChange}
                                    />

                                    <input
                                        value={input}
                                        onChange={(event) => setInput(event.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter" && !e.shiftKey) {
                                                e.preventDefault();
                                                handleSend();
                                            }
                                        }}
                                        disabled={resumeStatus !== "uploaded"}
                                        placeholder={
                                            resumeStatus === "uploaded"
                                                ? "Ask me to review your resume, rewrite bullets, or prep for interviews..."
                                                : "Upload your resume to start chatting..."
                                        }
                                        className="h-10 flex-1 border-none bg-transparent text-[13px] text-slate-800 outline-none placeholder:text-slate-400 disabled:cursor-not-allowed"
                                    />

                                    <button
                                        type="button"
                                        onClick={handleSend}
                                        disabled={resumeStatus !== "uploaded" || !input.trim() || isReplying}
                                        className="flex size-9 shrink-0 items-center justify-center rounded-full bg-slate-900 text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
                                    >
                                        <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                            <path
                                                fillRule="evenodd"
                                                d="M10 3a1 1 0 01.78.37l5 6a1 1 0 01-1.56 1.26L11 6.85V16a1 1 0 11-2 0V6.85l-3.22 3.78a1 1 0 11-1.56-1.26l5-6A1 1 0 0110 3z"
                                                clipRule="evenodd"
                                            />
                                        </svg>
                                    </button>
                                </div>

                                <div className="mt-2 flex items-center justify-between gap-3 text-[11px] text-slate-400">
                                    {resumeStatus === "uploaded" && resumeName ? (
                                        <div className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 py-1 pl-2 pr-1 text-slate-700">
                                            <svg className="h-3.5 w-3.5 text-slate-500" viewBox="0 0 20 20" fill="currentColor">
                                                <path
                                                    fillRule="evenodd"
                                                    d="M8 4a3 3 0 00-3 3v6a5 5 0 0010 0V8a1 1 0 112 0v5a7 7 0 11-14 0V7a5 5 0 0110 0v6a3 3 0 11-6 0V8a1 1 0 112 0v5a1 1 0 102 0V7a3 3 0 00-3-3z"
                                                    clipRule="evenodd"
                                                />
                                            </svg>
                                            <span className="max-w-[180px] truncate text-[11px] font-medium">
                                                {resumeName}
                                            </span>
                                            <button
                                                type="button"
                                                onClick={openPicker}
                                                title="Replace file"
                                                className="flex size-5 items-center justify-center rounded-full text-slate-400 transition hover:bg-white hover:text-slate-700"
                                            >
                                                <svg className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                                                    <path d="M10 3a7 7 0 105.94 10.7 1 1 0 10-1.7-1.06A5 5 0 115 10a1 1 0 10-2 0 7 7 0 007 7" />
                                                    <path d="M10 6a1 1 0 011 1v2h2a1 1 0 110 2h-3a1 1 0 01-1-1V7a1 1 0 011-1z" />
                                                </svg>
                                            </button>
                                            <button
                                                type="button"
                                                onClick={handleRemoveResume}
                                                title="Remove file"
                                                className="flex size-5 items-center justify-center rounded-full text-slate-400 transition hover:bg-white hover:text-rose-500"
                                            >
                                                <svg className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                                                    <path
                                                        fillRule="evenodd"
                                                        d="M4.29 4.29a1 1 0 011.42 0L10 8.58l4.29-4.3a1 1 0 111.42 1.42L11.42 10l4.3 4.29a1 1 0 11-1.42 1.42L10 11.42l-4.29 4.3a1 1 0 11-1.42-1.42L8.58 10 4.29 5.71a1 1 0 010-1.42z"
                                                        clipRule="evenodd"
                                                    />
                                                </svg>
                                            </button>
                                        </div>
                                    ) : (
                                        <span className="truncate pr-3">PDF, DOC, DOCX — up to 10MB</span>
                                    )}
                                    <span className="shrink-0">
                                        {resumeStatus === "uploading"
                                            ? "Uploading..."
                                            : resumeStatus === "uploaded"
                                              ? "Resume ready"
                                              : resumeStatus === "error"
                                                ? "Upload failed"
                                                : "Waiting"}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default Page;
