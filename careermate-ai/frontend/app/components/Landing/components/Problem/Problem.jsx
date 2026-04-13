import Image from "next/image";
import { problemPoints } from "../../data";

const Problem = () => (
    <section className="px-6 py-10 lg:px-10 lg:py-16">
        <div className="mx-auto max-w-6xl">
            <div className="mb-10 text-center">
                <h2 className="text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
                    Still struggling with job applications?
                </h2>
            </div>

            <div className="grid gap-6 lg:grid-cols-[1fr_1.05fr]">
                <div className="space-y-16">
                    {problemPoints.map((point) => (
                        <div
                            key={point}
                            className="flex items-center justify-between rounded-[1.75rem] bg-slate-50 px-6 py-8 shadow-sm transition hover:translate-y-0.5"
                        >
                            <p className="pr-5 text-base font-semibold text-slate-900 sm:text-lg">
                                {point}
                            </p>
                            <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-slate-950 text-white">
                                ↗
                            </span>
                        </div>
                    ))}
                </div>

                <div className="relative overflow-hidden rounded-[2rem] bg-[linear-gradient(135deg,#4F8CFF_0%,#2AB5F6_100%)] p-8 text-white sm:p-10">
                    <div className="relative z-10 max-w-sm">
                        <h3 className="text-3xl font-bold leading-tight">
                            CareerMate AI helps you fix all of that, smartly.
                        </h3>
                    </div>
                    <Image
                        src="/landing/7.png"
                        alt="Career growth illustration"
                        width={320}
                        height={320}
                        className="pointer-events-none absolute -bottom-20 right-0 h-auto w-44 sm:w-56"
                    />
                </div>
            </div>
        </div>
    </section>
);

export default Problem;
