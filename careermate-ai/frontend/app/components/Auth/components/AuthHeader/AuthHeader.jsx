import Image from "next/image";
import Link from "next/link";
import logo from "../../../Register/Header/assets/logo.png";

const AuthHeader = () => (
    <header className="fixed inset-x-0 top-0 z-30 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center px-4 py-5 sm:px-6 lg:px-8">
            <Link href="/" className="inline-flex items-center">
                <Image src={logo} alt="CareerMate AI" width={184} height={24} priority />
            </Link>
        </div>
    </header>
);

export default AuthHeader;
