"use client";

import AuthHeader from "../components/AuthHeader";
import AuthForm from "../components/AuthForm";
import AuthShowcase from "../components/AuthShowcase";

const Page = ({ mode }) => (
    <div className="min-h-screen bg-white text-slate-950">
        <AuthHeader />
        <main className="overflow-x-auto px-4 pb-6 pt-22 sm:px-6 lg:px-8">
            <div className="mx-auto grid min-h-[calc(100vh-7rem)] min-w-[980px] max-w-7xl grid-cols-[minmax(360px,0.92fr)_minmax(420px,1.08fr)] items-center gap-8">
                <AuthForm mode={mode} />
                <AuthShowcase />
            </div>
        </main>
    </div>
);

export default Page;
