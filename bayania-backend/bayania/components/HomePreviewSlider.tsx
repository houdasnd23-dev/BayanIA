"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";

const screens = [
  {
    image: "/screenshots/acceuil.png",
    title: "Accueil",
  },

  {
    image: "/screenshots/login.png",
    title: "Connexion",
  },
  {
    image: "/screenshots/register.png",
    title: "Inscription",
  },
  {
    image: "/screenshots/assistant.png",
    title: "Assistant IA",
  },
  {
    image: "/screenshots/response.png",
    title: "Réponse IA",
  },

  {
    image: "/screenshots/search.png",
    title: "Recherche juridique",
  },
   {
    image: "/screenshots/tarifs.png",
    title: "Tarifs",
  },
];

export default function HomePreviewSlider() {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((old) => (old + 1) % screens.length);
    }, 5000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="relative w-full max-w-xl mx-auto">

      <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-72 h-72 bg-blue-500/20 blur-[120px]" />

      <AnimatePresence mode="wait">
        <motion.div
          key={current}
          initial={{
            opacity: 0,
            x: 80,
            scale: 0.95,
          }}
          animate={{
            opacity: 1,
            x: 0,
            scale: 1,
          }}
          exit={{
            opacity: 0,
            x: -80,
            scale: 0.95,
          }}
          transition={{
            duration: 0.7,
          }}
          className="rounded-3xl overflow-hidden bg-white shadow-2xl"
        >
       <div className="w-full bg-white flex justify-center p-4">
  <Image
    src={screens[current].image}
    alt={screens[current].title}
    width={900}
    height={600}
    className="w-full h-auto rounded-xl"
    priority
  />
</div>

          <div className="bg-white p-5 flex justify-between items-center">

            <div>
              <p className="text-sm text-gray-500">
                Démonstration
              </p>

              <h3 className="font-semibold text-xl text-[#163A8C]">
                {screens[current].title}
              </h3>
            </div>

            <div className="flex gap-2">
              {screens.map((_, index) => (
                <div
                  key={index}
                  className={`w-2 h-2 rounded-full transition-all ${
                    current === index
                      ? "bg-blue-700 w-6"
                      : "bg-gray-300"
                  }`}
                />
              ))}
            </div>

          </div>

        </motion.div>
      </AnimatePresence>

    </div>
  );
}