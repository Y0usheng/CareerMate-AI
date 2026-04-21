"use client";

import { useState } from "react";

const EyeIcon = ({ open }) =>
    open ? (
        <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path d="M10 4C5.5 4 1.73 7.11 1 10c.73 2.89 4.5 6 9 6s8.27-3.11 9-6c-.73-2.89-4.5-6-9-6zm0 10a4 4 0 110-8 4 4 0 010 8zm0-2a2 2 0 100-4 2 2 0 000 4z" />
        </svg>
    ) : (
        <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path
                fillRule="evenodd"
                d="M3.28 2.22a.75.75 0 00-1.06 1.06l2.1 2.1C2.9 6.6 1.6 8.2 1 10c.73 2.89 4.5 6 9 6 1.6 0 3.1-.4 4.4-1.06l2.32 2.32a.75.75 0 101.06-1.06L3.28 2.22zM10 14a4 4 0 01-3.9-4.87l1.57 1.57a2 2 0 002.73 2.73l1.57 1.57c-.6.26-1.25.4-1.97.4zm9-4c-.54 2.14-2.82 4.5-5.93 5.5l-1.5-1.5A4 4 0 006.87 8.4l-2.2-2.2C6.16 5.27 7.98 4 10 4c4.5 0 8.27 3.11 9 6zm-8.27-2A2 2 0 0112 10a2 2 0 01-.04.37l-1.23-1.23z"
                clipRule="evenodd"
            />
        </svg>
    );

/**
 * Password input with show/hide toggle. `inputClassName` is appended to the
 * base styles so callers can match existing form styling.
 */
const PasswordInput = ({ inputClassName = "", ...inputProps }) => {
    const [revealed, setRevealed] = useState(false);

    return (
        <div className="relative">
            <input
                {...inputProps}
                type={revealed ? "text" : "password"}
                className={`${inputClassName} pr-12`}
            />
            <button
                type="button"
                onClick={() => setRevealed((v) => !v)}
                aria-label={revealed ? "Hide password" : "Show password"}
                className="absolute inset-y-0 right-3 flex items-center justify-center px-1 text-slate-400 transition hover:text-slate-700"
            >
                <EyeIcon open={revealed} />
            </button>
        </div>
    );
};

export default PasswordInput;
