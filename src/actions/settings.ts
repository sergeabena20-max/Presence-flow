"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireRole, requireUser } from "@/lib/permissions";
import type { UpdateSettingsInput } from "@/lib/types";

export interface ActionResult {
  success: boolean;
  message: string;
}

// Il ne doit exister qu'UN seul enregistrement Settings (section 6). On
// l'impose au niveau applicatif avec un id fixe et connu + un upsert,
// plutôt qu'un "findFirst puis create" sujet aux races.
import { SETTINGS_ID } from "@/lib/constants";

function timeStringToDate(hhmm: string): Date {
  const [hours, minutes] = hhmm.split(":").map(Number);
  const date = new Date(1970, 0, 1, hours || 0, minutes || 0, 0, 0);
  return date;
}

function dateToTimeString(date: Date): string {
  const hh = String(date.getHours()).padStart(2, "0");
  const mm = String(date.getMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
}

/**
 * Lecture des paramètres — accessible à tout utilisateur authentifié
 * (nécessaire pour afficher les horaires officiels dans le dashboard),
 * mais jamais modifiable en dehors de updateSettings.
 */
export async function getSettings() {
  await requireUser();

  const settings = await prisma.settings.findUnique({ where: { id: SETTINGS_ID } });

  if (!settings) {
    return null;
  }

  return {
    ...settings,
    officialArrivalTime: dateToTimeString(settings.officialArrivalTime),
    officialDepartureTime: dateToTimeString(settings.officialDepartureTime),
  };
}

/**
 * Crée ou met à jour l'unique enregistrement Settings. Réservé au
 * SUPER_ADMIN (section 6).
 */
export async function updateSettings(input: UpdateSettingsInput): Promise<ActionResult> {
  try {
    await requireRole("SUPER_ADMIN");

    if (
      !input.facilityName ||
      !input.address ||
      input.latitude === undefined ||
      input.longitude === undefined ||
      input.gpsRadius === undefined ||
      !input.officialArrivalTime ||
      input.arrivalTolerance === undefined ||
      !input.officialDepartureTime
    ) {
      return { success: false, message: "Tous les champs sont requis" };
    }

    if (input.latitude < -90 || input.latitude > 90) {
      return { success: false, message: "Latitude invalide" };
    }

    if (input.longitude < -180 || input.longitude > 180) {
      return { success: false, message: "Longitude invalide" };
    }

    if (input.gpsRadius <= 0) {
      return { success: false, message: "Le rayon GPS doit être positif" };
    }

    if (input.arrivalTolerance < 0) {
      return { success: false, message: "La tolérance ne peut pas être négative" };
    }

    const data = {
      facilityName: input.facilityName,
      address: input.address,
      latitude: input.latitude,
      longitude: input.longitude,
      gpsRadius: input.gpsRadius,
      officialArrivalTime: timeStringToDate(input.officialArrivalTime),
      arrivalTolerance: input.arrivalTolerance,
      officialDepartureTime: timeStringToDate(input.officialDepartureTime),
    };

    await prisma.settings.upsert({
      where: { id: SETTINGS_ID },
      create: { id: SETTINGS_ID, ...data },
      update: data,
    });

    revalidatePath("/settings");
    revalidatePath("/dashboard");
    return { success: true, message: "Paramètres mis à jour avec succès" };
  } catch (error) {
    console.error("updateSettings error:", error);
    return { success: false, message: "Une erreur est survenue" };
  }
}
