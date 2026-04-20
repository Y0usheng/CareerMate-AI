"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect } from "react";

export const MobileTopBar = ({ onOpenMenu, displayName, displayEmail, initial }) => (
    <div className="flex items-center justify-between gap-3 border-b border-slate-100 bg-white px-4 py-3 lg:hidden">
        <button
            type="button"
            onClick={onOpenMenu}
            aria-label="Open menu"
            className="flex size-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50"
        >
            <svg className="h-5 w-5" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 5h14M3 10h14M3 15h14" strokeLinecap="round" />
            </svg>
        </button>

        <Link href="/" className="inline-flex items-center gap-2">
            <Image src="/landing/13.svg" alt="CareerMate AI logo" width={24} height={24} priority />
            <Image
                src="/landing/career-mate-ai-2.svg"
                alt="CareerMate AI"
                width={110}
                height={20}
                className="h-auto w-auto"
                priority
            />
        </Link>

        <Link
            href="/settings"
            className="flex size-10 items-center justify-center rounded-full bg-slate-950 text-xs font-bold text-white"
            aria-label={displayName || "Account"}
            title={displayEmail || displayName || ""}
        >
            {initial}
        </Link>
    </div>
);

export const MobileNavDrawer = ({ open, onClose, navItems, activeLabel, onLogout }) => {
    useEffect(() => {
        if (!open) return;
        const original = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        return () => {
            document.body.style.overflow = original;
        };
    }, [open]);

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true">
            <div
                className="absolute inset-0 bg-slate-950/40"
                onClick={onClose}
                aria-hidden="true"
            />
            <aside className="absolute inset-y-0 left-0 flex w-[260px] max-w-[80vw] flex-col border-r border-slate-100 bg-white px-5 py-6 shadow-2xl">
                <div className="flex items-center justify-between">
                    <Link href="/" onClick={onClose} className="inline-flex items-center gap-2.5">
                        <Image src="/landing/13.svg" alt="CareerMate AI logo" width={28} height={28} priority />
                        <Image
                            src="/landing/career-mate-ai-2.svg"
                            alt="CareerMate AI"
                            width={128}
                            height={22}
                            className="h-auto w-auto"
                            priority
                        />
                    </Link>
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Close menu"
                        className="flex size-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                    >
                        <svg className="h-5 w-5" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M5 5l10 10M15 5L5 15" strokeLinecap="round" />
                        </svg>
                    </button>
                </div>

                <nav className="mt-8 flex flex-col gap-1">
                    {navItems.map((item) => {
                        const active = item.label === activeLabel;
                        return (
                            <Link
                                key={item.label}
                                href={item.href}
                                onClick={onClose}
                                className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm transition ${
                                    active
                                        ? "bg-slate-50 font-semibold text-[#4f6bff] shadow-[0_4px_12px_rgba(79,107,255,0.08)]"
                                        : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
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
                    onClick={() => {
                        onClose();
                        onLogout();
                    }}
                    className="mt-auto inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-semibold text-slate-500 transition hover:border-slate-300 hover:text-slate-900"
                >
                    Log out
                </button>
            </aside>
        </div>
    );
};
