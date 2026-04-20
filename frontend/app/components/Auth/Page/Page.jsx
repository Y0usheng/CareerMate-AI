"use client";

import AuthHeader from "../components/AuthHeader";
import AuthForm from "../components/AuthForm";
import AuthShowcase from "../components/AuthShowcase";

const Page = ({ mode }) => (
    <div className="min-h-screen bg-white text-slate-950">
        <AuthHeader />
        <main className="px-4 pb-8 pt-20 sm:px-6 sm:pt-24 lg:px-8">
            <div className="mx-auto grid min-h-[calc(100vh-7rem)] max-w-7xl items-center gap-8 lg:grid-cols-[minmax(360px,0.92fr)_minmax(420px,1.08fr)]">
                <AuthForm mode={mode} />
                <div className="hidden lg:block">
                    <AuthShowcase />
                </div>
            </div>
        </main>
    </div>
);

export default Page;
