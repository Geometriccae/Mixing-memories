import { useEffect, useRef } from "react";
import JsBarcode from "jsbarcode";

/** Renders CODE128 + human-readable text (admin catalog only). */
export default function AdminBarcodePreview({ value }: { value: string }) {
  const svgRef = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    const el = svgRef.current;
    const text = value.trim();
    if (!el || !text) return;
    try {
      el.replaceChildren();
      JsBarcode(el, text, {
        format: "CODE128",
        displayValue: true,
        fontSize: 13,
        height: 48,
        margin: 6,
        width: 2,
      });
    } catch {
      el.replaceChildren();
    }
  }, [value]);

  if (!value.trim()) return null;

  return (
    <div className="mt-2 inline-block max-w-full rounded-md border border-border bg-white p-2">
      <svg ref={svgRef} className="block max-w-full h-auto" aria-hidden />
    </div>
  );
}
