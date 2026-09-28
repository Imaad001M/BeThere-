import { z } from "zod";
export const CATALOG = {
  bouquet: {
    name: "Seasonal bouquet",
    price: 7900,
    cost: 3500,
    description: "Cream blooms, gathered by hand.",
    image: "/images/bouquet.webp",
  },
  cake: {
    name: "Celebration cake",
    price: 8900,
    cost: 4000,
    description: "Something sweet for 4–6 people.",
    image: "/images/cake.webp",
  },
  gift: {
    name: "Curated gift",
    price: 9900,
    cost: 4500,
    description: "A tea-and-keepsake gesture.",
    image: "/images/gift.webp",
  },
} as const;
export type Addon = keyof typeof CATALOG;
export const quoteSchema = z
  .object({
    event: z.enum(["birthday", "wedding", "funeral", "other"]),
    hours: z.number().int().min(2).max(4),
    addons: z.array(z.enum(["bouquet", "cake", "gift"])).max(3),
  })
  .strict()
  .superRefine((v, ctx) => {
    if (new Set(v.addons).size !== v.addons.length)
      ctx.addIssue({
        code: "custom",
        message: "Choose each addition once.",
        path: ["addons"],
      });
    if (v.event === "funeral" && v.addons.some((a) => a !== "bouquet"))
      ctx.addIssue({
        code: "custom",
        message: "Only sympathy flowers are available for remembrance.",
        path: ["addons"],
      });
  });
export type Selection = z.infer<typeof quoteSchema>;
export function quote(input: Selection) {
  const selection = quoteSchema.parse(input);
  const base = 19900;
  const extra = (selection.hours - 2) * 7900;
  const addons = selection.addons.reduce((s, a) => s + CATALOG[a].price, 0);
  const total = base + extra + addons;
  const representative = Math.round(total * 0.3);
  return {
    base,
    extra,
    addons,
    total,
    representative,
    platform: total - representative,
    currency: "SGD",
    pricingVersion: "sg-pilot-2026-09",
  };
}
export function economics(input: Selection) {
  const q = quote(input);
  const suppliers = input.addons.reduce((s, a) => s + CATALOG[a].cost, 0);
  const processing = Math.round(q.total * 0.034) + 50;
  const reserve = Math.round(q.total * 0.02);
  const travel = 1200;
  const support = 1000;
  const contribution =
    q.platform - suppliers - processing - reserve - travel - support;
  return {
    ...q,
    suppliers,
    processing,
    reserve,
    travel,
    support,
    contribution,
    afterAcquisition: contribution - 2500,
  };
}
export function money(cents: number, decimals = false) {
  return (
    "S$" +
    (cents / 100).toLocaleString("en-SG", {
      minimumFractionDigits: decimals ? 2 : 0,
      maximumFractionDigits: 2,
    })
  );
}
export function minimumDate() {
  return new Date(Date.now() + 48 * 3600000 + 8 * 3600000)
    .toISOString()
    .slice(0, 10);
}
export const detailSchema = z
  .object({
    yourName: z.string().trim().min(2, "Please enter your name.").max(80),
    email: z.string().trim().email("Please enter a valid email.").max(150),
    recipient: z.string().trim().min(2, "Who are we there for?").max(80),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Choose a date."),
    time: z.string().regex(/^(?:[01]\d|2[0-3]):[0-5]\d$/, "Choose a time."),
    venue: z
      .string()
      .trim()
      .min(5, "Please add the venue and address.")
      .max(250),
    language: z.enum(["English", "Mandarin", "Malay", "Tamil"]),
    message: z.string().trim().max(1000),
    notes: z.string().trim().max(1000),
  })
  .strict()
  .superRefine((v, ctx) => {
    const starts = new Date(v.date + "T" + v.time + ":00+08:00");
    const normalised = new Date(starts.getTime() + 8 * 3600000);
    if (
      !Number.isFinite(starts.getTime()) ||
      normalised.toISOString().slice(0, 10) !== v.date ||
      starts.getTime() < Date.now() + 48 * 3600000
    )
      ctx.addIssue({
        code: "custom",
        path: ["date"],
        message:
          "Choose a valid date and time at least 48 hours from now (Singapore time).",
      });
  });
export type Details = z.infer<typeof detailSchema>;
export const requestSchema = z
  .object({
    requestId: z.string().uuid(),
    selection: quoteSchema,
    details: detailSchema,
    demoAcknowledged: z.literal(true),
  })
  .strict();
