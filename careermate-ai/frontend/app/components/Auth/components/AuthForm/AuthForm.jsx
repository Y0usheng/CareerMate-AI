"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import AuthField from "../AuthField";
import { authContent } from "../../data";

const initialValuesByMode = {
    login: {
        email: "",
        password: "",
        remember: true,
    },
    register: {
        fullName: "",
        email: "",
        password: "",
    },
};

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const AuthForm = ({ mode }) => {
    const router = useRouter();
    const content = authContent[mode];
    const [values, setValues] = useState(initialValuesByMode[mode]);
    const [errors, setErrors] = useState({});
    const [banner, setBanner] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [successView, setSuccessView] = useState(false);
    const [successToast, setSuccessToast] = useState("");
    const [infoModal, setInfoModal] = useState("");

    const cardTitle = useMemo(() => content.title, [content.title]);

    const validate = () => {
        const nextErrors = {};

        if (mode === "register" && !values.fullName.trim()) {
            nextErrors.fullName = "Please enter your full name.";
        }

        if (!values.email.trim()) {
            nextErrors.email = "Please enter your email.";
        } else if (!emailRegex.test(values.email)) {
            nextErrors.email = "Please enter a valid email address.";
        }

        if (!values.password.trim()) {
            nextErrors.password = "Please enter your password.";
        } else if (mode === "register" && values.password.length < 8) {
            nextErrors.password = "Password should be at least 8 characters.";
        }

        return nextErrors;
    };

    const handleChange = (event) => {
        const { checked, name, type, value } = event.target;

        setValues((current) => ({
            ...current,
            [name]: type === "checkbox" ? checked : value,
        }));
        setErrors((current) => ({ ...current, [name]: "" }));
        setBanner("");
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setBanner("");

        const nextErrors = validate();
        if (Object.keys(nextErrors).length > 0) {
            setErrors(nextErrors);
            setBanner(
                mode === "login"
                    ? "Invalid email or password. Please try again."
                    : "Please complete the required fields before continuing."
            );
            return;
        }

        if (mode === "register" && values.email.toLowerCase().includes("exists")) {
            setInfoModal("Email already registered, please log in instead.");
            return;
        }

        if (mode === "login" && values.email.toLowerCase().includes("network")) {
            setBanner("Network error, please try again later.");
            return;
        }

        setIsSubmitting(true);
        setInfoModal("");

        await new Promise((resolve) => setTimeout(resolve, 1000));

        setIsSubmitting(false);

        if (mode === "register") {
            setSuccessView(true);
            setTimeout(() => router.push(content.redirectHref), 1500);
            return;
        }

        setSuccessToast(content.successMessage);
        setTimeout(() => router.push(content.redirectHref), 1200);
    };

    if (successView) {
        return (
            <section className="relative flex min-h-[640px] items-center justify-center overflow-hidden rounded-[2rem] bg-white">
                <div className="text-center">
                    <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-[#4f6bff] text-3xl text-white shadow-[0_18px_36px_rgba(79,107,255,0.35)]">
                        ✓
                    </div>
                    <p className="mt-6 text-sm font-medium text-slate-700">{content.successMessage}</p>
                    <Link
                        href="/"
                        className="mt-5 inline-flex text-sm font-semibold text-[#4f6bff] hover:underline"
                    >
                        Back to home
                    </Link>
                </div>
            </section>
        );
    }

    return (
        <section className="relative flex min-h-[640px] items-center">
            <div className="mx-auto w-full max-w-[28rem]">
                <div className="mb-10">
                    <Link
                        href="/"
                        className="mb-6 inline-flex text-sm font-semibold text-slate-500 hover:text-[#4f6bff]"
                    >
                        ← Back to home
                    </Link>
                    <h1 className="text-4xl font-black tracking-tight text-slate-950">{cardTitle}</h1>
                    <p className="mt-3 text-sm text-slate-500">{content.description}</p>
                </div>

                {banner ? (
                    <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-500">
                        {banner}
                    </div>
                ) : null}

                <form onSubmit={handleSubmit} className="space-y-4">
                    {content.fields.map((field) => (
                        <AuthField
                            key={field.name}
                            {...field}
                            value={values[field.name]}
                            onChange={handleChange}
                            error={errors[field.name]}
                        />
                    ))}

                    {mode === "login" ? (
                        <div className="flex items-center justify-between gap-4 pt-1 text-xs">
                            <label className="flex items-center gap-2 text-slate-500">
                                <input
                                    type="checkbox"
                                    name="remember"
                                    checked={values.remember}
                                    onChange={handleChange}
                                    className="size-4 rounded border-slate-300 accent-[#4f6bff]"
                                />
                                Remember Me
                            </label>
                            <Link
                                href="/forgot-password"
                                className="font-medium text-[#4f6bff] transition hover:opacity-80"
                            >
                                Forgot Password?
                            </Link>
                        </div>
                    ) : null}

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="mt-4 inline-flex h-12 w-full items-center justify-center rounded-full bg-[linear-gradient(98deg,#504ffd_12%,#40c3fb_91%)] text-sm font-bold text-white transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-70"
                    >
                        {isSubmitting ? "Please wait..." : content.submitLabel}
                    </button>
                </form>

                <p className="mt-5 text-center text-xs text-slate-500">
                    {content.helperText}{" "}
                    <Link href={content.helperHref} className="font-semibold text-[#4f6bff] hover:underline">
                        {content.helperLinkLabel}
                    </Link>
                </p>
                <p className="mt-3 text-center text-xs text-slate-500">
                    <Link href="/" className="font-medium text-slate-500 hover:text-[#4f6bff] hover:underline">
                        Back to home
                    </Link>
                </p>
            </div>

            {successToast ? (
                <div className="pointer-events-none absolute inset-x-0 top-[60%] flex justify-center">
                    <div className="rounded-full bg-slate-800 px-6 py-3 text-sm font-medium text-white shadow-xl">
                        {successToast}
                    </div>
                </div>
            ) : null}

            {infoModal ? (
                <div className="absolute inset-0 flex items-center justify-center bg-slate-950/22 px-6">
                    <div className="w-full max-w-xs rounded-[1.75rem] bg-white p-8 text-center shadow-2xl">
                        <div className="mx-auto flex size-10 items-center justify-center rounded-full bg-amber-100 text-amber-500">
                            !
                        </div>
                        <p className="mt-5 text-sm leading-6 text-slate-700">{infoModal}</p>
                        <Link
                            href="/login"
                            className="mt-6 inline-flex rounded-full bg-[linear-gradient(98deg,#504ffd_12%,#40c3fb_91%)] px-6 py-3 text-sm font-semibold text-white"
                        >
                            Go to Login
                        </Link>
                    </div>
                </div>
            ) : null}
        </section>
    );
};

export default AuthForm;
