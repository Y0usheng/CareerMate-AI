import Image from "next/image";

const TechStack = () => (
    <section className="px-6 pb-16 lg:px-10 lg:pb-24">
        <div className="mx-auto max-w-6xl rounded-[2.5rem] bg-slate-950 px-6 py-12 text-center text-white sm:px-10">
            <div className="mx-auto max-w-5xl">
                <Image
                    src="/landing/61.jpg"
                    alt="Tech stack graphic"
                    width={1327}
                    height={420}
                    className="mx-auto h-auto w-full"
                />
            </div>
            <h3 className="mt-6 text-2xl font-bold sm:text-3xl">
                Built with the power of AI engineering
            </h3>
            <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-slate-300">
                Powered by modern AI tooling and cloud infrastructure, then packaged into a
                guided experience for students and early-career professionals.
            </p>
        </div>
    </section>
);

export default TechStack;
