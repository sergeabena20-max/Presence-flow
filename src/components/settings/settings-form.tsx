"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateSettings } from "@/actions/settings";

interface SettingsFormValues {
  facilityName: string;
  address: string;
  latitude: string;
  longitude: string;
  gpsRadius: string;
  officialArrivalTime: string;
  arrivalTolerance: string;
  officialDepartureTime: string;
}

export function SettingsForm({
  initialValues,
}: {
  initialValues: SettingsFormValues | null;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(
    null
  );
  const [form, setForm] = useState<SettingsFormValues>(
    initialValues ?? {
      facilityName: "",
      address: "",
      latitude: "",
      longitude: "",
      gpsRadius: "100",
      officialArrivalTime: "08:00",
      arrivalTolerance: "15",
      officialDepartureTime: "17:00",
    }
  );

  function useMyLocation() {
    if (!navigator.geolocation) {
      setMessage({ type: "error", text: "La géolocalisation n'est pas disponible sur cet appareil." });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setForm((f) => ({
          ...f,
          latitude: position.coords.latitude.toString(),
          longitude: position.coords.longitude.toString(),
        }));
      },
      () => {
        setMessage({ type: "error", text: "Impossible d'obtenir votre position." });
      }
    );
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);

    startTransition(async () => {
      const result = await updateSettings({
        facilityName: form.facilityName,
        address: form.address,
        latitude: parseFloat(form.latitude),
        longitude: parseFloat(form.longitude),
        gpsRadius: parseFloat(form.gpsRadius),
        officialArrivalTime: form.officialArrivalTime,
        arrivalTolerance: parseInt(form.arrivalTolerance, 10),
        officialDepartureTime: form.officialDepartureTime,
      });

      setMessage({
        type: result.success ? "success" : "error",
        text: result.message,
      });

      if (result.success) {
        router.refresh();
      }
    });
  }

  return (
    <div className="p-8 max-w-2xl">
      <h1 className="text-2xl font-semibold">Paramètres de l&apos;établissement</h1>
      <p className="mt-1 text-sm text-slate-500">
        Ces valeurs pilotent la vérification GPS et le calcul des retards.
        Aucune n&apos;est codée en dur dans l&apos;application.
      </p>

      {message && (
        <div
          className={
            message.type === "success"
              ? "mt-4 rounded-md bg-green-50 dark:bg-green-950 px-3 py-2 text-sm text-green-700 dark:text-green-400"
              : "mt-4 rounded-md bg-red-50 dark:bg-red-950 px-3 py-2 text-sm text-red-700 dark:text-red-400"
          }
        >
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div>
          <label className="text-sm font-medium">Nom de l&apos;établissement</label>
          <input
            required
            value={form.facilityName}
            onChange={(e) => setForm({ ...form, facilityName: e.target.value })}
            className="mt-1 w-full rounded-md border border-slate-300 dark:border-slate-700 bg-transparent px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-400"
          />
        </div>

        <div>
          <label className="text-sm font-medium">Adresse</label>
          <input
            required
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
            className="mt-1 w-full rounded-md border border-slate-300 dark:border-slate-700 bg-transparent px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-400"
          />
        </div>

        <div className="flex items-center justify-between">
          <p className="text-sm font-medium">Position GPS de l&apos;établissement</p>
          <button
            type="button"
            onClick={useMyLocation}
            className="text-xs font-medium text-slate-600 dark:text-slate-300 hover:underline"
          >
            Utiliser ma position actuelle
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium">Latitude</label>
            <input
              required
              type="number"
              step="any"
              value={form.latitude}
              onChange={(e) => setForm({ ...form, latitude: e.target.value })}
              className="mt-1 w-full rounded-md border border-slate-300 dark:border-slate-700 bg-transparent px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-400"
            />
          </div>
          <div>
            <label className="text-xs font-medium">Longitude</label>
            <input
              required
              type="number"
              step="any"
              value={form.longitude}
              onChange={(e) => setForm({ ...form, longitude: e.target.value })}
              className="mt-1 w-full rounded-md border border-slate-300 dark:border-slate-700 bg-transparent px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-400"
            />
          </div>
        </div>

        <div>
          <label className="text-sm font-medium">Rayon GPS autorisé (mètres)</label>
          <input
            required
            type="number"
            min="1"
            value={form.gpsRadius}
            onChange={(e) => setForm({ ...form, gpsRadius: e.target.value })}
            className="mt-1 w-full rounded-md border border-slate-300 dark:border-slate-700 bg-transparent px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-400"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-sm font-medium">Heure officielle d&apos;arrivée</label>
            <input
              required
              type="time"
              value={form.officialArrivalTime}
              onChange={(e) => setForm({ ...form, officialArrivalTime: e.target.value })}
              className="mt-1 w-full rounded-md border border-slate-300 dark:border-slate-700 bg-transparent px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-400"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Tolérance (minutes)</label>
            <input
              required
              type="number"
              min="0"
              value={form.arrivalTolerance}
              onChange={(e) => setForm({ ...form, arrivalTolerance: e.target.value })}
              className="mt-1 w-full rounded-md border border-slate-300 dark:border-slate-700 bg-transparent px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-400"
            />
          </div>
        </div>

        <div>
          <label className="text-sm font-medium">Heure officielle de départ</label>
          <input
            required
            type="time"
            value={form.officialDepartureTime}
            onChange={(e) => setForm({ ...form, officialDepartureTime: e.target.value })}
            className="mt-1 w-full max-w-[200px] rounded-md border border-slate-300 dark:border-slate-700 bg-transparent px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-400"
          />
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="rounded-md bg-slate-900 dark:bg-slate-100 px-4 py-2 text-sm font-medium text-white dark:text-slate-900 hover:opacity-90 disabled:opacity-50"
        >
          {isPending ? "Enregistrement..." : "Enregistrer les paramètres"}
        </button>
      </form>
    </div>
  );
}
