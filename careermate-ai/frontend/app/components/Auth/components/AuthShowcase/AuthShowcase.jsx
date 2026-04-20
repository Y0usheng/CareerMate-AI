import backgroundImage from "./assets/background.png";

const coachAvatars = [
    { label: "A", className: "bg-[linear-gradient(145deg,#0f172a,#334155)]" },
    { label: "B", className: "bg-[linear-gradient(145deg,#2563eb,#38bdf8)]" },
    { label: "C", className: "bg-[linear-gradient(145deg,#111827,#6366f1)]" },
    { label: "D", className: "bg-[linear-gradient(145deg,#0f172a,#0284c7)]" },
];

const engineeringIcons = ["GPT", "</>", "AWS", "UX"];

const AuthShowcase = () => (
    <section
        className="relative flex h-full min-h-[420px] flex-col self-stretch overflow-visible rounded-[2rem] border border-white/60 p-5 shadow-[0_30px_90px_rgba(59,130,246,0.22)] sm:min-h-[520px] lg:min-h-[640px] lg:p-6"
        style={{ backgroundImage: `url(${backgroundImage.src})`, backgroundSize: "cover", backgroundPosition: "center" }}
    >

        <div className="relative flex flex-1 flex-col">
            <button className="ml-auto inline-flex items-center gap-2 rounded-full bg-slate-950 px-4 py-3 text-[10px] font-semibold tracking-[0.16em] text-white sm:text-xs">
                <span className="size-2 rounded-full bg-white" />
                SUBSCRIBE
            </button>

            <div className="mt-8 w-44 rounded-[1.4rem] border border-slate-200 bg-white px-4 py-4 shadow-[0_24px_50px_rgba(15,23,42,0.16)] sm:mt-12 -ml-16 sm:w-52 lg:mt-16">
                <div className="flex items-center gap-3">
                    <div className="flex size-9 items-center justify-center rounded-full bg-[linear-gradient(145deg,#1d4ed8,#0f172a)] text-xs font-bold text-white">
                        U
                    </div>
                    <div>
                        <p className="text-sm font-semibold text-slate-900">Username</p>
                        <p className="text-[11px] text-slate-500">CareerMate AI user</p>
                    </div>
                </div>
                <p className="mt-3 text-xs leading-5 text-slate-700">
                    Tried many, but this AI stands out.
                </p>
            </div>

            <div className="mt-auto grid gap-4 pt-8 md:grid-cols-2">
                <article className="rounded-[1.6rem] border border-white/65 bg-white/30 p-5 backdrop-blur-md">
                    <div className="flex items-start justify-between gap-4">
                        <p className="max-w-36 text-sm font-medium leading-6 text-slate-950 sm:text-base">
                            People find their own coach
                        </p>
                        <span className="flex size-8 items-center justify-center rounded-full bg-white text-sm text-slate-900">
                            ↗
                        </span>
                    </div>
                    <div className="mt-8 flex -space-x-3">
                        {coachAvatars.map((avatar) => (
                            <div
                                key={avatar.label}
                                className={`flex size-10 items-center justify-center rounded-full border-2 border-white text-xs font-bold text-white ${avatar.className}`}
                            >
                                {avatar.label}
                            </div>
                        ))}
                    </div>
                </article>

                <article className="rounded-[1.6rem] border border-white/65 bg-white/30 p-5 backdrop-blur-md">
                    <div className="flex items-start justify-between gap-4">
                        <p className="max-w-40 text-sm font-medium leading-6 text-slate-950 sm:text-base">
                            Built with the Power of AI Engineering
                        </p>
                        <span className="flex size-8 items-center justify-center rounded-full bg-white text-sm text-slate-900">
                            ↗
                        </span>
                    </div>
                    <div className="mt-8 flex flex-wrap gap-3">
                        {engineeringIcons.map((icon) => (
                            <div
                                key={icon}
                                className="flex size-11 items-center justify-center rounded-full bg-slate-950 text-[11px] font-semibold tracking-wide text-white shadow-lg"
                            >
                                {icon}
                            </div>
                        ))}
                    </div>
                </article>
            </div>
        </div>
    </section>
);

export default AuthShowcase;
