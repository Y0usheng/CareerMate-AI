import Link from "next/link";

const CallToAction = () => (
    <section className="px-6 py-16 lg:px-10 lg:py-24">
        <div className="mx-auto max-w-7xl">
            <div className="rounded-[2.5rem] bg-[linear-gradient(90deg,#5365FF_0%,#48C6FA_100%)] px-8 py-16 text-center text-white shadow-[0_30px_80px_rgba(72,198,250,0.24)] sm:px-12">
                <h2 className="text-4xl font-black tracking-tight sm:text-5xl">
                    Ready to level up your career?
                </h2>
                <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-sky-50/90">
                    Start your AI-powered journey today. It is free to begin and directly connected
                    to the current register flow.
                </p>
                <Link
                    href="/register"
                    className="mt-10 inline-flex rounded-full bg-slate-950 px-8 py-4 text-base font-bold text-white transition hover:-translate-y-0.5 hover:bg-slate-800"
                >
                    Start Practicing for Free
                </Link>
            </div>
        </div>
    </section>
);

export default CallToAction;
