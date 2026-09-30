"use client";
import { BOUQUETS, BAKERIES, money, type Addon, type Selection } from "@/lib/pricing";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";

export function AddonOptions({ addon, selection, onChange }: { addon: Addon; selection: Selection; onChange: (patch: Partial<Selection>) => void }) {
  if (addon === "bouquet") return <div className="addon-options">
    <label htmlFor="bouquet-size">Choose a size</label>
    <Select value={selection.bouquetSize ?? "medium"} onValueChange={(value) => onChange({bouquetSize: value as Selection["bouquetSize"]})}>
      <SelectTrigger id="bouquet-size"><SelectValue /></SelectTrigger>
      <SelectContent>{Object.entries(BOUQUETS).map(([id, option]) => <SelectItem key={id} value={id}>{option.name} · {money(option.price)}</SelectItem>)}</SelectContent>
    </Select>
    <small>Simulated bouquet prices.</small>
  </div>;
  if (addon === "cake") return <div className="addon-options">
    <p className="gift-fee">S$49 · service fee only</p>
    <small>The cake’s purchase price is additional and excluded from your BeThere total.</small>
    <label htmlFor="cake-bakery">1. Choose your bakery</label>
    <Select value={selection.bakery ?? "awfully"} onValueChange={(value) => onChange({bakery: value as Selection["bakery"], cakeFlavor: ""})}>
      <SelectTrigger id="cake-bakery"><SelectValue /></SelectTrigger>
      <SelectContent>{Object.entries(BAKERIES).map(([id, option]) => <SelectItem key={id} value={id}>{option.name}</SelectItem>)}</SelectContent>
    </Select>
    <a href={BAKERIES[selection.bakery ?? "awfully"].url} target="_blank" rel="noopener noreferrer">2. Browse flavours at {BAKERIES[selection.bakery ?? "awfully"].name} (new tab)</a>
    <small>Explore their cakes and prices, then return to this tab to tell us your choice. No purchase is needed for this demo.</small>
    <label htmlFor="cake-flavor">3. Your chosen cake flavour</label>
    <textarea id="cake-flavor" rows={3} maxLength={500} value={selection.cakeFlavor ?? ""} onChange={(e) => onChange({cakeFlavor: e.target.value})} placeholder="Cake name, flavour and preferred size" required />
    <small>Bakery availability and the cake price must be confirmed separately.</small>
  </div>;
  return <div className="addon-options">
    <p className="gift-fee">S$99 · service fee only</p>
    <small>The gift itself costs extra and is not included in your total. Tell us exactly what you have in mind.</small>
    <label htmlFor="gift-item">What would you like us to get?</label>
    <textarea id="gift-item" rows={3} maxLength={500} value={selection.giftItem ?? ""} onChange={(e) => onChange({giftItem: e.target.value})} placeholder="Item, colour, size, and preferred budget" required />
    <label htmlFor="gift-store">Where should we get it?</label>
    <input id="gift-store" maxLength={500} value={selection.giftStore ?? ""} onChange={(e) => onChange({giftStore: e.target.value})} placeholder="Shop name, address, or website" required />
  </div>;
}
