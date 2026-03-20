import Hero from "../components/landing/Hero";
import RegistrationsViewer from "../components/landing/RegistrationsViewer";

export default function HomePage() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-8 md:py-12">
      <Hero />
      <RegistrationsViewer />
    </main>
  );
}
