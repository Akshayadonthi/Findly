"use client";

import React from "react";
import Link from "next/link";
import { Sparkles, PlusCircle } from "lucide-react";
import Button from "@/components/ui/button";

export const CTASection: React.FC = () => {
  return (
    <section className="py-16 md:py-24 bg-gradient-to-t from-primary-50/40 via-white to-transparent">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-tr from-primary-600 to-primary-500 rounded-3xl p-8 md:p-12 text-white shadow-xl shadow-primary-600/10 text-center space-y-6 relative overflow-hidden">
          {/* Design accents */}
          <div className="absolute inset-0 opacity-10 bg-[linear-gradient(to_right,#ffffff_1px,transparent_1px),linear-gradient(to_bottom,#ffffff_1px,transparent_1px)] bg-[size:20px_20px]"></div>
          <div className="absolute -top-12 -left-12 h-36 w-36 bg-white/10 rounded-full blur-xl"></div>
          <div className="absolute -bottom-12 -right-12 h-36 w-36 bg-white/10 rounded-full blur-xl"></div>

          <div className="relative z-10 max-w-2xl mx-auto space-y-4">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/15 rounded-full text-xs font-semibold text-white">
              <Sparkles className="h-3.5 w-3.5 fill-white/10" />
              <span>Reunite belongings today</span>
            </div>
            
            <h3 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              Your lost item might already be waiting to be found.
            </h3>
            
            <p className="text-primary-100 text-sm md:text-base leading-relaxed">
              Join the Findly community and help bring lost belongings back home. Registration is simple, secure, and helpful for the entire campus.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
              <Link href="/report/lost" className="w-full sm:w-auto">
                <Button
                  variant="secondary"
                  size="md"
                  className="w-full sm:w-auto bg-white text-neutral-900 hover:bg-neutral-100 font-bold border-0 shadow-lg gap-1.5"
                >
                  <PlusCircle className="h-4.5 w-4.5 text-primary-600" />
                  Report Lost Item
                </Button>
              </Link>

              <Link href="/report/found" className="w-full sm:w-auto">
                <Button
                  variant="outline"
                  size="md"
                  className="w-full sm:w-auto bg-transparent border-white/30 text-white hover:bg-white/10 hover:border-white font-bold"
                >
                  Report Found Item
                </Button>
              </Link>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};

export default CTASection;
