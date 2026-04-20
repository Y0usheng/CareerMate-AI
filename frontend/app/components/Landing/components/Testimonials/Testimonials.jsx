import Image from "next/image";
import { testimonials } from "../../data";

const Testimonials = () => (
    <section className="px-6 py-16 lg:px-10 lg:py-24">
        <div className="mx-auto max-w-6xl">
            <div className="mb-12 text-center">
                <h2 className="text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
                    Trusted by students worldwide
                </h2>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
                {testimonials.map((testimonial) => (
                    <article
                        key={testimonial.name}
                        className="grid overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-[0_24px_48px_rgba(15,23,42,0.08)] md:grid-cols-[0.9fr_1.2fr]"
                    >
                        <div className="relative flex items-center justify-center bg-slate-50 md:h-auto md:min-h-72">
                            <Image
                                src={testimonial.image}
                                alt={testimonial.name}
                                width={800}
                                height={1000}
                                className="h-auto max-h-80 w-auto object-contain md:absolute md:inset-0 md:max-h-none md:h-full md:w-full md:object-cover"
                            />
                        </div>
                        <div className="flex flex-col justify-center p-6 sm:p-8">
                            <p className="text-lg font-semibold leading-8 text-slate-900">
                                &ldquo;{testimonial.quote}&rdquo;
                            </p>
                            <div className="mt-6">
                                <h3 className="text-base font-bold text-slate-950">{testimonial.name}</h3>
                                <p className="mt-1 text-sm text-slate-500">{testimonial.title}</p>
                            </div>
                        </div>
                    </article>
                ))}
            </div>
        </div>
    </section>
);

export default Testimonials;
