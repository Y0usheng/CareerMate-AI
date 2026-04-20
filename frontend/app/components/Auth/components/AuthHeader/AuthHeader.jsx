import Image from "next/image";
import Link from "next/link";

const AuthHeader = () => (
    <header className="fixed inset-x-0 top-0 z-30 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-5 sm:px-6 lg:px-8">
            <Link href="/" className="inline-flex items-center gap-3">
                <Image src="/landing/13.svg" alt="CareerMate AI logo" width={32} height={32} priority />
                <Image
                    src="/landing/career-mate-ai-2.svg"
                    alt="CareerMate AI"
                    width={144}
                    height={24}
                    className="h-auto w-auto"
                    priority
                />
            </Link>
        </div>
    </header>
);

export default AuthHeader;
