import { Heart } from "lucide-react";
import { Link } from "wouter";

type BrandMarkProps = { compact?: boolean; linked?: boolean };

export default function BrandMark({ compact = false, linked = true }: BrandMarkProps) {
  const mark = (
    <div className={`brand-mark ${compact ? "brand-mark--compact" : ""}`} aria-label="Thandi's Treats — Baked with Love">
      <div className="brand-mark__ring">
        <span className="brand-mark__eyebrow">Baked with</span>
        <span className="brand-mark__name">Thandi's</span>
        <span className="brand-mark__treats">Treats</span>
        <span className="brand-mark__love"><Heart size={11} fill="currentColor" /> love</span>
      </div>
    </div>
  );
  return linked ? <Link href="/">{mark}</Link> : mark;
}
