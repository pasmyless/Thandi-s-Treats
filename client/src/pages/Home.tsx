import BrandMark from "@/components/BrandMark";
import ThemeToggle from "@/components/ThemeToggle";
import { trpc } from "@/lib/trpc";
import { Check, ChevronDown, Download, Heart, Loader2, Mail, MapPin, PackageCheck, Printer, Star, X } from "lucide-react";
import { FormEvent, useMemo, useState } from "react";
import { Link } from "wouter";

const PRODUCTS = [
  "Classic banana bread 800g",
  "Choc chip banana bread 800g",
  "Classic carrot cake 800g",
  "Carrot fruit cake 800g",
  "Chocolate chip cookies 5pcs",
  "Fudgy chocolate brownies",
  "Cupcakes 4pcs",
] as const;
type Product = (typeof PRODUCTS)[number];

const PRICES: Record<Product, string> = {
  "Classic banana bread 800g": "700ksh",
  "Choc chip banana bread 800g": "900ksh",
  "Classic carrot cake 800g": "800ksh",
  "Carrot fruit cake 800g": "900ksh",
  "Chocolate chip cookies 5pcs": "200ksh",
  "Fudgy chocolate brownies": "100ksh",
  "Cupcakes 4pcs": "200ksh",
};
type Receipt = { id: number; customerName: string; email: string; requestedDate: string; requestedTime: string; fulfilment: "collection" | "delivery"; address?: string; items: Array<{ product: Product; quantity: number }>; occasion?: string; notes?: string };
type Modal = { title: string; message: string; receipt?: Receipt } | null;

function RatingStars({ value, onChange }: { value: number; onChange: (value: number) => void }) {
  const [hovered, setHovered] = useState(0);
  const active = hovered || value;
  return <div className="rating-picker" onMouseLeave={() => setHovered(0)} aria-label="Your star rating">
    {[1, 2, 3, 4, 5].map(star => <button type="button" key={star} className={`star-button ${star <= active ? "is-active" : ""}`} onMouseEnter={() => setHovered(star)} onFocus={() => setHovered(star)} onClick={() => onChange(star)} aria-label={`${star} star${star > 1 ? "s" : ""}`} aria-pressed={value === star}>
      <Star size={28} fill="currentColor" strokeWidth={1.7} />
    </button>)}
    <span className="rating-picker__label">{value ? `${value} of 5` : "Tap to rate"}</span>
  </div>;
}

function ProductCheckboxes({ chosen, setChosen }: { chosen: Product[]; setChosen: (products: Product[]) => void }) {
  function toggle(product: Product) { setChosen(chosen.includes(product) ? chosen.filter(item => item !== product) : [...chosen, product]); }
  return <div className="product-checkboxes">{PRODUCTS.map(product => <label className={`check-card ${chosen.includes(product) ? "is-selected" : ""}`} key={product}>
    <input type="checkbox" checked={chosen.includes(product)} onChange={() => toggle(product)} />
    <span className="check-card__box"><Check size={14} strokeWidth={3} /></span><span>{product} — <strong>{PRICES[product]}</strong></span>
  </label>)}</div>;
}

function ReviewForm({ onSuccess }: { onSuccess: (modal: Modal) => void }) {
  const utils = trpc.useUtils();
  const [name, setName] = useState(""); const [products, setProducts] = useState<Product[]>([]);
  const [comments, setComments] = useState(""); const [rating, setRating] = useState(0); const [recommendation, setRecommendation] = useState("");
  const [website, setWebsite] = useState(""); const [error, setError] = useState("");
  const submit = trpc.reviews.create.useMutation({
    onSuccess: () => { void utils.reviews.summary.invalidate(); setName(""); setProducts([]); setComments(""); setRating(0); setRecommendation(""); setWebsite(""); onSuccess({ title: "Thank you for the love!", message: "Your review has been saved and will help more treat-lovers discover us." }); },
    onError: () => setError("We couldn't save that review just now. Please try again."),
  });
  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!products.length || !comments.trim() || !rating || !recommendation) { setError("Please select products, add a comment, choose a star rating, and pick your top recommendation."); return; }
    setError(""); submit.mutate({ name: name.trim() || undefined, products, comments: comments.trim(), rating, recommendation: recommendation as Product, website });
  }
  return <form className="form-card review-form" onSubmit={handleSubmit} noValidate>
    <div className="form-card__heading"><span className="eyebrow"><Heart size={14} fill="currentColor" /> Share the love</span><h2>How did we do?</h2><p>Your words mean the world to our small bakery.</p></div>
    <label className="field-label">Your name <span>Optional</span><input value={name} onChange={event => setName(event.target.value)} placeholder="e.g. Nandi" maxLength={100} /></label>
    <fieldset className="field-set"><legend>Which treats did you try? <b>*</b></legend><ProductCheckboxes chosen={products} setChosen={setProducts} /></fieldset>
    <fieldset className="field-set"><legend>Your star rating <b>*</b></legend><RatingStars value={rating} onChange={setRating} /></fieldset>
    <label className="field-label">Tell us a little more <b>*</b><textarea value={comments} onChange={event => setComments(event.target.value)} placeholder="What made your treat special?" rows={4} maxLength={3000} /></label>
    <label className="field-label">What would you highly recommend? <b>*</b><span className="select-wrap"><select value={recommendation} onChange={event => setRecommendation(event.target.value)}><option value="">Choose a favourite</option>{PRODUCTS.map(product => <option key={product} value={product}>{product}</option>)}</select><ChevronDown size={18} /></span></label>
    <input className="honeypot" value={website} onChange={event => setWebsite(event.target.value)} tabIndex={-1} autoComplete="off" aria-hidden="true" name="website" />
    {error && <p className="form-error" role="alert">{error}</p>}
    <button className="primary-button" disabled={submit.isPending} type="submit">{submit.isPending ? <Loader2 className="spin" size={18} /> : <Heart size={18} fill="currentColor" />} Submit my review</button>
  </form>;
}

function BookingForm({ onSuccess }: { onSuccess: (modal: Modal) => void }) {
  const [customerName, setCustomerName] = useState(""); const [email, setEmail] = useState(""); const [phone, setPhone] = useState("");
  const [requestedDate, setRequestedDate] = useState(""); const [requestedTime, setRequestedTime] = useState(""); const [fulfilment, setFulfilment] = useState<"collection" | "delivery">("collection");
  const [address, setAddress] = useState(""); const [occasion, setOccasion] = useState(""); const [notes, setNotes] = useState(""); const [items, setItems] = useState<Partial<Record<Product, number>>>({});
  const [website, setWebsite] = useState(""); const [error, setError] = useState(""); const minDate = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const submit = trpc.bookings.create.useMutation({
    onSuccess: ({ id }) => {
      const receipt: Receipt = { id, customerName: customerName.trim(), email: email.trim(), requestedDate, requestedTime, fulfilment, address: address.trim() || undefined, items: PRODUCTS.filter(product => items[product]).map(product => ({ product, quantity: items[product] || 1 })), occasion: occasion.trim() || undefined, notes: notes.trim() || undefined };
      setCustomerName(""); setEmail(""); setPhone(""); setRequestedDate(""); setRequestedTime(""); setAddress(""); setOccasion(""); setNotes(""); setItems({}); setWebsite("");
      onSuccess({ title: "Booking request received!", message: `Your request #${id} is safely with Thandi's Treats. A confirmation email is on its way.`, receipt });
    },
    onError: () => setError("We couldn't submit that request just now. Please check the details and try again."),
  });
  function toggleItem(product: Product) { setItems(current => { const next = { ...current }; if (next[product]) delete next[product]; else next[product] = 1; return next; }); }
  function setQuantity(product: Product, quantity: number) { setItems(current => ({ ...current, [product]: Math.max(1, Math.min(99, quantity || 1)) })); }
  function handleSubmit(event: FormEvent) {
    event.preventDefault(); const orderItems = PRODUCTS.filter(product => items[product]).map(product => ({ product, quantity: items[product] || 1 }));
    if (!customerName.trim() || !email.trim() || !phone.trim() || !requestedDate || !requestedTime || !orderItems.length || (fulfilment === "delivery" && !address.trim())) { setError("Please complete your contact details, requested date and time, order, and delivery address when needed."); return; }
    setError(""); submit.mutate({ customerName: customerName.trim(), email: email.trim(), phone: phone.trim(), requestedDate, requestedTime, fulfilment, address: address.trim() || undefined, items: orderItems, occasion: occasion.trim() || undefined, notes: notes.trim() || undefined, website });
  }
  return <form className="form-card booking-form" onSubmit={handleSubmit} noValidate>
    <div className="form-card__heading"><span className="eyebrow"><PackageCheck size={15} /> Plan a treat moment</span><h2>Book your bake</h2><p>Send us your wish list and preferred collection or delivery time.</p></div>
    <div className="form-grid">
      <label className="field-label">Your name <b>*</b><input value={customerName} onChange={event => setCustomerName(event.target.value)} placeholder="Full name" /></label>
      <label className="field-label">Email address <b>*</b><input type="email" value={email} onChange={event => setEmail(event.target.value)} placeholder="you@example.com" /></label>
      <label className="field-label">Phone number <b>*</b><input type="tel" value={phone} onChange={event => setPhone(event.target.value)} placeholder="Your best contact number" /></label>
      <label className="field-label">What's the occasion? <span>Optional</span><input value={occasion} onChange={event => setOccasion(event.target.value)} placeholder="Birthday, tea, just because…" /></label>
      <label className="field-label">Requested date <b>*</b><input type="date" value={requestedDate} min={minDate} onChange={event => setRequestedDate(event.target.value)} /></label>
      <label className="field-label">Preferred time <b>*</b><input type="time" value={requestedTime} onChange={event => setRequestedTime(event.target.value)} /></label>
    </div>
    <fieldset className="field-set"><legend>How would you like your treats? <b>*</b></legend><div className="choice-row"><label className={`choice-pill ${fulfilment === "collection" ? "is-selected" : ""}`}><input type="radio" checked={fulfilment === "collection"} onChange={() => setFulfilment("collection")} /> Collection</label><label className={`choice-pill ${fulfilment === "delivery" ? "is-selected" : ""}`}><input type="radio" checked={fulfilment === "delivery"} onChange={() => setFulfilment("delivery")} /> Delivery</label></div></fieldset>
    {fulfilment === "delivery" && <label className="field-label">Delivery address <b>*</b><textarea rows={2} value={address} onChange={event => setAddress(event.target.value)} placeholder="Street address and area" /></label>}
    <fieldset className="field-set"><legend>What would you like to order? <b>*</b></legend><div className="order-items">{PRODUCTS.map(product => { const quantity = items[product]; return <div className={`order-item ${quantity ? "is-selected" : ""}`} key={product}><label><input type="checkbox" checked={Boolean(quantity)} onChange={() => toggleItem(product)} /><span className="check-card__box"><Check size={14} strokeWidth={3} /></span><span>{product} — <strong>{PRICES[product]}</strong></span></label>{quantity && <span className="quantity-control"><button type="button" onClick={() => setQuantity(product, quantity - 1)} aria-label={`Reduce ${product}`}>−</button><input aria-label={`${product} quantity`} type="number" min="1" max="99" value={quantity} onChange={event => setQuantity(product, Number(event.target.value))} /><button type="button" onClick={() => setQuantity(product, quantity + 1)} aria-label={`Increase ${product}`}>+</button></span>}</div>; })}</div></fieldset>
    <label className="field-label">Anything else we should know? <span>Optional</span><textarea rows={3} value={notes} onChange={event => setNotes(event.target.value)} placeholder="Allergies, custom message, styling notes…" /></label>
    <input className="honeypot" value={website} onChange={event => setWebsite(event.target.value)} tabIndex={-1} autoComplete="off" aria-hidden="true" name="website" />
    {error && <p className="form-error" role="alert">{error}</p>}
    <button className="primary-button" type="submit" disabled={submit.isPending}>{submit.isPending ? <Loader2 className="spin" size={18} /> : <Mail size={18} />} Send booking request</button>
  </form>;
}

function ReceiptDetails({ receipt }: { receipt: Receipt }) {
  return <div className="receipt-details">
    <div className="receipt-details__ref"><span>Booking reference</span><b>#{receipt.id}</b></div>
    <div className="receipt-details__row"><span>Requested for</span><b>{receipt.requestedDate} · {receipt.requestedTime}</b></div>
    <div className="receipt-details__row"><span>Fulfilment</span><b>{receipt.fulfilment === "delivery" ? "Delivery" : "Collection"}</b></div>
    <div className="receipt-details__items"><span>Order</span>{receipt.items.map(item => <div key={item.product}><span>{item.quantity} × {item.product}</span></div>)}</div>
    <div className="receipt-details__row"><span>Email</span><b>{receipt.email}</b></div>
  </div>;
}

export default function Home() {
  const [modal, setModal] = useState<Modal>(null); const { data: summary } = trpc.reviews.summary.useQuery(undefined, { refetchInterval: 20_000 });
  const average = summary?.average ?? 0; const count = summary?.count ?? 0;
  return <div className="bakery-site">
    <header className="site-header"><div className="container header-inner"><a href="#reviews" className="header-link">Leave a review</a><BrandMark compact /><div className="header-actions"><ThemeToggle /><Link href="/admin/login" className="admin-link">Admin sign in</Link></div></div></header>
    <main>
      <section className="hero-section"><div className="container hero-grid"><div className="hero-copy"><div className="hero-brand"><BrandMark linked={false} /></div><span className="eyebrow">Made for sweet moments</span><h1>Every treat is <em>baked with love.</em></h1><p>Thank you for making Thandi's Treats part of your table. Tell us what you loved, or book something delicious for your next special moment.</p><div className="hero-actions"><a className="primary-button" href="#reviews"><Heart size={18} fill="currentColor" /> Share your experience</a><a className="text-button" href="#book"><MapPin size={17} /> Book your treats</a></div><div className="hero-note"><span className="hero-note__stars">★★★★★</span> Thoughtfully baked. Happily shared.</div></div><aside className="hero-card"><span className="hero-card__flour">✦</span><p className="eyebrow">A little note from us</p><h2>There is always room for something homemade.</h2><p>From classic banana bread to fudgy brownies, every batch starts with care and ends in a happy dance.</p><div className="hero-card__stamp"><Heart size={16} fill="currentColor" /> Thank you for supporting small</div></aside></div></section>
      <section id="reviews" className="form-section review-section"><div className="container section-layout"><div className="section-intro"><span className="eyebrow">Your honest thoughts</span><h2>Tell us about your <em>treat moment.</em></h2><p>Your feedback helps us keep every slice, crumb and sprinkle special.</p><div className="mini-testimonial"><Star size={17} fill="currentColor" /> “The kind of bake you want to tell your friends about.”</div></div><ReviewForm onSuccess={setModal} /></div></section>
      <section id="book" className="form-section booking-section"><div className="container section-layout section-layout--reverse"><div className="section-intro booking-intro"><span className="eyebrow">Freshly made for you</span><h2>Ready to book your <em>favourite treats?</em></h2><p>Choose your bakes, tell us when you need them, and we'll take it from there.</p><div className="booking-callout"><PackageCheck size={20} /><span><b>Easy booking</b><br />You’ll receive an email as soon as your request is safely with us.</span></div></div><BookingForm onSuccess={setModal} /></div></section>
    </main>
    <footer className="site-footer">
      <BrandMark compact linked={false} />
      <p>Baked with care, shared with joy.</p>
      <div className="contact-info" style={{ marginTop: '1rem', fontSize: '0.9rem', color: 'var(--text-secondary, #666)' }}>
        <p style={{ margin: '0.2rem 0' }}><strong>Open:</strong> Mon-Sat, 9 AM – 6 PM</p>
        <p style={{ margin: '0.2rem 0' }}><strong>Delivery:</strong> Available through Boda</p>
        <p style={{ margin: '0.2rem 0' }}><strong>Phone / WhatsApp:</strong> 0113726685</p>
        <p style={{ margin: '0.2rem 0' }}><strong>Instagram:</strong> @thand_istreats</p>
      </div>
      <div className="footer-links" style={{ marginTop: '1rem' }}>
        <Link href="/privacy">Privacy policy</Link>
        <Link href="/terms">Terms of use</Link>
        <Link href="/admin/login">Administrator access</Link>
      </div>
    </footer>
    <div className="rating-bar" aria-live="polite"><div className="rating-bar__inside"><span className="rating-bar__heart"><Heart size={18} fill="currentColor" /></span><span><b>Our community rating</b><small>{count ? `From ${count} ${count === 1 ? "review" : "reviews"}` : "Be the first to share the love"}</small></span><span className="rating-bar__score">{average ? average.toFixed(1) : "—"}</span><span className="rating-bar__stars" aria-label={`${average} out of 5 stars`}>{[1, 2, 3, 4, 5].map(star => <Star key={star} size={17} fill={star <= Math.round(average) ? "currentColor" : "none"} />)}</span></div></div>
    {modal && <div className="success-modal" role="dialog" aria-modal="true" aria-labelledby="success-title"><div className="success-modal__panel"><button className="modal-close" onClick={() => setModal(null)} aria-label="Close confirmation"><X size={19} /></button><div className="success-modal__icon"><Check size={30} strokeWidth={3} /></div><p className="eyebrow">All set</p><h2 id="success-title">{modal.title}</h2><p>{modal.message}</p>{modal.receipt && <ReceiptDetails receipt={modal.receipt} />}<div className="modal-actions">{modal.receipt && <button className="text-button receipt-print-button" onClick={() => window.print()}><Printer size={16} /> Save / print receipt</button>}<button className="primary-button" onClick={() => setModal(null)}>{modal.receipt ? <><Download size={16} /> Done</> : "Lovely, thank you"}</button></div></div></div>}
  </div>;
}
