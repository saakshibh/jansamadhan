import { Hammer } from "lucide-react";

export default function ComingSoon({ title }) {
  return (
    <div className="grid place-items-center py-24 text-center">
      <div className="mb-4 grid h-16 w-16 place-items-center rounded-2xl bg-indigo-100 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-300">
        <Hammer size={30} />
      </div>
      <h1 className="font-display text-2xl font-bold">{title}</h1>
      <p className="mt-2 text-slate-500 dark:text-slate-400">This page is being built in an upcoming part.</p>
    </div>
  );
}