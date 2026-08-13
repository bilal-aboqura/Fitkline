"use client";

import { usePathname } from "next/navigation";

type WhatsAppButtonProps = {
  phoneNumber: string;
};

export function WhatsAppButton({ phoneNumber }: WhatsAppButtonProps) {
  const pathname = usePathname();
  const normalizedPhoneNumber = phoneNumber.replace(/\D/g, "");
  const sitsAbovePurchaseBar = /^\/products\/[^/]+/.test(pathname);

  if (pathname.startsWith("/admin") || !normalizedPhoneNumber) {
    return null;
  }

  return (
    <a
      className={`whatsapp-button${sitsAbovePurchaseBar ? " whatsapp-button--above-purchase" : ""}`}
      href={`https://wa.me/${normalizedPhoneNumber}`}
      target="_blank"
      rel="noreferrer"
      aria-label="تواصل مع Fitkline عبر واتساب"
    >
      <svg
        aria-hidden="true"
        viewBox="0 0 16 16"
        fill="currentColor"
        focusable="false"
      >
        <path d="M13.601 2.326A7.85 7.85 0 0 0 7.994 0C3.627 0 .068 3.558.064 7.926c0 1.399.366 2.76 1.057 3.965L0 16l4.204-1.102a7.9 7.9 0 0 0 3.79.965h.004c4.368 0 7.926-3.558 7.93-7.93a7.9 7.9 0 0 0-2.327-5.607M7.994 14.521a6.57 6.57 0 0 1-3.356-.92l-.24-.144-2.494.654.666-2.433-.156-.25a6.56 6.56 0 0 1-1.007-3.505c0-3.626 2.957-6.584 6.591-6.584a6.56 6.56 0 0 1 4.66 1.931 6.56 6.56 0 0 1 1.928 4.66c-.004 3.639-2.961 6.592-6.592 6.592m3.615-4.934c-.197-.099-1.17-.578-1.353-.644-.182-.066-.315-.099-.445.099-.133.197-.514.643-.627.775-.116.133-.232.15-.43.05-.197-.1-.836-.308-1.592-.985-.59-.525-.986-1.172-1.102-1.37-.116-.2-.013-.306.087-.405.09-.088.197-.232.296-.347.1-.116.133-.199.198-.332.066-.132.033-.248-.016-.347-.05-.1-.445-1.076-.61-1.47-.16-.389-.323-.335-.445-.341a7 7 0 0 0-.38-.007.73.73 0 0 0-.529.248c-.182.198-.692.677-.692 1.654s.71 1.916.81 2.049c.098.132 1.394 2.132 3.383 2.992.47.205.84.326 1.13.418.475.15.907.129 1.25.078.38-.058 1.171-.48 1.338-.943.164-.463.164-.86.116-.943-.05-.083-.182-.132-.38-.232" />
      </svg>
      <span>واتساب</span>
    </a>
  );
}
