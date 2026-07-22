import Image from "next/image";

export default function RegisterHero() {
  return (
    <div className="relative h-screen">
      <Image
        src="/images/register-hero.png"
        alt="Cabinet juridique"
        fill
        className="object-cover"
      />
    </div>
  );
}