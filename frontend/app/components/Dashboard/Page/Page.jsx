"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
    clearAuth,
    fetchProfile,
    getStoredUser,
    getToken,
} from "../../../lib/api";

const starterPrompts = [
    "Summarize my resume and suggest three improvements.",
    "Help me tailor my resume for a frontend developer role.",
    "Turn my internship experience into stronger bullet points.",
];

const navItems = [
    { label: "Home", href: "/dashboard", active: true },
    { label: "Resume", href: "/resume", active: false },
    { label: "Settings", href: "/settings", active: false },
];

const getInitial = (name) => (name ? name.trim().charAt(0).toUpperCase() : "?");

const Page = () => {
    const router = useRouter();
    const [user, setUser] = useState(null);
    const [resumeStatus, setResumeStatus] = useState("idle");
    const [resumeName, setResumeName] = useState("");
    const [input, setInput] = useState("");
    const [messages, setMessages] = useState([]);
    const [isReplying, setIsReplying] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");
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
    }, [router]);

    const handleLogout = () => {
        clearAuth();
        router.replace("/login");
    };

    const displayName = user?.full_name || "";
    const displayEmail = user?.email || "";
    const initial = getInitial(displayName || displayEmail);

    const openPicker = () => fileInputRef.current?.click();

    const simulateUpload = async (file) => {
        setResumeName(file.name);
        setErrorMessage("");
        setResumeStatus("uploading");

        await new Promise((resolve) => setTimeout(resolve, 1000));

        if (file.name.toLowerCase().includes("error")) {
            setResumeStatus("error");
            setErrorMessage("We failed to upload your resume. Please try again.");
            return;
        }

        setResumeStatus("uploaded");
        setMessages([
            {
                id: 1,
                role: "assistant",
                text: `Your resume "${file.name}" has been uploaded. Ask me anything about improving it.`,
            },
        ]);
    };

    const handleFileChange = async (event) => {
        const file = event.target.files?.[0];
        if (!file) return;

        await simulateUpload(file);
        event.target.value = "";
    };

    const handleSend = async () => {
        if (!input.trim() || resumeStatus !== "uploaded" || isReplying) return;

        const question = input.trim();
        setMessages((current) => [...current, { id: Date.now(), role: "user", text: question }]);
        setInput("");
        setIsReplying(true);

        await new Promise((resolve) => setTimeout(resolve, 900));

        setMessages((current) => [
            ...current,
            {
                id: Date.now() + 1,
                role: "assistant",
                text: "Based on your resume, I would tighten the summary, add measurable outcomes, and align the wording more closely with your target role.",
            },
        ]);
        setIsReplying(false);
    };

    const showPromptExamples = resumeStatus === "uploaded" && messages.length <= 1;

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
                        {navItems.map((item) => (
                            <Link
                                key={item.label}
                                href={item.href}
                                className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm transition ${
                                    item.active
                                        ? "bg-white font-semibold text-[#4f6bff] shadow-[0_4px_12px_rgba(79,107,255,0.08)]"
                                        : "text-slate-500 hover:bg-white hover:text-slate-900"
                                }`}
                            >
                                <span
                                    className={`size-1.5 rounded-full ${
                                        item.active ? "bg-[#4f6bff]" : "bg-slate-300"
                                    }`}
                                />
                                {item.label}
                            </Link>
                        ))}
                    </nav>

                    <button
                        type="button"
                        onClick={handleLogout}
                        className="mt-auto inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-semibold text-slate-500 transition hover:border-slate-300 hover:text-slate-900"
                    >
                        Log out
                    </button>
                </aside>

                <main className="flex flex-1 flex-col px-8 py-5">
                    <div className="flex items-start justify-end">
                        <Link
                            href="/settings"
                            className="flex items-center gap-3 rounded-full border border-slate-200 bg-white px-3 py-2 shadow-sm transition hover:border-slate-300"
                        >
                            <div className="text-right">
                                <p className="text-xs font-semibold text-slate-900">
                                    {displayName || "Loading..."}
                                </p>
                                <p className="mt-0.5 text-[11px] text-slate-400">
                                    {displayEmail || ""}
                                </p>
                            </div>
                            <div className="flex size-9 items-center justify-center rounded-full bg-slate-950 text-xs font-bold text-white">
                                {initial}
                            </div>
                        </Link>
                    </div>

                    <div className="mx-auto flex w-full max-w-[930px] flex-1 flex-col items-center justify-center pb-10 pt-6">
                        <div className="text-center">
                            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">AI resume coach</p>
                            <h1 className="mt-3 text-[44px] font-black tracking-tight text-slate-900">
                                {displayName ? `Hi, ${displayName}` : "Hi there"}
                            </h1>
                            <p className="mt-3 text-sm text-slate-500">
                                Upload your resume and start chatting with CareerMate AI.
                            </p>
                        </div>

                        {messages.length > 0 ? (
                            <div className="mt-10 flex w-full max-w-[760px] flex-col gap-3">
                                {messages.map((message) => (
                                    <div
                                        key={message.id}
                                        className={`max-w-[76%] rounded-[1.15rem] px-4 py-3 text-[13px] leading-6 shadow-sm ${
                                            message.role === "assistant"
                                                ? "self-start border border-slate-200 bg-white text-slate-700"
                                                : "self-end bg-[#eef1ff] text-slate-900"
                                        }`}
                                    >
                                        {message.text}
                                    </div>
                                ))}
                                {isReplying ? (
                                    <div className="self-start rounded-[1.15rem] border border-slate-200 bg-white px-4 py-3 text-[13px] text-slate-400 shadow-sm">
                                        CareerMate AI is thinking...
                                    </div>
                                ) : null}
                            </div>
                        ) : (
                            <div className="mt-12 flex h-40 items-center justify-center text-sm text-slate-300">
                                {resumeStatus === "idle"
                                    ? "No messages yet."
                                    : resumeStatus === "uploading"
                                      ? "Analyzing your resume..."
                                      : resumeStatus === "error"
                                        ? "Upload failed. Please try again."
                                        : null}
                            </div>
                        )}

                        {showPromptExamples ? (
                            <div className="mt-6 flex w-full max-w-[760px] flex-col gap-2.5">
                                {starterPrompts.map((prompt) => (
                                    <button
                                        key={prompt}
                                        type="button"
                                        onClick={() => setInput(prompt)}
                                        className="rounded-[1rem] border border-slate-200 bg-white px-4 py-3 text-left text-[13px] text-slate-600 transition hover:border-[#4f6bff] hover:text-slate-900"
                                    >
                                        {prompt}
                                    </button>
                                ))}
                            </div>
                        ) : null}

                        {errorMessage ? (
                            <div className="mt-6 rounded-full bg-slate-900 px-5 py-3 text-sm text-white shadow-lg">
                                {errorMessage}
                            </div>
                        ) : null}

                        <div className="mt-9 w-full max-w-[760px] rounded-[1.35rem] border border-[#9db7ff] bg-white px-4 py-3 shadow-[0_16px_32px_rgba(79,107,255,0.08)]">
                            <div className="flex items-center gap-3">
                                <button
                                    type="button"
                                    onClick={openPicker}
                                    className="flex size-9 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-base text-slate-500 transition hover:border-slate-300"
                                >
                                    +
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
                                    className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[linear-gradient(98deg,#504ffd_12%,#40c3fb_91%)] text-sm text-white shadow-md transition disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    ↑
                                </button>
                            </div>

                            <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400">
                                <span>
                                    {resumeName
                                        ? `Selected file: ${resumeName}`
                                        : "Accepted formats: PDF, DOC, DOCX"}
                                </span>
                                <span>
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
                </main>
            </div>
        </div>
    );
};

export default Page;
