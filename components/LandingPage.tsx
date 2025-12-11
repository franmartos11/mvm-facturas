"use client";

import Link from "next/link";
import { ArrowRight, Upload, Brain, TrendingUp, CheckCircle2, Star, ShieldCheck } from "lucide-react";
import { motion } from "framer-motion";

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background overflow-hidden">
      {/* Hero Section */}
      <section className="relative pt-20 pb-32 px-4 overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-100/50 via-white to-transparent dark:from-blue-950/30 dark:via-zinc-950 dark:to-zinc-950" />
        
        <div className="max-w-7xl mx-auto flex flex-col items-center text-center space-y-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <span className="inline-flex items-center px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-sm font-medium mb-6">
              <Star className="w-4 h-4 mr-2" /> Nueva versión 2.0 disponible
            </span>
            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6">
              Facturas <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">Inteligentes</span>
            </h1>
            <p className="max-w-2xl mx-auto text-zinc-600 dark:text-zinc-400 text-xl leading-relaxed">
              Automatiza tu contabilidad con IA. Procesa facturas, extrae datos y visualiza tus gastos en segundos, no horas.
            </p>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="flex flex-col sm:flex-row gap-4 w-full justify-center"
          >
            <Link
              href="/login"
              className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold rounded-xl text-white bg-blue-600 hover:bg-blue-700 transition-all shadow-lg hover:shadow-blue-500/25 hover:-translate-y-0.5"
            >
              Empezar Gratis <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
            <Link
              href="#features"
              className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold rounded-xl text-zinc-900 dark:text-zinc-100 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all hover:-translate-y-0.5"
            >
              Ver Demo
            </Link>
          </motion.div>

          {/* Trust Logos */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.5 }}
            className="pt-16 w-full"
          >
            <p className="text-sm text-zinc-500 dark:text-zinc-500 mb-6 font-medium">CON LA CONFIANZA DE EMPRESAS INNOVADORAS</p>
            <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16 opacity-50 grayscale hover:grayscale-0 transition-all duration-500">
               {/* Placeholders for logos - making them text for now but styled properly */}
               <span className="text-xl font-bold font-serif text-zinc-800 dark:text-white">Acme Corp</span>
               <span className="text-xl font-bold font-mono text-zinc-800 dark:text-white">GlobalTech</span>
               <span className="text-xl font-extrabold text-zinc-800 dark:text-white">NEXUS</span>
               <span className="text-xl font-semibold italic text-zinc-800 dark:text-white">Starlight</span>
               <span className="text-xl font-bold tracking-widest text-zinc-800 dark:text-white">UMBRELLA</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-zinc-50 dark:bg-zinc-900/50 border-y border-zinc-200 dark:border-zinc-800">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <StatItem number="+10k" label="Facturas Procesadas" />
            <StatItem number="99.9%" label="Precisión AI" />
            <StatItem number="2.5h" label="Ahorro Diario Promedio" />
            <StatItem number="+500" label="Empresas Activas" />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-32 px-4 max-w-7xl mx-auto w-full">
        <div className="text-center mb-24">
          <h2 className="text-4xl font-bold text-zinc-900 dark:text-white mb-6">
            Poderosa IA para tu Contabilidad
          </h2>
          <p className="text-xl text-zinc-500 dark:text-zinc-400 max-w-2xl mx-auto">
            Herramientas diseñadas para eliminar el trabajo manual y los errores humanos.
          </p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8">
          <FeatureCard 
            icon={<Upload className="w-8 h-8 text-blue-500" />}
            title="Subida Inteligente"
            description="Arrastra múltiples archivos PDF. Nuestro sistema detecta duplicados y valida la integridad de los documentos al instante."
            delay={0.1}
          />
          <FeatureCard 
            icon={<Brain className="w-8 h-8 text-indigo-500" />}
            title="Extracción Neural"
            description="Nuestros modelos de IA extraen cada ítem, impuesto y detalle con precisión humana, pero a la velocidad de la luz."
            delay={0.2}
          />
          <FeatureCard 
            icon={<TrendingUp className="w-8 h-8 text-emerald-500" />}
            title="Analytics en Tiempo Real"
            description="Dashboards interactivos que te muestran exactamente a dónde va tu dinero y detectan automáticamente anomalías."
            delay={0.3}
          />
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-32 bg-zinc-900 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-900/20 via-zinc-900 to-zinc-900" />
        <div className="max-w-7xl mx-auto px-4 relative z-10">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-16">Lo que dicen nuestros usuarios</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <TestimonialCard 
              quote="Antes perdía horas pasando datos a Excel. Facturas IA lo hace en segundos y sin errores. Es magia."
              author="Sofía Martínez"
              role="CFO, TechStart"
            />
            <TestimonialCard 
              quote="La trazabilidad de precios nos ha permitido renegociar con proveedores y ahorrar un 15% anual."
              author="Carlos Ruiz"
              role="Dueño de Restaurante"
            />
            <TestimonialCard 
              quote="Simplemente funciona. La interfaz es limpia, rápida y el soporte es excelente. Totalmente recomendado."
              author="Ana López"
              role="Contadora Independiente"
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 text-center px-4">
        <div className="max-w-4xl mx-auto bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl p-12 md:p-20 shadow-2xl relative overflow-hidden">
           {/* Decorative circles */}
           <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
           <div className="absolute bottom-0 left-0 w-64 h-64 bg-black/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
           
          <h2 className="text-3xl md:text-5xl font-bold mb-8 text-white relative z-10">Empieza a automatizar hoy</h2>
          <p className="mb-10 text-blue-100 text-lg md:text-xl max-w-2xl mx-auto relative z-10">
            Únete a más de 500 empresas que ya han modernizado su gestión de facturas.
          </p>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="relative z-10">
            <Link
              href="/login"
              className="inline-flex items-center justify-center px-8 py-4 text-lg font-bold rounded-xl bg-white text-blue-600 shadow-xl hover:shadow-2xl transition-all"
            >
              Crear cuenta gratis
            </Link>
          </motion.div>
          <p className="mt-6 text-blue-200 text-sm relative z-10">No se requiere tarjeta de crédito • Cancelación en cualquier momento</p>
        </div>
      </section>

      <footer className="py-12 text-center text-sm text-zinc-500 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950">
        <div className="flex items-center justify-center gap-2 mb-4">
           <Brain className="w-5 h-5 text-blue-600" />
           <span className="font-bold text-zinc-900 dark:text-zinc-100">Facturas IA</span>
        </div>
        © {new Date().getFullYear()} Facturas IA. Todos los derechos reservados.
      </footer>
    </div>
  );
}

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  delay?: number;
}

function FeatureCard({ icon, title, description, delay = 0 }: FeatureCardProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay }}
      whileHover={{ y: -5 }}
      className="p-8 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm hover:shadow-xl transition-all"
    >
      <div className="mb-6 bg-zinc-50 dark:bg-zinc-800 w-fit p-4 rounded-xl ring-1 ring-zinc-200 dark:ring-zinc-700">{icon}</div>
      <h3 className="text-xl font-bold mb-3 text-zinc-900 dark:text-white">{title}</h3>
      <p className="text-zinc-500 dark:text-zinc-400 leading-relaxed text-sm md:text-base">{description}</p>
    </motion.div>
  );
}

function StatItem({ number, label }: { number: string; label: string }) {
  return (
    <div className="text-center">
      <div className="text-4xl font-bold text-zinc-900 dark:text-white mb-2">{number}</div>
      <div className="text-sm text-zinc-500 dark:text-zinc-400 uppercase tracking-wider font-medium">{label}</div>
    </div>
  );
}

function TestimonialCard({ quote, author, role }: { quote: string; author: string; role: string }) {
  return (
    <div className="p-8 rounded-2xl bg-zinc-800/50 border border-zinc-700/50">
      <div className="flex gap-1 mb-6">
        {[1, 2, 3, 4, 5].map((i) => (
          <Star key={i} className="w-4 h-4 text-yellow-500 fill-yellow-500" />
        ))}
      </div>
      <p className="text-zinc-300 mb-6 italic text-lg">"{quote}"</p>
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-sm font-bold text-white">
          {author[0]}
        </div>
        <div>
          <div className="font-bold text-white">{author}</div>
          <div className="text-sm text-zinc-500">{role}</div>
        </div>
      </div>
    </div>
  );
}
