/**
 * Deepak Trading Corporation Premium Motion & Scroll Engine
 * - Smooth Inertial Scroll (Lenis)
 * - ScrollTrigger GSAP Sync
 * - Scroll-driven Mask Reveals for Headers (.text-reveal-mask)
 * - Image scroll parallax (.parallax-img inside .parallax-container)
 * - Interactive 3D Perspective Magnetic Tilt for logo cards (.brand-item)
 * - Dynamic scroll-speed dependent marquee speed adaptation
 */
function initAwwwardsEngine() {
  // 0. Cleanup existing instances to prevent duplicate bindings (essential for React SPA page toggles)
  if (window.lenisInstance) {
    window.lenisInstance.destroy();
    window.lenisInstance = null;
  }
  if (typeof ScrollTrigger !== 'undefined') {
    ScrollTrigger.getAll().forEach(t => t.kill());
  }

  const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0 || window.innerWidth < 1025;

  // 1. Initialize Lenis Smooth Scroll (only on non-touch devices)
  let lenisInstance = null;
  if (!isTouch && typeof Lenis !== 'undefined') {
    lenisInstance = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      infinite: false
    });
    window.lenisInstance = lenisInstance;

    function raf(time) {
      lenisInstance.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);

    // Sync with ScrollTrigger
    if (typeof ScrollTrigger !== 'undefined') {
      lenisInstance.on('scroll', ScrollTrigger.update);
      gsap.ticker.add((time) => {
        lenisInstance.raf(time * 1000);
      });
      gsap.ticker.lagSmoothing(0);
    }
  }

  // Register ScrollTrigger if available
  if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
    gsap.registerPlugin(ScrollTrigger);

    // 1.5. Page Load Entrance Animations Timeline (for Hero elements)
    const tl = gsap.timeline();
    
    const mainHeader = document.querySelector('.main-header');
    if (mainHeader) {
      tl.fromTo(mainHeader, 
        { y: -80, opacity: 0 }, 
        { y: 0, opacity: 1, duration: 0.8, ease: "power2.out" }
      );
    }
    
    const heroDesc = document.querySelector('.hero-description');
    const heroCta = document.querySelector('.hero-cta');
    if (heroDesc || heroCta) {
      tl.fromTo([heroDesc, heroCta].filter(Boolean),
        { y: 30, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.8, stagger: 0.15, ease: "power2.out" },
        "-=0.4"
      );
    }
    
    const heroFeatures = document.querySelectorAll('.hero-feature-item');
    if (heroFeatures.length) {
      tl.fromTo(heroFeatures,
        { y: 30, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.6, stagger: 0.1, ease: "power2.out" },
        "-=0.4"
      );
    }
    
    const floatCard = document.querySelector('.hero-floating-card');
    if (floatCard) {
      tl.fromTo(floatCard,
        { x: 100, opacity: 0 },
        { x: 0, opacity: 1, duration: 1.2, ease: "elastic.out(1, 0.75)" },
        "-=0.6"
      );
    }

    // 2. Scroll-Driven Mask Reveals for Headers
    gsap.utils.toArray('.text-reveal-mask').forEach(trigger => {
      const inner = trigger.querySelector('.text-reveal-inner');
      if (!inner) return;
      
      gsap.fromTo(inner, 
        { y: "105%" },
        {
          y: "0%",
          duration: 1.1,
          ease: "power3.out",
          scrollTrigger: {
            trigger: trigger,
            start: "top 92%",
            toggleActions: "play none none none"
          }
        }
      );
    });

    // 3. Scroll-Driven Image Parallax
    gsap.utils.toArray('.parallax-container').forEach(container => {
      const img = container.querySelector('.parallax-img');
      if (!img) return;

      gsap.fromTo(img,
        { yPercent: 0 },
        {
          yPercent: -15,
          ease: "none",
          scrollTrigger: {
            trigger: container,
            start: "top bottom",
            end: "bottom top",
            scrub: true
          }
        }
      );
    });

    // 3.5. Scroll-Triggered Staggers for Features Bar
    if (document.querySelector('.features-bar-grid')) {
      gsap.fromTo('.features-bar-item',
        { y: 50, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.8,
          stagger: 0.1,
          ease: "power2.out",
          scrollTrigger: {
            trigger: '.features-bar-grid',
            start: "top 88%",
            toggleActions: "play none none none"
          }
        }
      );
    }

    // 3.7. Scroll-Triggered Staggers for Stats Section
    if (document.querySelector('.stats-grid')) {
      gsap.fromTo('.stat-card',
        { y: 60, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.9,
          stagger: 0.12,
          ease: "power3.out",
          scrollTrigger: {
            trigger: '.stats-grid',
            start: "top 88%",
            toggleActions: "play none none none"
          }
        }
      );
    }
  }

  // 4. Staggered reveal fallback for trust banner logo cards if GSAP is blocked/fails
  const trustBoxes = document.querySelectorAll('.trust-banner-box');
  const revealOptions = {
    threshold: 0.05,
    rootMargin: '0px 0px -20px 0px'
  };

  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        revealObserver.unobserve(entry.target);
      }
    });
  }, revealOptions);

  trustBoxes.forEach(box => {
    const items = box.querySelectorAll('.brand-item');
    items.forEach((item, index) => {
      item.style.transitionDelay = `${index * 60}ms`;
    });
    revealObserver.observe(box);
  });

  // Backup fallback force reveal
  setTimeout(() => {
    trustBoxes.forEach(box => {
      if (!box.classList.contains('visible')) {
        box.classList.add('visible');
      }
    });
  }, 1000);

  // 5. Interactive Magnetic 3D Hover Tilt (for Brand Logos, non-touch only)
  const brandItems = document.querySelectorAll('.brand-item');
  if (!isTouch) {
    brandItems.forEach(item => {
      let sheen = item.querySelector('.brand-sheen');
      if (!sheen) {
        sheen = document.createElement('div');
        sheen.className = 'brand-sheen';
        item.appendChild(sheen);
      }
      
      item.addEventListener('mousemove', e => {
        const rect = item.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        const xc = rect.width / 2;
        const yc = rect.height / 2;
        
        const angleX = (yc - y) / 6;
        const angleY = (x - xc) / 8;
        
        const pullX = (x - xc) * 0.12;
        const pullY = (y - yc) * 0.12;
        
        item.style.transform = `perspective(1000px) translate3d(${pullX}px, ${pullY}px, 12px) rotateX(${angleX}deg) rotateY(${angleY}deg)`;
        
        const sheenX = (x / rect.width) * 100;
        const sheenY = (y / rect.height) * 100;
        sheen.style.background = `radial-gradient(circle at ${sheenX}% ${sheenY}%, rgba(255, 255, 255, 0.4) 0%, transparent 65%)`;
      });
      
      item.addEventListener('mouseenter', () => {
        item.style.transition = 'transform 0.1s cubic-bezier(0.25, 0.46, 0.45, 0.94), border-color 0.3s ease, box-shadow 0.3s ease';
      });
      
      item.addEventListener('mouseleave', () => {
        item.style.transition = 'transform 0.5s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.3s ease, box-shadow 0.3s ease';
        item.style.transform = 'perspective(1000px) translate3d(0, 0, 0) rotateX(0deg) rotateY(0deg)';
        sheen.style.background = 'transparent';
      });
    });
  }


}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initAwwwardsEngine);
} else {
  initAwwwardsEngine();
}
