// Wait for DOM to load
document.addEventListener('DOMContentLoaded', () => {

    /**
     * Narandžasti kružni kursor (samo fine pointer + hover, bez reduce-motion).
     * — Pozicija: jedan rAF u okviru frejma, samo transform3d.
     * — Klik: CSS klasa + animacija na ::after (bez alokacije div-ova u JS).
     * — Fallback: default kursor (touch, motion, nema matchMedia, itd.).
     */
    const cursorInteractive = 'a, button, input, textarea, select, [role="button"], label, summary, [data-cursor-hover]';
    const cursorPulseName = 'customCursorPulseRing';

    const mqOnChange = (mq, fn) => {
        if (mq.addEventListener) mq.addEventListener('change', fn);
        else if (mq.addListener) mq.addListener(fn);
    };
    const mqOffChange = (mq, fn) => {
        if (mq.removeEventListener) mq.removeEventListener('change', fn);
        else if (mq.removeListener) mq.removeListener(fn);
    };

    function canUseCustomCursor() {
        if (typeof window.matchMedia !== 'function') return false;
        if (window.matchMedia('(pointer: coarse)').matches) return false;
        if (!window.matchMedia('(hover: hover)').matches) return false;
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return false;
        if (window.matchMedia('(prefers-contrast: more)').matches) return false;
        if (!window.matchMedia('(pointer: fine)').matches) return false;
        return true;
    }

    if (canUseCustomCursor()) {
        const root = document.documentElement;
        root.classList.add('custom-cursor--enabled');

        const cursorEl = document.createElement('div');
        cursorEl.className = 'custom-cursor';
        cursorEl.setAttribute('aria-hidden', 'true');
        const ring = document.createElement('span');
        ring.className = 'custom-cursor__ring';
        cursorEl.appendChild(ring);
        document.body.appendChild(cursorEl);

        let mx = 0;
        let my = 0;
        let rafId = 0;
        let hasShown = false;

        const updateHoverFromPoint = () => {
            if (!hasShown) return;
            const el = document.elementFromPoint(mx, my);
            const hover = !!(el && el.closest && el.closest(cursorInteractive));
            cursorEl.classList.toggle('custom-cursor--hover', hover);
        };

        const runFrame = () => {
            rafId = 0;
            cursorEl.style.transform = `translate3d(${mx}px,${my}px,0)`;
            updateHoverFromPoint();
        };

        const scheduleFrame = () => {
            if (rafId) return;
            rafId = requestAnimationFrame(runFrame);
        };

        const onPointerMove = (e) => {
            if (e.pointerType && e.pointerType !== 'mouse') return;
            mx = e.clientX;
            my = e.clientY;
            if (!hasShown) {
                hasShown = true;
                cursorEl.classList.add('custom-cursor--visible');
            }
            scheduleFrame();
        };

        const onScrollOrResize = () => {
            if (!hasShown) return;
            scheduleFrame();
        };

        const pulseDurationMs = 500;
        let pulseEndTimer = 0;

        const clearPulseState = () => {
            if (pulseEndTimer) {
                clearTimeout(pulseEndTimer);
                pulseEndTimer = 0;
            }
            cursorEl.classList.remove('custom-cursor--pulse');
        };

        const onPointerDown = (e) => {
            if (e.button !== 0) return;
            if (e.pointerType && e.pointerType !== 'mouse') return;
            clearPulseState();
            void ring.offsetWidth;
            cursorEl.classList.add('custom-cursor--pulse');
            pulseEndTimer = window.setTimeout(clearPulseState, pulseDurationMs + 80);
        };

        const onAnimEnd = (e) => {
            if (e.target !== ring) return;
            const name = String(e.animationName || '');
            if (name.toLowerCase() !== cursorPulseName.toLowerCase()) return;
            clearPulseState();
        };

        const mqMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
        const mqUsable = window.matchMedia('(pointer: fine) and (hover: hover)');

        const destroyCursor = () => {
            document.removeEventListener('pointermove', onPointerMove);
            document.removeEventListener('pointerdown', onPointerDown, true);
            window.removeEventListener('scroll', onScrollOrResize, true);
            window.removeEventListener('resize', onScrollOrResize);
            ring.removeEventListener('animationend', onAnimEnd);
            if (rafId) cancelAnimationFrame(rafId);
            clearPulseState();
            mqOffChange(mqMotion, onMotionChange);
            mqOffChange(mqUsable, onUsableChange);
            root.classList.remove('custom-cursor--enabled');
            cursorEl.remove();
        };

        const onMotionChange = () => {
            if (mqMotion.matches) destroyCursor();
        };

        const onUsableChange = () => {
            if (!mqUsable.matches) destroyCursor();
        };

        document.addEventListener('pointermove', onPointerMove, { passive: true });
        document.addEventListener('pointerdown', onPointerDown, true);
        /* scroll capture: nakon scrolla element ispod fiksnog (clientX, clientY) se menja bez pointermove */
        window.addEventListener('scroll', onScrollOrResize, { passive: true, capture: true });
        window.addEventListener('resize', onScrollOrResize, { passive: true });
        ring.addEventListener('animationend', onAnimEnd);
        mqOnChange(mqMotion, onMotionChange);
        mqOnChange(mqUsable, onUsableChange);
    }

    // Register GSAP Plugins
    if (typeof ScrollTrigger !== 'undefined') {
        gsap.registerPlugin(ScrollTrigger);
    }

    /**
     * Preloader
     */
    const preloader = document.getElementById('preloader');
    const loaderBar = document.querySelector('.loader-bar');
    
    // Simulate loading progress
    if (preloader && loaderBar) {
        let progress = 0;
        const interval = setInterval(() => {
            progress += Math.random() * 30;
            if (progress > 100) progress = 100;
            loaderBar.style.width = progress + '%';
            
            if (progress === 100) {
                clearInterval(interval);
                setTimeout(() => {
                    gsap.to(preloader, {
                        opacity: 0,
                        duration: 0.8,
                        onComplete: () => {
                            preloader.style.display = 'none';
                            initAnimations(); // Start animations after preloader
                        }
                    });
                }, 500);
            }
        }, 150);
    } else {
        initAnimations(); // Run animations immediately if no preloader
    }

    /**
     * Header Scroll Logic
     */
    const header = document.getElementById('header');
    const scrollToTopBtn = document.getElementById('scrollToTop');

    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }

        // Back to top button visibility
        if (scrollToTopBtn) {
            if (window.scrollY > 500) {
                scrollToTopBtn.classList.add('show');
            } else {
                scrollToTopBtn.classList.remove('show');
            }
        }
    });

    /**
     * Mobile Navigation
     */
    const mobileToggle = document.querySelector('.mobile-nav-toggle');
    const mobileOverlay = document.querySelector('.mobile-nav-overlay');
    const mobileLinks = document.querySelectorAll('.mobile-nav-list a');

    if (mobileToggle && mobileOverlay) {
        mobileToggle.addEventListener('click', () => {
            mobileOverlay.classList.toggle('active');
            document.body.style.overflow = mobileOverlay.classList.contains('active') ? 'hidden' : 'auto';
            
            const bars = mobileToggle.querySelectorAll('.bar');
            if (mobileOverlay.classList.contains('active')) {
                bars[0].style.transform = 'translateY(10px) rotate(45deg)';
                bars[1].style.opacity = '0';
                bars[2].style.transform = 'translateY(-10px) rotate(-45deg)';
            } else {
                bars[0].style.transform = 'none';
                bars[1].style.opacity = '1';
                bars[2].style.transform = 'none';
            }
        });

        // Mobile Dropdown Toggle
        const dropdownToggles = document.querySelectorAll('.dropdown-arrow');
        dropdownToggles.forEach(toggle => {
            toggle.addEventListener('click', (e) => {
                e.preventDefault();
                const parent = toggle.closest('.mobile-dropdown');
                parent.classList.toggle('active');
            });
        });

        mobileLinks.forEach(link => {
            if (!link.closest('.mobile-dropdown-header')) {
                link.addEventListener('click', () => {
                    mobileOverlay.classList.remove('active');
                    document.body.style.overflow = 'auto';
                    const bars = mobileToggle.querySelectorAll('.bar');
                    bars[0].style.transform = 'none';
                    bars[1].style.opacity = '1';
                    bars[2].style.transform = 'none';
                });
            }
        });
    }

    /**
     * GSAP Animations
     */
    function initAnimations() {
        // Hero Section
        const heroTl = gsap.timeline();
        heroTl.from(".reveal-text", {
            y: 100,
            opacity: 0,
            duration: 1.2,
            ease: "power4.out",
            stagger: 0.2
        })
        .from(".reveal-up", {
            y: 50,
            opacity: 0,
            duration: 1,
            ease: "power3.out",
            stagger: 0.2
        }, "-=0.8")
        .from(".blob", {
            scale: 0,
            duration: 2,
            ease: "elastic.out(1, 0.5)",
            stagger: 0.3
        }, "-=1.5");

        // Scroll Reveal Animations
        const revealElements = [
            { class: ".reveal-left", x: -100 },
            { class: ".reveal-right", x: 100 },
            { class: ".reveal-up", y: 100 }
        ];

        revealElements.forEach(item => {
            document.querySelectorAll(item.class).forEach(el => {
                gsap.from(el, {
                    scrollTrigger: {
                        trigger: el,
                        start: "top 85%",
                        toggleActions: "play none none none"
                    },
                    x: item.x || 0,
                    y: item.y || 0,
                    opacity: 0,
                    duration: 1.2,
                    ease: "power3.out"
                });
            });
        });

        // Stats Counter Animation
        document.querySelectorAll('.number').forEach(num => {
            const target = parseInt(num.getAttribute('data-target'));
            gsap.to(num, {
                scrollTrigger: {
                    trigger: num,
                    start: "top 90%"
                },
                innerText: target,
                duration: 2,
                snap: { innerText: 1 },
                ease: "power2.out"
            });
        });

        // Portfolio staggering
        gsap.from(".portfolio-item", {
            scrollTrigger: {
                trigger: ".portfolio-grid",
                start: "top 80%"
            },
            y: 60,
            opacity: 0,
            duration: 1,
            stagger: 0.2,
            ease: "power3.out"
        });
    }

    /**
     * Form Submission (Mock)
     */
    const contactForm = document.getElementById('contact-form');
    if (contactForm) {
        contactForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const btn = contactForm.querySelector('button');
            const originalText = btn.innerText;
            
            btn.innerText = 'Šaljem...';
            btn.disabled = true;

            setTimeout(() => {
                btn.innerText = 'Poruka Poslata!';
                btn.style.background = '#00ff88';
                contactForm.reset();
                
                setTimeout(() => {
                    btn.innerText = originalText;
                    btn.style.background = '';
                    btn.disabled = false;
                }, 3000);
            }, 1500);
        });
    }

    // Scroll to section smoothness (Native approach for Vanilla fallback)
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const href = this.getAttribute('href');
            if (href && href !== '#') {
                e.preventDefault();
                try {
                    const target = document.querySelector(href);
                    if (target) {
                        const headerOffset = 80;
                        const elementPosition = target.getBoundingClientRect().top;
                        const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

                        window.scrollTo({
                            top: offsetPosition,
                            behavior: "smooth"
                        });
                    }
                } catch(err) {
                    // Ignore invalid selectors
                }
            }
        });
    });

    /**
     * Floating Contact Stack & Modal
     */
    const openContactBtn = document.getElementById('open-contact-modal');
    const phonePulseBtn = document.getElementById('phone-pulse');
    const closeContactBtn = document.getElementById('close-contact-modal');
    const contactModal = document.getElementById('contact-modal-overlay');
    const showFormBtn = document.getElementById('show-contact-form-btn');
    const backToOptionsBtn = document.getElementById('back-to-options-btn');
    const viewOptions = document.getElementById('modal-view-options');
    const viewForm = document.getElementById('modal-view-form');

    if (phonePulseBtn) {
        // Pulsing effect every 5 seconds on the phone icon
        setInterval(() => {
            phonePulseBtn.classList.add('pulse-trigger');
            setTimeout(() => {
                phonePulseBtn.classList.remove('pulse-trigger');
            }, 2000);
        }, 5000);
    }

    if (openContactBtn && contactModal) {
        openContactBtn.addEventListener('click', () => {
            contactModal.classList.add('active');
            document.body.style.overflow = 'hidden';
            // Default to form view as user requested "when clicked show email form"
            if (viewOptions && viewForm) {
                viewOptions.classList.remove('active');
                viewForm.classList.add('active');
            }
        });

        const closeModal = () => {
            contactModal.classList.remove('active');
            document.body.style.overflow = 'auto';
        };

        if (closeContactBtn) closeContactBtn.addEventListener('click', closeModal);

        if (showFormBtn) {
            showFormBtn.addEventListener('click', () => {
                viewOptions.classList.remove('active');
                viewForm.classList.add('active');
            });
        }

        if (backToOptionsBtn) {
            backToOptionsBtn.addEventListener('click', () => {
                viewForm.classList.remove('active');
                viewOptions.classList.add('active');
            });
        }

        // Close on escape key
        window.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && contactModal.classList.contains('active')) {
                closeModal();
            }
        });

        // Close on overlay click
        contactModal.addEventListener('click', (e) => {
            if (e.target === contactModal) {
                closeModal();
            }
        });
    }

    // Modal form submission
    const modalForm = document.getElementById('modal-contact-form');
    if (modalForm) {
        modalForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const btn = modalForm.querySelector('button[type="submit"]');
            const originalText = btn.textContent;
            btn.textContent = 'Slanje...';
            btn.disabled = true;

            setTimeout(() => {
                btn.textContent = 'Poruka poslata!';
                btn.style.background = '#10b981';
                modalForm.reset();
                setTimeout(() => {
                    contactModal.classList.remove('active');
                    document.body.style.overflow = 'auto';
                    setTimeout(() => {
                        btn.textContent = originalText;
                        btn.style.background = '';
                        btn.disabled = false;
                    }, 500);
                }, 1500);
            }, 1500);
        });
    }

    const currentYearEl = document.getElementById('current-year');
    if (currentYearEl) {
        currentYearEl.textContent = new Date().getFullYear();
    }

});
