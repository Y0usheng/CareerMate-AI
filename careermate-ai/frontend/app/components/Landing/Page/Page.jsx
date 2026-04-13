import Header from "../components/Header";
import Hero from "../components/Hero";
import Problem from "../components/Problem";
import Features from "../components/Features";
import Demo from "../components/Demo";
import TechStack from "../components/TechStack";
import Testimonials from "../components/Testimonials";
import Contact from "../components/Contact";
import CallToAction from "../components/CallToAction";
import Footer from "../components/Footer";
import BackToTop from "../components/BackToTop";

const Page = () => (
    <div className="bg-white text-slate-950">
        <Header />
        <main>
            <Hero />
            <Problem />
            <Features />
            <Demo />
            <TechStack />
            <Testimonials />
            <Contact />
            <CallToAction />
        </main>
        <Footer />
        <BackToTop />
    </div>
);

export default Page;
