"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import logo from "../../Register/Header/assets/logo.png";

const steps = [
    { id: "welcome", label: "Welcome" },
    { id: "basic", label: "Basic Information" },
    { id: "skills", label: "Skills" },
    { id: "career", label: "Career Goal" },
    { id: "finish", label: "Finish" },
];

const initialValues = {
    fullName: "",
    role: "",
    field: "",
    skills: [],
    targetRole: "",
    stage: "",
    goal: "",
};

const skillOptions = [
    "JavaScript",
    "React",
    "Node.js",
    "Python",
    "SQL",
    "UI Design",
    "Data Analysis",
    "Cloud",
];

const stepTitles = {
    welcome: {
        title: "Welcome to CareerMate AI !",
        description: "Let us guide you as you prepare and grow.",
    },
    basic: {
        title: "Basic Information",
        description: "Tell us who you are so we can personalize your experience.",
    },
    skills: {
        title: "Your Skills",
        description: "Pick the areas you already feel comfortable with.",
    },
    career: {
        title: "Career Goal",
        description: "Tell us what role you want and where you are in your job search.",
    },
    finish: {
        title: "Setup Complete !",
        description: "You are all set to start your AI career journey.",
    },
};

const Page = () => {
    const router = useRouter();
    const [step, setStep] = useState(0);
    const [values, setValues] = useState(initialValues);
    const [errors, setErrors] = useState({});

    const currentStep = steps[step].id;

    const setFieldValue = (name, value) => {
        setValues((current) => ({ ...current, [name]: value }));
        setErrors((current) => ({ ...current, [name]: "" }));
    };

    const handleChange = (event) => {
        const { name, value } = event.target;
        setFieldValue(name, value);
    };

    const toggleSkill = (skill) => {
        const hasSkill = values.skills.includes(skill);
        const nextSkills = hasSkill
            ? values.skills.filter((item) => item !== skill)
            : [...values.skills, skill];

        setFieldValue("skills", nextSkills);
    };

    const validateStep = () => {
        const nextErrors = {};

        if (currentStep === "basic") {
            if (!values.fullName.trim()) nextErrors.fullName = "Please enter your full name.";
            if (!values.role) nextErrors.role = "Please choose your role.";
            if (!values.field) nextErrors.field = "Please choose your field.";
        }

        if (currentStep === "skills" && values.skills.length === 0) {
            nextErrors.skills = "Please choose at least one skill.";
        }

        if (currentStep === "career") {
            if (!values.targetRole.trim()) nextErrors.targetRole = "Please enter your target role.";
            if (!values.stage) nextErrors.stage = "Please choose your current stage.";
            if (!values.goal.trim()) nextErrors.goal = "Please enter your main goal.";
        }

        return nextErrors;
    };

    const goNext = () => {
        const nextErrors = validateStep();

        if (Object.keys(nextErrors).length > 0) {
            setErrors(nextErrors);
            return;
        }

        setStep((current) => Math.min(current + 1, steps.length - 1));
    };

    const goBack = () => setStep((current) => Math.max(current - 1, 0));

    const fieldClassName = (name) =>
        `h-12 w-full rounded-full border bg-white px-4 text-sm text-slate-900 outline-none transition ${
            errors[name]
                ? "border-rose-400 bg-rose-50 focus:border-rose-500"
                : "border-slate-200 focus:border-[#5b63ff] focus:shadow-[0_0_0_3px_rgba(91,99,255,0.12)]"
        }`;

    const titleConfig = stepTitles[currentStep];

    return (
        <div className="min-h-screen overflow-x-auto bg-white text-slate-950">
            <div className="mx-auto flex min-h-screen min-w-[980px] max-w-[1440px]">
                <aside className="flex w-[220px] flex-col bg-slate-50 px-6 py-8">
                    <Link href="/" className="inline-flex items-center">
                        <Image src={logo} alt="CareerMate AI" width={184} height={24} priority />
                    </Link>

                    <nav className="mt-auto pb-8">
                        <ol className="space-y-5">
                            {steps.map((item, index) => {
                                const active = index === step;
                                const completed = index < step;

                                return (
                                    <li key={item.id} className="flex items-center gap-3">
                                        <span
                                            className={`flex size-5 items-center justify-center rounded-full text-[10px] font-bold ${
                                                active || completed
                                                    ? "bg-[#4f6bff] text-white"
                                                    : "bg-white text-slate-400"
                                            }`}
                                        >
                                            {index + 1}
                                        </span>
                                        <span
                                            className={`text-sm ${
                                                active ? "font-semibold text-[#4f6bff]" : "text-slate-400"
                                            }`}
                                        >
                                            {item.label}
                                        </span>
                                    </li>
                                );
                            })}
                        </ol>
                    </nav>
                </aside>

                <main className="flex flex-1 items-center justify-center px-16 py-12">
                    {currentStep === "welcome" ? (
                        <div className="text-center">
                            <h1 className="text-5xl font-black tracking-tight text-slate-900">
                                {titleConfig.title}
                            </h1>
                            <p className="mt-4 text-sm text-slate-500">{titleConfig.description}</p>
                            <button
                                type="button"
                                onClick={goNext}
                                className="mt-10 inline-flex h-12 items-center justify-center rounded-full bg-[linear-gradient(98deg,#504ffd_12%,#40c3fb_91%)] px-10 text-sm font-bold text-white transition hover:brightness-105"
                            >
                                Start Setup
                            </button>
                        </div>
                    ) : null}

                    {currentStep === "basic" ? (
                        <div className="w-full max-w-md">
                            <h2 className="text-3xl font-black tracking-tight text-slate-900">
                                {titleConfig.title}
                            </h2>
                            <p className="mt-3 text-sm text-slate-500">{titleConfig.description}</p>

                            <div className="mt-10 space-y-5">
                                <div>
                                    <label htmlFor="fullName" className="mb-2 block text-xs font-medium text-slate-500">
                                        Your Name
                                    </label>
                                    <input
                                        id="fullName"
                                        name="fullName"
                                        value={values.fullName}
                                        onChange={handleChange}
                                        placeholder="Enter your name"
                                        className={fieldClassName("fullName")}
                                    />
                                    {errors.fullName ? (
                                        <p className="mt-2 text-xs text-rose-500">{errors.fullName}</p>
                                    ) : null}
                                </div>

                                <div>
                                    <label htmlFor="role" className="mb-2 block text-xs font-medium text-slate-500">
                                        Your Role
                                    </label>
                                    <select
                                        id="role"
                                        name="role"
                                        value={values.role}
                                        onChange={handleChange}
                                        className={fieldClassName("role")}
                                    >
                                        <option value="">Select</option>
                                        <option value="student">Student</option>
                                        <option value="graduate">Graduate</option>
                                        <option value="professional">Professional</option>
                                    </select>
                                    {errors.role ? (
                                        <p className="mt-2 text-xs text-rose-500">{errors.role}</p>
                                    ) : null}
                                </div>

                                <div>
                                    <label htmlFor="field" className="mb-2 block text-xs font-medium text-slate-500">
                                        Your Field
                                    </label>
                                    <select
                                        id="field"
                                        name="field"
                                        value={values.field}
                                        onChange={handleChange}
                                        className={fieldClassName("field")}
                                    >
                                        <option value="">Select</option>
                                        <option value="software">Software Engineering</option>
                                        <option value="data">Data Science</option>
                                        <option value="design">Product Design</option>
                                        <option value="business">Business Analysis</option>
                                    </select>
                                    {errors.field ? (
                                        <p className="mt-2 text-xs text-rose-500">{errors.field}</p>
                                    ) : null}
                                </div>
                            </div>

                            <div className="mt-10 flex items-center justify-between gap-4">
                                <button
                                    type="button"
                                    onClick={goBack}
                                    className="inline-flex h-11 items-center justify-center rounded-full border border-slate-200 px-6 text-sm font-semibold text-slate-500 transition hover:border-slate-300 hover:text-slate-800"
                                >
                                    Back
                                </button>
                                <button
                                    type="button"
                                    onClick={goNext}
                                    className="inline-flex h-11 items-center justify-center rounded-full bg-slate-950 px-7 text-sm font-semibold text-white transition hover:bg-slate-800"
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    ) : null}

                    {currentStep === "skills" ? (
                        <div className="w-full max-w-xl">
                            <h2 className="text-3xl font-black tracking-tight text-slate-900">
                                {titleConfig.title}
                            </h2>
                            <p className="mt-3 text-sm text-slate-500">{titleConfig.description}</p>

                            <div className="mt-10 flex flex-wrap gap-3">
                                {skillOptions.map((skill) => {
                                    const selected = values.skills.includes(skill);

                                    return (
                                        <button
                                            key={skill}
                                            type="button"
                                            onClick={() => toggleSkill(skill)}
                                            className={`rounded-full border px-4 py-3 text-sm font-medium transition ${
                                                selected
                                                    ? "border-[#4f6bff] bg-[#eef1ff] text-[#4f6bff]"
                                                    : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                                            }`}
                                        >
                                            {skill}
                                        </button>
                                    );
                                })}
                            </div>
                            {errors.skills ? (
                                <p className="mt-4 text-xs text-rose-500">{errors.skills}</p>
                            ) : null}

                            <div className="mt-10 flex items-center justify-between gap-4">
                                <button
                                    type="button"
                                    onClick={goBack}
                                    className="inline-flex h-11 items-center justify-center rounded-full border border-slate-200 px-6 text-sm font-semibold text-slate-500 transition hover:border-slate-300 hover:text-slate-800"
                                >
                                    Back
                                </button>
                                <button
                                    type="button"
                                    onClick={goNext}
                                    className="inline-flex h-11 items-center justify-center rounded-full bg-slate-950 px-7 text-sm font-semibold text-white transition hover:bg-slate-800"
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    ) : null}

                    {currentStep === "career" ? (
                        <div className="w-full max-w-md">
                            <h2 className="text-3xl font-black tracking-tight text-slate-900">
                                {titleConfig.title}
                            </h2>
                            <p className="mt-3 text-sm text-slate-500">{titleConfig.description}</p>

                            <div className="mt-10 space-y-5">
                                <div>
                                    <label htmlFor="targetRole" className="mb-2 block text-xs font-medium text-slate-500">
                                        Target Role
                                    </label>
                                    <input
                                        id="targetRole"
                                        name="targetRole"
                                        value={values.targetRole}
                                        onChange={handleChange}
                                        placeholder="For example: Frontend Developer"
                                        className={fieldClassName("targetRole")}
                                    />
                                    {errors.targetRole ? (
                                        <p className="mt-2 text-xs text-rose-500">{errors.targetRole}</p>
                                    ) : null}
                                </div>

                                <div>
                                    <label htmlFor="stage" className="mb-2 block text-xs font-medium text-slate-500">
                                        Job Search Stage
                                    </label>
                                    <select
                                        id="stage"
                                        name="stage"
                                        value={values.stage}
                                        onChange={handleChange}
                                        className={fieldClassName("stage")}
                                    >
                                        <option value="">Select</option>
                                        <option value="exploring">Just exploring</option>
                                        <option value="preparing">Preparing resume and portfolio</option>
                                        <option value="applying">Actively applying</option>
                                        <option value="interviewing">Interviewing</option>
                                    </select>
                                    {errors.stage ? (
                                        <p className="mt-2 text-xs text-rose-500">{errors.stage}</p>
                                    ) : null}
                                </div>

                                <div>
                                    <label htmlFor="goal" className="mb-2 block text-xs font-medium text-slate-500">
                                        Main Goal
                                    </label>
                                    <input
                                        id="goal"
                                        name="goal"
                                        value={values.goal}
                                        onChange={handleChange}
                                        placeholder="For example: get interview-ready in 30 days"
                                        className={fieldClassName("goal")}
                                    />
                                    {errors.goal ? (
                                        <p className="mt-2 text-xs text-rose-500">{errors.goal}</p>
                                    ) : null}
                                </div>
                            </div>

                            <div className="mt-10 flex items-center justify-between gap-4">
                                <button
                                    type="button"
                                    onClick={goBack}
                                    className="inline-flex h-11 items-center justify-center rounded-full border border-slate-200 px-6 text-sm font-semibold text-slate-500 transition hover:border-slate-300 hover:text-slate-800"
                                >
                                    Back
                                </button>
                                <button
                                    type="button"
                                    onClick={goNext}
                                    className="inline-flex h-11 items-center justify-center rounded-full bg-slate-950 px-7 text-sm font-semibold text-white transition hover:bg-slate-800"
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    ) : null}

                    {currentStep === "finish" ? (
                        <div className="text-center">
                            <h2 className="text-5xl font-black tracking-tight text-slate-900">
                                {titleConfig.title}
                            </h2>
                            <p className="mt-4 text-sm text-slate-500">{titleConfig.description}</p>
                            <button
                                type="button"
                                onClick={() => router.push("/dashboard")}
                                className="mt-10 inline-flex h-12 items-center justify-center rounded-full bg-[linear-gradient(98deg,#504ffd_12%,#40c3fb_91%)] px-10 text-sm font-bold text-white transition hover:brightness-105"
                            >
                                Go to Dashboard
                            </button>
                        </div>
                    ) : null}
                </main>
            </div>
        </div>
    );
};

export default Page;
