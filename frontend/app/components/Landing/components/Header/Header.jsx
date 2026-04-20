"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { navigationLinks } from "../../data";
import { clearAuth, getStoredUser, getToken } from "../../../../lib/api";

const getInitials = (name = "") => {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return "U";
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

const Header = () => {
    const router = useRouter();
    const [user, setUser] = useState(null);
    const [mounted, setMounted] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);
    const [mobileNavOpen, setMobileNavOpen] = useState(false);
    const menuRef = useRef(null);

    useEffect(() => {
        setMounted(true);
        const syncUser = () => {
            if (getToken()) {
                setUser(getStoredUser());
            } else {
                setUser(null);
            }
        };
        syncUser();
        window.addEventListener("storage", syncUser);
        window.addEventListener("focus", syncUser);
        return () => {
            window.removeEventListener("storage", syncUser);
            window.removeEventListener("focus", syncUser);
        };
    }, []);

    useEffect(() => {
        if (!menuOpen) return;
        const handleClick = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setMenuOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClick);
        return () => document.removeEventListener("mousedown", handleClick);
    }, [menuOpen]);

    const handleLogout = () => {
        clearAuth();
        setUser(null);
        setMenuOpen(false);
        router.refresh();
    };

    const displayName = user?.full_name || user?.email || "";
    const firstName = displayName.split(/\s+/)[0] || "there";
    const isLoggedIn = mounted && !!user;

    return (
        <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/85 backdrop-blur">
            <div className="mx-auto flex h-[64px] w-full max-w-7xl items-center justify-between gap-3 px-4 sm:h-[72px] sm:gap-6 sm:px-6 lg:px-10">
                <Link href="/" className="flex items-center gap-2 sm:gap-3">
                    <Image src="/landing/13.svg" alt="CareerMate AI logo" width={32} height={32} className="h-7 w-7 sm:h-8 sm:w-8" />
                    <Image
                        src="/landing/career-mate-ai-2.svg"
                        alt="CareerMate AI"
                        width={144}
                        height={24}
                        className="h-auto w-auto"
                    />
                </Link>

                <nav className="hidden items-center gap-2 rounded-full border border-slate-200 bg-slate-50/80 px-3 py-2 md:flex">
                    {navigationLinks.map((link) => (
                        <a
                            key={link.href}
                            href={link.href}
                            className="rounded-full px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-white hover:text-slate-950"
                        >
                            {link.label}
                        </a>
                    ))}
                </nav>

                <div className="flex items-center gap-2 sm:gap-3">
                    <button
                        type="button"
                        onClick={() => setMobileNavOpen(true)}
                        aria-label="Open menu"
                        className="flex size-9 items-center justify-center rounded-full border border-slate-200 text-slate-600 transition hover:bg-slate-50 md:hidden"
                    >
                        <svg className="h-5 w-5" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M3 5h14M3 10h14M3 15h14" strokeLinecap="round" />
                        </svg>
                    </button>
                    {isLoggedIn ? (
                        <>
                            <div className="relative" ref={menuRef}>
                                <button
                                    type="button"
                                    onClick={() => setMenuOpen((open) => !open)}
                                    className="flex items-center gap-2 rounded-full border border-slate-200 bg-white py-1.5 pl-1.5 pr-4 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
                                    aria-haspopup="menu"
                                    aria-expanded={menuOpen}
                                >
                                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[linear-gradient(135deg,#504ffd,#40c3fb)] text-xs font-bold text-white">
                                        {getInitials(displayName)}
                                    </span>
                                    <span className="hidden sm:inline">
                                        <span className="text-slate-500">Hello, </span>
                                        <span className="text-slate-950">{firstName}</span>
                                    </span>
                                    <svg
                                        className={`h-4 w-4 text-slate-400 transition ${menuOpen ? "rotate-180" : ""}`}
                                        viewBox="0 0 20 20"
                                        fill="currentColor"
                                        aria-hidden="true"
                                    >
                                        <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.06l3.71-3.83a.75.75 0 111.08 1.04l-4.24 4.38a.75.75 0 01-1.08 0L5.21 8.27a.75.75 0 01.02-1.06z" clipRule="evenodd" />
                                    </svg>
                                </button>

                                {menuOpen ? (
                                    <div
                                        role="menu"
                                        className="absolute right-0 mt-2 w-60 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_20px_50px_rgba(15,23,42,0.12)]"
                                    >
                                        <div className="border-b border-slate-100 px-4 py-3">
                                            <p className="text-xs uppercase tracking-wide text-slate-400">
                                                Signed in as
                                            </p>
                                            <p className="mt-1 truncate text-sm font-semibold text-slate-900">
                                                {displayName}
                                            </p>
                                            {user?.email && user?.full_name ? (
                                                <p className="truncate text-xs text-slate-500">{user.email}</p>
                                            ) : null}
                                        </div>
                                        <Link
                                            href="/dashboard"
                                            onClick={() => setMenuOpen(false)}
                                            className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                                            role="menuitem"
                                        >
                                            <svg className="h-4 w-4 text-slate-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                                <path d="M3 4a1 1 0 011-1h5a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm8 0a1 1 0 011-1h5a1 1 0 011 1v3a1 1 0 01-1 1h-5a1 1 0 01-1-1V4zm0 8a1 1 0 011-1h5a1 1 0 011 1v5a1 1 0 01-1 1h-5a1 1 0 01-1-1v-5zm-8 2a1 1 0 011-1h5a1 1 0 011 1v3a1 1 0 01-1 1H4a1 1 0 01-1-1v-3z" />
                                            </svg>
                                            Back to Dashboard
                                        </Link>
                                        <button
                                            type="button"
                                            onClick={handleLogout}
                                            className="flex w-full items-center gap-3 border-t border-slate-100 px-4 py-3 text-left text-sm font-medium text-rose-600 transition hover:bg-rose-50"
                                            role="menuitem"
                                        >
                                            <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                                <path fillRule="evenodd" d="M3 4.75A2.75 2.75 0 015.75 2h4.5a.75.75 0 010 1.5h-4.5c-.69 0-1.25.56-1.25 1.25v10.5c0 .69.56 1.25 1.25 1.25h4.5a.75.75 0 010 1.5h-4.5A2.75 2.75 0 013 15.25V4.75zm10.47 2.22a.75.75 0 011.06 0l2.5 2.5a.75.75 0 010 1.06l-2.5 2.5a.75.75 0 11-1.06-1.06L14.69 10.5H8.75a.75.75 0 010-1.5h5.94l-1.22-1.22a.75.75 0 010-1.06z" clipRule="evenodd" />
                                            </svg>
                                            Log out
                                        </button>
                                    </div>
                                ) : null}
                            </div>

                            <button
                                type="button"
                                onClick={handleLogout}
                                className="hidden rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 sm:inline-flex"
                            >
                                Log out
                            </button>
                        </>
                    ) : (
                        <>
                            <Link
                                href="/login"
                                className="hidden rounded-full px-4 py-2 text-sm font-semibold text-slate-600 transition hover:text-slate-950 sm:inline-flex"
                            >
                                Sign In
                            </Link>
                            <Link
                                href="/register"
                                className="inline-flex rounded-full bg-slate-950 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-slate-800 sm:px-5 sm:py-3 sm:text-sm"
                            >
                                Start for Free
                            </Link>
                        </>
                    )}
                </div>
            </div>

            {mobileNavOpen ? (
                <div className="fixed inset-0 z-50 md:hidden" role="dialog" aria-modal="true">
                    <div className="absolute inset-0 bg-slate-950/40" onClick={() => setMobileNavOpen(false)} />
                    <div className="absolute inset-x-0 top-0 border-b border-slate-200 bg-white px-4 py-4 shadow-xl">
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-semibold text-slate-900">Menu</span>
                            <button
                                type="button"
                                onClick={() => setMobileNavOpen(false)}
                                aria-label="Close menu"
                                className="flex size-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100"
                            >
                                <svg className="h-5 w-5" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M5 5l10 10M15 5L5 15" strokeLinecap="round" />
                                </svg>
                            </button>
                        </div>
                        <nav className="mt-4 flex flex-col gap-1">
                            {navigationLinks.map((link) => (
                                <a
                                    key={link.href}
                                    href={link.href}
                                    onClick={() => setMobileNavOpen(false)}
                                    className="rounded-xl px-3 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                                >
                                    {link.label}
                                </a>
                            ))}
                        </nav>
                    </div>
                </div>
            ) : null}
        </header>
    );
};

export default Header;
