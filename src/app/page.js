'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Lenis from '@studio-freight/lenis';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import {
  FileText,
  Users,
  Trophy,
  Zap,
  ArrowRight,
  GraduationCap,
  Calendar
} from 'lucide-react';

export default function LandingPage() {
  const [isLoading, setIsLoading] = useState(true);
  const containerRef = useRef(null);
  const horizontalSectionRef = useRef(null);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    // Initialize Lenis
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smooth: true,
      mouseMultiplier: 1,
    });

    function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);

    const ctx = gsap.context(() => {
      // LOADER ANIMATION
      const tlLoader = gsap.timeline({
        onComplete: () => setIsLoading(false)
      });

      tlLoader
        .to(".loader-text", {
          y: 0,
          duration: 1,
          stagger: 0.1,
          ease: "power4.out"
        })
        .to(".loader-line", {
          scaleX: 1,
          duration: 1,
          ease: "power2.inOut"
        })
        .to(".loader-overlay", {
          yPercent: -100,
          duration: 1,
          ease: "power4.inOut",
          delay: 0.5
        })
        .from(".hero-title", {
          yPercent: 120,
          stagger: 0.1,
          duration: 1.2,
          ease: "power4.out"
        }, "-=0.5")
        .to(".hero-sub", {
          opacity: 1,
          y: 0,
          stagger: 0.1,
          duration: 1,
          ease: "power2.out"
        }, "-=0.8");

      // FLOATING HERO CARDS
      gsap.to(".hero-cards-container", {
        y: -20,
        duration: 2,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut"
      });

      gsap.from(".hero-card", {
        y: 100,
        opacity: 0,
        stagger: 0.2,
        duration: 1.2,
        ease: "back.out(1.7)",
        delay: 2
      });

      // HORIZONTAL SCROLL
      const panels = gsap.utils.toArray(".problem-panel");
      if (panels.length > 0) {
        gsap.to(panels, {
          xPercent: -100 * (panels.length - 1),
          ease: "none",
          scrollTrigger: {
            trigger: horizontalSectionRef.current,
            pin: true,
            scrub: 1,
            snap: 1 / (panels.length - 1),
            end: () => "+=" + (horizontalSectionRef.current?.offsetWidth || 0)
          }
        });
      }

      // SOLUTION REVEAL
      const solutionTl = gsap.timeline({
        scrollTrigger: {
          trigger: "#solution-center",
          start: "top 80%",
          toggleActions: "play none none reverse"
        }
      });

      solutionTl
        .to("#solution-center", { scale: 1, duration: 0.8, ease: "back.out(1.7)" })
        .to(".solution-circle", {
          width: "800px",
          height: "800px",
          duration: 1.5,
          ease: "power2.out"
        }, "-=0.5")
        .to(".pillar-anim", {
          opacity: 1,
          y: 0,
          stagger: 0.1,
          duration: 0.5
        }, "-=1");

      // STACKED CARDS
      const cards = gsap.utils.toArray(".stack-card");
      cards.forEach((card, i) => {
        gsap.from(card, {
          scale: 0.9 + (0.05 * i),
          opacity: 0,
          scrollTrigger: {
            trigger: card,
            start: "top bottom-=100",
            end: "top center",
            scrub: true
          }
        });
      });

    }, containerRef);

    // MAGNETIC BUTTONS
    const magnetBtns = document.querySelectorAll(".magnet-btn");
    magnetBtns.forEach(btn => {
      const handleMouseMove = (e) => {
        const rect = btn.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;

        gsap.to(btn, {
          x: x * 0.3,
          y: y * 0.3,
          duration: 0.3,
          ease: "power2.out"
        });
      };

      const handleMouseLeave = () => {
        gsap.to(btn, {
          x: 0,
          y: 0,
          duration: 0.5,
          ease: "elastic.out(1, 0.3)"
        });
      };

      btn.addEventListener("mousemove", handleMouseMove);
      btn.addEventListener("mouseleave", handleMouseLeave);
    });

    return () => {
      ctx.revert();
      lenis.destroy();
    };
  }, []);

  return (
    <div ref={containerRef} className="relative bg-black text-white min-h-screen overflow-x-hidden font-sans">

      {/* PRELOADER */}
      {isLoading && (
        <div className="loader-overlay fixed inset-0 bg-black z-[9999] flex justify-center items-center">
          <div className="text-center">
            <div className="text-6xl font-black tracking-tighter mb-2 overflow-hidden">
              <span className="loader-text inline-block translate-y-full">UNI</span>
              <span className="loader-text inline-block translate-y-full text-indigo-500">LOOP</span>
            </div>
            <div className="w-48 h-[1px] bg-gray-800 mx-auto mt-4 overflow-hidden">
              <div className="loader-line w-full h-full bg-white origin-left scale-x-0"></div>
            </div>
          </div>
        </div>
      )}

      {/* NAVBAR */}
      <nav className="fixed top-0 w-full z-50 px-6 py-6 flex justify-between items-center mix-blend-difference">
        <a href="#" className="text-2xl font-black tracking-tighter">
          UNILOOP<span className="text-indigo-500">.</span>
        </a>

        <div className="hidden md:flex gap-8">
          <a href="#problems" className="text-sm uppercase tracking-widest hover:text-indigo-400 transition">Mission</a>
          <a href="#solutions" className="text-sm uppercase tracking-widest hover:text-indigo-400 transition">Features</a>
        </div>

        <Link href="/login" className="magnet-btn px-6 py-2 border border-white/20 rounded-full text-xs font-bold uppercase tracking-widest hover:bg-white hover:text-black transition">
          Start Beta
        </Link>
      </nav>

      {/* HERO SECTION */}
      <section className="relative h-screen flex flex-col justify-center items-center px-6 overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60vw] h-[60vw] bg-indigo-600/20 rounded-full blur-[100px] pointer-events-none animate-pulse"></div>

        <div className="z-10 text-center max-w-5xl">
          <div className="overflow-hidden mb-2">
            <h1 className="hero-title text-6xl md:text-9xl leading-[0.9] font-black tracking-tighter">
              CAMPUS LIFE.
            </h1>
          </div>
          <div className="overflow-hidden mb-8">
            <h1 className="hero-title text-6xl md:text-9xl leading-[0.9] font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">
              REMASTERED.
            </h1>
          </div>

          <p className="hero-sub text-gray-400 text-lg md:text-xl max-w-2xl mx-auto opacity-0 translate-y-10 leading-relaxed">
            No more WhatsApp spam. No more missed hackathons. <br />
            The operating system your college actually needs.
          </p>

          <div className="mt-12 flex justify-center gap-6 hero-sub opacity-0 translate-y-10">
            <Link href="/login" className="magnet-btn bg-white text-black px-10 py-4 rounded-full font-bold text-lg hover:scale-105 transition shadow-[0_0_30px_rgba(255,255,255,0.3)]">
              Get Started
            </Link>
            <button className="magnet-btn px-10 py-4 rounded-full border border-white/20 font-bold text-lg hover:bg-white/5 transition flex items-center gap-2">
              <Zap className="w-5 h-5" /> Demo
            </button>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-10 flex flex-col items-center gap-2 opacity-50">
          <span className="text-[10px] uppercase tracking-widest">Scroll to Explore</span>
          <div className="w-[1px] h-12 bg-gradient-to-b from-white to-transparent"></div>
        </div>
      </section>

      {/* 3D FLOATING CARDS SHOWCASE */}
      <section className="py-20 px-6 relative">
        <div className="max-w-md mx-auto hero-cards-container relative h-96">
          {/* Card 1: Notes */}
          <div className="hero-card absolute top-0 left-0 w-full h-full bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 transform rotate-[-6deg] translate-y-4 z-10 border-l-4 border-l-yellow-400">
            <div className="flex justify-between items-center mb-4">
              <span className="text-yellow-400 font-bold text-sm">NOTES</span>
              <FileText className="w-6 h-6 text-gray-400" />
            </div>
            <div className="h-2 w-1/2 bg-gray-700 rounded mb-2"></div>
            <div className="h-2 w-3/4 bg-gray-700 rounded mb-8"></div>
            <div className="bg-yellow-400/10 p-3 rounded-lg border border-yellow-400/20">
              <p className="text-xs text-yellow-200">"Bro, Engineering Maths ke notes bhej de pls!"</p>
            </div>
          </div>

          {/* Card 2: Teams */}
          <div className="hero-card absolute top-4 left-4 w-full h-full bg-gray-900 backdrop-blur-xl border border-white/10 rounded-2xl p-6 transform rotate-[6deg] translate-x-4 z-20 border-l-4 border-l-green-400">
            <div className="flex justify-between items-center mb-4">
              <span className="text-green-400 font-bold text-sm">TEAMS</span>
              <Users className="w-6 h-6 text-gray-400" />
            </div>
            <div className="flex -space-x-2 mb-6">
              <div className="w-8 h-8 rounded-full bg-blue-500 border-2 border-gray-900"></div>
              <div className="w-8 h-8 rounded-full bg-purple-500 border-2 border-gray-900"></div>
              <div className="w-8 h-8 rounded-full bg-red-500 border-2 border-gray-900"></div>
              <div className="w-8 h-8 rounded-full bg-gray-700 border-2 border-gray-900 flex items-center justify-center text-xs">+1</div>
            </div>
            <div className="bg-green-400/10 p-3 rounded-lg border border-green-400/20">
              <p className="text-xs text-green-200">Looking for a frontend dev for Hackathon!</p>
            </div>
          </div>

          {/* Card 3: Main Dashboard */}
          <div className="hero-card absolute top-8 left-[-10px] w-full h-full bg-[#0c0c16] backdrop-blur-xl rounded-2xl p-6 z-30 border border-indigo-500/50 shadow-[0_0_30px_rgba(99,102,241,0.3)]">
            <div className="flex items-center gap-3 mb-6 border-b border-gray-800 pb-4">
              <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center">
                <GraduationCap className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-lg">UNILOOP</h3>
                <p className="text-xs text-gray-400">Dashboard</p>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-2 bg-white/5 rounded hover:bg-white/10 cursor-pointer">
                <span className="text-sm">Found: Blue Drafter</span>
                <span className="text-xs text-indigo-400">View</span>
              </div>
              <div className="flex items-center justify-between p-2 bg-white/5 rounded hover:bg-white/10 cursor-pointer">
                <span className="text-sm">Smart India Hackathon</span>
                <span className="text-xs text-green-400">Apply</span>
              </div>
              <div className="flex items-center justify-between p-2 bg-white/5 rounded hover:bg-white/10 cursor-pointer">
                <span className="text-sm">PYQ Papers 2024</span>
                <span className="text-xs text-yellow-400">Download</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* HORIZONTAL SCROLL PROBLEMS */}
      <section id="problems" ref={horizontalSectionRef} className="h-screen overflow-hidden bg-[#0a0a0a]">
        <div className="horizontal-container h-full flex items-center">

          {/* Panel 1: Intro */}
          <div className="problem-panel w-screen h-full flex flex-col justify-center px-10 md:px-32 border-r border-white/5 flex-shrink-0">
            <span className="text-indigo-500 font-bold tracking-widest uppercase mb-4">The Current State</span>
            <h2 className="text-5xl md:text-7xl font-bold leading-tight">
              Why is everything <br />
              <span className="text-gray-600">so scattered?</span>
            </h2>
            <div className="mt-10 flex items-center gap-4 text-gray-400">
              <ArrowRight className="w-6 h-6 animate-bounce" />
              <span>Scroll right to see the chaos</span>
            </div>
          </div>

          {/* Panel 2: WhatsApp Chaos */}
          <div className="problem-panel w-screen h-full flex flex-col justify-center px-10 md:px-32 border-r border-white/5 flex-shrink-0 bg-[#0c0c0c]">
            <div className="max-w-2xl">
              <div className="w-16 h-16 bg-green-500/10 rounded-2xl flex items-center justify-center mb-6">
                <Zap className="w-8 h-8 text-green-500" />
              </div>
              <h3 className="text-4xl font-bold mb-4">Notification Hell</h3>
              <p className="text-gray-400 text-lg">"Does anyone have the Physics pdf?" buried under 500 birthday wishes. Important info gets lost instantly.</p>
            </div>
          </div>

          {/* Panel 3: Missed Opportunities */}
          <div className="problem-panel w-screen h-full flex flex-col justify-center px-10 md:px-32 flex-shrink-0 bg-[#0e0e0e]">
            <div className="max-w-2xl">
              <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center mb-6">
                <Calendar className="w-8 h-8 text-red-500" />
              </div>
              <h3 className="text-4xl font-bold mb-4">Missed Deadlines</h3>
              <p className="text-gray-400 text-lg">Hackathons, Scholarships, Fests. You find out about them the day after registrations close.</p>
            </div>
          </div>

        </div>
      </section>

      {/* SOLUTION REVEAL */}
      <section className="min-h-[80vh] flex flex-col items-center justify-center relative overflow-hidden bg-gradient-to-b from-black to-[#050510]">
        <div className="solution-circle w-0 h-0 rounded-full border border-indigo-500/50 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-0"></div>
        <div className="solution-circle w-0 h-0 rounded-full border border-purple-500/30 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-0"></div>

        <div className="z-10 text-center scale-0" id="solution-center">
          <div className="w-24 h-24 mx-auto bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-[0_0_50px_rgba(99,102,241,0.6)] mb-6">
            <span className="font-black text-4xl">U</span>
          </div>
          <h2 className="text-5xl md:text-7xl font-bold mb-4">UNILOOP</h2>
          <p className="text-xl text-gray-300">The Operating System for your Campus.</p>
        </div>

        {/* Pillars */}
        <div className="absolute top-[20%] opacity-0 pillar-anim translate-y-10">
          <span className="px-4 py-2 bg-indigo-500/10 border border-indigo-500/50 rounded-full text-indigo-300 font-bold tracking-wider">CONNECT</span>
        </div>
        <div className="absolute bottom-[20%] opacity-0 pillar-anim translate-y-10">
          <span className="px-4 py-2 bg-purple-500/10 border border-purple-500/50 rounded-full text-purple-300 font-bold tracking-wider">GROW</span>
        </div>
        <div className="absolute left-[10%] md:left-[25%] opacity-0 pillar-anim translate-y-10">
          <span className="px-4 py-2 bg-blue-500/10 border border-blue-500/50 rounded-full text-blue-300 font-bold tracking-wider">SHARE</span>
        </div>
        <div className="absolute right-[10%] md:right-[25%] opacity-0 pillar-anim translate-y-10">
          <span className="px-4 py-2 bg-pink-500/10 border border-pink-500/50 rounded-full text-pink-300 font-bold tracking-wider">LEARN</span>
        </div>
      </section>

      {/* STACKED CARDS */}
      <section id="solutions" className="py-32 px-4 md:px-10 bg-black">
        <div className="text-center mb-20">
          <span className="text-indigo-500 font-bold uppercase tracking-widest text-sm">Introducing Uniloop</span>
          <h2 className="text-4xl md:text-6xl font-bold mt-4">Order from Chaos.</h2>
        </div>

        <div className="max-w-5xl mx-auto relative space-y-24">

          {/* Card 1: Resources */}
          <div className="stack-card sticky top-24 bg-white/5 backdrop-blur-xl rounded-3xl p-8 md:p-14 min-h-[500px] flex flex-col md:flex-row gap-10 items-center border-t border-indigo-500/30">
            <div className="w-full md:w-1/2">
              <div className="w-16 h-16 bg-indigo-500/20 rounded-2xl flex items-center justify-center mb-8 text-indigo-400">
                <FileText className="w-8 h-8" />
              </div>
              <h3 className="text-3xl md:text-4xl font-bold mb-4">Resource Hub</h3>
              <p className="text-gray-400 text-lg leading-relaxed">A structured library for every semester. Upload notes, get karma, become a legend.</p>
            </div>
            <div className="w-full md:w-1/2 h-64 bg-gradient-to-br from-indigo-900/20 to-black rounded-2xl border border-white/10 flex items-center justify-center">
              <div className="bg-white/5 backdrop-blur-xl px-6 py-3 rounded-xl border border-white/10">
                <span className="font-mono text-indigo-300">/download/sem3_notes.pdf</span>
              </div>
            </div>
          </div>

          {/* Card 2: Teams */}
          <div className="stack-card sticky top-24 bg-white/5 backdrop-blur-xl rounded-3xl p-8 md:p-14 min-h-[500px] flex flex-col md:flex-row gap-10 items-center border-t border-purple-500/30">
            <div className="w-full md:w-1/2">
              <div className="w-16 h-16 bg-purple-500/20 rounded-2xl flex items-center justify-center mb-8 text-purple-400">
                <Users className="w-8 h-8" />
              </div>
              <h3 className="text-3xl md:text-4xl font-bold mb-4">Team Matchmaking</h3>
              <p className="text-gray-400 text-lg leading-relaxed">Don't have a team for the hackathon? Filter students by skills (React, AI, Design) and connect instantly.</p>
            </div>
            <div className="w-full md:w-1/2 h-64 bg-gradient-to-br from-purple-900/20 to-black rounded-2xl border border-white/10 flex items-center justify-center">
              <div className="flex -space-x-4">
                <div className="w-12 h-12 rounded-full bg-blue-500 border-2 border-black"></div>
                <div className="w-12 h-12 rounded-full bg-green-500 border-2 border-black"></div>
                <div className="w-12 h-12 rounded-full bg-yellow-500 border-2 border-black flex items-center justify-center font-bold text-black text-xs">+1</div>
              </div>
            </div>
          </div>

          {/* Card 3: Events */}
          <div className="stack-card sticky top-24 bg-white/5 backdrop-blur-xl rounded-3xl p-8 md:p-14 min-h-[500px] flex flex-col md:flex-row gap-10 items-center border-t border-pink-500/30">
            <div className="w-full md:w-1/2">
              <div className="w-16 h-16 bg-pink-500/20 rounded-2xl flex items-center justify-center mb-8 text-pink-400">
                <Trophy className="w-8 h-8" />
              </div>
              <h3 className="text-3xl md:text-4xl font-bold mb-4">One Calendar</h3>
              <p className="text-gray-400 text-lg leading-relaxed">Every fest, workshop, and hackathon in one place. Sync it to your Google Calendar and never miss out.</p>
            </div>
            <div className="w-full md:w-1/2 h-64 bg-gradient-to-br from-pink-900/20 to-black rounded-2xl border border-white/10 flex items-center justify-center">
              <div className="bg-white/5 backdrop-blur-xl px-6 py-8 rounded-xl border border-white/10 text-center">
                <div className="text-3xl font-bold">24</div>
                <div className="text-sm uppercase tracking-widest text-pink-400">OCTOBER</div>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* FOOTER CTA */}
      <section className="h-[70vh] flex flex-col justify-center items-center text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>

        <h2 className="text-5xl md:text-9xl font-bold tracking-tighter mb-10 z-10 mix-blend-difference">
          GET IN THE <br /> LOOP.
        </h2>

        <Link href="/login" className="magnet-btn relative px-12 py-5 bg-white text-black rounded-full font-bold text-xl overflow-hidden group z-10 hover:scale-105 transition duration-300">
          <span className="relative z-10">Launch UNILOOP</span>
          <div className="absolute inset-0 bg-indigo-500 transform scale-x-0 origin-left group-hover:scale-x-100 transition-transform duration-300 ease-out"></div>
          <span className="absolute inset-0 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20">LET'S GO</span>
        </Link>

        <div className="mt-20 text-gray-500 text-xs uppercase tracking-widest z-10">
          Designed for Hackathon Winners
        </div>
      </section>

    </div>
  );
}
