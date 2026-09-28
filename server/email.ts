import { ADMIN_EMAILS } from "./adminAuth";
import type { BookingInput, ReviewInput } from "./db";

const FROM = process.env.RESEND_FROM_EMAIL;
const API_KEY = process.env.RESEND_API_KEY;

type EmailPayload = { to: string | string[]; subject: string; html: string };

function escapeHtml(value: string) {
  return value.replace(/[&<>'"]/g, character => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "'": "&#39;",
    '"': "&quot;",
  })[character] || character);
}

async function sendEmail(payload: EmailPayload) {
  if (!API_KEY || !FROM) return { sent: false, reason: "Email delivery is not configured" };

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from: FROM, ...payload }),
  });

  if (!response.ok) {
    const detail = await response.text();
    console.error("[Email] Delivery failed", response.status, detail);
    return { sent: false, reason: "Email delivery failed" };
  }
  return { sent: true };
}

function emailShell(title: string, body: string) {
  return `<div style="background:#f8f1e8;padding:32px;font-family:Georgia,serif;color:#4a2b20">
    <div style="max-width:620px;margin:auto;background:#fffdf9;border-radius:18px;padding:32px;border-top:6px solid #9e1b32;box-shadow:0 8px 24px rgba(74,43,32,.12)">
      <p style="margin:0 0 8px;color:#9e1b32;font-family:Arial,sans-serif;font-size:12px;font-weight:700;letter-spacing:.14em;text-transform:uppercase">Thandi's Treats</p>
      <h1 style="margin:0 0 20px;font-size:28px">${title}</h1>${body}
      <p style="margin:28px 0 0;color:#866b60;font-size:14px">Baked with love. Thank you for choosing Thandi's Treats.</p>
    </div></div>`;
}

export async function notifyReview(review: ReviewInput) {
  const productList = review.products.map(escapeHtml).join(", ");
  return sendEmail({
    to: ADMIN_EMAILS,
    subject: `New ${review.rating}-star review for Thandi's Treats`,
    html: emailShell(
      "A new review has arrived",
      `<p><strong>${escapeHtml(review.guestName || "A customer")}</strong> left a ${review.rating}-star review.</p>
       <p><strong>Products tried:</strong> ${productList}</p>
       <p><strong>Top recommendation:</strong> ${escapeHtml(review.recommendation)}</p>
       <blockquote style="margin:20px 0;padding-left:16px;border-left:3px solid #9e1b32;color:#62463b">${escapeHtml(review.comments)}</blockquote>`,
    ),
  });
}

function bookingSummary(booking: BookingInput) {
  return booking.items
    .map(item => `${item.quantity} × ${escapeHtml(item.product)}`)
    .join("<br />");
}

export async function notifyBooking(booking: BookingInput, bookingId: number) {
  const fulfilment = booking.fulfilment === "delivery" ? "Delivery" : "Collection";
  const details = `<p><strong>Date requested:</strong> ${escapeHtml(booking.requestedDate)} at ${escapeHtml(booking.requestedTime)}<br />
    <strong>Fulfilment:</strong> ${fulfilment}</p>
    <p><strong>Your treats</strong><br />${bookingSummary(booking)}</p>
    ${booking.occasion ? `<p><strong>Occasion:</strong> ${escapeHtml(booking.occasion)}</p>` : ""}
    ${booking.address ? `<p><strong>Address:</strong> ${escapeHtml(booking.address)}</p>` : ""}
    ${booking.notes ? `<p><strong>Notes:</strong> ${escapeHtml(booking.notes)}</p>` : ""}`;

  const customer = sendEmail({
    to: booking.email,
    subject: `We received your Thandi's Treats booking #${bookingId}`,
    html: emailShell(
      `Thank you, ${escapeHtml(booking.customerName)}!`,
      `<p>We have received your booking request <strong>#${bookingId}</strong>. We will confirm availability with you shortly.</p>${details}`,
    ),
  });
  const administrators = sendEmail({
    to: ADMIN_EMAILS,
    subject: `New booking #${bookingId} — ${booking.customerName}`,
    html: emailShell(
      `New booking from ${escapeHtml(booking.customerName)}`,
      `<p><strong>Contact:</strong> ${escapeHtml(booking.email)} · ${escapeHtml(booking.phone)}</p>${details}`,
    ),
  });

  return Promise.all([customer, administrators]);
}
