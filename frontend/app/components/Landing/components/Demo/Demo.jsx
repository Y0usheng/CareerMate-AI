import Image from "next/image";
import Link from "next/link";

const Demo = () => (
    <section id="demo" className="px-6 py-16 lg:px-10 lg:py-24">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.95fr_1.2fr] lg:items-center">
            <div>
                <h2 className="text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
                    See CareerMate AI in action
                </h2>
                <p className="mt-5 max-w-xl text-base leading-7 text-slate-600">
                    Explore how users move from preparation to practice and feedback in one flow,
                    without juggling separate tools.
                </p>
                <div className="mt-8">
                    <Image
                        src="/landing/59.svg"
                        alt="CareerMate AI workflow diagram"
                        width={600}
                        height={420}
                        className="h-auto w-full max-w-2xl"
                    />
                </div>
                <Link
                    href="/register"
                    className="mt-8 inline-flex rounded-full bg-slate-950 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                >
                    Try the Register Flow
                </Link>
            </div>

            <div className="rounded-[2rem] border border-slate-200 bg-white p-4 shadow-[0_30px_80px_rgba(15,23,42,0.08)]">
                <Image
                    src="/landing/career-mate-ai-landing-page.png"
                    alt="CareerMate AI interface preview"
                    width={1024}
                    height={768}
                    className="h-auto w-full rounded-[1.5rem]"
                />
            </div>
        </div>
    </section>
);

export default Demo;
