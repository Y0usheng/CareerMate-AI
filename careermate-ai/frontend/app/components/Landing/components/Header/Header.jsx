import Image from "next/image";
import Link from "next/link";
import { navigationLinks } from "../../data";

const Header = () => (
    <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/85 backdrop-blur">
        <div className="mx-auto flex h-[72px] w-full max-w-7xl items-center justify-between gap-6 px-6 lg:px-10">
            <Link href="/" className="flex items-center gap-3">
                <Image src="/landing/13.svg" alt="CareerMate AI logo" width={32} height={32} />
                <Image
                    src="/landing/career-mate-ai-2.svg"
                    alt="CareerMate AI"
                    width={144}
                    height={24}
                    className="h-auto w-auto"
                />
            </Link>

            <nav className="hidden items-center gap-2 rounded-full border border-slate-200 bg-slate-50/80 px-3 py-2 md:flex">
                {navigationLinks.map((link) => (
                    <a
                        key={link.href}
                        href={link.href}
                        className="rounded-full px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-white hover:text-slate-950"
                    >
                        {link.label}
                    </a>
                ))}
            </nav>

            <div className="flex items-center gap-3">
                <Link
                    href="/login"
                    className="hidden rounded-full px-4 py-2 text-sm font-semibold text-slate-600 transition hover:text-slate-950 sm:inline-flex"
                >
                    Sign In
                </Link>
                <Link
                    href="/register"
                    className="inline-flex rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                >
                    Start for Free
                </Link>
            </div>
        </div>
    </header>
);

export default Header;
