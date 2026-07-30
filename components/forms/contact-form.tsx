"use client";

import { useState } from "react";
import type { PagesContent } from "@/lib/cms-store";

export function ContactForm({
  content,
}: {
  content: PagesContent["contact"]["form"];
}) {
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  if (sent) {
    return <div className="success-state" role="status"><h2>{content.successTitle}</h2><p>{content.successDescription}</p></div>;
  }

  return (
    <form className="commerce-form" onSubmit={async (event) => {
      event.preventDefault();
      setError("");
      const formData = new FormData(event.currentTarget);
      try {
        const response = await fetch("/api/contact", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(Object.fromEntries(formData.entries())) });
        const result = (await response.json()) as { error?: string };
        if (!response.ok) throw new Error(result.error ?? content.errorMessage);
        setSent(true);
      } catch (submitError) {
        setError(submitError instanceof Error ? submitError.message : content.errorMessage);
      }
    }}>
      <div className="form-grid">
        <label><span>{content.nameLabel}</span><input required name="name" autoComplete="name" /></label>
        <label><span>{content.phoneLabel}</span><input required name="phone" type="tel" inputMode="tel" autoComplete="tel" /></label>
        <label><span>{content.facilityLabel}</span><input required name="facility" /></label>
        <label><span>{content.facilityTypeLabel}</span><select required name="facilityType" defaultValue=""><option value="" disabled>{content.facilityTypePlaceholder}</option>{content.facilityTypeOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
        <label><span>{content.governorateLabel}</span><input required name="governorate" autoComplete="address-level1" /></label>
        <label><span>{content.areaLabel}</span><input name="area" placeholder={content.areaPlaceholder} /></label>
        <label className="form-grid__full"><span>{content.messageLabel}</span><textarea required name="message" rows={5} /></label>
      </div>
      {error ? <p className="form-error" role="alert">{error}</p> : null}
      <button className="fit-button-primary" type="submit">{content.submitLabel}</button>
    </form>
  );
}
