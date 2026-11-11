"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import { Menu } from "lucide-react";

const navLinks = [
  { href: "/#home", label: "Home" },
  { href: "/#about", label: "About Us" },
  { href: "/#publishers", label: "Publishers" },
  { href: "/#advertisers", label: "Advertisers" },
  { href: "/#contact", label: "Contact" },
];

export default function PublicLayout({
  children,
  className = "",
  footerVariant = "default",
}: {
  children: React.ReactNode;
  className?: string;
  footerVariant?: "default" | "auth";
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const isHomePage = pathname === "/";
  const [active, setActive] = useState<string | null>(isHomePage ? "/#home" : null);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    if (!isHomePage) {
      setIsScrolled(true);
      return;
    }

    const updateScrolledState = () => setIsScrolled(window.scrollY > 20);
    updateScrolledState();
    window.addEventListener("scroll", updateScrolledState, { passive: true });
    return () => window.removeEventListener("scroll", updateScrolledState);
  }, [isHomePage]);

  useEffect(() => {
    if (!open) return;

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [open]);

  useEffect(() => {
    if (!isHomePage) {
      setActive(null);
      return;
    }

    setActive("/#home");
    const sections = navLinks
      .map((link) => document.getElementById(link.href.split("#")[1]))
      .filter((el): el is HTMLElement => !!el);
    if (!sections.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const top = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (top) setActive(`/#${top.target.id}`);
      },
      { rootMargin: "-45% 0px -45% 0px", threshold: [0, 0.25, 0.5, 1] }
    );
    sections.forEach((s) => observer.observe(s));
    return () => observer.disconnect();
  }, [isHomePage]);

  const go = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    const hash = new URL(href, window.location.origin).hash;
    if (!hash) return;
    e.preventDefault();
    const el = document.querySelector(hash);
    if (!el) return;
    const headerHeight = document.querySelector("header")?.getBoundingClientRect().height ?? 72;
    const y = (el as HTMLElement).getBoundingClientRect().top + window.scrollY - headerHeight;
    window.scrollTo({ top: y, behavior: "smooth" });
    history.replaceState(null, "", hash);
    setOpen(false);
  };

  const headerSolid = open || !isHomePage || isScrolled;

  return (
    <div
      data-mobile-menu-open={open ? "true" : undefined}
      className={`public-site relative min-h-screen w-full overflow-x-hidden ${className}`}
    >
      <div className="relative z-10 flex min-h-screen flex-col">
        <header
          className={`fixed inset-x-0 top-0 z-40 border-b ${open ? "" : "transition-[background-color,border-color,box-shadow] duration-200"} ${
            headerSolid
              ? "border-transparent bg-[rgba(33,37,41,0.97)] shadow-none"
              : "border-transparent bg-transparent shadow-none"
          }`}
        >
          <nav className="relative z-10 mx-auto flex h-16 max-w-screen-2xl items-center justify-between gap-3 px-4 sm:px-6 lg:h-[70px] lg:px-8">
            <a
              href={isHomePage ? "#home" : "/#home"}
              onClick={isHomePage ? (e) => go(e, "#home") : undefined}
              className="flex shrink-0 items-center"
            >
              <Image
                src="/affmine/logo.png"
                alt="Affmine"
                width={150}
                height={38}
                sizes="120px"
                className="h-9 w-[120px] object-contain sm:h-10 sm:w-[132px]"
                priority
              />
            </a>

            <div className="hidden items-center gap-1 xl:gap-2 lg:flex">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={isHomePage ? (e) => go(e, link.href) : undefined}
                  aria-current={active === link.href ? "location" : undefined}
                  className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                    isHomePage && active === link.href
                      ? "text-[#5ff442]"
                      : "text-white/75 hover:text-white"
                  }`}
                >
                  {link.label}
                </a>
              ))}
            </div>

            <div className="relative flex items-center gap-2">
              <Link
                href="/signup"
                prefetch={false}
                className="hidden lg:inline-flex items-center rounded-lg bg-[#5ff442] px-4 py-2.5 text-sm font-bold text-[#263238] transition-colors hover:bg-[#4dd935]"
              >
                Sign up
              </Link>
              <Link
                href="/login"
                prefetch={false}
                aria-current={pathname === "/login" ? "page" : undefined}
                className="hidden lg:inline-flex items-center rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-[#263238] transition-colors hover:bg-[#f0f4f7]"
              >
                Login
              </Link>
              <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                className={`grid h-10 w-14 place-items-center rounded border bg-transparent text-white/50 transition-colors lg:hidden ${
                  open
                    ? "border-[#17a2b8]"
                    : "border-white/10 hover:border-white/25 hover:text-white/80"
                } focus:border-[#17a2b8] focus:outline-none focus-visible:border-[#17a2b8]`}
                aria-label="Toggle navigation"
                aria-expanded={open}
                aria-controls="public-mobile-menu"
              >
                <Menu className="h-[22px] w-[22px] text-white" strokeWidth={2.25} />
              </button>

              <AnimatePresence>
                {open && (
                  <motion.div
                    id="public-mobile-menu"
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.16, ease: "easeOut" }}
                    className="absolute right-0 top-[calc(100%+8px)] z-50 w-[min(16rem,calc(100vw-2rem))] lg:hidden"
                  >
                    <nav
                      aria-label="Mobile navigation"
                      className="rounded-sm bg-[rgba(33,37,41,0.97)] px-2.5 pb-2.5 pt-3.5 shadow-[0_8px_24px_rgba(0,0,0,0.35)]"
                    >
                      <ul className="m-0 list-none p-0">
                        {navLinks.map((link) => (
                          <li key={link.href}>
                            <a
                              href={link.href}
                              onClick={(event) => {
                                if (isHomePage) go(event, link.href);
                                else setOpen(false);
                              }}
                              aria-current={isHomePage && active === link.href ? "location" : undefined}
                              className={`block py-[5px] pb-2 text-[20px] font-normal leading-tight transition-colors ${
                                isHomePage && active === link.href
                                  ? "text-white"
                                  : "text-white/50 hover:text-white/80"
                              }`}
                            >
                              {link.label}
                            </a>
                          </li>
                        ))}
                        <li className="pt-1">
                          <Link
                            href="/signup"
                            prefetch={false}
                            onClick={() => setOpen(false)}
                            className="block rounded-[3px] bg-[#17a2b8] px-2 py-[5px] pb-1 text-center text-[20px] font-normal leading-tight text-white transition-colors hover:bg-[#138496]"
                          >
                            Sign up
                          </Link>
                        </li>
                        <li className="pt-2">
                          <Link
                            href="/login"
                            prefetch={false}
                            onClick={() => setOpen(false)}
                            aria-current={pathname === "/login" ? "page" : undefined}
                            className="block rounded-[3px] bg-[#f3f5f7] px-2 py-[5px] pb-1 text-center text-[20px] font-normal leading-tight text-[#212529] transition-colors hover:bg-white"
                          >
                            Login
                          </Link>
                        </li>
                      </ul>
                    </nav>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </nav>
        </header>

        {open && (
          <button
            type="button"
            aria-label="Close navigation menu"
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-30 cursor-default bg-transparent lg:hidden"
          />
        )}

        {children}

        {footerVariant === "auth" ? (
          <footer className="mt-auto bg-[#e9ecef]">
            <div className="mx-auto max-w-7xl px-4 py-5 text-center sm:px-6 lg:px-8">
              <p className="text-[13px] leading-relaxed text-[#6c757d]">
                © 2019 - 2026 Affmine LLC - All rights reserved
              </p>
              <p className="mt-1.5 text-[13px] leading-relaxed text-[#6c757d]">
                <Link href="/privacy" className="hover:text-[#495057] hover:underline">
                  Privacy Policy
                </Link>
                <span className="mx-2" aria-hidden="true">
                  {" "}
                </span>
                <Link href="/terms" className="hover:text-[#495057] hover:underline">
                  Terms &amp; Conditions
                </Link>
              </p>
            </div>
          </footer>
        ) : (
          <footer className="mt-auto border-t border-white/10 bg-[#1a2429]">
            <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-4 py-4 sm:px-6 md:flex-row lg:px-8">
              <p className="text-center text-xs leading-relaxed text-white/55 md:text-left">
                <span className="font-semibold text-white/85">Affmine</span>
                <span className="mx-2 text-[#5ff442]/70" aria-hidden="true">•</span>
                © 2019–2026. All rights reserved.
              </p>
            </div>
          </footer>
        )}
      </div>
    </div>
  );
}
