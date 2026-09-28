import BrandMark from "@/components/BrandMark";
import ThemeToggle from "@/components/ThemeToggle";
import { downloadCsv } from "@/lib/exportData";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, CalendarDays, Download, KeyRound, Loader2, LogOut, MessageCircle, MessageSquareHeart, PackageCheck, RefreshCw, Star, UsersRound } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import { Link, useLocation } from "wouter";

type BookingStatus = "new" | "confirmed" | "completed" | "cancelled";
function prettyDate(value: Date | string) { return new Date(value).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" }); }
function whatsappHref(phone: string, customerName: string) {
  const digits = phone.replace(/\D/g, "");
  const international = digits.startsWith("0") ? `27${digits.slice(1)}` : digits;
  return `https://wa.me/${international}?text=${encodeURIComponent(`Hi ${customerName}! This is Thandi's Treats regarding your booking.`)}`;
}

export default function AdminDashboard() {
  const [, setLocation] = useLocation(); const utils = trpc.useUtils();
  const { data: admin, isLoading: adminLoading } = trpc.admin.me.useQuery();
  const dashboard = trpc.admin.dashboard.useQuery(undefined, { enabled: Boolean(admin), retry: false });
  const [currentPassword, setCurrentPassword] = useState(""); const [newPassword, setNewPassword] = useState(""); const [passwordMessage, setPasswordMessage] = useState("");
  const logout = trpc.admin.logout.useMutation({ onSuccess: () => setLocation("/admin/login") });
  const updateStatus = trpc.admin.updateBookingStatus.useMutation({ onSuccess: () => void utils.admin.dashboard.invalidate() });
  const changePassword = trpc.admin.changePassword.useMutation({ onSuccess: () => { setCurrentPassword(""); setNewPassword(""); setPasswordMessage("Password updated successfully."); }, onError: () => setPasswordMessage("We couldn't update that password. Check your current password and try again.") });
  useEffect(() => { if (!adminLoading && !admin) setLocation("/admin/login"); }, [admin, adminLoading, setLocation]);
  if (adminLoading || !admin) return <div className="admin-loading"><Loader2 className="spin" /> Checking secure access…</div>;

  function handlePassword(event: FormEvent) { event.preventDefault(); if (!currentPassword || newPassword.length < 9) { setPasswordMessage("Use your current password and a new password with at least 9 characters."); return; } setPasswordMessage(""); changePassword.mutate({ currentPassword, newPassword }); }
  function exportData() {
    if (!dashboard.data) return;
    downloadCsv("thandis-treats-orders.csv", dashboard.data.bookings.map(booking => ({ id: booking.id, customer: booking.customerName, email: booking.email, phone: booking.phone, requestedDate: booking.requestedDate, requestedTime: booking.requestedTime, fulfilment: booking.fulfilment, items: booking.items.map((item: { product: string; quantity: number }) => `${item.quantity} x ${item.product}`).join(" | "), occasion: booking.occasion, notes: booking.notes, status: booking.status, createdAt: booking.createdAt })));
    downloadCsv("thandis-treats-reviews.csv", dashboard.data.reviews.map(review => ({ id: review.id, name: review.guestName || "Anonymous", products: review.products.join(" | "), rating: review.rating, recommendation: review.recommendation, comments: review.comments, createdAt: review.createdAt })));
  }
  const data = dashboard.data;
  return <main className="admin-dashboard-page">
    <header className="admin-dashboard-header"><div className="admin-dashboard-header__inner"><BrandMark compact linked={false} /><div className="admin-dashboard-header__right"><span>Signed in as <b>{admin.displayName}</b></span><ThemeToggle /><Link href="/" className="admin-icon-button" aria-label="Back to bakery"><ArrowLeft size={18} /></Link><button className="admin-icon-button" onClick={() => logout.mutate()} aria-label="Sign out"><LogOut size={18} /></button></div></div></header>
    <section className="admin-dashboard-title"><div><span className="eyebrow">Thandi's Treats · private dashboard</span><h1>Good day, {admin.displayName}.</h1><p>Here’s what’s been shared and requested from your bakery today.</p></div><div className="dashboard-actions"><button className="refresh-button" onClick={() => void dashboard.refetch()} disabled={dashboard.isFetching}><RefreshCw size={16} className={dashboard.isFetching ? "spin" : ""} /> Refresh</button><button className="refresh-button export-button" onClick={exportData} disabled={!data}><Download size={16} /> Export CSVs</button></div></section>
    {dashboard.isLoading ? <div className="admin-loading"><Loader2 className="spin" /> Loading bookings and reviews…</div> : data ? <div className="admin-dashboard-content">
      <section className="metric-grid"><article className="metric-card metric-card--red"><span><Star size={20} fill="currentColor" /> Community rating</span><strong>{data.rating.average ? data.rating.average.toFixed(1) : "—"}<small>/ 5</small></strong><p>{data.rating.count} review{data.rating.count === 1 ? "" : "s"} received</p></article><article className="metric-card"><span><PackageCheck size={20} /> Booking requests</span><strong>{data.bookings.length}</strong><p>{data.bookings.filter(item => item.status === "new").length} waiting for a response</p></article><article className="metric-card"><span><MessageSquareHeart size={20} /> Recent feedback</span><strong>{data.reviews.length}</strong><p>Latest 100 reviews shown</p></article></section>
      <section className="dashboard-panel"><div className="dashboard-panel__header"><div><span className="eyebrow">Orders & requests</span><h2>Booking requests</h2></div><span className="panel-chip"><UsersRound size={15} /> {data.bookings.length} customers</span></div>
        {data.bookings.length ? <div className="booking-table-wrap"><table className="booking-table"><thead><tr><th>Customer</th><th>Requested for</th><th>Order</th><th>Fulfilment</th><th>Status</th></tr></thead><tbody>{data.bookings.map(booking => <tr key={booking.id}><td><b>{booking.customerName}</b><span>{booking.email}</span><span>{booking.phone}</span><a className="whatsapp-link" href={whatsappHref(booking.phone, booking.customerName)} target="_blank" rel="noreferrer"><MessageCircle size={14} /> WhatsApp</a></td><td><b><CalendarDays size={14} /> {booking.requestedDate}</b><span>{booking.requestedTime}</span><small>Submitted {prettyDate(booking.createdAt)}</small></td><td><ul>{booking.items.map((item: { product: string; quantity: number }) => <li key={item.product}>{item.quantity} × {item.product}</li>)}</ul>{booking.notes && <small className="booking-note">“{booking.notes}”</small>}</td><td><b>{booking.fulfilment === "delivery" ? "Delivery" : "Collection"}</b>{booking.address && <small>{booking.address}</small>}</td><td><select value={booking.status} onChange={event => updateStatus.mutate({ bookingId: booking.id, status: event.target.value as BookingStatus })} disabled={updateStatus.isPending}><option value="new">New</option><option value="confirmed">Confirmed</option><option value="completed">Completed</option><option value="cancelled">Cancelled</option></select></td></tr>)}</tbody></table></div> : <div className="empty-state"><PackageCheck size={28} /><p>No booking requests yet — they’ll appear here as soon as customers send one.</p></div>}
      </section>
      <section className="admin-bottom-grid"><section className="dashboard-panel"><div className="dashboard-panel__header"><div><span className="eyebrow">Customer notes</span><h2>Latest reviews</h2></div></div>{data.reviews.length ? <div className="review-list">{data.reviews.slice(0, 6).map(review => <article key={review.id} className="admin-review"><div><b>{review.guestName || "Anonymous customer"}</b><span className="admin-review__stars">{"★".repeat(review.rating)}{"☆".repeat(5 - review.rating)}</span></div><p>{review.comments}</p><small>{review.products.join(", ")} · recommends {review.recommendation}</small></article>)}</div> : <div className="empty-state"><MessageSquareHeart size={28} /><p>Reviews will show up here as they arrive.</p></div>}</section>
        <section className="dashboard-panel password-panel"><div className="dashboard-panel__header"><div><span className="eyebrow">Account safety</span><h2>Change password</h2></div><KeyRound size={21} /></div><p>Replace the starter password with a unique one before sharing this dashboard.</p><form onSubmit={handlePassword}><label className="field-label">Current password<input type="password" value={currentPassword} onChange={event => setCurrentPassword(event.target.value)} autoComplete="current-password" /></label><label className="field-label">New password<input type="password" value={newPassword} onChange={event => setNewPassword(event.target.value)} autoComplete="new-password" /></label>{passwordMessage && <p className={passwordMessage.includes("success") ? "success-note" : "form-error"}>{passwordMessage}</p>}<button className="primary-button" disabled={changePassword.isPending}>{changePassword.isPending ? <Loader2 className="spin" size={17} /> : <KeyRound size={17} />} Update password</button></form></section>
      </section>
    </div> : <div className="admin-loading">Unable to load dashboard data. Please refresh the page.</div>}
  </main>;
}
