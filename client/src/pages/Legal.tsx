import BrandMark from "@/components/BrandMark";
import ThemeToggle from "@/components/ThemeToggle";
import { ArrowLeft, ShieldCheck, ScrollText } from "lucide-react";
import { Link } from "wouter";

type LegalKind = "privacy" | "terms";

const legalCopy = {
  privacy: {
    eyebrow: "Your information, treated with care",
    title: "Privacy policy",
    intro: "This policy explains how Thandi's Treats collects, uses and protects information when you submit a review or booking request through this website.",
    icon: ShieldCheck,
  },
  terms: {
    eyebrow: "A few helpful ground rules",
    title: "Terms of use",
    intro: "These terms explain how to use the Thandi's Treats website, submit feedback and request a bake. They are intended to keep the experience clear and fair for everyone.",
    icon: ScrollText,
  },
} as const;

export default function Legal({ kind }: { kind: LegalKind }) {
  const copy = legalCopy[kind];
  const Icon = copy.icon;
  return (
    <main className="legal-page">
      <header className="legal-header">
        <Link href="/" className="back-link"><ArrowLeft size={17} /> Back to bakery</Link>
        <BrandMark compact />
        <ThemeToggle />
      </header>
      <article className="legal-card">
        <div className="legal-card__icon"><Icon size={25} /></div>
        <span className="eyebrow">{copy.eyebrow}</span>
        <h1>{copy.title}</h1>
        <p className="legal-intro">{copy.intro}</p>
        <p className="legal-updated">Last updated: 28 September 2026</p>

        {kind === "privacy" ? <>
          <section><h2>1. Information we collect</h2><p>When you submit a review, we may collect your name if you choose to provide it, the products you tried, your star rating, your recommendation and your comments.</p><p>When you send a booking request, we collect your name, email address, phone number, requested date and time, fulfilment preference, delivery address where applicable, selected products, occasion and any notes you choose to share.</p></section>
          <section><h2>2. How we use information</h2><p>We use this information to save and display your feedback internally, calculate our overall rating, respond to booking requests, prepare your order and send booking confirmations or important updates.</p><p>We may contact you using the details you provide only when reasonably necessary to handle your review or booking request, unless you separately agree to receive marketing.</p></section>
          <section><h2>3. Who receives your information</h2><p>Booking and review details are available to authorised Thandi's Treats administrators so they can operate the bakery. Booking notifications may also be sent to the customer email address you provide and the two authorised bakery administrator email addresses.</p><p>We use hosting, database and email service providers to operate this website. They may process information only as needed to provide those services and are expected to protect it.</p></section>
          <section><h2>4. Retention and security</h2><p>We keep review and booking records for as long as reasonably needed for bakery operations, customer service, accounting or legal obligations. We use access controls and server-side storage for administrator functions, but no online service can promise absolute security.</p></section>
          <section><h2>5. Your choices</h2><p>You may ask us to correct or delete personal information you submitted, subject to records we need to keep for legitimate business or legal reasons. You may also ask what information we hold about you.</p></section>
          <section><h2>6. Contact</h2><p>For privacy questions or requests, email <a href="mailto:mylesmuoka@gmail.com">mylesmuoka@gmail.com</a> or <a href="mailto:naimathandi@gmail.com">naimathandi@gmail.com</a>.</p></section>
        </> : <>
          <section><h2>1. Using the website</h2><p>You may use this website to read bakery information, submit genuine customer feedback and send a genuine booking request. Do not misuse the website, impersonate another person, submit malicious content or attempt to access administrator areas without permission.</p></section>
          <section><h2>2. Reviews</h2><p>Reviews should be honest, relevant and respectful. Thandi's Treats may remove content that is abusive, unlawful, misleading, discriminatory, promotional spam or unrelated to the products and service.</p><p>By submitting a review, you give Thandi's Treats permission to store and use it for operating and improving the bakery, including sharing an edited excerpt in bakery communications. We will not present optional contact details as part of a public review without a separate reason to do so.</p></section>
          <section><h2>3. Booking requests</h2><p>A booking request is a request, not a confirmed order. A booking becomes confirmed only after Thandi's Treats contacts you or otherwise confirms availability. We may need to adjust a requested time, product or fulfilment arrangement depending on availability.</p><p>You are responsible for providing accurate contact, date, time and delivery information. Please tell us about relevant allergies or dietary requirements in the notes field; we will respond with what we can safely accommodate.</p></section>
          <section><h2>4. Communications</h2><p>By sending a booking request, you agree that we may email or call you about that request, including confirmation, clarification and collection or delivery updates. We do not promise that every email will arrive immediately or without filtering.</p></section>
          <section><h2>5. Website content and availability</h2><p>We aim to keep the website accurate and available, but descriptions, availability and timings may change. The website is provided as a helpful bakery service and may occasionally be unavailable for maintenance or reasons outside our control.</p></section>
          <section><h2>6. Contact</h2><p>Questions about a booking or these terms can be sent to <a href="mailto:mylesmuoka@gmail.com">mylesmuoka@gmail.com</a> or <a href="mailto:naimathandi@gmail.com">naimathandi@gmail.com</a>.</p></section>
        </>}
        <div className="legal-note"><b>Important:</b> This is a practical website policy template, not legal advice. If you operate in a jurisdiction with specific privacy, consumer or data-protection requirements, have the final wording reviewed by a qualified professional.</div>
      </article>
    </main>
  );
}
