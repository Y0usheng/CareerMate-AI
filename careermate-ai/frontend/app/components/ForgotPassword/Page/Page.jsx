"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useRef, useState } from "react";

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const Page = () => {
    const [step, setStep] = useState(0);
    const [email, setEmail] = useState("");
    const [code, setCode] = useState(["", "", "", ""]);
    const [passwords, setPasswords] = useState({ password: "", confirmPassword: "" });
    const [errors, setErrors] = useState({});
    const codeRefs = useRef([]);

    const title = useMemo(() => {
        if (step === 0) return "Forgot your password?";
        if (step === 1) return "Check your email";
        if (step === 2) return "Set a new password";
        return "Reset successful";
    }, [step]);

    const description = useMemo(() => {
        if (step === 0) return "Enter your email and we will send you a verification code.";
        if (step === 1) return "We sent a 4-digit code to your email address.";
        if (step === 2) return "Create a secure password so you can get back into your account.";
        return "Your password has been updated successfully.";
    }, [step]);

    const handleEmailSubmit = () => {
        if (!email.trim()) {
            setErrors({ email: "Please enter your email." });
            return;
        }

        if (!emailRegex.test(email)) {
            setErrors({ email: "Please enter a valid email address." });
            return;
        }

        setErrors({});
        setStep(1);
    };

    const handleCodeChange = (index, value) => {
        const nextValue = value.replace(/\D/g, "").slice(0, 1);
        const nextCode = [...code];
        nextCode[index] = nextValue;
        setCode(nextCode);
        setErrors((current) => ({ ...current, code: "" }));

        if (nextValue && index < codeRefs.current.length - 1) {
            codeRefs.current[index + 1]?.focus();
        }
    };

    const handleCodeSubmit = () => {
        const joined = code.join("");

        if (joined.length !== 4) {
            setErrors({ code: "Please enter the 4-digit verification code." });
            return;
        }

        if (joined !== "1234") {
            setErrors({ code: "Invalid verification code. Try 1234 for this demo flow." });
            return;
        }

        setErrors({});
        setStep(2);
    };

    const handlePasswordChange = (event) => {
        const { name, value } = event.target;
        setPasswords((current) => ({ ...current, [name]: value }));
        setErrors((current) => ({ ...current, [name]: "" }));
    };

    const handleResetSubmit = () => {
        const nextErrors = {};

        if (!passwords.password) {
            nextErrors.password = "Please enter a new password.";
        } else if (passwords.password.length < 8) {
            nextErrors.password = "Password should be at least 8 characters.";
        }

        if (!passwords.confirmPassword) {
            nextErrors.confirmPassword = "Please confirm your new password.";
        } else if (passwords.password !== passwords.confirmPassword) {
            nextErrors.confirmPassword = "Passwords do not match.";
        }

        if (Object.keys(nextErrors).length > 0) {
            setErrors(nextErrors);
            return;
        }

        setErrors({});
        setStep(3);
    };

    const inputClassName = (name) =>
        `h-11 w-full rounded-full border px-4 text-sm text-slate-900 outline-none transition ${
            errors[name]
                ? "border-rose-400 bg-rose-50 focus:border-rose-500"
                : "border-slate-200 bg-white focus:border-[#4f6bff] focus:shadow-[0_0_0_3px_rgba(79,107,255,0.12)]"
        }`;

    return (
        <div className="min-h-screen bg-white text-slate-950">
            <div className="mx-auto flex min-h-screen max-w-7xl flex-col px-5 py-5">
                <div className="flex items-center justify-between">
                    <Link href="/" className="inline-flex items-center gap-3">
                        <Image src="/landing/13.svg" alt="CareerMate AI logo" width={32} height={32} priority />
                        <Image
                            src="/landing/career-mate-ai-2.svg"
                            alt="CareerMate AI"
                            width={144}
                            height={24}
                            className="h-auto w-auto"
                            priority
                        />
                    </Link>
                    <Link
                        href="/login"
                        className="inline-flex h-9 items-center justify-center rounded-full border border-slate-200 px-4 text-xs font-medium text-slate-500 transition hover:border-slate-300 hover:text-slate-800"
                    >
                        Log in
                    </Link>
                </div>

                <main className="flex flex-1 items-center justify-center">
                    <section className="w-full max-w-sm text-center">
                        {step === 3 ? (
                            <div>
                                <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-[#4f6bff] text-3xl text-white shadow-[0_18px_36px_rgba(79,107,255,0.35)]">
                                    ✓
                                </div>
                                <p className="mt-6 text-lg font-semibold text-slate-900">{title}</p>
                                <p className="mt-3 text-sm text-slate-500">{description}</p>
                                <Link
                                    href="/login"
                                    className="mt-8 inline-flex h-11 items-center justify-center rounded-full bg-[linear-gradient(98deg,#504ffd_12%,#40c3fb_91%)] px-8 text-sm font-bold text-white transition hover:brightness-105"
                                >
                                    Back to login
                                </Link>
                            </div>
                        ) : (
                            <div>
                                <div className="mx-auto flex size-10 items-center justify-center rounded-full border border-slate-200 text-sm text-slate-400">
                                    {step === 0 ? "@" : step === 1 ? "#" : "o"}
                                </div>
                                <h1 className="mt-6 text-3xl font-black tracking-tight text-slate-900">{title}</h1>
                                <p className="mt-3 text-sm text-slate-500">{description}</p>

                                {step === 0 ? (
                                    <div className="mt-8 space-y-4 text-left">
                                        <div>
                                            <label htmlFor="email" className="mb-2 block text-xs font-medium text-slate-500">
                                                Email
                                            </label>
                                            <input
                                                id="email"
                                                value={email}
                                                onChange={(event) => {
                                                    setEmail(event.target.value);
                                                    setErrors({});
                                                }}
                                                placeholder="Your email"
                                                className={inputClassName("email")}
                                            />
                                            {errors.email ? (
                                                <p className="mt-2 text-xs text-rose-500">{errors.email}</p>
                                            ) : null}
                                        </div>

                                        <button
                                            type="button"
                                            onClick={handleEmailSubmit}
                                            className="inline-flex h-11 w-full items-center justify-center rounded-full bg-[linear-gradient(98deg,#504ffd_12%,#40c3fb_91%)] text-sm font-bold text-white transition hover:brightness-105"
                                        >
                                            Send
                                        </button>
                                    </div>
                                ) : null}

                                {step === 1 ? (
                                    <div className="mt-8">
                                        <div className="flex justify-center gap-3">
                                            {code.map((digit, index) => (
                                                <input
                                                    key={`code-${index}`}
                                                    ref={(element) => {
                                                        codeRefs.current[index] = element;
                                                    }}
                                                    value={digit}
                                                    onChange={(event) => handleCodeChange(index, event.target.value)}
                                                    className={`h-14 w-12 rounded-2xl border text-center text-lg font-semibold outline-none transition ${
                                                        errors.code
                                                            ? "border-rose-400 bg-rose-50"
                                                            : "border-slate-200 bg-white focus:border-[#4f6bff] focus:shadow-[0_0_0_3px_rgba(79,107,255,0.12)]"
                                                    }`}
                                                />
                                            ))}
                                        </div>
                                        {errors.code ? (
                                            <p className="mt-3 text-xs text-rose-500">{errors.code}</p>
                                        ) : null}

                                        <button
                                            type="button"
                                            onClick={handleCodeSubmit}
                                            className="mt-6 inline-flex h-11 w-full items-center justify-center rounded-full bg-[linear-gradient(98deg,#504ffd_12%,#40c3fb_91%)] text-sm font-bold text-white transition hover:brightness-105"
                                        >
                                            Verify code
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => setStep(0)}
                                            className="mt-4 text-xs font-medium text-slate-400 hover:text-[#4f6bff]"
                                        >
                                            Back to email step
                                        </button>
                                    </div>
                                ) : null}

                                {step === 2 ? (
                                    <div className="mt-8 space-y-4 text-left">
                                        <div>
                                            <label htmlFor="password" className="mb-2 block text-xs font-medium text-slate-500">
                                                New Password
                                            </label>
                                            <input
                                                id="password"
                                                name="password"
                                                type="password"
                                                value={passwords.password}
                                                onChange={handlePasswordChange}
                                                placeholder="Create a password"
                                                className={inputClassName("password")}
                                            />
                                            {errors.password ? (
                                                <p className="mt-2 text-xs text-rose-500">{errors.password}</p>
                                            ) : null}
                                        </div>

                                        <div>
                                            <label htmlFor="confirmPassword" className="mb-2 block text-xs font-medium text-slate-500">
                                                Confirm Password
                                            </label>
                                            <input
                                                id="confirmPassword"
                                                name="confirmPassword"
                                                type="password"
                                                value={passwords.confirmPassword}
                                                onChange={handlePasswordChange}
                                                placeholder="Confirm your password"
                                                className={inputClassName("confirmPassword")}
                                            />
                                            {errors.confirmPassword ? (
                                                <p className="mt-2 text-xs text-rose-500">{errors.confirmPassword}</p>
                                            ) : null}
                                        </div>

                                        <button
                                            type="button"
                                            onClick={handleResetSubmit}
                                            className="inline-flex h-11 w-full items-center justify-center rounded-full bg-[linear-gradient(98deg,#504ffd_12%,#40c3fb_91%)] text-sm font-bold text-white transition hover:brightness-105"
                                        >
                                            Reset password
                                        </button>
                                    </div>
                                ) : null}
                            </div>
                        )}
                    </section>
                </main>
            </div>
        </div>
    );
};

export default Page;
