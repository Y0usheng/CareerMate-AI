"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { MobileNavDrawer, MobileTopBar } from "../../Shared/MobileShell";
import PasswordInput from "../../Shared/PasswordInput";
import {
    clearAuth,
    fetchProfile,
    getStoredUser,
    getToken,
    setAuth,
    updateCareer,
    updatePassword,
    updateProfile,
} from "../../../lib/api";

const navItems = [
    { label: "Home", href: "/dashboard" },
    { label: "Resume", href: "/resume" },
    { label: "Settings", href: "/settings" },
];

const tabs = [
    { id: "basic", label: "Basic Information" },
    { id: "learning", label: "Career & Learning" },
    { id: "security", label: "Account Security" },
];

const stageOptions = [
    { value: "", label: "Select" },
    { value: "exploring", label: "Just exploring" },
    { value: "preparing", label: "Preparing resume and portfolio" },
    { value: "applying", label: "Actively applying" },
    { value: "interviewing", label: "Interviewing" },
];

const fieldOptions = [
    { value: "", label: "Select" },
    { value: "software", label: "Software Engineering" },
    { value: "data", label: "Data Science" },
    { value: "design", label: "Product Design" },
    { value: "business", label: "Business Analysis" },
];

const careerGoalOptions = [
    "Frontend Developer",
    "Backend Developer",
    "Full Stack Developer",
    "Mobile Developer",
    "Data Scientist",
    "Data Analyst",
    "Machine Learning Engineer",
    "DevOps Engineer",
    "Cloud Engineer",
    "Cybersecurity Engineer",
    "UI / UX Designer",
    "Product Manager",
    "Business Analyst",
    "QA / Test Engineer",
];

const getInitial = (name) => (name ? name.trim().charAt(0).toUpperCase() : "?");

const Page = () => {
    const router = useRouter();
    const [user, setUser] = useState(null);
    const [activeTab, setActiveTab] = useState("basic");
    const [profile, setProfile] = useState({ fullName: "", email: "", field: "" });
    const [learning, setLearning] = useState({ careerGoal: "", stage: "", skills: "" });
    const [security, setSecurity] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
    const [errors, setErrors] = useState({});
    const [toast, setToast] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [mobileNavOpen, setMobileNavOpen] = useState(false);

    const applyProfile = (data) => {
        setUser(data);
        setProfile({
            fullName: data.full_name || "",
            email: data.email || "",
            field: data.field || "",
        });
        setLearning({
            careerGoal: data.career_goal || "",
            stage: data.stage || "",
            skills: data.skills || "",
        });
    };

    useEffect(() => {
        const token = getToken();
        if (!token) {
            router.replace("/login");
            return;
        }

        const cached = getStoredUser();
        if (cached) applyProfile({ ...cached, career_goal: cached.career_goal, stage: cached.stage, skills: cached.skills, field: cached.field });

        fetchProfile()
            .then(applyProfile)
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

    const showToast = (message) => {
        setToast(message);
        setTimeout(() => setToast(""), 2500);
    };

    const handleBasicSave = async () => {
        const nextErrors = {};
        if (!profile.fullName.trim()) nextErrors.fullName = "Please enter your full name.";
        if (!profile.email.trim()) nextErrors.email = "Please enter your email.";
        if (Object.keys(nextErrors).length > 0) {
            setErrors(nextErrors);
            return;
        }

        setIsSubmitting(true);
        try {
            const updated = await updateProfile({
                full_name: profile.fullName,
                email: profile.email,
                field: profile.field,
            });
            applyProfile(updated);
            const token = getToken();
            if (token) setAuth(token, updated);
            showToast("Basic info updated successfully.");
            setErrors({});
        } catch (err) {
            showToast(err.message || "Update failed");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleLearningSave = async () => {
        setIsSubmitting(true);
        try {
            const updated = await updateCareer({
                career_goal: learning.careerGoal,
                stage: learning.stage,
                skills: learning.skills,
            });
            applyProfile(updated);
            showToast("Career settings updated successfully.");
            setErrors({});
        } catch (err) {
            showToast(err.message || "Update failed");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleSecuritySave = async () => {
        const nextErrors = {};
        if (!security.currentPassword) nextErrors.currentPassword = "Please enter your current password.";
        if (!security.newPassword) {
            nextErrors.newPassword = "Please enter a new password.";
        } else if (security.newPassword.length < 8) {
            nextErrors.newPassword = "Password should be at least 8 characters.";
        }
        if (!security.confirmPassword) {
            nextErrors.confirmPassword = "Please confirm your new password.";
        } else if (security.confirmPassword !== security.newPassword) {
            nextErrors.confirmPassword = "Passwords do not match.";
        }

        if (Object.keys(nextErrors).length > 0) {
            setErrors(nextErrors);
            return;
        }

        setIsSubmitting(true);
        try {
            await updatePassword({
                current_password: security.currentPassword,
                new_password: security.newPassword,
                confirm_password: security.confirmPassword,
            });
            setSecurity({ currentPassword: "", newPassword: "", confirmPassword: "" });
            setErrors({});
            showToast("Your password has been updated successfully.");
        } catch (err) {
            if (err.status === 400 && err.data?.detail?.toLowerCase().includes("current")) {
                setErrors({ currentPassword: "Current password is incorrect." });
            } else {
                showToast(err.message || "Update failed");
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleSave = () => {
        if (activeTab === "basic") handleBasicSave();
        else if (activeTab === "learning") handleLearningSave();
        else handleSecuritySave();
    };

    const inputClassName = (name) =>
        `h-11 w-full rounded-full border px-4 text-sm text-slate-900 outline-none transition ${
            errors[name]
                ? "border-rose-400 bg-rose-50 focus:border-rose-500"
                : "border-slate-200 bg-white focus:border-[#4f6bff] focus:shadow-[0_0_0_3px_rgba(79,107,255,0.12)]"
        }`;

    const selectClassName = (name) =>
        `${inputClassName(name)} appearance-none bg-[url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20' stroke='%2364748b' stroke-width='2'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='m6 8 4 4 4-4'/%3E%3C/svg%3E")] bg-[length:1rem_1rem] bg-[right_1.25rem_center] bg-no-repeat pr-10`;

    const tabTitle = useMemo(() => tabs.find((tab) => tab.id === activeTab)?.label ?? "", [activeTab]);

    const displayName = profile.fullName || "";
    const displayEmail = profile.email || "";
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
                activeLabel="Settings"
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
                            const active = item.label === "Settings";
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

                    <div className="mt-3 flex items-center gap-2.5 rounded-xl border border-slate-100 bg-slate-50/60 px-2.5 py-2">
                        <div className="flex size-8 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white">
                            {getInitial(user?.full_name || user?.email || "")}
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="truncate text-xs font-semibold text-slate-900">
                                {user?.full_name || "—"}
                            </p>
                            <p className="truncate text-[11px] text-slate-500">{user?.email || ""}</p>
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

                <main className="flex flex-1 flex-col px-4 py-5 sm:px-6 lg:px-8">
                    <div className="hidden items-start justify-end lg:flex">
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

                    <div className="mx-auto flex w-full max-w-[980px] flex-1 flex-col pt-2 lg:pt-4">
                        <div>
                            <h1 className="text-xl font-bold text-slate-900">Personal Settings</h1>
                            <p className="mt-2 text-sm text-slate-500">
                                Update your profile, career preferences, and account security.
                            </p>
                        </div>

                        <div className="mt-6 flex flex-col gap-6 lg:mt-8 lg:flex-row lg:gap-8">
                            <div className="w-full rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-sm lg:w-[230px]">
                                <div className="flex items-center gap-3 rounded-2xl bg-slate-50 px-3 py-3">
                                    <div className="flex size-10 items-center justify-center rounded-full bg-slate-950 text-sm font-bold text-white">
                                        {initial}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="truncate text-sm font-semibold text-slate-900">
                                            {displayName || "Loading..."}
                                        </p>
                                        <p className="truncate text-xs text-slate-400">{displayEmail || ""}</p>
                                    </div>
                                </div>

                                <div className="mt-4 flex gap-2 overflow-x-auto lg:flex-col lg:space-y-2 lg:overflow-visible">
                                    {tabs.map((tab) => (
                                        <button
                                            key={tab.id}
                                            type="button"
                                            onClick={() => {
                                                setActiveTab(tab.id);
                                                setErrors({});
                                            }}
                                            className={`flex shrink-0 items-center gap-2 whitespace-nowrap rounded-full px-3 py-2 text-xs transition lg:w-full ${
                                                activeTab === tab.id
                                                    ? "bg-[#eef1ff] font-semibold text-[#4f6bff]"
                                                    : "text-slate-400 hover:bg-slate-50 hover:text-slate-700"
                                            }`}
                                        >
                                            <span
                                                className={`size-1.5 rounded-full ${
                                                    activeTab === tab.id ? "bg-[#4f6bff]" : "bg-slate-300"
                                                }`}
                                            />
                                            {tab.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="flex-1 rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                                <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:gap-6">
                                    <div>
                                        <h2 className="text-base font-semibold text-slate-900">{tabTitle}</h2>
                                        <p className="mt-2 text-sm text-slate-500">
                                            {activeTab === "basic"
                                                ? "Manage your basic profile information."
                                                : activeTab === "learning"
                                                  ? "Adjust your role, stage, and career focus."
                                                  : "Update your password and account protection settings."}
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={handleSave}
                                        disabled={isSubmitting}
                                        className="inline-flex h-10 items-center justify-center rounded-full bg-slate-900 px-6 text-xs font-bold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                                    >
                                        {isSubmitting ? "Saving..." : "Update"}
                                    </button>
                                </div>

                                <div className="mt-6 max-w-[520px] space-y-4 sm:mt-8">
                                    {activeTab === "basic" ? (
                                        <>
                                            <div>
                                                <label className="mb-2 block text-xs font-medium text-slate-500">Name</label>
                                                <input
                                                    name="fullName"
                                                    value={profile.fullName}
                                                    onChange={(e) => {
                                                        setProfile((c) => ({ ...c, fullName: e.target.value }));
                                                        setErrors((c) => ({ ...c, fullName: "" }));
                                                    }}
                                                    className={inputClassName("fullName")}
                                                />
                                                {errors.fullName ? (
                                                    <p className="mt-2 text-xs text-rose-500">{errors.fullName}</p>
                                                ) : null}
                                            </div>
                                            <div>
                                                <label className="mb-2 block text-xs font-medium text-slate-500">Email</label>
                                                <input
                                                    name="email"
                                                    value={profile.email}
                                                    onChange={(e) => {
                                                        setProfile((c) => ({ ...c, email: e.target.value }));
                                                        setErrors((c) => ({ ...c, email: "" }));
                                                    }}
                                                    className={inputClassName("email")}
                                                />
                                                {errors.email ? (
                                                    <p className="mt-2 text-xs text-rose-500">{errors.email}</p>
                                                ) : null}
                                            </div>
                                            <div>
                                                <label className="mb-2 block text-xs font-medium text-slate-500">Your Field</label>
                                                <select
                                                    name="field"
                                                    value={profile.field}
                                                    onChange={(e) => setProfile((c) => ({ ...c, field: e.target.value }))}
                                                    className={selectClassName("field")}
                                                >
                                                    {fieldOptions.map((opt) => (
                                                        <option key={opt.value} value={opt.value}>
                                                            {opt.label}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                        </>
                                    ) : null}

                                    {activeTab === "learning" ? (
                                        <>
                                            <div>
                                                <label className="mb-2 block text-xs font-medium text-slate-500">Career Goal</label>
                                                <select
                                                    name="careerGoal"
                                                    value={learning.careerGoal}
                                                    onChange={(e) => setLearning((c) => ({ ...c, careerGoal: e.target.value }))}
                                                    className={selectClassName("careerGoal")}
                                                >
                                                    <option value="">Select</option>
                                                    {careerGoalOptions.map((role) => (
                                                        <option key={role} value={role}>
                                                            {role}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div>
                                                <label className="mb-2 block text-xs font-medium text-slate-500">Stage</label>
                                                <select
                                                    name="stage"
                                                    value={learning.stage}
                                                    onChange={(e) => setLearning((c) => ({ ...c, stage: e.target.value }))}
                                                    className={selectClassName("stage")}
                                                >
                                                    {stageOptions.map((opt) => (
                                                        <option key={opt.value} value={opt.value}>
                                                            {opt.label}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div>
                                                <label className="mb-2 block text-xs font-medium text-slate-500">Skills</label>
                                                <input
                                                    name="skills"
                                                    value={learning.skills}
                                                    onChange={(e) => setLearning((c) => ({ ...c, skills: e.target.value }))}
                                                    placeholder="React, JavaScript, CSS"
                                                    className={inputClassName("skills")}
                                                />
                                                <p className="mt-2 text-[11px] text-slate-400">Separate multiple skills with commas.</p>
                                            </div>
                                        </>
                                    ) : null}

                                    {activeTab === "security" ? (
                                        <>
                                            <div>
                                                <label className="mb-2 block text-xs font-medium text-slate-500">Current Password</label>
                                                <PasswordInput
                                                    name="currentPassword"
                                                    value={security.currentPassword}
                                                    onChange={(e) => {
                                                        setSecurity((c) => ({ ...c, currentPassword: e.target.value }));
                                                        setErrors((c) => ({ ...c, currentPassword: "" }));
                                                    }}
                                                    inputClassName={inputClassName("currentPassword")}
                                                />
                                                {errors.currentPassword ? (
                                                    <p className="mt-2 text-xs text-rose-500">{errors.currentPassword}</p>
                                                ) : null}
                                            </div>
                                            <div>
                                                <label className="mb-2 block text-xs font-medium text-slate-500">New Password</label>
                                                <PasswordInput
                                                    name="newPassword"
                                                    value={security.newPassword}
                                                    onChange={(e) => {
                                                        setSecurity((c) => ({ ...c, newPassword: e.target.value }));
                                                        setErrors((c) => ({ ...c, newPassword: "" }));
                                                    }}
                                                    inputClassName={inputClassName("newPassword")}
                                                />
                                                {errors.newPassword ? (
                                                    <p className="mt-2 text-xs text-rose-500">{errors.newPassword}</p>
                                                ) : null}
                                            </div>
                                            <div>
                                                <label className="mb-2 block text-xs font-medium text-slate-500">Confirm New Password</label>
                                                <PasswordInput
                                                    name="confirmPassword"
                                                    value={security.confirmPassword}
                                                    onChange={(e) => {
                                                        setSecurity((c) => ({ ...c, confirmPassword: e.target.value }));
                                                        setErrors((c) => ({ ...c, confirmPassword: "" }));
                                                    }}
                                                    inputClassName={inputClassName("confirmPassword")}
                                                />
                                                {errors.confirmPassword ? (
                                                    <p className="mt-2 text-xs text-rose-500">{errors.confirmPassword}</p>
                                                ) : null}
                                            </div>
                                        </>
                                    ) : null}
                                </div>
                            </div>
                        </div>
                    </div>
                </main>

                {toast ? (
                    <div className="fixed right-6 top-6 z-50 rounded-[1.15rem] bg-slate-900 px-4 py-3 text-sm text-white shadow-2xl">
                        {toast}
                    </div>
                ) : null}
            </div>
        </div>
    );
};

export default Page;
