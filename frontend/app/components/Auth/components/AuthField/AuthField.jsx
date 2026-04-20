"use client";

const AuthField = ({
    error,
    label,
    name,
    onChange,
    placeholder,
    type = "text",
    value,
}) => (
    <div>
        <label htmlFor={name} className="mb-2 block text-xs font-medium text-slate-600">
            {label}
        </label>
        <div className="relative">
            <input
                id={name}
                name={name}
                type={type}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                className={`h-12 w-full rounded-full border bg-white px-4 text-sm text-slate-950 outline-none transition ${
                    error
                        ? "border-rose-400 bg-rose-50 focus:border-rose-500"
                        : "border-slate-200 focus:border-[#5b63ff] focus:shadow-[0_0_0_3px_rgba(91,99,255,0.12)]"
                }`}
            />
            {type === "password" ? (
                <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-slate-400">
                    ⊙
                </span>
            ) : null}
        </div>
        {error ? <p className="mt-2 text-xs text-rose-500">{error}</p> : null}
    </div>
);

export default AuthField;
