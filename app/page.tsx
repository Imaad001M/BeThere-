"use client";
import { useState, useEffect, useRef } from "react";
import { loadDemoRequest, saveDemoRequest, type SavedRequest } from "@/lib/demo-storage";
import {
  CakeSlice,
  HeartHandshake,
  Flower2,
  Sparkles,
  ArrowUpRight,
  Check,
  ArrowRight,
  ArrowLeft,
  MapPin,
  Clock3,
  Plus,
  Download,
  ShieldCheck,
  Loader2,
} from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  RELIGIONS, CATALOG, addonName, addonPrice, giftError, cakeError,
  quote,
  money,
  quoteSchema,
  detailSchema,
  minimumDate,
  type Selection,
  type Details,
  type Addon,
} from "@/lib/pricing";
import { AddonOptions } from "@/components/addon-options";
const occasions = [
  {
    id: "birthday",
    name: "Birthday",
    text: "Make their day a little brighter.",
    Icon: CakeSlice,
    title: "A birthday,",
    end: "made personal.",
  },
  {
    id: "wedding",
    name: "Wedding",
    text: "Send your love to their big day.",
    Icon: HeartHandshake,
    title: "Their big day.",
    end: "Your warmest wishes.",
  },
  {
    id: "funeral",
    name: "Funeral & remembrance",
    text: "A quiet presence, when it matters.",
    Icon: Flower2,
    title: "When words",
    end: "aren’t quite enough.",
  },
  {
    id: "other",
    name: "Another occasion",
    text: "Every meaningful moment counts.",
    Icon: Sparkles,
    title: "Their moment.",
    end: "Your thoughtfulness.",
  },
] as const;
const emptyDetails: Details = {
  yourName: "",
  email: "",
  recipient: "",
  date: "",
  time: "18:00",
  venue: "",
  language: "English",
  message: "",
  notes: "",
};
function occasionName(id: string) {
  return occasions.find((o) => o.id === id)?.name || id;
}
function RepresentativePromise() {
  return (
    <section className="representative-promise" aria-label="The BeThere promise">
      <div className="promise-mark" aria-hidden="true">
        <HeartHandshake size={24} strokeWidth={1.3} />
      </div>
      <div>
        <span className="eyebrow">THE BETHERE PROMISE</span>
        <h3>Your moment, thoughtfully cared for.</h3>
        <p>
          Our commitment is to pair you with a trained professional, prepared
          for your occasion and attentive to the details that matter to you.
          A warm introduction, a little discretion, and your wishes carried
          with care.
        </p>
      </div>
    </section>
  );
}

export default function Page() {
  const [selection, setSelection] = useState<Selection>({
    event: "birthday",
    hours: 2,
    addons: [],
  });
  const [step, setStep] = useState(0),
    [details, setDetails] = useState<Details>(emptyDetails),
    [dialog, setDialog] = useState<"how" | null>(null),
    [error, setError] = useState(""),
    [fieldErrors, setFieldErrors] = useState<Record<string, string>>({}),
    [ack, setAck] = useState(false),
    [busy, setBusy] = useState(false),
    [saved, setSaved] = useState<SavedRequest | null>(null),
    [notice, setNotice] = useState("");
  const requestId = useRef("");
  const topRef = useRef<HTMLDivElement>(null);
  const stateRef = useRef(selection);
  stateRef.current = selection;
  const q = saved?.quote || quote(selection),
    occasion = occasions.find((o) => o.id === selection.event)!;
  useEffect(() => {
    requestId.current = crypto.randomUUID();
    const id = new URLSearchParams(window.location.search).get("request");
    if (id) {
      try {
        const data = loadDemoRequest(id);
        setSaved(data);
        setSelection(data.selection);
        setDetails(data.details);
        setStep(3);
      } catch (e) {
        setError(e instanceof Error ? e.message : "We couldn’t load your saved plan.");
      }
    }
  }, []);
  useEffect(() => {
    const context = (
      document as Document & {
        modelContext?: {
          registerTool: (
            tool: unknown,
            options: unknown,
          ) => Promise<void> | void;
        };
      }
    ).modelContext;
    if (!context?.registerTool) return;
    const lifecycle = new AbortController();
    const tools = [
      {
        name: "get_bethere_quote",
        description:
          "Read the current BeThere event selection and estimated SGD price. Does not create a request.",
        inputSchema: {
          type: "object",
          properties: {},
          additionalProperties: false,
        },
        annotations: { readOnlyHint: true },
        execute: () => ({
          selection: stateRef.current,
          ...quote(stateRef.current),
        }),
      },
      {
        name: "configure_bethere_quote",
        description:
          "Stage an occasion, attendance hours and optional add-ons in the visible BeThere planner. Does not book, save or pay.",
        inputSchema: {
          type: "object",
          properties: {
            event: {
              type: "string",
              enum: ["birthday", "wedding", "funeral", "other"],
            },
            hours: { type: "integer", minimum: 2, maximum: 4 },
            bouquetSize: {type: "string", enum: ["small", "medium", "large"]},
            bakery: {type: "string", enum: ["awfully", "bengawan", "emicakes", "patissier"]},
            cakeFlavor: {type: "string", maxLength: 500},
            giftItem: {type: "string", maxLength: 500},
            giftStore: {type: "string", maxLength: 500},
            addons: {
              type: "array",
              items: { type: "string", enum: ["bouquet", "cake", "gift"] },
              uniqueItems: true,
            },
          },
          required: ["event", "hours", "addons"],
          additionalProperties: false,
        },
        annotations: { readOnlyHint: false },
        execute: async (input: unknown) => {
          const next = quoteSchema.parse(input);
          setSaved(null);
          requestId.current = crypto.randomUUID();
          window.history.replaceState({}, "", "/");
          setAck(false);
          setSelection(next);
          setStep(0);
          setError("");
          stateRef.current = next;
          await new Promise<void>((resolve) =>
            requestAnimationFrame(() => resolve()),
          );
          return { selection: next, ...quote(next) };
        },
      },
    ];
    tools.forEach((tool) => {
      try {
        Promise.resolve(
          context.registerTool(tool, { signal: lifecycle.signal }),
        ).catch(() => {});
      } catch {}
    });
    return () => lifecycle.abort();
  }, []);
  function go(next: number) {
    if (step === 0 && next > 0 && (cakeError(selection) || giftError(selection))) {
      setError(cakeError(selection) || giftError(selection));
      return;
    }
    setError("");
    setStep(next);
    topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }
  function changeOccasion(value: string) {
    const next = value as Selection["event"];
    if (next !== "funeral") setDetails(({religion, religionOther, ...rest}) => rest);
    if (next === "funeral" && selection.addons.some((a) => a !== "bouquet"))
      setNotice(
        "Celebration cake and the gift have been removed for remembrance.",
      );
    else setNotice("");
    setSelection((s) => ({
      ...s,
      event: next,
      addons:
        next === "funeral" ? s.addons.filter((a) => a === "bouquet") : s.addons,
    }));
  }
  function toggleAddon(a: Addon) {
    setSelection((s) => ({
      ...s,
      addons: s.addons.includes(a)
        ? s.addons.filter((v) => v !== a)
        : [...s.addons, a],
    }));
  }
  function update(key: keyof Details, value: string) {
    setDetails((d) => ({ ...d, [key]: value }));
    setFieldErrors((e) => ({ ...e, [key]: "" }));
  }
  function validate() {
    const parsed = detailSchema.safeParse(details);
    if (!parsed.success) {
      const errors: Record<string, string> = {};
      parsed.error.issues.forEach((i) => {
        errors[String(i.path[0])] = i.message;
      });
      setFieldErrors(errors);
      setError("Please check the highlighted details.");
      return false;
    }
    setDetails(parsed.data);
    setFieldErrors({});
    return true;
  }
  function fillSample() {
    const date = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);
    setDetails({
      yourName: "Alex Tan",
      email: "alex@example.com",
      recipient: "Jamie",
      date,
      time: "18:00",
      venue: "Sample celebration venue, Singapore",
      language: "English",
      message:
        "Happy birthday, Jamie. Sending so much love from afar. I wish I could be there to celebrate with you.",
      notes:
        "Please introduce yourself as a BeThere representative attending on my behalf.",
    });
    setFieldErrors({});
    setError("");
  }
  function save() {
    if (!ack) {
      setError("Please acknowledge that this is a demo request.");
      return;
    }
    if (!validate()) {
      go(1);
      return;
    }
    setBusy(true);
    setError("");
    try {
      const data = saveDemoRequest({
          requestId: requestId.current,
          selection,
          details,
          demoAcknowledged: true,
      });
      setSaved(data);
      window.history.replaceState({}, "", "?request=" + data.id);
      go(3);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Please try again.");
    } finally {
      setBusy(false);
    }
  }
  function reset() {
    setSaved(null);
    setAck(false);
    setSelection({ event: "birthday", hours: 2, addons: [] });
    setDetails(emptyDetails);
    requestId.current = crypto.randomUUID();
    window.history.replaceState({}, "", "/");
    go(0);
  }
  function download() {
    if (!saved) return;
    const content = [
      "BETHERE — SAVED DEMO REQUEST",
      "No visit is booked. No payment has been taken.",
      "Saved in this browser only. This plan has not been sent to BeThere.",
      "",
      "Reference: " + saved.id,
      "Occasion: " + occasionName(selection.event),
      "For: " + details.recipient,
      "Date: " +
        details.date +
        " at " +
        details.time +
        " (Singapore, UTC+08:00)",
      "Venue: " + details.venue,
      "Duration: " + selection.hours + " hours",
      "Language: " + details.language,
      ...(selection.event === "funeral" ? ["Religion / tradition: " + (details.religion === "Other" ? "Other" + (details.religionOther ? " — " + details.religionOther : "") : details.religion || "Not specified")] : []),
      "Add-ons: " +
        (selection.addons.map((a) => addonName(a, selection)).join(", ") || "None"),
      ...(selection.addons.includes("gift") ? ["Gift requested: " + (selection.giftItem || "Not specified"), "Buy from: " + (selection.giftStore || "Not specified"), "S$99 covers the gift service only. Gift purchase cost is additional and excluded from the total."] : []),
      ...(selection.addons.includes("cake") ? ["Cake flavour: " + (selection.cakeFlavor || "Not specified"), "S$49 covers the cake service only. Cake purchase price is additional and excluded from this total."] : []),
      "Estimated total: " + money(q.total),
      "Representative share (30%): " + money(q.representative, true),
      "",
      "Your message: " + details.message,
      "Notes: " + details.notes,
    ].join("\n");
    const url = URL.createObjectURL(
      new Blob([content], { type: "text/plain" }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = "BeThere-demo-request.txt";
    a.click();
    URL.revokeObjectURL(url);
  }
  const fields = (
    key: keyof Details,
    label: string,
    type = "text",
    placeholder = "",
    required = true,
  ) => (
    <label className={"field " + (fieldErrors[key] ? "invalid" : "")} key={key}>
      <span>
        {label}
        {!required && <small>Optional</small>}
      </span>
      <input
        type={type}
        value={details[key]}
        onChange={(e) => update(key, e.target.value)}
        placeholder={placeholder}
        required={required}
        min={type === "date" ? minimumDate() : undefined}
        maxLength={key === "venue" ? 250 : 150}
        aria-invalid={Boolean(fieldErrors[key])}
        aria-describedby={fieldErrors[key] ? key + "-error" : undefined}
      />
      {fieldErrors[key] && (
        <small className="field-error" id={key + "-error"}>
          {fieldErrors[key]}
        </small>
      )}
    </label>
  );
  return (
    <>
      <header className="header">
        <a className="brand" href="/" aria-label="BeThere home">
          Be<span>There</span>
          <i aria-hidden="true">✳</i>
        </a>
        <nav aria-label="Main navigation">
          <button
            className="active"
            onClick={() => {
              if (saved) reset();
              else go(0);
            }}
          >
            Arrange a presence
          </button>
          <button onClick={() => setDialog("how")}>How it works</button>
        </nav>
        <div className="locale">
          <MapPin size={15} /> Singapore <span>SGD</span>
        </div>
      </header>
      <main className="shell">
        <div className="eyebrow">THOUGHTFULLY PRESENT. EVEN FROM AFAR.</div>
        <div className="page-title">
          <h1>
            Life happens.
            <br />
            <em>Be there for it.</em>
          </h1>
          <p>
            Send someone thoughtful to the moments
            <br />
            you wish you could make.
          </p>
        </div>
        <div className="mobile-nav">
          <button onClick={() => setDialog("how")}>How it works</button>
        </div>
        <div className="workspace" ref={topRef}>
          <section className="main-surface">
            <nav className="steps" aria-label="Booking steps">
              {["The occasion", "The details", "Review"].map((label, i) => (
                <div className="step-wrap" key={label}>
                  {i > 0 && <i />}
                  <button
                    className={
                      step === i ? "current" : step > i ? "complete" : ""
                    }
                    aria-current={step === i ? "step" : undefined}
                    disabled={i > step || !!saved}
                    onClick={() => go(i)}
                  >
                    <b>
                      {step > i ? (
                        <Check size={12} />
                      ) : (
                        String(i + 1).padStart(2, "0")
                      )}
                    </b>
                    {label}
                  </button>
                </div>
              ))}
            </nav>
            {error && (
              <div className="error-message" role="alert">
                {error}
              </div>
            )}
            {step === 0 && (
              <div className="stage">
                <div className="section-title">
                  <h2>What’s the occasion?</h2>
                  <span>01 / 03</span>
                </div>
                <RadioGroup
                  value={selection.event}
                  onValueChange={changeOccasion}
                  className="occasion-grid"
                  aria-label="Occasion"
                >
                  {occasions.map(({ id, name, text, Icon }) => (
                    <label
                      key={id}
                      className={
                        "occasion " + (selection.event === id ? "selected" : "")
                      }
                    >
                      <RadioGroupItem
                        value={id}
                        className="event-radio"
                        aria-label={name}
                      />
                      <Icon size={28} strokeWidth={1.2} />
                      <strong>{name}</strong>
                      <span>{text}</span>
                    </label>
                  ))}
                </RadioGroup>
                <div className="included">
                  <div className="small-icon">
                    <HeartHandshake size={23} strokeWidth={1.3} />
                  </div>
                  <div>
                    <strong>
                      {selection.event === "funeral"
                        ? "A presence guided by respect."
                        : "More than just showing up."}
                    </strong>
                    <p>
                      {selection.event === "funeral"
                        ? "We start with the family’s wishes. Your representative offers condolences on your behalf, with cultural and religious customs respected."
                        : "Your representative carries your message, spends time with your people, and shares a personal update afterwards."}
                    </p>
                  </div>
                </div>
                <div className="section-title addon-title">
                  <div>
                    <h2>A little something from you</h2>
                    <p>Thoughtful additions. Hand-delivered with care.</p>
                  </div>
                  <span>OPTIONAL</span>
                </div>
                {notice && (
                  <p className="notice" role="status">
                    {notice}
                  </p>
                )}
                <div className="addons">
                  {(Object.keys(CATALOG) as Addon[])
                    .filter(
                      (a) => selection.event !== "funeral" || a === "bouquet",
                    )
                    .map((a) => {
                      const item = CATALOG[a],
                        selected = selection.addons.includes(a);
                      return (
                        <div
                          className={"addon " + (selected ? "selected" : "")}
                          key={a}
                        >
                          <div className="addon-image">
                            <img
                              src={item.image}
                              alt={
                                a === "bouquet"
                                  ? "Cream flowers tied with a champagne ribbon"
                                  : a === "cake"
                                    ? "Small ivory cake with a gold candle"
                                    : "Charcoal gift box with champagne ribbon"
                              }
                              width={552}
                              height={368}
                            />
                            <span className="addon-control">
                              <Checkbox
                                checked={selected}
                                onCheckedChange={() => toggleAddon(a)}
                                aria-label={
                                  "Add " +
                                  (selection.event === "funeral"
                                    ? "sympathy bouquet"
                                    : item.name)
                                }
                              />
                            </span>
                          </div>
                          <div className="addon-content">
                            <strong>
                              {selection.event === "funeral"
                                ? "Sympathy bouquet"
                                : item.name}
                            </strong>
                            <p>
                              {selection.event === "funeral"
                                ? "Seasonal flowers, with family approval."
                                : item.description}
                            </p>
                            <span>
                              {money(addonPrice(a, selection))}
                              <small>
                                {selected ? (
                                  <>
                                    <Check size={12} /> Added
                                  </>
                                ) : (
                                  <>
                                    <Plus size={12} /> Add
                                  </>
                                )}
                              </small>
                            </span>
                          </div>
                          {selected && <AddonOptions addon={a} selection={selection} onChange={(patch) => setSelection((s) => ({...s, ...patch}))} />}
                        </div>
                      );
                    })}
                </div>
                <p className="catalog-note">
                  Illustrative arrangements. Final contents and availability
                  confirmed before a live booking.
                </p>
                <div className="flow-bottom">
                  <span>
                    <Clock3 size={15} /> Plan at least 48 hours ahead
                  </span>
                  <button className="text-button" onClick={() => go(1)}>
                    Event details <ArrowRight size={16} />
                  </button>
                </div>
              </div>
            )}
            {step === 1 && (
              <form
                className="stage details-form"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (validate()) go(2);
                }}
                noValidate
              >
                <div className="section-title">
                  <div>
                    <h2>It’s the details that matter.</h2>
                    <p>Help us make your presence feel personal.</p>
                  </div>
                  <span>02 / 03</span>
                </div>
                <div className="demo-note">
                  <span>Explore the prototype with sample details.</span>
                  <button type="button" onClick={fillSample}>
                    Fill sample details <ArrowUpRight size={13} />
                  </button>
                </div>
                <div className="form-grid">
                  {fields("yourName", "Your name", "text", "Your full name")}
                  {fields("email", "Your email", "email", "you@example.com")}
                  {fields(
                    "recipient",
                    "Who are we there for?",
                    "text",
                    "Name of recipient or family",
                  )}
                  <label className="field">
                    <span>Preferred language</span>
                    <Select
                      value={details.language}
                      onValueChange={(v) => update("language", v)}
                    >
                      <SelectTrigger aria-label="Preferred language">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {["English", "Mandarin", "Malay", "Tamil"].map((l) => (
                          <SelectItem key={l} value={l}>
                            {l}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </label>
                  {selection.event === "funeral" && <div className="full-field">
                    <label className="field">
                      <span>Religion or tradition <small>Optional</small></span>
                      <Select value={details.religion ?? ""} onValueChange={(value) => update("religion", value)}>
                        <SelectTrigger aria-label="Religion or tradition"><SelectValue placeholder="Select a religion or tradition" /></SelectTrigger>
                        <SelectContent>{RELIGIONS.map((religion) => <SelectItem key={religion} value={religion}>{religion}</SelectItem>)}</SelectContent>
                      </Select>
                    </label>
                    <p className="catalog-note">Help us respect the family’s wishes. You can share any customs or guidance in the additional notes below.</p>
                    {details.religion === "Other" && fields("religionOther", "Specify the religion or tradition (optional)", "text", "Religion, tradition or denomination")}
                  </div>}
                  {fields("date", "Event date", "date")}
                  {fields("time", "Arrival time · Singapore", "time")}
                  <div className="full-field">
                    {fields(
                      "venue",
                      "Venue and address",
                      "text",
                      "Venue, street, and postal code",
                    )}
                  </div>
                  <label className="field full-field">
                    <span>Time at the event</span>
                    <Select
                      value={String(selection.hours)}
                      onValueChange={(v) =>
                        setSelection((s) => ({ ...s, hours: Number(v) }))
                      }
                    >
                      <SelectTrigger aria-label="Attendance duration">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="2">
                          2 hours · included in S$199
                        </SelectItem>
                        <SelectItem value="3">3 hours · +S$79</SelectItem>
                        <SelectItem value="4">4 hours · +S$158</SelectItem>
                      </SelectContent>
                    </Select>
                  </label>
                  <label className="field full-field">
                    <span>
                      Your personal message <small>Optional</small>
                    </span>
                    <textarea
                      value={details.message}
                      onChange={(e) => update("message", e.target.value)}
                      maxLength={1000}
                      placeholder="The words you’d like us to carry with us…"
                      rows={4}
                    />
                    <small className="character-count">
                      {details.message.length} / 1,000
                    </small>
                  </label>
                  <label className="field full-field">
                    <span>
                      Anything we should know? <small>Optional</small>
                    </span>
                    <textarea
                      value={details.notes}
                      onChange={(e) => update("notes", e.target.value)}
                      maxLength={1000}
                      placeholder="Dress code, cultural customs, dietary needs or accessibility…"
                      rows={3}
                    />
                  </label>
                </div>
                <div className="disclosure">
                  <ShieldCheck size={20} />
                  <p>
                    Your representative will introduce themselves as attending
                    on your behalf. In a live booking, the host’s consent and
                    access to the venue must be confirmed first.
                  </p>
                </div>
                <div className="form-actions">
                  <button
                    type="button"
                    className="text-button"
                    onClick={() => go(0)}
                  >
                    <ArrowLeft size={16} /> Back
                  </button>
                  <button type="submit" className="primary">
                    Review your presence <ArrowRight size={17} />
                  </button>
                </div>
              </form>
            )}
            {step === 2 && (
              <div className="stage review">
                <div className="section-title">
                  <div>
                    <h2>A thoughtful plan, just for them.</h2>
                    <p>Take a moment to make sure everything feels right.</p>
                  </div>
                  <span>03 / 03</span>
                </div>
                <div className="review-card">
                  <div className="review-card-head">
                    <span className="eyebrow">
                      {occasionName(selection.event).toUpperCase()}
                    </span>
                    <button onClick={() => go(1)} className="text-button">
                      Edit details
                    </button>
                  </div>
                  <h3>For {details.recipient}</h3>
                  <div className="review-lines">
                    <p>
                      <Clock3 size={16} />
                      {details.date} · {details.time} SGT · {selection.hours}{" "}
                      hours
                    </p>
                    <p>
                      <MapPin size={16} />
                      {details.venue}
                    </p>
                    <p>
                      <HeartHandshake size={16} />
                      {details.language}-speaking representative requested
                    </p>
                  </div>
                  {details.message && (
                    <blockquote>
                      “{details.message}”<span>From {details.yourName}</span>
                    </blockquote>
                  )}
                  {details.notes && (
                    <p className="review-notes">
                      <strong>Additional notes</strong>
                      {details.notes}
                    </p>
                  )}
                  {selection.event === "funeral" && <p className="review-email">Religion / tradition: {details.religion === "Other" ? "Other" + (details.religionOther ? " — " + details.religionOther : "") : details.religion || "Not specified"}</p>}
                  <p className="review-email">Contact: {details.email}</p>
                </div>
                <div className="review-addons">
                  <h3>Your thoughtful additions</h3>
                  {selection.addons.length ? (
                    selection.addons.map((a) => (
                      <div className="mini-addon" key={a}>
                        <img
                          src={CATALOG[a].image}
                          alt=""
                          width={60}
                          height={45}
                        />
                        <span>
                          {selection.event === "funeral"
                            ? "Sympathy · " + addonName(a, selection)
                            : addonName(a, selection)}
                        </span>
                        <strong>{money(addonPrice(a, selection))}</strong>
                      </div>
                    ))
                  ) : (
                    <p>
                      Your personal message is included. No paid additions
                      selected.
                    </p>
                  )}
                  {selection.addons.includes("cake") && <p className="gift-summary">Cake flavour: {selection.cakeFlavor || "Not specified"}<br />S$49 is the service fee only. The cake’s purchase price is additional and excluded from this total.</p>}
                  {selection.addons.includes("gift") && <p className="gift-summary">Gift: {selection.giftItem || "Not specified"}<br />From: {selection.giftStore || "Not specified"}<br />S$99 is the service fee only. The gift’s purchase cost is additional and excluded from this total.</p>}
                  <button className="text-button" onClick={() => go(0)}>
                    Edit occasion & additions
                  </button>
                </div>
                <RepresentativePromise />
                <div className="disclosure">
                  <ShieldCheck size={20} />
                  <p>
                    Your demo plan is saved only in this browser. No details are
                    sent to BeThere, no visit is booked, and no payment is taken.
                  </p>
                </div>
                <label className="ack">
                  <Checkbox
                    checked={ack}
                    onCheckedChange={(v) => setAck(v === true)}
                    aria-label="I understand this is a demo request"
                  />
                  <span>
                    I understand this is a demo request, not a confirmed
                    booking.
                  </span>
                </label>
                <div className="form-actions">
                  <button className="text-button" onClick={() => go(1)}>
                    <ArrowLeft size={16} /> Back
                  </button>
                  <button
                    className="primary"
                    onClick={save}
                    disabled={busy || !ack}
                  >
                    {busy ? (
                      <>
                        <Loader2 className="spin" size={17} />
                        Saving…
                      </>
                    ) : (
                      <>
                        Save demo request <ArrowRight size={17} />
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
            {step === 3 && saved && (
              <div className="stage success">
                <div className="success-mark">
                  <Check size={31} />
                </div>
                <span className="eyebrow">YOUR DEMO REQUEST IS SAVED</span>
                <h2>
                  A little closer,
                  <br />
                  <em>even from afar.</em>
                </h2>
                <p>
                  Your plan for {details.recipient} is saved in this browser.
                  No visit is booked and no payment has been taken.
                  Download a copy to keep it if you clear your browser data.
                </p>
                <div className="saved-detail">
                  <span>REQUEST REFERENCE</span>
                  <strong>{saved.id.slice(0, 8).toUpperCase()}</strong>
                  <p>
                    {occasionName(selection.event)} · {details.date} ·{" "}
                    {details.time} SGT
                  </p>
                  <p>{details.venue}</p>
                </div>
                <RepresentativePromise />
                <div className="next-steps">
                  <h3>For a live booking, what would happen next?</h3>
                  <p>
                    We would confirm the host’s consent, agree on a
                    representative and your additions, then request payment once
                    everything is ready.
                  </p>
                </div>
                <button className="primary" onClick={download}>
                  <Download size={17} />
                  Download your demo plan
                </button>
                <button className="text-button" onClick={reset}>
                  Arrange another presence <ArrowRight size={15} />
                </button>
              </div>
            )}
          </section>
          <aside className="summary">
            <div className="summary-top">
              <span className="eyebrow">YOUR PRESENCE, ARRANGED</span>
              <div className="summary-icon">B.</div>
              <h3>
                {occasion.title}
                <br />
                <em>{occasion.end}</em>
              </h3>
              <p>
                {selection.event === "funeral"
                  ? "Your condolences, delivered with care."
                  : "Someone there. Something meaningful."}
              </p>
            </div>
            <div className="summary-body">
              <div className="price-row">
                <div>
                  <strong>The BeThere presence</strong>
                  <small>2 hours · one representative</small>
                </div>
                <span>{money(q.base)}</span>
              </div>
              {selection.hours > 2 && (
                <div className="price-row extra-line">
                  <span>
                    {selection.hours - 2} additional{" "}
                    {selection.hours === 3 ? "hour" : "hours"}
                  </span>
                  <span>{money(q.extra)}</span>
                </div>
              )}
              {selection.addons.map((a) => (
                <div className="price-row extra-line" key={a}>
                  <span>
                    {selection.event === "funeral"
                      ? "Sympathy · " + addonName(a, selection)
                      : addonName(a, selection)}
                  </span>
                  <span>{money(addonPrice(a, selection))}</span>
                </div>
              ))}
              {selection.addons.includes("cake") && <p className="gift-summary">Cake purchase price is additional. Only the S$49 cake service fee is included in this total.</p>}
              {selection.addons.includes("gift") && <p className="gift-summary">Gift purchase cost is additional. Only the S$99 gift service fee is included in this total.</p>}
              <ul>
                <li>
                  <Check />A personal message from you
                </li>
                <li>
                  <Check />
                  Travel within Singapore
                </li>
                <li>
                  <Check />
                  An update after the occasion
                </li>
              </ul>
              <div className="total" aria-live="polite">
                <span>
                  Estimated total{" "}
                  <small>All prices in SGD · pilot pricing</small>
                </span>
                <strong>{money(q.total)}</strong>
              </div>
              {step === 0 ? (
                <button className="primary" onClick={() => go(1)}>
                  Continue to details <ArrowRight size={18} />
                </button>
              ) : step === 1 ? (
                <button
                  className="primary"
                  onClick={() => {
                    if (validate()) go(2);
                  }}
                >
                  Review your presence <ArrowRight size={18} />
                </button>
              ) : step === 2 ? (
                <button
                  className="primary"
                  onClick={save}
                  disabled={busy || !ack}
                >
                  {busy ? "Saving…" : "Save demo request"}
                  {!busy && <ArrowRight size={18} />}
                </button>
              ) : (
                <div className="saved-status">
                  <Check size={17} /> Saved as a demo request
                </div>
              )}
              <p className="quiet">Prototype · no booking or payment</p>
            </div>
          </aside>
        </div>
      </main>
      <footer>
        <span className="brand small">
          BeThere<i>✳</i>
        </span>
        <span>Distance changes plans. It doesn’t have to change care.</span>
      </footer>
      <Dialog
        open={dialog !== null}
        onOpenChange={(open) => {
          if (!open) setDialog(null);
        }}
      >
        <DialogContent className="info-dialog">
          <span className="eyebrow">BETHERE, THOUGHTFULLY EXPLAINED</span>
          <DialogTitle>Good intentions. Thoughtfully delivered.</DialogTitle>
          <DialogDescription>
            A proposed service built around your people and their comfort.
          </DialogDescription>
              <div className="how-step">
                <b>01</b>
                <div>
                  <h3>Tell us about the moment.</h3>
                  <p>
                    Choose an occasion, a personal gesture and the message you
                    want to share.
                  </p>
                </div>
              </div>
              <div className="how-step">
                <b>02</b>
                <div>
                  <h3>We agree on the right presence.</h3>
                  <p>
                    For a live service, we would confirm host consent,
                    etiquette, language and representative availability before
                    accepting your booking.
                  </p>
                </div>
              </div>
              <div className="how-step">
                <b>03</b>
                <div>
                  <h3>Your care arrives in person.</h3>
                  <p>
                    The representative openly attends on your behalf, delivers
                    your message and gifts, and follows up with a private
                    written update.
                  </p>
                </div>
              </div>
              <p className="dialog-note">
                This version saves demo plans only in your browser. They are
                not sent to BeThere or shared across devices. Real visits,
                payments, supplier orders and representative matching are not active.
              </p>
        </DialogContent>
      </Dialog>
    </>
  );
}
