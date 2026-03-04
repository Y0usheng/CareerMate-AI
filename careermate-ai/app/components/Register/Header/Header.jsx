import Image from 'next/image';
import logo from './assets/logo.png';

const Header = () => (
    <header className="register-header fixed p-8">
        <Image src={logo} alt="CareerMate-AI" width={184} height={24} />
    </header>
)

export default Header;