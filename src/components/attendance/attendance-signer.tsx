"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

type Attendance = {
  arrivalTime: Date | string | null;
  departureTime: Date | string | null;
  arrivalStatus: "PRESENT" | "LATE" | null;
} | null;

function getGeolocationErrorMessage(error: GeolocationPositionError): string {
  switch (error.code) {
    case error.PERMISSION_DENIED:
      return "Vous avez refusé l'accès à la position GPS. Autorisez la géolocalisation dans votre navigateur pour signer votre présence.";
    case error.POSITION_UNAVAILABLE:
      return "Position GPS indisponible. Vérifiez votre connexion et réessayez.";
    case error.TIMEOUT:
      return "La localisation a pris trop de temps. Réessayez.";
    default:
      return "Impossible d'obtenir votre position GPS.";
  }
}

function getCurrentPosition(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("La géolocalisation n'est pas disponible sur cet appareil."));
      return;
    }
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout: 15000,
    });
  });
}

export function AttendanceSigner({ initialAttendance }: { initialAttendance: Attendance }) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [loadingAction, setLoadingAction] = useState<"arrival" | "departure" | null>(null);

  const hasArrived = !!initialAttendance?.arrivalTime;
  const hasDeparted = !!initialAttendance?.departureTime;

  async function handleSign(type: "arrival" | "departure") {
    setMessage(null);
    setLoadingAction(type);

    try {
      const position = await getCurrentPosition();

      const response = await fetch(`/api/attendance/${type}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        setMessage({ type: "error", text: result.message || "Une erreur est survenue." });
        return;
      }

      setMessage({
        type: "success",
        text: type === "arrival" ? "Arrivée enregistrée avec succès." : "Départ enregistré avec succès.",
      });
      startTransition(() => router.refresh());
    } catch (err: any) {
      if (err && typeof err === "object" && "code" in err) {
        setMessage({ type: "error", text: getGeolocationErrorMessage(err) });
      } else {
        setMessage({ type: "error", text: err?.message || "Une erreur est survenue." });
      }
    } finally {
      setLoadingAction(null);
    }
  }

  return (
    <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6">
      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          disabled={hasArrived || loadingAction !== null}
          onClick={() => handleSign("arrival")}
          className="flex-1 rounded-md bg-slate-900 dark:bg-slate-100 px-4 py-3 text-sm font-medium text-white dark:text-slate-900 hover:opacity-90 disabled:opacity-50"
        >
          {loadingAction === "arrival"
            ? "Localisation en cours..."
            : hasArrived
            ? "Arrivée déjà signée"
            : "Signer mon arrivée"}
        </button>

        <button
          type="button"
          disabled={!hasArrived || hasDeparted || loadingAction !== null}
          onClick={() => handleSign("departure")}
          className="flex-1 rounded-md border border-slate-300 dark:border-slate-700 px-4 py-3 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50"
        >
          {loadingAction === "departure"
            ? "Localisation en cours..."
            : hasDeparted
            ? "Départ déjà signé"
            : "Signer mon départ"}
        </button>
      </div>

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
    </div>
  );
}
