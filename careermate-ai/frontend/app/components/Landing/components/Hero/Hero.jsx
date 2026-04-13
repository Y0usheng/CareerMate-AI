import Image from "next/image";
import Link from "next/link";

const Hero = () => (
    <section className="overflow-hidden px-6 pb-20 pt-16 lg:px-10 lg:pb-28 lg:pt-24">
        <div className="mx-auto flex max-w-7xl flex-col items-center">
            <div className="max-w-4xl text-center">
                <span className="inline-flex rounded-full border border-sky-200 bg-sky-50 px-4 py-2 text-sm font-semibold text-sky-700">
                    AI career guidance for resumes, interviews, and growth
                </span>
                <h1 className="mt-6 text-5xl font-black tracking-tight text-slate-950 sm:text-6xl lg:text-7xl">
                    Your AI Career Practice Partner
                </h1>
                <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-slate-600 sm:text-xl">
                    Get job-ready from resumes to interviews. CareerMate AI helps you practice,
                    improve, and move forward with more confidence.
                </p>
                <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
                    <Link
                        href="/register"
                        className="inline-flex min-w-48 items-center justify-center rounded-full bg-[linear-gradient(98deg,#504ffd_12%,#40c3fb_91%)] px-7 py-4 text-base font-bold text-white shadow-[0_20px_40px_rgba(64,195,251,0.28)] transition hover:-translate-y-0.5"
                    >
                        Start for Free
                    </Link>
                    <a
                        href="#demo"
                        className="inline-flex min-w-48 items-center justify-center rounded-full border border-slate-200 bg-white px-7 py-4 text-base font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                    >
                        Watch Demo
                    </a>
                </div>
            </div>

            <div className="relative mt-16 w-full max-w-6xl overflow-hidden rounded-[2rem] border border-slate-200 bg-slate-50 p-3 shadow-[0_30px_80px_rgba(15,23,42,0.08)]">
                <div className="absolute inset-x-10 top-0 h-32 bg-[radial-gradient(circle_at_top,_rgba(80,79,253,0.18),_transparent_70%)] blur-3xl" />
                <Image
                    src="/landing/49.jpg"
                    alt="CareerMate AI dashboard preview"
                    width={1440}
                    height={820}
                    className="relative h-auto w-full rounded-[1.5rem] object-cover"
                    priority
                />
            </div>
        </div>
    </section>
);

export default Hero;
