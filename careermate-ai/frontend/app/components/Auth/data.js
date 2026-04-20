export const authContent = {
    login: {
        title: "Welcome Back",
        description: "Log in to continue your AI journey.",
        submitLabel: "Log In",
        helperText: "Don't have an account?",
        helperLinkLabel: "Sign up",
        helperHref: "/register",
        fields: [
            { name: "email", label: "Email", type: "email", placeholder: "Your email" },
            { name: "password", label: "Password", type: "password", placeholder: "Your password" },
        ],
        successMessage: "Logged in successfully. Redirecting...",
        redirectHref: "/dashboard",
    },
    register: {
        title: "Create Your Account",
        description: "Join CareerMate AI and start your smart career journey.",
        submitLabel: "Create Account",
        helperText: "Already have an account?",
        helperLinkLabel: "Log in",
        helperHref: "/login",
        fields: [
            { name: "fullName", label: "Full Name", type: "text", placeholder: "Enter your full name" },
            { name: "email", label: "Email", type: "email", placeholder: "Enter your email" },
            { name: "password", label: "Password", type: "password", placeholder: "Create a password" },
        ],
        successMessage: "Registration successful! Taking you to onboarding...",
        redirectHref: "/onboarding",
    },
};
