import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getSettings } from "@/actions/settings";
import { SettingsForm } from "@/components/settings/settings-form";

export default async function SettingsPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.role !== "SUPER_ADMIN") {
    redirect("/dashboard");
  }

  const settings = await getSettings();

  const initialValues = settings
    ? {
        facilityName: settings.facilityName,
        address: settings.address,
        latitude: String(settings.latitude),
        longitude: String(settings.longitude),
        gpsRadius: String(settings.gpsRadius),
        officialArrivalTime: settings.officialArrivalTime,
        arrivalTolerance: String(settings.arrivalTolerance),
        officialDepartureTime: settings.officialDepartureTime,
      }
    : null;

  return <SettingsForm initialValues={initialValues} />;
}
