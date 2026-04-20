"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
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
                            const active = item.label === "Settings";
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

                <main className="flex flex-1 flex-col px-8 py-5">
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

                    <div className="mx-auto flex w-full max-w-[980px] flex-1 flex-col pt-4">
                        <div>
                            <h1 className="text-xl font-bold text-slate-900">Personal Settings</h1>
                            <p className="mt-2 text-sm text-slate-500">
                                Update your profile, career preferences, and account security.
                            </p>
                        </div>

                        <div className="mt-8 flex gap-8">
                            <div className="w-[230px] rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-sm">
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

                                <div className="mt-4 space-y-2">
                                    {tabs.map((tab) => (
                                        <button
                                            key={tab.id}
                                            type="button"
                                            onClick={() => {
                                                setActiveTab(tab.id);
                                                setErrors({});
                                            }}
                                            className={`flex w-full items-center gap-2 rounded-full px-3 py-2 text-xs transition ${
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

                            <div className="flex-1 rounded-[1.5rem] border border-slate-200 bg-white p-6 shadow-sm">
                                <div className="flex items-start justify-between gap-6">
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
                                        className="inline-flex h-10 items-center justify-center rounded-full bg-[linear-gradient(98deg,#504ffd_12%,#40c3fb_91%)] px-6 text-xs font-bold text-white transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60"
                                    >
                                        {isSubmitting ? "Saving..." : "Update"}
                                    </button>
                                </div>

                                <div className="mt-8 max-w-[520px] space-y-4">
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
                                                <input
                                                    name="currentPassword"
                                                    type="password"
                                                    value={security.currentPassword}
                                                    onChange={(e) => {
                                                        setSecurity((c) => ({ ...c, currentPassword: e.target.value }));
                                                        setErrors((c) => ({ ...c, currentPassword: "" }));
                                                    }}
                                                    className={inputClassName("currentPassword")}
                                                />
                                                {errors.currentPassword ? (
                                                    <p className="mt-2 text-xs text-rose-500">{errors.currentPassword}</p>
                                                ) : null}
                                            </div>
                                            <div>
                                                <label className="mb-2 block text-xs font-medium text-slate-500">New Password</label>
                                                <input
                                                    name="newPassword"
                                                    type="password"
                                                    value={security.newPassword}
                                                    onChange={(e) => {
                                                        setSecurity((c) => ({ ...c, newPassword: e.target.value }));
                                                        setErrors((c) => ({ ...c, newPassword: "" }));
                                                    }}
                                                    className={inputClassName("newPassword")}
                                                />
                                                {errors.newPassword ? (
                                                    <p className="mt-2 text-xs text-rose-500">{errors.newPassword}</p>
                                                ) : null}
                                            </div>
                                            <div>
                                                <label className="mb-2 block text-xs font-medium text-slate-500">Confirm New Password</label>
                                                <input
                                                    name="confirmPassword"
                                                    type="password"
                                                    value={security.confirmPassword}
                                                    onChange={(e) => {
                                                        setSecurity((c) => ({ ...c, confirmPassword: e.target.value }));
                                                        setErrors((c) => ({ ...c, confirmPassword: "" }));
                                                    }}
                                                    className={inputClassName("confirmPassword")}
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
