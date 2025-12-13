"use client";

import Link from "next/link";
import { ArrowRight, Upload, Brain, TrendingUp, CheckCircle2, Star, ShieldCheck, ChevronDown, Sparkles, FileText, Zap, PieChart } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background overflow-x-hidden">
      {/* Hero Section */}
      <section className="relative pt-20 pb-20 px-4 overflow-hidden">
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

          {/* Hero Image Mockup - Browser Window Style */}
          <motion.div 
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.4, type: "spring" }}
            className="w-full max-w-5xl mt-16 relative"
          >
             {/* Glow Effect */}
             <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl blur opacity-20 dark:opacity-40 animate-pulse" />
             
             <div className="relative rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xl overflow-hidden">
                {/* Browser Header */}
                <div className="h-10 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 flex items-center px-4 space-x-2">
                   <div className="w-3 h-3 rounded-full bg-red-400/80" />
                   <div className="w-3 h-3 rounded-full bg-amber-400/80" />
                   <div className="w-3 h-3 rounded-full bg-green-400/80" />
                   <div className="ml-4 flex-1 h-5 bg-zinc-200 dark:bg-zinc-800 rounded-full max-w-sm opacity-50" />
                </div>
                
                {/* Browser Content (Mockup) */}
                <div className="p-6 grid grid-cols-12 gap-6 bg-zinc-50/50 dark:bg-black/50 aspect-[16/9] md:aspect-[21/9]">
                   {/* Sidebar */}
                   <div className="hidden md:flex col-span-2 flex-col gap-3">
                      <div className="h-8 w-24 bg-zinc-200 dark:bg-zinc-800 rounded mb-4 animate-pulse" />
                      <div className="h-4 w-full bg-blue-100 dark:bg-blue-900/20 rounded animate-pulse" />
                      <div className="h-4 w-2/3 bg-zinc-100 dark:bg-zinc-800 rounded animate-pulse" />
                      <div className="h-4 w-3/4 bg-zinc-100 dark:bg-zinc-800 rounded animate-pulse" />
                      <div className="h-4 w-full bg-zinc-100 dark:bg-zinc-800 rounded animate-pulse" />
                   </div>
                   
                   {/* Main Content */}
                   <div className="col-span-12 md:col-span-10 grid grid-cols-2 gap-4">
                      {/* Top Cards */}
                      <div className="col-span-2 grid grid-cols-3 gap-4">
                         <div className="h-24 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 p-4 shadow-sm">
                            <div className="h-8 w-8 rounded-full bg-green-100 dark:bg-green-900/30 mb-2" />
                            <div className="h-4 w-16 bg-zinc-100 dark:bg-zinc-800 rounded" />
                         </div>
                         <div className="h-24 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 p-4 shadow-sm">
                            <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900/30 mb-2" />
                            <div className="h-4 w-16 bg-zinc-100 dark:bg-zinc-800 rounded" />
                         </div>
                         <div className="h-24 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 p-4 shadow-sm">
                            <div className="h-8 w-8 rounded-full bg-purple-100 dark:bg-purple-900/30 mb-2" />
                            <div className="h-4 w-16 bg-zinc-100 dark:bg-zinc-800 rounded" />
                         </div>
                      </div>
                      
                      {/* Big Chart Area */}
                      <div className="col-span-2 md:col-span-1 h-32 md:h-full rounded-xl bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 p-4 shadow-sm relative overflow-hidden">
                          <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-blue-500/10 to-transparent" />
                          <div className="flex items-end justify-between h-full gap-2 px-2 pb-2">
                             {[40, 70, 45, 90, 60, 80].map((h, i) => (
                                <motion.div 
                                  key={i} 
                                  initial={{ height: 0 }}
                                  whileInView={{ height: `${h}%` }}
                                  transition={{ duration: 1, delay: 0.5 + (i * 0.1) }}
                                  className="w-full bg-blue-500/80 rounded-t-sm" 
                                />
                             ))}
                          </div>
                      </div>
                      
                      {/* List Area */}
                      <div className="col-span-2 md:col-span-1 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 p-4 shadow-sm flex flex-col gap-3">
                         {[1, 2, 3].map((i) => (
                            <div key={i} className="flex items-center gap-3">
                               <div className="w-8 h-8 rounded bg-zinc-100 dark:bg-zinc-800" />
                               <div className="flex-1 space-y-1">
                                  <div className="h-2 w-full bg-zinc-100 dark:bg-zinc-800 rounded" />
                                  <div className="h-2 w-2/3 bg-zinc-100 dark:bg-zinc-800 rounded" />
                               </div>
                            </div>
                         ))}
                      </div>
                   </div>
                </div>
             </div>
          </motion.div>

          {/* Trust Logos */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.8 }}
            className="pt-16 w-full"
          >
            <p className="text-sm text-zinc-500 dark:text-zinc-500 mb-6 font-medium">CON LA CONFIANZA DE EMPRESAS INNOVADORAS</p>
            <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16 opacity-50 grayscale hover:grayscale-0 transition-all duration-500">
               {/* Placeholders for logos */}
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
      <section className="py-20 bg-white dark:bg-zinc-900 border-y border-zinc-200 dark:border-zinc-800">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <StatItem number="+10k" label="Facturas Procesadas" />
            <StatItem number="99.9%" label="Precisión AI" />
            <StatItem number="2.5h" label="Ahorro Diario Promedio" />
            <StatItem number="+500" label="Empresas Activas" />
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-24 px-4 bg-zinc-50 dark:bg-black relative overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-4 text-zinc-900 dark:text-white">Cómo Funciona</h2>
            <p className="text-zinc-500 dark:text-zinc-400 max-w-2xl mx-auto text-lg">
              Simplificamos el proceso contable en tres pasos simples.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-12 relative">
             {/* Connector Line (Desktop) */}
             <div className="hidden md:block absolute top-12 left-[15%] right-[15%] h-0.5 bg-gradient-to-r from-blue-200 via-indigo-200 to-blue-200 dark:from-blue-900 dark:via-indigo-900 dark:to-blue-900 -z-10" />

             <HowItWorksStep 
               number="1"
               icon={<FileText className="w-6 h-6 text-white" />}
               title="Sube tus archivos"
               description="Arrastra y suelta tus facturas en PDF. Aceptamos múltiples archivos a la vez."
               delay={0}
             />
             <HowItWorksStep 
               number="2"
               icon={<Zap className="w-6 h-6 text-white" />}
               title="La IA Analiza"
               description="Nuestros algoritmos extraen automáticamente proveedores, fechas, items y totales."
               delay={0.2}
             />
              <HowItWorksStep 
               number="3"
               icon={<PieChart className="w-6 h-6 text-white" />}
               title="Toma el Control"
               description="Visualiza tus gastos, exporta reportes y toma decisiones basadas en datos reales."
               delay={0.4}
             />
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
      <section className="py-32 bg-muted/30 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-500/5 via-transparent to-transparent dark:from-blue-900/10" />
        <div className="max-w-7xl mx-auto px-4 relative z-10">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-16 text-foreground">Lo que dicen nuestros usuarios</h2>
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

      {/* FAQ Section */}
      <section className="py-24 px-4 max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-zinc-900 dark:text-white">Preguntas Frecuentes</h2>
          <p className="text-zinc-500 dark:text-zinc-400">Todo lo que necesitas saber antes de empezar.</p>
        </div>
        <div className="space-y-4 w-full">
          <FaqItem 
            question="¿Es gratuito empezar?" 
            answer="Sí, tenemos un plan gratuito que te permite procesar hasta 50 facturas al mes sin costo alguno. No se requiere tarjeta de crédito." 
          />
          <FaqItem 
            question="¿Qué tipos de archivos soportan?" 
            answer="Actualmente soportamos archivos PDF nativos y escaneados. Nuestra IA es capaz de leer texto de imágenes con alta precisión." 
          />
          <FaqItem 
            question="¿Mis datos están seguros?" 
            answer="Absolutamente. Utilizamos encriptación de grado bancario para todos los archivos y datos en reposo y en tránsito. Tus facturas son privadas." 
          />
          <FaqItem 
            question="¿Puedo exportar mis datos?" 
            answer="Sí, puedes exportar todos los datos extraídos a Excel, CSV o conectarlos directamente con tu software contable vía API." 
          />
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

// ... existing components (FeatureCard, StatItem, TestimonialCard) ...
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
    <div className="p-8 rounded-2xl bg-card border border-border shadow-sm hover:shadow-md transition-shadow">
      <div className="flex gap-1 mb-6">
        {[1, 2, 3, 4, 5].map((i) => (
          <Star key={i} className="w-4 h-4 text-yellow-500 fill-yellow-500" />
        ))}
      </div>
      <p className="text-muted-foreground mb-6 italic text-lg">"{quote}"</p>
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-sm font-bold text-white">
          {author[0]}
        </div>
        <div>
          <div className="font-bold text-foreground">{author}</div>
          <div className="text-sm text-muted-foreground">{role}</div>
        </div>
      </div>
    </div>
  );
}

// NEW COMPONENTS

function HowItWorksStep({ number, icon, title, description, delay }: { number: string; icon: React.ReactNode; title: string; description: string; delay: number }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay }}
      className="flex flex-col items-center text-center relative z-10 group"
    >
       <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/20 flex items-center justify-center mb-6 transform transition-transform group-hover:scale-110 group-hover:rotate-3">
         {icon}
         <div className="absolute -top-2 -right-2 w-6 h-6 bg-white dark:bg-zinc-800 rounded-full border border-blue-100 dark:border-blue-900 flex items-center justify-center text-xs font-bold text-blue-600 dark:text-blue-400 shadow-sm">
            {number}
         </div>
       </div>
       <h3 className="text-xl font-bold mb-3 text-zinc-900 dark:text-white">{title}</h3>
       <p className="text-zinc-500 dark:text-zinc-400 leading-relaxed">{description}</p>
    </motion.div>
  );
}

function FaqItem({ question, answer }: { question: string; answer: string }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="w-full border border-zinc-200 dark:border-zinc-800 rounded-xl bg-white dark:bg-zinc-900 overflow-hidden">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full p-6 text-left focus:outline-none"
      >
        <span className="font-semibold text-zinc-900 dark:text-zinc-100">{question}</span>
        <ChevronDown className={`w-5 h-5 text-zinc-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-6 pb-6 text-zinc-500 dark:text-zinc-400 leading-relaxed break-words">
              {answer}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
