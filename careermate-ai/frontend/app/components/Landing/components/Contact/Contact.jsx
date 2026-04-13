"use client";

import { useState } from "react";
import { contactDetails } from "../../data";

const initialValues = {
    fullname: "",
    email: "",
    role: "",
    field: "",
    message: "",
};

const Contact = () => {
    const [values, setValues] = useState(initialValues);
    const [errors, setErrors] = useState({});
    const [status, setStatus] = useState({ type: "", message: "" });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const validate = () => {
        const nextErrors = {};

        if (!values.fullname.trim()) nextErrors.fullname = "Full name is required.";
        if (!values.email.trim()) nextErrors.email = "Email is required.";
        if (values.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) {
            nextErrors.email = "Please enter a valid email.";
        }
        if (!values.message.trim()) nextErrors.message = "Message is required.";
        if (values.message.trim() && values.message.trim().length < 20) {
            nextErrors.message = "Please enter at least 20 characters.";
        }

        return nextErrors;
    };

    const handleChange = (event) => {
        const { name, value } = event.target;

        setValues((current) => ({ ...current, [name]: value }));
        setErrors((current) => ({ ...current, [name]: "" }));
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        const nextErrors = validate();

        if (Object.keys(nextErrors).length > 0) {
            setErrors(nextErrors);
            setStatus({ type: "error", message: "Please fix the highlighted fields." });
            return;
        }

        setIsSubmitting(true);
        setStatus({ type: "", message: "" });

        await new Promise((resolve) => setTimeout(resolve, 900));

        setIsSubmitting(false);
        setValues(initialValues);
        setStatus({ type: "success", message: "Message sent successfully. We'll be in touch soon." });
    };

    const fieldClassName = (name) =>
        `mt-2 w-full rounded-2xl border px-4 py-3 text-sm text-slate-900 outline-none transition ${
            errors[name]
                ? "border-rose-300 bg-rose-50 focus:border-rose-400"
                : "border-slate-200 bg-white focus:border-slate-900"
        }`;

    return (
        <section id="contact" className="bg-slate-50 px-6 py-16 lg:px-10 lg:py-24">
            <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[0.9fr_1.1fr]">
                <div className="pt-4">
                    <h2 className="text-4xl font-bold leading-tight text-slate-950 sm:text-5xl">
                        Get in touch with us
                    </h2>
                    <p className="mt-6 max-w-lg text-base leading-7 text-slate-600">
                        Whether you have a question about the platform, want to share feedback, or
                        need help getting started, our team is ready to help.
                    </p>

                    <div className="mt-10 space-y-6">
                        {contactDetails.map((detail) => (
                            <div key={detail.label}>
                                <p className="text-sm font-medium text-slate-500">{detail.label}</p>
                                <a
                                    href={detail.href}
                                    className="mt-1 inline-block text-lg font-semibold text-slate-950 hover:underline"
                                >
                                    {detail.value}
                                </a>
                            </div>
                        ))}
                        <p className="text-sm text-slate-500">
                            Available Monday to Friday, 9 AM to 6 PM GMT.
                        </p>
                    </div>
                </div>

                <div className="rounded-[2rem] bg-white p-8 shadow-[0_24px_60px_rgba(15,23,42,0.08)] sm:p-10">
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label htmlFor="fullname" className="text-sm font-semibold text-slate-700">
                                Full Name
                            </label>
                            <input
                                id="fullname"
                                name="fullname"
                                value={values.fullname}
                                onChange={handleChange}
                                placeholder="Your full name"
                                className={fieldClassName("fullname")}
                            />
                            {errors.fullname ? (
                                <p className="mt-2 text-sm text-rose-500">{errors.fullname}</p>
                            ) : null}
                        </div>

                        <div>
                            <label htmlFor="email" className="text-sm font-semibold text-slate-700">
                                Email
                            </label>
                            <input
                                id="email"
                                name="email"
                                type="email"
                                value={values.email}
                                onChange={handleChange}
                                placeholder="Your email"
                                className={fieldClassName("email")}
                            />
                            {errors.email ? (
                                <p className="mt-2 text-sm text-rose-500">{errors.email}</p>
                            ) : null}
                        </div>

                        <div className="grid gap-5 sm:grid-cols-2">
                            <div>
                                <label htmlFor="role" className="text-sm font-semibold text-slate-700">
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
                            </div>

                            <div>
                                <label htmlFor="field" className="text-sm font-semibold text-slate-700">
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
                                </select>
                            </div>
                        </div>

                        <div>
                            <label htmlFor="message" className="text-sm font-semibold text-slate-700">
                                How can we help you?
                            </label>
                            <textarea
                                id="message"
                                name="message"
                                rows="5"
                                value={values.message}
                                onChange={handleChange}
                                placeholder="Tell us a bit more..."
                                className={fieldClassName("message")}
                            />
                            {errors.message ? (
                                <p className="mt-2 text-sm text-rose-500">{errors.message}</p>
                            ) : null}
                        </div>

                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="inline-flex w-full items-center justify-center rounded-full bg-slate-950 px-6 py-4 text-sm font-bold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
                        >
                            {isSubmitting ? "Sending..." : "Send Message"}
                        </button>

                        {status.message ? (
                            <p
                                className={`text-sm ${
                                    status.type === "success" ? "text-emerald-600" : "text-rose-500"
                                }`}
                            >
                                {status.message}
                            </p>
                        ) : null}
                    </form>
                </div>
            </div>
        </section>
    );
};

export default Contact;
