// ID fixe et connu pour l'unique enregistrement Settings de l'établissement
// (section 6 du cahier des charges : un seul enregistrement Settings).
// Utilisé à la fois par prisma/seed.ts et src/actions/settings.ts pour
// être certain de toujours lire/écrire la même ligne.
export const SETTINGS_ID = "facility-settings-singleton";
