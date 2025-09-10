"use client";

import Link from "next/link";
import { useTranslation } from "react-i18next";
import LanguageSwitcher from "./LanguageSwitcher";
import { usePathname } from "next/navigation";
import clsx from "clsx";

export default function Header() {
  const { t } = useTranslation();
  const pathname = usePathname();

  const navLinks = [
    { href: "/", label: "dashboard" },
    { href: "/cards", label: "cards" },
    { href: "/transactions", label: "transactions" },
    { href: "/reports", label: "reports" },
  ];

  return (
    <header className="border-b bg-white shadow-sm sticky top-0 z-10">
      <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="font-bold text-xl text-blue-600">{t('debit_card_manager')}</h1>
        </div>
        <div className="flex items-center gap-4 text-sm">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={clsx(
                "hover:text-blue-600 transition-colors px-3 py-2 rounded-md",
                pathname === link.href ? "bg-blue-50 text-blue-600 font-semibold" : "text-gray-600"
              )}
            >
              {t(link.label)}
            </Link>
          ))}
          <div className="border-l h-5 mx-2"></div>
          <LanguageSwitcher />
        </div>
      </nav>
    </header>
  );
}
