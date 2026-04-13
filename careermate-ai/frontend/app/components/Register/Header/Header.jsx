import Image from 'next/image';
import Link from 'next/link';
import logo from './assets/logo.png';

const Header = () => (
    <header className="register-header fixed p-8">
        <Link href="/">
            <Image src={logo} alt="CareerMate-AI" width={184} height={24} />
        </Link>
    </header>
)

export default Header;
