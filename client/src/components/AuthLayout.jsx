import { Landmark, Sparkles, ShieldCheck, Zap, Sun, Moon } from "lucide-react";
import { useTheme } from "../context/ThemeContext";

const features = [
  { icon: Sparkles, text: "AI classifies and routes complaints instantly" },
  { icon: ShieldCheck, text: "Every action tracked in a transparent audit trail" },
  { icon: Zap, text: "Automatic escalation when deadlines are missed" },
];

export default function AuthLayout({ title, subtitle, children }) {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden overflow-hidden bg-gradient-to-br from-indigo-600 via-violet-600 to-fuchsia-600 p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="absolute -left-20 -top-20 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-24 -right-16 h-80 w-80 rounded-full bg-pink-400/30 blur-3xl" />

        <div className="relative flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-xl bg-white/20 backdrop-blur">
            <Landmark size={24} />
          </div>
          <span className="font-display text-2xl font-bold">JanSamadhan</span>
        </div>

        <div className="relative">
          <h1 className="font-display text-4xl font-bold leading-tight xl:text-5xl">
            Every complaint heard.
            <br />
            Every issue resolved.
          </h1>
          <p className="mt-4 max-w-md text-lg text-white/80">
            AI-powered grievance triage that routes your issue to the right department, tracks it,
            and keeps authorities accountable.
          </p>
          <ul className="mt-8 space-y-4">
            {features.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3">
                <span className="grid h-9 w-9 place-items-center rounded-lg bg-white/20 backdrop-blur">
                  <Icon size={18} />
                </span>
                <span className="text-white/90">{text}</span>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-sm text-white/60">© 2026 JanSamadhan</p>
      </div>

      <div className="relative flex items-center justify-center p-6">
        <button
          onClick={toggleTheme}
          className="absolute right-6 top-6 grid h-10 w-10 place-items-center rounded-full border border-slate-300 bg-white text-slate-600 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
          aria-label="Toggle theme"
        >
          {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        <div className="w-full max-w-md">
          <h2 className="font-display text-3xl font-bold">{title}</h2>
          <p className="mb-8 mt-2 text-slate-500 dark:text-slate-400">{subtitle}</p>
          {children}
        </div>
      </div>
    </div>
  );
}