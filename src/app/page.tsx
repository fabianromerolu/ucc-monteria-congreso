import Hero from "../components/landing/Hero";
import RegisterCards from "../components/landing/RegisterCards";
import Schedule from "../components/landing/Schedule";

export default function HomePage() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-8 md:py-12">
      <Hero />
      <Schedule />
      <RegisterCards />
    </main>
  );
}
