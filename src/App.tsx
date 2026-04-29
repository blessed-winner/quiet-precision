/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion, AnimatePresence, useInView } from "motion/react";
import { useState, useEffect, useRef, useMemo } from "react";

// --- Components ---

const RippleEffect = () => {
  const [ripples, setRipples] = useState<{ x: number; y: number; id: number }[]>([]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const id = Date.now();
      setRipples((prev) => [...prev, { x: e.clientX, y: e.clientY, id }]);
      setTimeout(() => {
        setRipples((prev) => prev.filter((r) => r.id !== id));
      }, 600);
    };
    window.addEventListener("mousedown", handleClick);
    return () => window.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-[999]">
      {ripples.map((ripple) => (
        <span
          key={ripple.id}
          className="ripple-effect"
          style={{ left: ripple.x, top: ripple.y }}
        />
      ))}
    </div>
  );
};

const Typewriter = ({ phrases }: { phrases: string[] }) => {
  const [index, setIndex] = useState(0);
  const [text, setText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  
  useEffect(() => {
    const timeout = setTimeout(() => {
      const currentPhrase = phrases[index];
      if (!isDeleting) {
        setText(currentPhrase.substring(0, text.length + 1));
        if (text.length + 1 === currentPhrase.length) {
          setTimeout(() => setIsDeleting(true), 1800);
        }
      } else {
        setText(currentPhrase.substring(0, text.length - 1));
        if (text.length === 0) {
          setIsDeleting(false);
          setIndex((prev) => (prev + 1) % phrases.length);
        }
      }
    }, isDeleting ? 32 : 58);
    
    return () => clearTimeout(timeout);
  }, [text, isDeleting, index, phrases]);

  return (
    <span className="font-serif italic text-secondary">
      {text}
      <span className="inline-block w-[1px] h-[1.2em] bg-primary align-middle ml-1 animate-pulse" />
    </span>
  );
};

const CursorTrail = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let particles: { x: number; y: number; opacity: number; life: number; radius: number }[] = [];
    
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
      particles.push({
        x: e.clientX,
        y: e.clientY - canvas.getBoundingClientRect().top,
        opacity: 0.18,
        life: 60,
        radius: Math.random() * 3 + 1
      });
    };

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles = particles.filter(p => p.life > 0);
      particles.forEach(p => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(26, 26, 26, ${p.opacity})`;
        ctx.fill();
        p.life--;
        p.opacity -= 0.18 / 60;
      });
      requestAnimationFrame(animate);
    };

    const handleResize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("resize", handleResize);
    handleResize();
    const animationFrame = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationFrame);
    };
  }, []);

  return (
    <div 
      className="absolute inset-0 z-0 overflow-hidden hide-cursor"
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      <canvas ref={canvasRef} className="w-full h-full" />
      {isHovering && (
        <div 
          className="custom-cursor-dot" 
          style={{ left: mousePos.x, top: mousePos.y }} 
        />
      )}
    </div>
  );
};

const ProjectThumbnail = ({ index }: { index: number }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const seed = useMemo(() => Math.random() * 10, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let t = 0;
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.strokeStyle = "rgba(0,0,0,0.07)";
      ctx.lineWidth = 0.5;

      for (let i = 0; i < 14; i++) {
        ctx.beginPath();
        const freq = 0.01 + (i * 0.002) + (seed * 0.001);
        const amp = 15 + (i * 2);
        for (let x = 0; x <= canvas.width; x += 2) {
          const y = (canvas.height / 2) + Math.sin(x * freq + t + (i * 0.5)) * amp;
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
      t += 0.012;
      requestAnimationFrame(animate);
    };

    const handleResize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    window.addEventListener("resize", handleResize);
    handleResize();
    const animationFrame = requestAnimationFrame(animate);
    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationFrame);
    };
  }, [seed]);

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full opacity-60" />;
};

const CountingStat = ({ target, label, suffix = "" }: { target: number; label: string; suffix?: string }) => {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });

  useEffect(() => {
    if (inView) {
      const duration = 1400;
      const stepTime = 16;
      const steps = duration / stepTime;
      const increment = Math.ceil(target / steps);
      
      const timer = setInterval(() => {
        setCount((prev) => {
          if (prev + increment >= target) {
            clearInterval(timer);
            return target;
          }
          return prev + increment;
        });
      }, stepTime);
      return () => clearInterval(timer);
    }
  }, [inView, target]);

  return (
    <div ref={ref} className="text-center md:text-left">
      <div className="font-serif text-4xl mb-1 text-primary">
        <span>{count}</span>{suffix}
      </div>
      <div className="label-text text-tertiary">{label}</div>
    </div>
  );
};

const SkillRow = ({ name, level }: { name: string; level: number }) => {
  const [width, setWidth] = useState(0);
  const [displayLevel, setDisplayLevel] = useState(0);
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });

  useEffect(() => {
    if (inView) {
      setTimeout(() => setWidth(level), 200);
      const timer = setInterval(() => {
        setDisplayLevel(prev => {
          if (prev >= level) {
            clearInterval(timer);
            return level;
          }
          return prev + 1;
        });
      }, 10);
      return () => clearInterval(timer);
    }
  }, [inView, level]);

  return (
    <div ref={ref} className="group py-3 hairline-b flex items-center justify-between">
      <div className="flex-1">
        <div className="flex justify-between items-baseline mb-2">
          <span className="font-sans text-[13px] text-primary">{name}</span>
          <span className="font-mono text-[10px] text-tertiary">{displayLevel}%</span>
        </div>
        <div className="h-[2px] bg-border overflow-hidden">
          <div 
            className="h-full bg-primary transition-all duration-[1200ms] ease-[cubic-bezier(.16,1,.3,1)]"
            style={{ width: `${width}%` }}
          />
        </div>
      </div>
      <div className="ml-4 flex gap-1">
        {[...Array(5)].map((_, i) => (
          <div 
            key={i} 
            className={`w-[5px] h-[5px] rounded-full ${i < Math.floor(level/20) ? "bg-primary" : "bg-border"}`} 
          />
        ))}
      </div>
    </div>
  );
};

// --- Main Page ---

export default function App() {
  return (
    <div className="min-h-screen font-sans selection:bg-primary/10 selection:text-primary">
      <RippleEffect />
      
      {/* Navigation */}
      <nav className="fixed top-0 left-0 w-full h-[60px] bg-white hairline-b z-[100] px-6 flex items-center justify-between">
        <div className="font-serif text-[18px]">Elias Vance</div>
        <div className="hidden md:flex gap-8">
          {["Work", "About", "Skills", "Experience", "Contact"].map((item) => (
            <a 
              key={item} 
              href={`#${item.toLowerCase()}`}
              className="label-text text-tertiary hover:text-primary transition-colors duration-200"
            >
              {item}
            </a>
          ))}
        </div>
        <div className="md:hidden">
          <div className="w-4 h-[1px] bg-primary mb-1" />
          <div className="w-4 h-[1px] bg-primary" />
        </div>
      </nav>

      <main className="max-w-[1100px] mx-auto pt-[60px]">
        
        {/* Hero Section */}
        <section className="relative min-h-[500px] grid grid-cols-1 md:grid-cols-2 hairline-b">
          <CursorTrail />
          <div className="relative z-10 p-12 flex flex-col justify-end hairline-r">
            <div className="label-text text-tertiary mb-4">Role // Product Designer • Loc // Milan</div>
            <h1 className="text-[56px] leading-[1.05] tracking-[-0.01em] text-primary">
              Elias <br />
              <span className="italic text-secondary">Vance.</span>
            </h1>
          </div>
          <div className="relative z-10 p-12 flex flex-col justify-between">
            <div className="max-w-[320px]">
              <p className="font-serif italic text-2xl text-secondary leading-tight">
                "Design is the silent ambassador of your brand."
              </p>
            </div>
            <div className="space-y-4">
              {["01 — Minimalist by philosophy", "02 — Architectural by structure", "03 — Human-centric by nature"].map((line, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-4 h-[0.5px] bg-border" />
                  <span className="label-text text-tertiary">{line}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Marquee (Skills) */}
        <div className="overflow-hidden bg-white hairline-b py-3 flex">
          <div className="flex animate-marquee whitespace-nowrap">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="flex gap-12 px-6">
                {["SYSTEM DESIGN", "USER RESEARCH", "MOTION PHILOSOPHY", "CRAFT", "LEGACY", "TYPOGRAPHY", "RESTRAINT"].map((tag) => (
                  <span key={tag} className="label-text text-tertiary opacity-60">
                    {tag}
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Work Section */}
        <section id="work" className="hairline-b">
          <div className="label-text text-tertiary p-6 hairline-b">Selected Work</div>
          <div className="grid grid-cols-1 md:grid-cols-2">
            {[
              { num: "01", title: "The Obsidian Project", type: "Visual Identity • 2024", desc: "A study in dark values and material weight." },
              { num: "02", title: "Silent Interfaces", type: "UX Research • 2023", desc: "Crafting digital spaces that don't fight for attention." },
              { num: "03", title: "Kinetic Form", type: "Motion Design • 2023", desc: "Exploring the boundary between stillness and momentum." },
              { num: "04", title: "Archive of Light", type: "Digital Curation • 2022", desc: "A narrative-first approach to architectural history." }
            ].map((project, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: i * 0.12 }}
                className={`group relative p-12 hairline-b ${i % 2 === 0 ? "md:hairline-r" : ""} hover:bg-[#f8f8f8] transition-colors duration-200 cursor-pointer overflow-hidden`}
              >
                <ProjectThumbnail index={i} />
                <div className="relative z-10">
                  <div className="flex justify-between items-start mb-16">
                    <span className="label-text text-tertiary">{project.num}</span>
                    <span className="text-[14px] text-tertiary group-hover:text-primary group-hover:-translate-y-1 group-hover:translate-x-1 transition-all duration-200">↗</span>
                  </div>
                  <h3 className="text-[22px] mb-2">{project.title}</h3>
                  <div className="label-text text-tertiary mb-4">{project.type}</div>
                  <p className="font-sans text-[12px] text-secondary max-w-[200px]">{project.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* About Section */}
        <section id="about" className="grid grid-cols-1 md:grid-cols-[160px_1fr] hairline-b">
          <div className="p-6 hairline-r hidden md:flex items-center justify-center">
            <div className="label-text text-tertiary rotate-180 [writing-mode:vertical-rl]">Philosophy</div>
          </div>
          <div className="p-12 md:p-24">
            <div className="max-w-[520px] mb-16">
              <p className="font-serif text-[20px] italic leading-[1.75] text-secondary">
                <Typewriter phrases={[
                  "Rejecting the temporary, we build for the enduring.",
                  "Design is the process of stripping away until only the truth remains.",
                  "Every pixel should serve a narrative purpose.",
                  "The objective is not visibility. The objective is legacy.",
                  "Quiet precision in every structural decision."
                ]} />
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-12">
              <CountingStat target={12} label="Years Experience" suffix="+" />
              <CountingStat target={84} label="Projects Completed" suffix="" />
              <CountingStat target={98} label="Client Satisfaction" suffix="%" />
            </div>
          </div>
        </section>

        {/* Skills Section */}
        <section id="skills" className="grid grid-cols-1 md:grid-cols-3 hairline-b">
          {[
            { cat: "Creative", list: ["Design Systems", "Typography", "Art Direction", "Motion Graphics"] },
            { cat: "Technical", list: ["Product Architecture", "React Engineering", "Creative Coding", "3D Visualization"] },
            { cat: "Strategy", list: ["User Research", "Narrative Design", "Brand Positioning", "Material Inquiry"] }
          ].map((col, i) => (
            <div key={i} className={`flex flex-col ${i < 2 ? "md:hairline-r" : ""}`}>
              <div className="label-text text-tertiary p-6 hairline-b text-center">{col.cat}</div>
              <div className="flex-1 p-6 space-y-0">
                {col.list.map((skill, j) => (
                  <SkillRow key={j} name={skill} level={75 + Math.random() * 20} />
                ))}
              </div>
            </div>
          ))}
        </section>

        {/* Experience Section */}
        <section id="experience" className="p-12 md:p-24 hairline-b">
          <div className="label-text text-tertiary mb-12">Professional Chronicle</div>
          <div className="space-y-8">
            {[
              { year: "2022 — PRES", role: "Principal Architect", company: "Vance Design Studio", loc: "Milan" },
              { year: "2019 — 2022", role: "Senior Product Designer", company: "Abstract Corp", loc: "London" },
              { year: "2016 — 2019", role: "UI / UX Designer", company: "Atelier Monolith", loc: "Paris" }
            ].map((job, i) => (
              <motion.div 
                key={i} 
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: i * 0.12 }}
                className="flex flex-col sm:flex-row gap-4 sm:gap-12 pb-8 hairline-b last:border-b-0 last:pb-0"
              >
                <div className="text-[11px] text-tertiary font-mono w-[90px]">{job.year}</div>
                <div>
                  <h4 className="text-[17px] mb-1">{job.role}</h4>
                  <div className="text-[11px] text-tertiary uppercase tracking-wider">{job.company} • {job.loc}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Testimonial */}
        <section className="p-24 flex flex-col items-center hairline-b">
          <div className="font-serif text-[72px] text-[#d0d0d0] leading-none mb-4">“</div>
          <p className="font-serif italic text-[22px] text-secondary leading-relaxed text-center max-w-[540px] mb-8">
            His ability to find the intersection of structural logic and poetic sensibility is rare. The result is always a work of quiet power.
          </p>
          <div className="label-text text-tertiary">Marcus Aurel • Creative Director</div>
        </section>

        {/* Contact Section */}
        <section id="contact" className="grid grid-cols-1 md:grid-cols-2 noise-texture relative overflow-hidden">
          <div className="p-12 md:p-24 hairline-r relative z-10">
            <h2 className="text-[36px] leading-[1.2] mb-8">
              Let’s build something <br />
              <span className="italic text-secondary">that endures.</span>
            </h2>
            <p className="font-sans text-[13px] text-secondary max-w-[300px] mb-12 leading-relaxed">
              Open to inquiries for architectural digital products and strategic identity consultations.
            </p>
            <a href="mailto:hello@eliasvance.com" className="label-text border-b border-primary pb-1 hover:text-secondary hover:border-secondary transition-colors duration-200">
              hello@eliasvance.com
            </a>
          </div>
          <div className="p-12 md:p-24 relative z-10">
            <form className="space-y-8" onSubmit={(e) => e.preventDefault()}>
              {[
                { label: "Identity", placeholder: "Your Name" },
                { label: "Contact", placeholder: "Email Address" },
                { label: "Subject", placeholder: "Project Type" }
              ].map((field) => (
                <div key={field.label}>
                  <div className="label-text text-tertiary mb-2">{field.label}</div>
                  <input 
                    type="text" 
                    placeholder={field.placeholder}
                    className="w-full bg-transparent p-0 pb-2 border-b border-border text-[13px] focus:outline-none focus:border-primary transition-colors duration-200 placeholder:text-tertiary/40" 
                  />
                </div>
              ))}
              <div>
                <div className="label-text text-tertiary mb-2">Inquiry</div>
                <textarea 
                  rows={3}
                  placeholder="How can we collaborate?"
                  className="w-full bg-transparent p-0 pb-2 border-b border-border text-[13px] focus:outline-none focus:border-primary transition-colors duration-200 placeholder:text-tertiary/40 resize-none" 
                />
              </div>
              <button className="label-text text-[9px] px-8 py-3 border-[0.5px] border-primary hover:bg-primary hover:text-white transition-all duration-200">
                Send Message →
              </button>
            </form>
          </div>
        </section>

        {/* Footer */}
        <footer className="p-6 hairline-t flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="label-text text-tertiary opacity-60">© 2026 Elias Vance Studio</div>
          <div className="flex gap-6">
            {["Instagram", "LinkedIn", "Twitter"].map((social) => (
              <a key={social} href="#" className="label-text text-tertiary hover:text-primary transition-colors selection:bg-transparent">
                {social}
              </a>
            ))}
          </div>
        </footer>

      </main>
    </div>
  );
}
