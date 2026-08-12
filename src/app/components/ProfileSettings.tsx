import { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { User, Lock, Bell, Shield, Palette, Receipt, Upload, FileCheck2, Info, Globe2, MapPin, Camera, Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Switch } from "./ui/switch";
import { getAuthToken, publicAnonKey, refreshStoredSession, resolvePsychologistProfileId, supabaseRest, supabaseUrl, updateSupabaseAuthPassword } from "../../services/api";
import {
  getCalendarModalityColors,
  saveCalendarModalityColors,
  type CalendarModalityColors,
} from "../utils/calendarColors";

interface ProfileSettingsProps {
  currentUser: {
    id: string;
    name: string;
    role: string;
    avatar?: string;
    email?: string;
    phone?: string;
  };
  onUserUpdated?: (updates: { nombre?: string; apellido?: string; telefono?: string; foto_perfil?: string }) => void;
}

function splitFullName(value: string) {
  const parts = value.trim().split(/\s+/).filter(Boolean);
  if (parts.length <= 1) return { nombre: parts[0] || "", apellido: "" };
  return {
    nombre: parts.slice(0, -1).join(" "),
    apellido: parts.slice(-1).join(" "),
  };
}

type PublicProfileForm = {
  psychologistId: string;
  photoUrl: string;
  visible: boolean;
  acceptsNewPatients: boolean;
  license: string;
  focus: string;
  biography: string;
  specialtiesText: string;
  experienceYears: string;
  privateRate: string;
  sessionDuration: string;
  presencial: boolean;
  virtual: boolean;
  officeSummary: string;
  services: PublicServiceForm[];
};

type PublicServiceForm = {
  id?: string;
  name: string;
  description: string;
  duration: string;
  price: string;
  modality: "presencial" | "virtual" | "ambas";
  visible: boolean;
};

const emptyPublicProfile: PublicProfileForm = {
  psychologistId: "",
  photoUrl: "",
  visible: true,
  acceptsNewPatients: true,
  license: "",
  focus: "",
  biography: "",
  specialtiesText: "",
  experienceYears: "",
  privateRate: "",
  sessionDuration: "50",
  presencial: true,
  virtual: true,
  officeSummary: "Sin consultorio principal publicado",
  services: [],
};

const defaultServiceOptions: PublicServiceForm[] = [
  {
    name: "Terapia individual",
    description: "Sesión clínica para trabajar objetivos personales.",
    duration: "50",
    price: "",
    modality: "ambas",
    visible: true,
  },
  {
    name: "Terapia de pareja",
    description: "Acompañamiento para comunicación, acuerdos y vínculo.",
    duration: "60",
    price: "",
    modality: "presencial",
    visible: true,
  },
];

function createEmptyService(): PublicServiceForm {
  return {
    name: "",
    description: "",
    duration: "50",
    price: "",
    modality: "ambas",
    visible: true,
  };
}

const PROFILE_PHOTOS_BUCKET = "perfil-fotos";
const MAX_PROFILE_PHOTO_SIZE = 5 * 1024 * 1024;

function getInitials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function buildProfilePhotoPath(userId: string, file: File) {
  const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const cleanExtension = ["jpg", "jpeg", "png", "webp"].includes(extension) ? extension : "jpg";
  const uniqueId = typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}`;

  return `${userId}/${uniqueId}.${cleanExtension}`;
}

async function verifyCurrentPassword(email: string, password: string) {
  const response = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: {
      apikey: publicAnonKey,
      Authorization: `Bearer ${publicAnonKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    throw new Error("La contraseña actual no es correcta.");
  }
}

export function ProfileSettings({ currentUser, onUserUpdated }: ProfileSettingsProps) {
  const isPsychologist = currentUser.role.toLowerCase().includes("psic");
  const [profileData, setProfileData] = useState({
    name: currentUser.name,
    email: currentUser.email || "",
    phone: currentUser.phone || "",
    photoUrl: currentUser.avatar || "",
    specialty: "Administración General",
  });

  const [passwordData, setPasswordData] = useState({
    current: "",
    new: "",
    confirm: "",
  });

  const [notifications, setNotifications] = useState({
    email: true,
    sms: false,
    appointments: true,
    payments: true,
    reports: false,
  });

  const [calendarColors, setCalendarColors] = useState<CalendarModalityColors>(() =>
    getCalendarModalityColors(currentUser.id)
  );

  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [uploadingProfilePhoto, setUploadingProfilePhoto] = useState(false);
  const [publicProfile, setPublicProfile] = useState<PublicProfileForm>(emptyPublicProfile);
  const [loadingPublicProfile, setLoadingPublicProfile] = useState(false);
  const [savingPublicProfile, setSavingPublicProfile] = useState(false);
  const profilePhotoInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!isPsychologist) return;
    let active = true;

    async function loadPublicProfile() {
      setLoadingPublicProfile(true);
      try {
        const psychologistId = await resolvePsychologistProfileId(currentUser.id);
        if (!psychologistId) return;

        const [profiles, relations, services] = await Promise.all([
          supabaseRest<Array<{
            id: string;
            cedula_profesional: string | null;
            especialidades: string[] | null;
            enfoque_principal: string | null;
            biografia: string | null;
            anos_experiencia: number | null;
            tarifa_privada_centavos: number | null;
            duracion_sesion_minutos: number | null;
            modalidades: string[] | null;
            acepta_nuevos_pacientes: boolean | null;
            visible_directorio: boolean | null;
          }>>(
            `/psicologos?id=eq.${psychologistId}&select=id,cedula_profesional,especialidades,enfoque_principal,biografia,anos_experiencia,tarifa_privada_centavos,duracion_sesion_minutos,modalidades,acepta_nuevos_pacientes,visible_directorio&limit=1`
          ),
          supabaseRest<Array<{
            es_principal: boolean;
            consultorios?: {
              colonia?: string | null;
              municipio?: string | null;
              estado_region?: string | null;
              latitud?: number | null;
              longitud?: number | null;
              fotos_urls?: string[] | null;
            } | null;
          }>>(
            `/psicologo_consultorios?psicologo_id=eq.${psychologistId}&select=es_principal,consultorios(colonia,municipio,estado_region,latitud,longitud,fotos_urls)&order=es_principal.desc&limit=1`
          ),
          supabaseRest<Array<{
            id: string;
            nombre: string;
            descripcion: string | null;
            duracion_minutos: number | null;
            precio_centavos: number | null;
            modalidad: "presencial" | "virtual" | "ambas" | null;
            visible_directorio: boolean | null;
          }>>(
            `/psicologo_servicios?psicologo_id=eq.${psychologistId}&select=id,nombre,descripcion,duracion_minutos,precio_centavos,modalidad,visible_directorio&order=orden.asc,nombre.asc`
          ).catch(() => []),
        ]);

        if (!active || !profiles[0]) return;
        const profile = profiles[0];
        const office = relations[0]?.consultorios;
        const officeParts = [office?.colonia, office?.municipio, office?.estado_region].filter(Boolean);

        setPublicProfile({
          psychologistId,
          photoUrl: profileData.photoUrl || "",
          visible: profile.visible_directorio !== false,
          acceptsNewPatients: profile.acepta_nuevos_pacientes !== false,
          license: profile.cedula_profesional || "",
          focus: profile.enfoque_principal || "",
          biography: profile.biografia || "",
          specialtiesText: (profile.especialidades || []).join("\n"),
          experienceYears: profile.anos_experiencia == null ? "" : String(profile.anos_experiencia),
          privateRate: profile.tarifa_privada_centavos == null ? "" : String(Math.round(profile.tarifa_privada_centavos / 100)),
          sessionDuration: profile.duracion_sesion_minutos == null ? "50" : String(profile.duracion_sesion_minutos),
          presencial: (profile.modalidades || []).includes("presencial"),
          virtual: (profile.modalidades || []).includes("virtual"),
          officeSummary: officeParts.length
            ? `${officeParts.join(", ")} · Pin ${office?.latitud && office?.longitud ? "confirmado" : "pendiente"} · ${office?.fotos_urls?.length || 0} fotos`
            : "Sin consultorio principal publicado",
          services: services.length
            ? services.map((service) => ({
                id: service.id,
                name: service.nombre || "",
                description: service.descripcion || "",
                duration: service.duracion_minutos == null ? "50" : String(service.duracion_minutos),
                price: service.precio_centavos == null ? "" : String(Math.round(service.precio_centavos / 100)),
                modality: service.modalidad || "ambas",
                visible: service.visible_directorio !== false,
              }))
            : defaultServiceOptions.map((service) => ({
                ...service,
                price: profile.tarifa_privada_centavos ? String(Math.round(profile.tarifa_privada_centavos / 100)) : "",
                duration: profile.duracion_sesion_minutos ? String(profile.duracion_sesion_minutos) : service.duration,
              })),
        });
      } catch (error) {
        console.error("Load public profile error:", error);
        toast.error("No se pudo cargar tu perfil público.");
      } finally {
        if (active) setLoadingPublicProfile(false);
      }
    }

    loadPublicProfile();

    return () => {
      active = false;
    };
  }, [currentUser.id, isPsychologist]);

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const { nombre, apellido } = splitFullName(profileData.name);

    if (!nombre) {
      toast.error("Escribe tu nombre.");
      return;
    }

    setSavingProfile(true);

    try {
      await supabaseRest(`/usuarios?id=eq.${currentUser.id}`, {
        method: "PATCH",
        headers: { Prefer: "return=representation" },
        body: JSON.stringify({
          nombre,
          apellido,
          telefono: profileData.phone || null,
          foto_perfil_url: profileData.photoUrl || null,
          updated_at: new Date().toISOString(),
        }),
      });

      onUserUpdated?.({ nombre, apellido, telefono: profileData.phone, foto_perfil: profileData.photoUrl });
      toast.success("Perfil actualizado exitosamente");
    } catch (error) {
      console.error("Update profile error:", error);
      toast.error("No se pudo actualizar tu perfil en Supabase.");
    } finally {
      setSavingProfile(false);
    }
  };

  const saveProfilePhotoUrl = async (photoUrl: string) => {
    await supabaseRest(`/usuarios?id=eq.${currentUser.id}`, {
      method: "PATCH",
      headers: { Prefer: "return=representation" },
      body: JSON.stringify({
        foto_perfil_url: photoUrl,
        updated_at: new Date().toISOString(),
      }),
    });

    setProfileData((current) => ({ ...current, photoUrl }));
    setPublicProfile((current) => ({ ...current, photoUrl }));
    onUserUpdated?.({ foto_perfil: photoUrl });
  };

  const handleProfilePhotoSelected = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Selecciona una imagen válida.");
      return;
    }

    if (file.size > MAX_PROFILE_PHOTO_SIZE) {
      toast.error("La imagen debe pesar menos de 5 MB.");
      return;
    }

    setUploadingProfilePhoto(true);

    try {
      const filePath = buildProfilePhotoPath(currentUser.id, file);
      const uploadPhoto = (token: string) => fetch(`${supabaseUrl}/storage/v1/object/${PROFILE_PHOTOS_BUCKET}/${filePath}`, {
        method: "POST",
        headers: {
          apikey: publicAnonKey,
          Authorization: `Bearer ${token}`,
          "Content-Type": file.type || "image/jpeg",
          "x-upsert": "true",
        },
        body: file,
      });

      let response = await uploadPhoto(getAuthToken());
      if (response.status === 401) {
        const freshToken = await refreshStoredSession();
        response = await uploadPhoto(freshToken);
      }

      if (!response.ok) {
        const detail = await response.text();
        throw new Error(detail || "No se pudo subir la imagen.");
      }

      const publicUrl = `${supabaseUrl}/storage/v1/object/public/${PROFILE_PHOTOS_BUCKET}/${filePath}`;
      await saveProfilePhotoUrl(publicUrl);
      toast.success("Foto de perfil actualizada.");
    } catch (error: any) {
      console.error("Upload profile photo error:", error);
      toast.error(`No se pudo subir la foto. ${error?.message || ""}`);
    } finally {
      setUploadingProfilePhoto(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!passwordData.current || !passwordData.new || !passwordData.confirm) {
      toast.error("Complete todos los campos");
      return;
    }

    if (passwordData.new !== passwordData.confirm) {
      toast.error("Las contraseñas no coinciden");
      return;
    }

    if (passwordData.new.length < 8) {
      toast.error("La contraseña debe tener al menos 8 caracteres");
      return;
    }

    setSavingPassword(true);

    try {
      if (currentUser.email) {
        await verifyCurrentPassword(currentUser.email, passwordData.current);
      }
      await updateSupabaseAuthPassword(passwordData.new);
      toast.success("Contraseña actualizada exitosamente");
      setPasswordData({ current: "", new: "", confirm: "" });
    } catch (error) {
      console.error("Update password error:", error);
      toast.error("No se pudo actualizar la contraseña en Supabase.");
    } finally {
      setSavingPassword(false);
    }
  };

  const handleNotificationsSubmit = () => {
    console.log("Updating notifications:", notifications);
    toast.success("Preferencias de notificaciones actualizadas");
  };

  const handleCalendarColorsSubmit = () => {
    saveCalendarModalityColors(currentUser.id, calendarColors);
    toast.success("Colores del calendario actualizados");
  };

  const handlePublicProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!publicProfile.psychologistId) {
      toast.error("Tu usuario no tiene perfil de psicólogo vinculado.");
      return;
    }

    setSavingPublicProfile(true);

    try {
      const specialties = publicProfile.specialtiesText
        .split("\n")
        .map((item) => item.trim())
        .filter(Boolean);
      const modalities = [
        publicProfile.presencial ? "presencial" : "",
        publicProfile.virtual ? "virtual" : "",
      ].filter(Boolean);
      const servicePayload = publicProfile.services
        .map((service, index) => ({
          psicologo_id: publicProfile.psychologistId,
          nombre: service.name.trim(),
          descripcion: service.description.trim() || null,
          duracion_minutos: service.duration ? Number(service.duration) : 50,
          precio_centavos: service.price ? Math.round(Number(service.price) * 100) : null,
          modalidad: service.modality,
          visible_directorio: service.visible,
          orden: index + 1,
        }))
        .filter((service) => service.nombre);

      await Promise.all([
        supabaseRest(`/usuarios?id=eq.${currentUser.id}`, {
          method: "PATCH",
          headers: { Prefer: "return=representation" },
          body: JSON.stringify({
            foto_perfil_url: publicProfile.photoUrl || null,
            telefono: profileData.phone || null,
            updated_at: new Date().toISOString(),
          }),
        }),
        supabaseRest(`/psicologo_servicios?psicologo_id=eq.${publicProfile.psychologistId}`, {
          method: "DELETE",
          headers: { Prefer: "return=representation" },
        }),
      ]);

      if (servicePayload.length) {
        await supabaseRest("/psicologo_servicios", {
          method: "POST",
          headers: { Prefer: "return=representation" },
          body: JSON.stringify(servicePayload),
        });
      }

      await Promise.all([
        supabaseRest(`/psicologos?id=eq.${publicProfile.psychologistId}`, {
          method: "PATCH",
          headers: { Prefer: "return=representation" },
          body: JSON.stringify({
            visible_directorio: publicProfile.visible,
            acepta_nuevos_pacientes: publicProfile.acceptsNewPatients,
            cedula_profesional: publicProfile.license || `PENDIENTE-${publicProfile.psychologistId}`,
            enfoque_principal: publicProfile.focus || null,
            biografia: publicProfile.biography || null,
            especialidades: specialties,
            anos_experiencia: publicProfile.experienceYears ? Number(publicProfile.experienceYears) : null,
            tarifa_privada_centavos: publicProfile.privateRate ? Math.round(Number(publicProfile.privateRate) * 100) : null,
            duracion_sesion_minutos: publicProfile.sessionDuration ? Number(publicProfile.sessionDuration) : 50,
            modalidades: modalities,
            updated_at: new Date().toISOString(),
          }),
        }),
      ]);

      setProfileData((current) => ({ ...current, photoUrl: publicProfile.photoUrl }));
      onUserUpdated?.({ foto_perfil: publicProfile.photoUrl });
      toast.success("Perfil público actualizado");
    } catch (error: any) {
      console.error("Save public profile error:", error);
      toast.error(`No se pudo guardar el perfil público. ${error?.message || ""}`);
    } finally {
      setSavingPublicProfile(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-foreground mb-1">Mi Perfil</h1>
        <p className="text-muted-foreground">
          Gestiona tu información personal y preferencias
        </p>
      </div>

      {/* Profile Header Card */}
      <Card className="border-border">
        <CardContent className="p-6">
          <div className="flex items-center gap-6">
            <input
              ref={profilePhotoInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
              onChange={handleProfilePhotoSelected}
            />
            <button
              type="button"
              onClick={() => profilePhotoInputRef.current?.click()}
              className="group relative rounded-full focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:cursor-not-allowed"
              disabled={uploadingProfilePhoto}
              aria-label="Cambiar foto de perfil"
            >
              <Avatar className="w-24 h-24 border border-primary/20">
                <AvatarImage src={profileData.photoUrl} />
                <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                  {getInitials(currentUser.name)}
                </AvatarFallback>
              </Avatar>
              <span className="absolute inset-0 flex items-center justify-center rounded-full bg-foreground/45 text-background opacity-0 transition-opacity group-hover:opacity-100">
                {uploadingProfilePhoto ? (
                  <Loader2 className="h-7 w-7 animate-spin" />
                ) : (
                  <Camera className="h-7 w-7" />
                )}
              </span>
              <span className="absolute bottom-1 right-1 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm">
                {uploadingProfilePhoto ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Camera className="h-4 w-4" />
                )}
              </span>
            </button>
            <div className="flex-1">
              <h2 className="text-foreground mb-1">{currentUser.name}</h2>
              <p className="text-muted-foreground mb-3">{currentUser.role}</p>
              <p className="text-sm text-muted-foreground">
                {isPsychologist ? "Tu foto se usará en el directorio público." : "Información de tu cuenta."}
              </p>
              <Button
                type="button"
                variant="outline"
                className="mt-4 gap-2"
                onClick={() => profilePhotoInputRef.current?.click()}
                disabled={uploadingProfilePhoto}
              >
                {uploadingProfilePhoto ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4" />
                )}
                {uploadingProfilePhoto ? "Subiendo..." : "Cambiar foto"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="personal" className="space-y-6">
        <TabsList className={`grid w-full max-w-6xl ${isPsychologist ? "grid-cols-6" : "grid-cols-5"}`}>
          <TabsTrigger value="personal" className="gap-2">
            <User className="w-4 h-4" />
            Información Personal
          </TabsTrigger>
          {isPsychologist && (
            <TabsTrigger value="public-profile" className="gap-2">
              <Globe2 className="w-4 h-4" />
              Perfil público
            </TabsTrigger>
          )}
          <TabsTrigger value="security" className="gap-2">
            <Lock className="w-4 h-4" />
            Seguridad
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-2">
            <Bell className="w-4 h-4" />
            Notificaciones
          </TabsTrigger>
          <TabsTrigger value="settings" className="gap-2">
            <Palette className="w-4 h-4" />
            Configuración
          </TabsTrigger>
          <TabsTrigger value="fiscal" className="gap-2">
            <Receipt className="w-4 h-4" />
            Fiscal
          </TabsTrigger>
        </TabsList>

        {/* Personal Information */}
        <TabsContent value="personal">
          <Card className="border-border">
            <CardHeader>
              <CardTitle>Información Personal</CardTitle>
              <CardDescription>
                Actualiza tu información de contacto y datos profesionales
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleProfileSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nombre Completo</Label>
                    <Input
                      id="name"
                      value={profileData.name}
                      onChange={(e) =>
                        setProfileData({ ...profileData, name: e.target.value })
                      }
                      className="bg-input-background"
                      disabled={savingProfile}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={profileData.email}
                      className="bg-input-background"
                      disabled
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone">Teléfono</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={profileData.phone}
                      onChange={(e) =>
                        setProfileData({ ...profileData, phone: e.target.value })
                      }
                      className="bg-input-background"
                      disabled={savingProfile}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="specialty">Especialidad / Rol</Label>
                    <Input
                      id="specialty"
                      value={profileData.specialty}
                      onChange={(e) =>
                        setProfileData({
                          ...profileData,
                          specialty: e.target.value,
                        })
                      }
                      className="bg-input-background"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between gap-4 rounded-2xl border border-border bg-card p-4">
                  <div>
                    <Label>Foto de perfil pública</Label>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Selecciona la imagen circular de arriba o usa este botón para cambiarla.
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    className="gap-2"
                    onClick={() => profilePhotoInputRef.current?.click()}
                    disabled={savingProfile || uploadingProfilePhoto}
                  >
                    {uploadingProfilePhoto ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Upload className="h-4 w-4" />
                    )}
                    {uploadingProfilePhoto ? "Subiendo..." : "Subir foto"}
                  </Button>
                </div>

                <div className="pt-4">
                  <Button
                    type="submit"
                    className="bg-primary text-primary-foreground hover:bg-primary/90"
                    disabled={savingProfile}
                  >
                    {savingProfile ? "Guardando..." : "Guardar Cambios"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {isPsychologist && (
          <TabsContent value="public-profile">
            <form onSubmit={handlePublicProfileSubmit} className="space-y-6">
              <Card className="border-border">
                <CardHeader>
                  <CardTitle>Perfil público en directorio</CardTitle>
                  <CardDescription>
                    Esta información alimenta tu perfil público para que personas externas puedan encontrarte y contactarte.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {loadingPublicProfile ? (
                    <div className="rounded-xl bg-muted/40 p-6 text-sm text-muted-foreground">
                      Cargando perfil público...
                    </div>
                  ) : (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex items-center justify-between rounded-xl border border-border p-4">
                          <div>
                            <p className="text-sm text-foreground">Aparecer en directorio</p>
                            <p className="text-xs text-muted-foreground">Permite mostrar tu perfil a personas sin cuenta.</p>
                          </div>
                          <Switch
                            checked={publicProfile.visible}
                            onCheckedChange={(checked) => setPublicProfile({ ...publicProfile, visible: checked })}
                          />
                        </div>
                        <div className="flex items-center justify-between rounded-xl border border-border p-4">
                          <div>
                            <p className="text-sm text-foreground">Acepto nuevos pacientes</p>
                            <p className="text-xs text-muted-foreground">Si está apagado, tu perfil no se listará como disponible.</p>
                          </div>
                          <Switch
                            checked={publicProfile.acceptsNewPatients}
                            onCheckedChange={(checked) => setPublicProfile({ ...publicProfile, acceptsNewPatients: checked })}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Foto pública</Label>
                          <div className="flex items-center gap-4 rounded-2xl border border-border bg-card p-4">
                            <button
                              type="button"
                              onClick={() => profilePhotoInputRef.current?.click()}
                              className="group relative rounded-full focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                              disabled={uploadingProfilePhoto}
                              aria-label="Cambiar foto pública"
                            >
                              <Avatar className="h-16 w-16 border border-primary/20">
                                <AvatarImage src={publicProfile.photoUrl || profileData.photoUrl} />
                                <AvatarFallback className="bg-primary text-primary-foreground">
                                  {getInitials(profileData.name || currentUser.name)}
                                </AvatarFallback>
                              </Avatar>
                              <span className="absolute bottom-0 right-0 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm">
                                {uploadingProfilePhoto ? (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                  <Camera className="h-3.5 w-3.5" />
                                )}
                              </span>
                            </button>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm text-foreground">Imagen del directorio</p>
                              <p className="mt-1 text-xs text-muted-foreground">
                                Se muestra en tu tarjeta pública y en el detalle del perfil.
                              </p>
                            </div>
                            <Button
                              type="button"
                              variant="outline"
                              className="gap-2"
                              onClick={() => profilePhotoInputRef.current?.click()}
                              disabled={uploadingProfilePhoto}
                            >
                              {uploadingProfilePhoto ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Upload className="h-4 w-4" />
                              )}
                              {uploadingProfilePhoto ? "Subiendo..." : "Cambiar"}
                            </Button>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label>Cédula profesional</Label>
                          <Input
                            value={publicProfile.license}
                            onChange={(event) => setPublicProfile({ ...publicProfile, license: event.target.value })}
                            placeholder="12345678"
                            className="bg-input-background"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Enfoque principal</Label>
                          <Input
                            value={publicProfile.focus}
                            onChange={(event) => setPublicProfile({ ...publicProfile, focus: event.target.value })}
                            placeholder="Terapia cognitivo-conductual, terapia familiar..."
                            className="bg-input-background"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Años de experiencia</Label>
                          <Input
                            type="number"
                            min="0"
                            value={publicProfile.experienceYears}
                            onChange={(event) => setPublicProfile({ ...publicProfile, experienceYears: event.target.value })}
                            className="bg-input-background"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Tarifa por sesión</Label>
                          <Input
                            type="number"
                            min="0"
                            value={publicProfile.privateRate}
                            onChange={(event) => setPublicProfile({ ...publicProfile, privateRate: event.target.value })}
                            placeholder="800"
                            className="bg-input-background"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Duración de sesión</Label>
                          <Input
                            type="number"
                            min="30"
                            value={publicProfile.sessionDuration}
                            onChange={(event) => setPublicProfile({ ...publicProfile, sessionDuration: event.target.value })}
                            className="bg-input-background"
                          />
                        </div>
                      </div>

                      <div className="space-y-4 rounded-2xl border border-border bg-card p-4">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <Label>Servicios y precios públicos</Label>
                            <p className="mt-1 text-xs text-muted-foreground">
                              Estos servicios aparecerán en tu perfil del directorio.
                            </p>
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            className="gap-2"
                            onClick={() =>
                              setPublicProfile({
                                ...publicProfile,
                                services: [...publicProfile.services, createEmptyService()],
                              })
                            }
                          >
                            <Plus className="h-4 w-4" />
                            Agregar servicio
                          </Button>
                        </div>

                        <div className="space-y-3">
                          {publicProfile.services.length === 0 ? (
                            <div className="rounded-xl bg-muted/40 p-4 text-sm text-muted-foreground">
                              Aún no tienes servicios. Agrega opciones como terapia individual, de pareja o familiar.
                            </div>
                          ) : (
                            publicProfile.services.map((service, index) => (
                              <div key={`${service.id || "new"}-${index}`} className="rounded-xl border border-border bg-background p-4">
                                <div className="mb-4 flex items-center justify-between gap-3">
                                  <div>
                                    <p className="text-sm text-foreground">Servicio {index + 1}</p>
                                    <p className="text-xs text-muted-foreground">
                                      {service.visible ? "Visible en directorio" : "Oculto al público"}
                                    </p>
                                  </div>
                                  <div className="flex items-center gap-3">
                                    <Switch
                                      checked={service.visible}
                                      onCheckedChange={(checked) => {
                                        const services = [...publicProfile.services];
                                        services[index] = { ...service, visible: checked };
                                        setPublicProfile({ ...publicProfile, services });
                                      }}
                                    />
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="icon"
                                      className="text-destructive hover:text-destructive"
                                      onClick={() =>
                                        setPublicProfile({
                                          ...publicProfile,
                                          services: publicProfile.services.filter((_, serviceIndex) => serviceIndex !== index),
                                        })
                                      }
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </div>

                                <div className="grid grid-cols-1 gap-3 md:grid-cols-12">
                                  <div className="space-y-2 md:col-span-4">
                                    <Label>Nombre</Label>
                                    <Input
                                      value={service.name}
                                      onChange={(event) => {
                                        const services = [...publicProfile.services];
                                        services[index] = { ...service, name: event.target.value };
                                        setPublicProfile({ ...publicProfile, services });
                                      }}
                                      placeholder="Terapia individual"
                                      className="bg-input-background"
                                    />
                                  </div>
                                  <div className="space-y-2 md:col-span-2">
                                    <Label>Precio</Label>
                                    <Input
                                      type="number"
                                      min="0"
                                      value={service.price}
                                      onChange={(event) => {
                                        const services = [...publicProfile.services];
                                        services[index] = { ...service, price: event.target.value };
                                        setPublicProfile({ ...publicProfile, services });
                                      }}
                                      placeholder="800"
                                      className="bg-input-background"
                                    />
                                  </div>
                                  <div className="space-y-2 md:col-span-2">
                                    <Label>Min</Label>
                                    <Input
                                      type="number"
                                      min="30"
                                      value={service.duration}
                                      onChange={(event) => {
                                        const services = [...publicProfile.services];
                                        services[index] = { ...service, duration: event.target.value };
                                        setPublicProfile({ ...publicProfile, services });
                                      }}
                                      className="bg-input-background"
                                    />
                                  </div>
                                  <div className="space-y-2 md:col-span-4">
                                    <Label>Modalidad</Label>
                                    <select
                                      value={service.modality}
                                      onChange={(event) => {
                                        const services = [...publicProfile.services];
                                        services[index] = { ...service, modality: event.target.value as PublicServiceForm["modality"] };
                                        setPublicProfile({ ...publicProfile, services });
                                      }}
                                      className="h-10 w-full rounded-md border border-input bg-input-background px-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
                                    >
                                      <option value="ambas">Presencial y en línea</option>
                                      <option value="presencial">Presencial</option>
                                      <option value="virtual">En línea</option>
                                    </select>
                                  </div>
                                  <div className="space-y-2 md:col-span-12">
                                    <Label>Descripción breve</Label>
                                    <Input
                                      value={service.description}
                                      onChange={(event) => {
                                        const services = [...publicProfile.services];
                                        services[index] = { ...service, description: event.target.value };
                                        setPublicProfile({ ...publicProfile, services });
                                      }}
                                      placeholder="Ideal para ansiedad, estrés, autoestima o procesos personales."
                                      className="bg-input-background"
                                    />
                                  </div>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>Biografía pública</Label>
                        <Textarea
                          value={publicProfile.biography}
                          onChange={(event) => setPublicProfile({ ...publicProfile, biography: event.target.value })}
                          placeholder="Cuéntale a futuros pacientes cómo trabajas, a quién ayudas y qué pueden esperar de una primera sesión."
                          className="bg-input-background min-h-[140px]"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Especialidades</Label>
                        <Textarea
                          value={publicProfile.specialtiesText}
                          onChange={(event) => setPublicProfile({ ...publicProfile, specialtiesText: event.target.value })}
                          placeholder={"Ansiedad\nDepresión\nTerapia de pareja"}
                          className="bg-input-background min-h-[110px]"
                        />
                        <p className="text-xs text-muted-foreground">Una especialidad por línea.</p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="rounded-xl border border-border p-4 space-y-3">
                          <Label>Modalidades publicadas</Label>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-foreground">Presencial</span>
                            <Switch
                              checked={publicProfile.presencial}
                              onCheckedChange={(checked) => setPublicProfile({ ...publicProfile, presencial: checked })}
                            />
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-foreground">En línea</span>
                            <Switch
                              checked={publicProfile.virtual}
                              onCheckedChange={(checked) => setPublicProfile({ ...publicProfile, virtual: checked })}
                            />
                          </div>
                        </div>
                        <div className="rounded-xl border border-border p-4">
                          <div className="flex items-start gap-3">
                            <MapPin className="w-5 h-5 text-primary mt-0.5" />
                            <div>
                              <p className="text-sm text-foreground">Consultorio principal</p>
                              <p className="text-sm text-muted-foreground mt-1">{publicProfile.officeSummary}</p>
                              <p className="text-xs text-muted-foreground mt-3">
                                La dirección, fotos y pin se configuran desde Consultorios. En público solo se muestra colonia, ciudad, estado y ubicación aproximada.
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex justify-end">
                        <Button
                          type="submit"
                          className="bg-primary text-primary-foreground hover:bg-primary/90"
                          disabled={savingPublicProfile}
                        >
                          {savingPublicProfile ? "Guardando..." : "Guardar perfil público"}
                        </Button>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </form>
          </TabsContent>
        )}

        {/* Security */}
        <TabsContent value="security">
          <Card className="border-border">
            <CardHeader>
              <CardTitle>Cambiar Contraseña</CardTitle>
              <CardDescription>
                Asegúrate de usar una contraseña segura de al menos 8 caracteres
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePasswordSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="current-password">Contraseña Actual</Label>
                  <Input
                    id="current-password"
                    type="password"
                    value={passwordData.current}
                    onChange={(e) =>
                      setPasswordData({ ...passwordData, current: e.target.value })
                    }
                    className="bg-input-background"
                    disabled={savingPassword}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="new-password">Nueva Contraseña</Label>
                  <Input
                    id="new-password"
                    type="password"
                    value={passwordData.new}
                    onChange={(e) =>
                      setPasswordData({ ...passwordData, new: e.target.value })
                    }
                    className="bg-input-background"
                    disabled={savingPassword}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirmar Nueva Contraseña</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    value={passwordData.confirm}
                    onChange={(e) =>
                      setPasswordData({ ...passwordData, confirm: e.target.value })
                    }
                    className="bg-input-background"
                    disabled={savingPassword}
                  />
                </div>

                <div className="pt-4">
                  <Button
                    type="submit"
                    className="bg-primary text-primary-foreground hover:bg-primary/90"
                    disabled={savingPassword}
                  >
                    {savingPassword ? "Actualizando..." : "Actualizar Contraseña"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <Card className="border-border mt-6">
            <CardHeader>
              <CardTitle>Autenticación de Dos Factores</CardTitle>
              <CardDescription>
                Agrega una capa adicional de seguridad a tu cuenta
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Shield className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-foreground">Autenticación de dos factores</p>
                    <p className="text-xs text-muted-foreground">
                      Actualmente desactivada
                    </p>
                  </div>
                </div>
                <Button variant="outline">Activar</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications */}
        <TabsContent value="notifications">
          <Card className="border-border">
            <CardHeader>
              <CardTitle>Preferencias de Notificaciones</CardTitle>
              <CardDescription>
                Elige cómo y cuándo quieres recibir notificaciones
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-sm text-muted-foreground">Canales de Comunicación</h3>
                
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-foreground">Notificaciones por Email</p>
                    <p className="text-xs text-muted-foreground">
                      Recibe actualizaciones por correo electrónico
                    </p>
                  </div>
                  <Switch
                    checked={notifications.email}
                    onCheckedChange={(checked) =>
                      setNotifications({ ...notifications, email: checked })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-foreground">Notificaciones por SMS</p>
                    <p className="text-xs text-muted-foreground">
                      Recibe alertas importantes por mensaje de texto
                    </p>
                  </div>
                  <Switch
                    checked={notifications.sms}
                    onCheckedChange={(checked) =>
                      setNotifications({ ...notifications, sms: checked })
                    }
                  />
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t border-border">
                <h3 className="text-sm text-muted-foreground">Tipos de Notificaciones</h3>
                
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-foreground">Citas</p>
                    <p className="text-xs text-muted-foreground">
                      Recordatorios de citas próximas y cambios
                    </p>
                  </div>
                  <Switch
                    checked={notifications.appointments}
                    onCheckedChange={(checked) =>
                      setNotifications({ ...notifications, appointments: checked })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-foreground">Pagos</p>
                    <p className="text-xs text-muted-foreground">
                      Confirmaciones de pagos recibidos
                    </p>
                  </div>
                  <Switch
                    checked={notifications.payments}
                    onCheckedChange={(checked) =>
                      setNotifications({ ...notifications, payments: checked })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-foreground">Reportes</p>
                    <p className="text-xs text-muted-foreground">
                      Reportes semanales y mensuales
                    </p>
                  </div>
                  <Switch
                    checked={notifications.reports}
                    onCheckedChange={(checked) =>
                      setNotifications({ ...notifications, reports: checked })
                    }
                  />
                </div>
              </div>

              <div className="pt-4">
                <Button
                  onClick={handleNotificationsSubmit}
                  className="bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  Guardar Preferencias
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings */}
        <TabsContent value="settings">
          <Card className="border-border">
            <CardHeader>
              <CardTitle>Configuración del Calendario</CardTitle>
              <CardDescription>
                Selecciona los colores para diferenciar citas presenciales y en línea.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-xl border border-border bg-card p-4 space-y-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <Label htmlFor="presencial-color">Color presencial</Label>
                      <p className="text-xs text-muted-foreground mt-1">
                        Se usará para citas en consultorio.
                      </p>
                    </div>
                    <Input
                      id="presencial-color"
                      type="color"
                      value={calendarColors.presencial}
                      onChange={(event) =>
                        setCalendarColors({ ...calendarColors, presencial: event.target.value })
                      }
                      className="h-11 w-16 cursor-pointer rounded-lg p-1"
                    />
                  </div>
                  <div
                    className="rounded-lg p-3 text-white shadow-sm"
                    style={{ backgroundColor: calendarColors.presencial }}
                  >
                    <p className="text-sm font-medium">Consulta presencial</p>
                    <p className="text-xs opacity-90">10:00 AM · Consultorio</p>
                  </div>
                </div>

                <div className="rounded-xl border border-border bg-card p-4 space-y-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <Label htmlFor="virtual-color">Color en línea</Label>
                      <p className="text-xs text-muted-foreground mt-1">
                        Se usará para videollamadas.
                      </p>
                    </div>
                    <Input
                      id="virtual-color"
                      type="color"
                      value={calendarColors.virtual}
                      onChange={(event) =>
                        setCalendarColors({ ...calendarColors, virtual: event.target.value })
                      }
                      className="h-11 w-16 cursor-pointer rounded-lg p-1"
                    />
                  </div>
                  <div
                    className="rounded-lg p-3 text-white shadow-sm"
                    style={{ backgroundColor: calendarColors.virtual }}
                  >
                    <p className="text-sm font-medium">Consulta en línea</p>
                    <p className="text-xs opacity-90">12:00 PM · Videollamada</p>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-border bg-muted/30 p-4">
                <p className="text-sm text-foreground mb-3">Vista previa en calendario</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div
                    className="rounded-lg p-3 text-white"
                    style={{ backgroundColor: calendarColors.presencial }}
                  >
                    <p className="text-xs opacity-80">09:00 AM</p>
                    <p className="text-sm font-medium">Paciente presencial</p>
                  </div>
                  <div
                    className="rounded-lg p-3 text-white"
                    style={{ backgroundColor: calendarColors.virtual }}
                  >
                    <p className="text-xs opacity-80">11:00 AM</p>
                    <p className="text-sm font-medium">Paciente en línea</p>
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <Button
                  type="button"
                  onClick={handleCalendarColorsSubmit}
                  className="bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  Guardar colores
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Fiscal Prototype */}
        <TabsContent value="fiscal">
          <div className="space-y-6">
            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Info className="w-5 h-5 text-primary mt-0.5" />
                  <div>
                    <p className="text-sm text-foreground">Información prototipada</p>
                    <p className="text-xs text-muted-foreground">
                      Esta pantalla es solo visual. Después se conectará a base de datos, storage privado y proveedor de timbrado CFDI.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border">
              <CardHeader>
                <CardTitle>Datos fiscales del emisor</CardTitle>
                <CardDescription>
                  Información fiscal que usaría el psicólogo para emitir facturas a sus pacientes.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>RFC</Label>
                    <Input className="bg-input-background" defaultValue="ROPE860911AB4" />
                  </div>
                  <div className="space-y-2">
                    <Label>Razón social / Nombre fiscal</Label>
                    <Input className="bg-input-background" defaultValue={currentUser.name.toUpperCase()} />
                  </div>
                  <div className="space-y-2">
                    <Label>Régimen fiscal</Label>
                    <Input className="bg-input-background" defaultValue="612 - Personas físicas con actividades empresariales y profesionales" />
                  </div>
                  <div className="space-y-2">
                    <Label>Código postal fiscal</Label>
                    <Input className="bg-input-background" defaultValue="44100" />
                  </div>
                  <div className="space-y-2">
                    <Label>Email fiscal</Label>
                    <Input className="bg-input-background" defaultValue={profileData.email} />
                  </div>
                  <div className="space-y-2">
                    <Label>Serie de facturación</Label>
                    <Input className="bg-input-background" defaultValue="PSI" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border">
              <CardHeader>
                <CardTitle>Certificados de sello digital</CardTitle>
                <CardDescription>
                  Para timbrar CFDI normalmente se usaría CSD: archivo .cer, archivo .key y contraseña.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[
                    ["Certificado .cer", "mindcare_demo.cer"],
                    ["Llave privada .key", "mindcare_demo.key"],
                    ["Contraseña CSD", "************"],
                  ].map(([label, value]) => (
                    <div key={label} className="rounded-xl border border-border bg-card p-4">
                      <div className="flex items-center justify-between gap-3 mb-3">
                        <p className="text-sm text-foreground">{label}</p>
                        <FileCheck2 className="w-4 h-4 text-primary" />
                      </div>
                      <p className="text-xs text-muted-foreground mb-3">{value}</p>
                      <Button type="button" variant="outline" size="sm" className="gap-2 w-full">
                        <Upload className="w-4 h-4" />
                        Subir archivo
                      </Button>
                    </div>
                  ))}
                </div>

                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                  <p className="text-sm text-amber-900">Pendiente de seguridad</p>
                  <p className="text-xs text-amber-800 mt-1">
                    Los certificados no deben guardarse en el frontend. Después se enviarán a storage privado y la contraseña se cifrará en backend.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border">
              <CardHeader>
                <CardTitle>Automatización de facturas a pacientes</CardTitle>
                <CardDescription>
                  Reglas visuales para emitir facturas individuales o cortes mensuales.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  ["Emitir factura al marcar cita como completada y pagada", true],
                  ["Agrupar citas del paciente en corte mensual", true],
                  ["Enviar PDF y XML por correo al paciente", true],
                  ["Revisar prefactura antes de timbrar", false],
                ].map(([label, checked]) => (
                  <div key={String(label)} className="flex items-center justify-between rounded-lg border border-border p-3">
                    <p className="text-sm text-foreground">{label}</p>
                    <Switch checked={Boolean(checked)} />
                  </div>
                ))}

                <div className="flex justify-end gap-2 pt-2">
                  <Button type="button" variant="outline">Probar conexión PAC</Button>
                  <Button type="button" className="bg-primary text-primary-foreground hover:bg-primary/90">
                    Guardar prototipo
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
