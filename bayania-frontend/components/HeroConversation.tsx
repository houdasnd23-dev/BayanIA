"use client";

import { motion } from "framer-motion";
import { TypeAnimation } from "react-type-animation";
import {
  MessageSquare,
  User,
  ShieldCheck,
  FileText,
} from "lucide-react";

export default function HeroConversation() {
  return (
    <div className="relative w-full max-w-4xl mx-auto px-4">

      {/* Card principale - Bleu foncé */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="rounded-3xl bg-[#10254d] shadow-2xl p-8 overflow-hidden"
      >

        {/* Background glow subtle */}
        <div className="absolute inset-0 opacity-8 pointer-events-none">
          <div className="absolute w-96 h-96 bg-cyan-400 blur-[150px] rounded-full -top-32 -left-40"/>
          <div className="absolute w-96 h-96 bg-blue-600 blur-[150px] rounded-full -bottom-32 -right-40"/>
        </div>

        {/* Contenu */}
        <div className="relative z-10 space-y-6">

          {/* TOP - Header */}
          <div className="flex justify-between items-center gap-4 flex-wrap">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="flex items-center gap-2 text-slate-100"
            >
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"/>
              <span className="text-sm font-semibold">98% Score de Confiance</span>
            </motion.div>

            <motion.div
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ repeat: Infinity, duration: 2.5 }}
              className="flex items-center gap-2 text-slate-100"
            >
              <FileText size={16}/>
              <span className="text-sm font-semibold">PDF Analysis</span>
            </motion.div>
          </div>

          {/* TITLE */}
          <div className="flex items-center gap-3 mb-2">
            <motion.div
              animate={{ y: [0, -4, 0] }}
              transition={{ repeat: Infinity, duration: 2.5 }}
              className="bg-white/10 p-2.5 rounded-lg"
            >
              <MessageSquare size={20} className="text-white"/>
            </motion.div>
            <h2 className="text-3xl font-bold text-gray-100">
              BayanAI
            </h2>
          </div>
          <p className="text-xs text-slate-300 ml-11">Assistant Juridique Intelligent</p>

          {/* USER MESSAGE */}
          <motion.div
            initial={{ opacity: 0, x: 80 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="flex justify-end gap-3 mt-8"
          >
            <div className="bg-[#2958A3] text-slate-50 px-5 py-4 rounded-2xl max-w-md text-sm leading-relaxed font-medium shadow-lg">
              Quel est le préavis légal en cas de licenciement d&aposun salarié étranger ?
            </div>
            <div className="bg-[#1E3F78] rounded-full p-2.5 h-fit">
              <User size={18} className="text-white"/>
            </div>
          </motion.div>

          {/* AI RESPONSE */}
          <motion.div
            initial={{ opacity: 0, x: -80 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.9 }}
            className="flex gap-3 mt-6"
          >
            <div className="bg-white/10 rounded-full p-2.5 h-fit">
              <MessageSquare size={18} className="text-cyan-300"/>
            </div>
            <div className="bg-[#1E3F78] text-slate-100 px-5 py-4 rounded-2xl max-w-2xl text-sm leading-relaxed shadow-lg">
              <TypeAnimation
                cursor={true}
                speed={60}
                sequence={[
                  "Selon le Dahir n°1-03-194 (Code du Travail), le préavis dépend de l'ancienneté et de la catégorie du salarié. Pour un salarié étranger, les mêmes dispositions s'appliquent, sauf si une convention particulière prévoit des règles différentes.",
                  2000
                ]}
                repeat={0}
              />
            </div>
          </motion.div>

          {/* Security Footer */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 2 }}
            className="mt-10 pt-6 border-t border-white/10"
          >
            <div className="bg-white rounded-2xl shadow-lg w-fit px-5 py-4 flex items-center gap-3">
              <ShieldCheck size={22} className="text-emerald-500"/>
              <div>
                <div className="font-bold text-[#1a3a7a] text-sm">
                  SÉCURITÉ AVANT TOUT
                </div>
                <div className="text-xs text-gray-500">
                  Conforme CNDP
                </div>
              </div>
            </div>
          </motion.div>

        </div>

      </motion.div>

    </div>
  );
}




