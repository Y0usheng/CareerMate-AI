import Button from "./components/Button";
import Field from "./components/Field";
import LoginLink from "./components/LoginLink";

const Form = () => (
    <form className="flex-1 px-[125px] my-auto">
        <div className="mb-16">
            <h1 className="form-title font-black text-[40px]">
                Create Your Account
            </h1>
            <p className="text-sm text-gray-700 mt-3">
                Join CareerMate AI and start your smart career journey
            </p>
        </div>

        <div className="space-y-4">
            <Field label="Full Name" placeholder="Enter your full name" type="text" />
            <Field label="Email" placeholder="Enter your email" type="email" />
            <Field label="Password" placeholder="Enter your password" type="password" />
        </div>
        <div className="mt-10 space-y-6">
            <Button>Create Account</Button>
            <LoginLink />
        </div>
    </form>
)

export default Form;