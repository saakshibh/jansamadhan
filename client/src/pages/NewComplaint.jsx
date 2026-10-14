import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { Mic, MicOff, ImagePlus, X, ArrowLeft, ArrowRight, Check, Send } from "lucide-react";
import api from "../utils/api";
import { CATEGORIES } from "../utils/constants";

const steps = ["Details", "Location & photos", "Review"];
const languages = [
  { code: "en-IN", label: "English" },
  { code: "hi-IN", label: "हिन्दी" },
  { code: "kn-IN", label: "ಕನ್ನಡ" },
];

export default function NewComplaint() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({ category: "", title: "", description: "", address: "", city: "", pincode: "" });
  const [images, setImages] = useState([]);
  const [lang, setLang] = useState("en-IN");
  const [listening, setListening] = useState(false);
  const [usedVoice, setUsedVoice] = useState(false);
  const [busy, setBusy] = useState(false);
  const recRef = useRef(null);
  const fileRef = useRef(null);

  useEffect(() => () => recRef.current?.stop(), []);

  const update = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const toggleVoice = () => {
    if (listening) {
      recRef.current?.stop();
      return;
    }
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return toast.error("Voice input is not supported here. Please use Chrome or Edge.");

    const rec = new SR();
    rec.lang = lang;
    rec.continuous = true;
    rec.interimResults = false;
    rec.onresult = (e) => {
      let text = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) text += e.results[i][0].transcript + " ";
      }
      if (text) setForm((f) => ({ ...f, description: (f.description + " " + text).trim() }));
    };
    rec.onerror = (e) => {
      toast.error(e.error === "not-allowed" ? "Microphone permission denied" : "Voice input error");
      setListening(false);
    };
    rec.onend = () => setListening(false);
    rec.start();
    recRef.current = rec;
    setListening(true);
    setUsedVoice(true);
  };

  const addImages = (e) => {
    const picked = Array.from(e.target.files);
    e.target.value = "";
    const room = 3 - images.length;
    if (picked.length > room) toast.error("You can upload up to 3 photos");
    const valid = picked.slice(0, room).filter((f) => {
      if (!f.type.startsWith("image/")) {
        toast.error(`${f.name} is not an image`);
        return false;
      }
      if (f.size > 5 * 1024 * 1024) {
        toast.error(`${f.name} is larger than 5 MB`);
        return false;
      }
      return true;
    });
    setImages((prev) => [...prev, ...valid.map((file) => ({ file, preview: URL.createObjectURL(file) }))]);
  };

  const removeImage = (i) => {
    URL.revokeObjectURL(images[i].preview);
    setImages(images.filter((_, idx) => idx !== i));
  };

  const next = () => {
    if (step === 0) {
      if (!form.category) return toast.error("Please select a category");
      if (form.title.trim().length < 5) return toast.error("Title must be at least 5 characters");
      if (form.description.trim().length < 20) return toast.error("Please describe the issue in at least 20 characters");
    }
    if (step === 1 && !form.address.trim()) return toast.error("Please enter the address of the issue");
    if (listening) recRef.current?.stop();
    setStep(step + 1);
  };

  const submit = async () => {
    setBusy(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v.trim()));
      fd.append("submittedVia", usedVoice ? "voice" : "text");
      images.forEach(({ file }) => fd.append("images", file));

      const { data } = await api.post("/complaints", fd);
      toast.success(`Complaint ${data.complaint.complaintId} submitted!`);
      navigate("/complaints");
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not submit complaint");
    } finally {
      setBusy(false);
    }
  };

  const card = "rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900";
  const label = "mb-2 block text-sm font-medium";
  const selected = CATEGORIES.find((c) => c.name === form.category);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">File a complaint</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">Tell us what is wrong and we will route it to the right department.</p>
      </div>

      <div className="flex items-center">
        {steps.map((s, i) => (
          <div key={s} className="flex flex-1 items-center last:flex-none">
            <div className="flex items-center gap-2">
              <span
                className={`grid h-9 w-9 place-items-center rounded-full text-sm font-semibold ${
                  i <= step
                    ? "bg-gradient-to-br from-indigo-600 to-fuchsia-600 text-white"
                    : "bg-slate-200 text-slate-500 dark:bg-slate-800"
                }`}
              >
                {i < step ? <Check size={16} /> : i + 1}
              </span>
              <span className={`hidden text-sm font-medium sm:block ${i <= step ? "" : "text-slate-400"}`}>{s}</span>
            </div>
            {i < steps.length - 1 && (
              <div className={`mx-3 h-0.5 flex-1 rounded ${i < step ? "bg-indigo-500" : "bg-slate-200 dark:bg-slate-800"}`} />
            )}
          </div>
        ))}
      </div>

      {step === 0 && (
        <div className={`${card} space-y-6`}>
          <div>
            <span className={label}>Category</span>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
              {CATEGORIES.map(({ name, icon: Icon }) => (
                <button
                  key={name}
                  type="button"
                  onClick={() => setForm({ ...form, category: name })}
                  className={`flex flex-col items-center gap-2 rounded-2xl border-2 p-3 text-center text-xs font-medium transition ${
                    form.category === name
                      ? "border-indigo-500 bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300"
                      : "border-slate-200 hover:border-slate-300 dark:border-slate-700"
                  }`}
                >
                  <Icon size={22} />
                  {name}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className={label}>Title</label>
            <input
              className="input pl-4"
              maxLength={120}
              placeholder="e.g. Large pothole near the bus stop"
              value={form.title}
              onChange={update("title")}
            />
          </div>

          <div>
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <label className="text-sm font-medium">Describe the issue</label>
              <div className="flex items-center gap-2">
                <select
                  value={lang}
                  onChange={(e) => setLang(e.target.value)}
                  disabled={listening}
                  className="rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs dark:border-slate-700 dark:bg-slate-900"
                >
                  {languages.map((l) => (
                    <option key={l.code} value={l.code}>{l.label}</option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={toggleVoice}
                  className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                    listening
                      ? "animate-pulse bg-red-500 text-white"
                      : "bg-indigo-100 text-indigo-700 hover:bg-indigo-200 dark:bg-indigo-500/20 dark:text-indigo-300"
                  }`}
                >
                  {listening ? <MicOff size={14} /> : <Mic size={14} />}
                  {listening ? "Stop recording" : "Speak instead"}
                </button>
              </div>
            </div>
            <textarea
              rows={6}
              maxLength={2000}
              className="input pl-4"
              placeholder="Explain what happened, since when, and how it affects people..."
              value={form.description}
              onChange={update("description")}
            />
            <p className="mt-1 text-right text-xs text-slate-400">{form.description.length}/2000</p>
          </div>
        </div>
      )}

      {step === 1 && (
        <div className={`${card} space-y-6`}>
          <div>
            <label className={label}>Address of the issue</label>
            <input
              className="input pl-4"
              placeholder="Street, landmark, area"
              value={form.address}
              onChange={update("address")}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={label}>City</label>
              <input className="input pl-4" placeholder="City" value={form.city} onChange={update("city")} />
            </div>
            <div>
              <label className={label}>Pincode</label>
              <input className="input pl-4" maxLength={6} placeholder="6-digit pincode" value={form.pincode} onChange={update("pincode")} />
            </div>
          </div>

          <div>
            <span className={label}>Photos (optional, up to 3)</span>
            <div className="flex flex-wrap gap-3">
              {images.map((img, i) => (
                <div key={img.preview} className="relative h-28 w-28 overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700">
                  <img src={img.preview} alt="Preview" className="h-full w-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeImage(i)}
                    className="absolute right-1 top-1 grid h-6 w-6 place-items-center rounded-full bg-black/60 text-white hover:bg-red-500"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
              {images.length < 3 && (
                <button
                  type="button"
                  onClick={() => fileRef.current.click()}
                  className="grid h-28 w-28 place-items-center rounded-xl border-2 border-dashed border-slate-300 text-slate-400 transition hover:border-indigo-500 hover:text-indigo-500 dark:border-slate-700"
                >
                  <span className="flex flex-col items-center gap-1 text-xs">
                    <ImagePlus size={24} /> Add photo
                  </span>
                </button>
              )}
            </div>
            <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={addImages} />
          </div>
        </div>
      )}

      {step === 2 && (
        <div className={`${card} space-y-5`}>
          <h2 className="font-display text-lg font-semibold">Review your complaint</h2>
          <div className="flex items-center gap-3">
            {selected && (
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-indigo-100 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-300">
                <selected.icon size={20} />
              </span>
            )}
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400">{form.category}</p>
              <p className="font-semibold">{form.title}</p>
            </div>
          </div>
          <p className="whitespace-pre-wrap rounded-xl bg-slate-50 p-4 text-sm dark:bg-slate-800/60">{form.description}</p>
          <div className="text-sm">
            <p className="text-xs text-slate-500 dark:text-slate-400">Location</p>
            <p>{[form.address, form.city, form.pincode].filter(Boolean).join(", ")}</p>
          </div>
          {images.length > 0 && (
            <div className="flex gap-3">
              {images.map((img) => (
                <img key={img.preview} src={img.preview} alt="Attached" className="h-20 w-20 rounded-lg object-cover" />
              ))}
            </div>
          )}
        </div>
      )}

      <div className="flex justify-between">
        <button
          type="button"
          onClick={() => setStep(step - 1)}
          disabled={step === 0}
          className="flex items-center gap-2 rounded-xl border border-slate-300 px-5 py-3 text-sm font-medium transition hover:bg-slate-100 disabled:invisible dark:border-slate-700 dark:hover:bg-slate-800"
        >
          <ArrowLeft size={16} /> Back
        </button>

        {step < 2 ? (
          <button type="button" onClick={next} className="btn-primary flex w-auto items-center gap-2 px-6">
            Next <ArrowRight size={16} />
          </button>
        ) : (
          <button type="button" onClick={submit} disabled={busy} className="btn-primary flex w-auto items-center gap-2 px-6">
            {busy ? "Submitting..." : "Submit complaint"} <Send size={16} />
          </button>
        )}
      </div>
    </div>
  );
}