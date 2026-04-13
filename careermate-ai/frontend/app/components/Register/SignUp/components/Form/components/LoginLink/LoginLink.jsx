import Link from "next/link";

const LoginLink = () => (
    <p className="text-center text-sm">
        <span className="text-grey-700">Want to explore first? </span>
        <Link href="/" className="text-blue-500 hover:underline">
            Back to home
        </Link>
    </p>
)

export default LoginLink;
