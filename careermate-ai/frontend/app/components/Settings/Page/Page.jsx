"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import logo from "../../Register/Header/assets/logo.png";

const navItems = [
    { label: "Home", href: "/dashboard" },
    { label: "Resume", href: "/dashboard" },
    { label: "Settings", href: "/settings" },
];

const tabs = [
    { id: "basic", label: "Basic Information" },
    { id: "learning", label: "Career & Learning" },
    { id: "security", label: "Account Security" },
];

const initialProfile = {
    fullName: "Ray Zhang",
    email: "ray@example.com",
    field: "Software Engineering",
};

const initialLearning = {
    careerGoal: "Frontend Developer",
    stage: "Actively applying",
    skills: "React, JavaScript, CSS",
};

const initialSecurity = {
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
};

const Page = () => {
    const [activeTab, setActiveTab] = useState("basic");
    const [profile, setProfile] = useState(initialProfile);
    const [learning, setLearning] = useState(initialLearning);
    const [security, setSecurity] = useState(initialSecurity);
    const [errors, setErrors] = useState({});
    const [toast, setToast] = useState("");

    const handleProfileChange = (event) => {
        const { name, value } = event.target;
        setProfile((current) => ({ ...current, [name]: value }));
    };

    const handleLearningChange = (event) => {
        const { name, value } = event.target;
        setLearning((current) => ({ ...current, [name]: value }));
    };

    const handleSecurityChange = (event) => {
        const { name, value } = event.target;
        setSecurity((current) => ({ ...current, [name]: value }));
        setErrors((current) => ({ ...current, [name]: "" }));
    };

    const showToast = (message) => {
        setToast(message);
        setTimeout(() => setToast(""), 2500);
    };

    const handleSave = () => {
        if (activeTab === "security") {
            const nextErrors = {};

            if (!security.currentPassword) {
                nextErrors.currentPassword = "Please enter your current password.";
            }
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

            setErrors({});
            showToast("Your password has been updated successfully.");
            setSecurity(initialSecurity);
            return;
        }

        showToast(activeTab === "basic" ? "Basic info updated successfully." : "Career settings updated successfully.");
    };

    const inputClassName = (name) =>
        `h-11 w-full rounded-full border px-4 text-sm text-slate-900 outline-none transition ${
            errors[name]
                ? "border-rose-400 bg-rose-50 focus:border-rose-500"
                : "border-slate-200 bg-white focus:border-[#4f6bff] focus:shadow-[0_0_0_3px_rgba(79,107,255,0.12)]"
        }`;

    const tabTitle = useMemo(() => tabs.find((tab) => tab.id === activeTab)?.label ?? "", [activeTab]);

    return (
        <div className="min-h-screen overflow-x-auto bg-white text-slate-950">
            <div className="mx-auto flex min-h-screen min-w-[1180px] max-w-[1600px]">
                <aside className="flex w-[190px] flex-col border-r border-slate-100 bg-slate-50/55 px-4 py-5">
                    <Link href="/" className="inline-flex items-center">
                        <Image src={logo} alt="CareerMate AI" width={164} height={22} priority />
                    </Link>

                    <div className="mt-8 space-y-1">
                        {navItems.map((item) => {
                            return (
                                <Link
                                    key={item.label}
                                    href={item.href}
                                    className={`flex items-center gap-2 rounded-full px-3 py-2 text-xs transition ${
                                        item.label === "Settings"
                                            ? "bg-white font-semibold text-[#4f6bff] shadow-sm"
                                            : "text-slate-400 hover:bg-white hover:text-slate-700"
                                    }`}
                                >
                                    <span
                                        className={`size-1.5 rounded-full ${
                                            item.label === "Settings" ? "bg-[#4f6bff]" : "bg-slate-300"
                                        }`}
                                    />
                                    {item.label}
                                </Link>
                            );
                        })}
                    </div>

                    <div className="mt-auto rounded-[1.5rem] border border-slate-200 bg-white p-3 shadow-sm">
                        <div className="flex items-center gap-2.5">
                            <div className="flex size-8 items-center justify-center rounded-full bg-slate-950 text-xs font-bold text-white">
                                R
                            </div>
                            <div>
                                <p className="text-xs font-semibold text-slate-900">Ray Zhang</p>
                                <p className="text-[11px] text-slate-400">ray@example.com</p>
                            </div>
                        </div>
                        <div className="mt-3 space-y-1.5 text-[11px] text-slate-400">
                            <p>Profile Settings</p>
                            <p>Career Preferences</p>
                            <p>Account Security</p>
                        </div>
                    </div>
                </aside>

                <main className="flex flex-1 flex-col px-8 py-5">
                    <div className="flex items-start justify-end">
                        <div className="flex items-center gap-3 rounded-full border border-slate-200 bg-white px-3 py-2 shadow-sm">
                            <div className="text-right">
                                <p className="text-[11px] font-semibold text-slate-900">Ray Zhang</p>
                                <p className="text-[10px] text-slate-400">Personal settings</p>
                            </div>
                            <div className="flex size-8 items-center justify-center rounded-full bg-slate-950 text-xs font-bold text-white">
                                R
                            </div>
                        </div>
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
                                        R
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-slate-900">Ray Zhang</p>
                                        <p className="text-xs text-slate-400">ray@example.com</p>
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
                                        className="inline-flex h-10 items-center justify-center rounded-full bg-[linear-gradient(98deg,#504ffd_12%,#40c3fb_91%)] px-6 text-xs font-bold text-white transition hover:brightness-105"
                                    >
                                        Update
                                    </button>
                                </div>

                                <div className="mt-8 max-w-[520px] space-y-4">
                                    {activeTab === "basic" ? (
                                        <>
                                            <div>
                                                <label className="mb-2 block text-xs font-medium text-slate-500">
                                                    Name
                                                </label>
                                                <input
                                                    name="fullName"
                                                    value={profile.fullName}
                                                    onChange={handleProfileChange}
                                                    className={inputClassName("fullName")}
                                                />
                                            </div>
                                            <div>
                                                <label className="mb-2 block text-xs font-medium text-slate-500">
                                                    Email
                                                </label>
                                                <input
                                                    name="email"
                                                    value={profile.email}
                                                    onChange={handleProfileChange}
                                                    className={inputClassName("email")}
                                                />
                                            </div>
                                            <div>
                                                <label className="mb-2 block text-xs font-medium text-slate-500">
                                                    Your Field
                                                </label>
                                                <input
                                                    name="field"
                                                    value={profile.field}
                                                    onChange={handleProfileChange}
                                                    className={inputClassName("field")}
                                                />
                                            </div>
                                        </>
                                    ) : null}

                                    {activeTab === "learning" ? (
                                        <>
                                            <div>
                                                <label className="mb-2 block text-xs font-medium text-slate-500">
                                                    Career Goal
                                                </label>
                                                <input
                                                    name="careerGoal"
                                                    value={learning.careerGoal}
                                                    onChange={handleLearningChange}
                                                    className={inputClassName("careerGoal")}
                                                />
                                            </div>
                                            <div>
                                                <label className="mb-2 block text-xs font-medium text-slate-500">
                                                    Stage
                                                </label>
                                                <select
                                                    name="stage"
                                                    value={learning.stage}
                                                    onChange={handleLearningChange}
                                                    className={inputClassName("stage")}
                                                >
                                                    <option>Actively applying</option>
                                                    <option>Preparing</option>
                                                    <option>Interviewing</option>
                                                    <option>Exploring</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="mb-2 block text-xs font-medium text-slate-500">
                                                    Skills
                                                </label>
                                                <input
                                                    name="skills"
                                                    value={learning.skills}
                                                    onChange={handleLearningChange}
                                                    className={inputClassName("skills")}
                                                />
                                            </div>
                                        </>
                                    ) : null}

                                    {activeTab === "security" ? (
                                        <>
                                            <div>
                                                <label className="mb-2 block text-xs font-medium text-slate-500">
                                                    Current Password
                                                </label>
                                                <input
                                                    name="currentPassword"
                                                    type="password"
                                                    value={security.currentPassword}
                                                    onChange={handleSecurityChange}
                                                    className={inputClassName("currentPassword")}
                                                />
                                                {errors.currentPassword ? (
                                                    <p className="mt-2 text-xs text-rose-500">{errors.currentPassword}</p>
                                                ) : null}
                                            </div>
                                            <div>
                                                <label className="mb-2 block text-xs font-medium text-slate-500">
                                                    New Password
                                                </label>
                                                <input
                                                    name="newPassword"
                                                    type="password"
                                                    value={security.newPassword}
                                                    onChange={handleSecurityChange}
                                                    className={inputClassName("newPassword")}
                                                />
                                                {errors.newPassword ? (
                                                    <p className="mt-2 text-xs text-rose-500">{errors.newPassword}</p>
                                                ) : null}
                                            </div>
                                            <div>
                                                <label className="mb-2 block text-xs font-medium text-slate-500">
                                                    Confirm New Password
                                                </label>
                                                <input
                                                    name="confirmPassword"
                                                    type="password"
                                                    value={security.confirmPassword}
                                                    onChange={handleSecurityChange}
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
