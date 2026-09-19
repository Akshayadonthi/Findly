"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight, PlusCircle, Laptop, MapPin, Sparkles, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";
import Button from "@/components/ui/button";

export const Hero: React.FC = () => {

  // Animations configuration
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { type: "spring" as const, stiffness: 100 } },
  };

  return (
    <>
      <section className="relative overflow-hidden bg-gradient-to-b from-primary-50/40 via-white to-transparent py-16 lg:py-24">
        {/* Decorative subtle background blobs */}
        <div className="absolute top-[-10%] right-[-10%] h-[350px] w-[350px] rounded-full bg-primary-100/30 blur-3xl pointer-events-none" />
        <div className="absolute bottom-[5%] left-[-10%] h-[280px] w-[280px] rounded-full bg-accent-100/20 blur-3xl pointer-events-none" />

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Column 1: Copywriting */}
            <motion.div 
              className="lg:col-span-6 space-y-6 text-center lg:text-left"
              initial="hidden"
              animate="visible"
              variants={containerVariants}
            >
              <motion.div variants={itemVariants} className="inline-flex items-center gap-1.5 px-3 py-1 bg-primary-50 border border-primary-100 rounded-full text-xs font-semibold text-primary-700 shadow-xs">
                <Sparkles className="h-3.5 w-3.5" />
                <span>Now live: Instantly match lost belongings</span>
              </motion.div>

              <motion.h1 variants={itemVariants} className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-neutral-900 leading-tight">
                Lost something? <br />
                <span className="bg-gradient-to-r from-primary-600 to-primary-500 bg-clip-text text-transparent">Find it again.</span>
              </motion.h1>

              <motion.p variants={itemVariants} className="text-lg text-neutral-500 max-w-xl mx-auto lg:mx-0 leading-relaxed">
                Report lost items, discover things others have found, and safely reconnect belongings with their owners. High trust, automated matching.
              </motion.p>

              <motion.div variants={itemVariants} className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
                <Link href="/report/lost" className="w-full sm:w-auto">
                  <Button
                    variant="primary"
                    size="lg"
                    className="w-full sm:w-auto gap-2"
                  >
                    <PlusCircle className="h-5 w-5" />
                    Report Lost Item
                  </Button>
                </Link>
                <Link href="/report/found" className="w-full sm:w-auto">
                  <Button
                    variant="outline"
                    size="lg"
                    className="w-full sm:w-auto text-neutral-700 hover:text-neutral-900 border-neutral-200"
                  >
                    Report Found Item
                  </Button>
                </Link>
              </motion.div>

              <motion.div variants={itemVariants} className="pt-2">
                <Link href="/lost" className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary-600 hover:text-primary-700 transition-colors">
                  Browse reported items
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </motion.div>
            </motion.div>

            {/* Column 2: Animated Interactive Flow Diagram */}
            <div className="lg:col-span-6 flex justify-center">
              <motion.div 
                className="relative w-full max-w-md bg-white border border-neutral-100 rounded-3xl p-6 shadow-xl"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                {/* Connecting arrow/line */}
                <div className="absolute left-1/2 top-[120px] bottom-[120px] w-0.5 border-l-2 border-dashed border-neutral-200 -translate-x-1/2 hidden sm:block"></div>

                <div className="space-y-8 relative">
                  
                  {/* Step 1: Lost Item Card */}
                  <motion.div 
                    className="flex items-center gap-4 bg-neutral-50 border border-neutral-100 rounded-2xl p-4 shadow-sm"
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.5, type: "spring" as const }}
                  >
                    <div className="h-10 w-10 bg-danger-500 rounded-xl flex items-center justify-center text-white shrink-0 shadow-md shadow-danger-500/10">
                      <Laptop className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <span className="text-xs font-bold text-danger-600 uppercase tracking-wide">Lost Report</span>
                        <span className="text-[10px] text-neutral-400">Just now</span>
                      </div>
                      <h4 className="text-sm font-bold text-neutral-800 truncate">MacBook Pro 14&quot;</h4>
                      <p className="text-xs text-neutral-400 flex items-center gap-1 mt-0.5">
                        <MapPin className="h-3 w-3" /> Central Library
                      </p>
                    </div>
                  </motion.div>

                  {/* Step 2: Findly Processing Core */}
                  <div className="flex justify-center relative">
                    <motion.div 
                      className="relative z-10 h-16 w-16 bg-primary-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-primary-500/30"
                      animate={{ 
                        scale: [1, 1.05, 1],
                        rotate: [0, 5, -5, 0]
                      }}
                      transition={{ 
                        repeat: Infinity, 
                        duration: 4, 
                        ease: "easeInOut" 
                      }}
                    >
                      <Sparkles className="h-8 w-8" />
                      
                      {/* Pulse rings */}
                      <span className="absolute inset-0 rounded-2xl border border-primary-500 animate-ping opacity-25"></span>
                    </motion.div>
                    
                    {/* Potential Match Badge */}
                    <motion.div 
                      className="absolute -top-3 left-[60%] bg-accent-500 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full shadow-md flex items-center gap-0.5"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 1.2, type: "spring" as const }}
                    >
                      <CheckCircle2 className="h-3 w-3 stroke-[2.5]" />
                      <span>87% match</span>
                    </motion.div>
                  </div>

                  {/* Step 3: Reunited Card */}
                  <motion.div 
                    className="flex items-center gap-4 bg-white border border-neutral-100 rounded-2xl p-4 shadow-sm"
                    initial={{ x: 20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.9, type: "spring" as const }}
                  >
                    <div className="h-10 w-10 bg-accent-500 rounded-xl flex items-center justify-center text-white shrink-0 shadow-md shadow-accent-500/10">
                      <CheckCircle2 className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <span className="text-xs font-bold text-accent-600 uppercase tracking-wide">Found Match</span>
                        <span className="text-[10px] text-neutral-400">Library reception</span>
                      </div>
                      <h4 className="text-sm font-bold text-neutral-800 truncate">Apple Laptop (Silver)</h4>
                      <p className="text-xs text-accent-600 font-semibold mt-0.5 flex items-center gap-1">
                        Owner reunited successfully!
                      </p>
                    </div>
                  </motion.div>

                </div>
              </motion.div>
            </div>

          </div>
        </div>
      </section>
    </>
  );
};

export default Hero;
