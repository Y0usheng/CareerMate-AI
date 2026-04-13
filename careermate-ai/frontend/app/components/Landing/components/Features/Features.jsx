import Image from "next/image";
import { featureCards } from "../../data";

const Features = () => (
    <section id="features" className="px-6 py-16 lg:px-10 lg:py-24">
        <div className="mx-auto max-w-6xl">
            <div className="mb-12 text-center">
                <h2 className="text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
                    Everything you need to grow your career
                </h2>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                {featureCards.map((feature) => (
                    <article
                        key={feature.title}
                        className="rounded-[2rem] bg-slate-50 p-8 transition hover:-translate-y-1 hover:shadow-[0_20px_40px_rgba(15,23,42,0.07)]"
                    >
                        <div className="mb-6 flex h-56 items-center justify-center overflow-hidden rounded-[1.5rem] bg-white">
                            <Image
                                src={feature.image}
                                alt={feature.title}
                                width={420}
                                height={224}
                                className="h-full w-full object-contain p-6"
                            />
                        </div>
                        <h3 className="text-2xl font-bold text-slate-950">{feature.title}</h3>
                        <p className="mt-3 text-base leading-7 text-slate-600">{feature.description}</p>
                    </article>
                ))}
            </div>
        </div>
    </section>
);

export default Features;
