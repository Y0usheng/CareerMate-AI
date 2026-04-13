const footerLinks = [
    { href: "#", label: "Terms" },
    { href: "#", label: "Privacy" },
    { href: "#contact", label: "Contact" },
    { href: "#", label: "JR Academy" },
];

const Footer = () => (
    <footer className="border-t border-slate-200 bg-slate-50 px-6 py-10 lg:px-10">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
            <div>
                <p className="text-base font-semibold text-slate-950">CareerMate AI</p>
                <p className="mt-3 text-sm text-slate-500">© 2025 CareerMate AI by JR Academy</p>
            </div>

            <div className="flex flex-wrap gap-6 text-sm font-medium text-slate-600">
                {footerLinks.map((link) => (
                    <a key={link.label} href={link.href} className="transition hover:text-slate-950">
                        {link.label}
                    </a>
                ))}
            </div>
        </div>
    </footer>
);

export default Footer;
