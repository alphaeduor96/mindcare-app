import { useEffect, useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Textarea } from "./ui/textarea";
import { toast } from "sonner";
import { Checkbox } from "./ui/checkbox";
import { copomexToken, getAuthToken, googleMapsApiKey, publicAnonKey, resolvePsychologistProfileId, supabaseRest, supabaseUrl } from "../../services/api";
import { ImagePlus, MapPin, Maximize2, Minus, Plus, Search, X } from "lucide-react";

export interface OfficeRow {
  id: string;
  nombre: string;
  direccion: string;
  colonia?: string | null;
  municipio: string;
  estado_region: string;
  codigo_postal?: string | null;
  latitud?: number | null;
  longitud?: number | null;
  telefono?: string | null;
  descripcion?: string | null;
  amenidades: string[];
  fotos_urls?: string[];
  estado: "activo" | "inactivo" | "pendiente" | "suspendido";
  created_at: string;
}

interface AddOfficeModalProps {
  isOpen: boolean;
  onClose: () => void;
  office?: OfficeRow | null;
  currentPsychologistId?: string;
  onSaved?: () => void;
}

const emptyForm = {
  nombre: "",
  direccion: "",
  colonia: "",
  municipio: "Guadalajara",
  estado_region: "Jalisco",
  codigo_postal: "",
  latitud: 20.6736,
  longitud: -103.344,
  telefono: "",
  descripcion: "",
  amenidades: [] as string[],
  fotos_urls: [] as string[],
  estado: "activo" as OfficeRow["estado"],
};

const amenityOptions = [
  { id: "escritorio", label: "Escritorio" },
  { id: "sofa_divan", label: "Sofá/Diván" },
  { id: "sillas", label: "Sillas" },
  { id: "pizarra", label: "Pizarra" },
  { id: "computadora", label: "Computadora" },
  { id: "aire_acondicionado", label: "Aire acondicionado" },
  { id: "wifi", label: "WiFi" },
  { id: "estacionamiento", label: "Estacionamiento" },
];

function officeToForm(office?: OfficeRow | null) {
  if (!office) return emptyForm;

  return {
    nombre: office.nombre || "",
    direccion: office.direccion || "",
    colonia: office.colonia || "",
    municipio: office.municipio || "Guadalajara",
    estado_region: office.estado_region || "Jalisco",
    codigo_postal: office.codigo_postal || "",
    latitud: Number(office.latitud || 20.6736),
    longitud: Number(office.longitud || -103.344),
    telefono: office.telefono || "",
    descripcion: office.descripcion || "",
    amenidades: office.amenidades || [],
    fotos_urls: office.fotos_urls || [],
    estado: office.estado || "activo",
  };
}

type LocationResult = {
  display_name: string;
  lat: string;
  lon: string;
  address?: {
    road?: string;
    house_number?: string;
    suburb?: string;
    neighbourhood?: string;
    city?: string;
    town?: string;
    municipality?: string;
    state?: string;
    postcode?: string;
  };
};

type GoogleGeocodeResult = {
  geometry?: { location?: { lat: number; lng: number } };
  postcode_localities?: string[];
  address_components?: Array<{
    long_name: string;
    short_name: string;
    types: string[];
  }>;
};

type PostalCodeOption = {
  colonia: string;
  ciudad: string;
  estado: string;
  latitud?: number;
  longitud?: number;
};

type CopomexRow = {
  response?: {
    asentamiento?: string;
    municipio?: string;
    estado?: string;
    ciudad?: string;
  };
};

const OFFICE_PHOTOS_BUCKET = "consultorio-fotos";
const MAP_CENTER = { lat: 20.6736, lng: -103.344 };

declare global {
  interface Window {
    google?: any;
  }
}

let googleMapsLoader: Promise<void> | null = null;

function loadGoogleMapsScript() {
  if (!googleMapsApiKey || window.google?.maps) return Promise.resolve();
  if (googleMapsLoader) return googleMapsLoader;

  googleMapsLoader = new Promise((resolve, reject) => {
    const existingScript = document.querySelector<HTMLScriptElement>("script[data-mindcare-google-maps]");
    if (existingScript) {
      existingScript.addEventListener("load", () => resolve());
      existingScript.addEventListener("error", () => reject(new Error("No se pudo cargar Google Maps.")));
      return;
    }

    const script = document.createElement("script");
    script.dataset.mindcareGoogleMaps = "true";
    script.async = true;
    script.defer = true;
    script.src = `https://maps.googleapis.com/maps/api/js?key=${googleMapsApiKey}&language=es-419&region=MX`;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("No se pudo cargar Google Maps."));
    document.head.appendChild(script);
  });

  return googleMapsLoader;
}

function uniquePostalOptions(options: PostalCodeOption[]) {
  const seen = new Set<string>();
  return options
    .map((option) => ({
      ...option,
      colonia: cleanPostalText(option.colonia),
      ciudad: cleanPostalText(option.ciudad),
      estado: cleanPostalText(option.estado),
    }))
    .filter((option) =>
      isLikelyPostalText(option.colonia) &&
      isLikelyPostalText(option.ciudad) &&
      isLikelyPostalText(option.estado)
    )
    .filter((option) => {
    const key = `${option.colonia.toLowerCase()}|${option.ciudad.toLowerCase()}|${option.estado.toLowerCase()}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return Boolean(option.colonia && option.ciudad && option.estado);
  });
}

function cleanPostalText(value = "") {
  return String(value)
    .replace(/\s+/g, " ")
    .trim();
}

function isLikelyPostalText(value = "") {
  const text = cleanPostalText(value);
  if (text.length < 3) return false;
  if (!/[aeiouáéíóúüñ]/i.test(text)) return false;
  if (/^[a-z0-9]{4,}$/i.test(text) && /\d/.test(text) && !/\s/.test(text)) return false;
  return true;
}

function GoogleOfficeMap({
  lat,
  lng,
  expanded,
  onChange,
}: {
  lat: number;
  lng: number;
  expanded: boolean;
  onChange: (coords: { lat: number; lng: number }) => void;
}) {
  const mapNodeRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);

  useEffect(() => {
    let mounted = true;

    loadGoogleMapsScript()
      .then(() => {
        if (!mounted || !mapNodeRef.current || !window.google?.maps) return;

        const position = { lat, lng };
        mapRef.current = new window.google.maps.Map(mapNodeRef.current, {
          center: position,
          zoom: 16,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: true,
          zoomControl: true,
          gestureHandling: "greedy",
        });

        markerRef.current = new window.google.maps.Marker({
          position,
          map: mapRef.current,
          draggable: true,
          title: "Ubicación aproximada del consultorio",
        });

        mapRef.current.addListener("click", (event: any) => {
          if (!event.latLng) return;
          const next = { lat: event.latLng.lat(), lng: event.latLng.lng() };
          markerRef.current.setPosition(next);
          onChange(next);
        });

        markerRef.current.addListener("dragend", () => {
          const position = markerRef.current.getPosition();
          if (!position) return;
          onChange({ lat: position.lat(), lng: position.lng() });
        });
      })
      .catch((error) => {
        console.error(error);
        toast.error("No se pudo cargar Google Maps.");
      });

    return () => {
      mounted = false;
    };
  }, [expanded]);

  useEffect(() => {
    const next = { lat, lng };
    if (mapRef.current) mapRef.current.setCenter(next);
    if (markerRef.current) markerRef.current.setPosition(next);
  }, [lat, lng]);

  return <div ref={mapNodeRef} className="h-full w-full" />;
}

export function AddOfficeModal({ isOpen, onClose, office, currentPsychologistId, onSaved }: AddOfficeModalProps) {
  const [formData, setFormData] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [searchingLocation, setSearchingLocation] = useState(false);
  const [loadingPostalCode, setLoadingPostalCode] = useState(false);
  const [mapZoom, setMapZoom] = useState(16);
  const [mapExpanded, setMapExpanded] = useState(false);
  const [postalCodeOptions, setPostalCodeOptions] = useState<PostalCodeOption[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const isEditing = Boolean(office);

  useEffect(() => {
    if (isOpen) {
      setFormData(officeToForm(office));
      setSelectedFiles([]);
    }
  }, [isOpen, office]);

  useEffect(() => {
    const postalCode = formData.codigo_postal.trim();
    if (!isOpen || postalCode.length !== 5) {
      setPostalCodeOptions([]);
      return;
    }

    setPostalCodeOptions([]);
    const timeout = window.setTimeout(() => {
      loadColoniesByPostalCode(postalCode);
    }, 450);

    return () => window.clearTimeout(timeout);
  }, [formData.codigo_postal, isOpen]);

  const handleAmenityChange = (amenityId: string, checked: boolean) => {
    setFormData((current) => ({
      ...current,
      amenidades: checked
        ? [...current.amenidades, amenityId]
        : current.amenidades.filter((id) => id !== amenityId),
    }));
  };

  const updatePinFromPointer = (event: React.PointerEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width));
    const y = Math.min(1, Math.max(0, (event.clientY - rect.top) / rect.height));
    const span = 0.11 / Math.max(1, mapZoom - 12);
    setFormData((current) => ({
      ...current,
      latitud: Number(((Number(current.latitud) || MAP_CENTER.lat) + (0.5 - y) * span).toFixed(6)),
      longitud: Number(((Number(current.longitud) || MAP_CENTER.lng) + (x - 0.5) * span).toFixed(6)),
    }));
  };

  const mapLat = Number(formData.latitud) || MAP_CENTER.lat;
  const mapLng = Number(formData.longitud) || MAP_CENTER.lng;
  const openStreetMapSpan = 0.16 / Math.max(1, mapZoom - 10);
  const mapSrc = googleMapsApiKey
    ? `https://www.google.com/maps/embed/v1/place?key=${googleMapsApiKey}&q=${mapLat},${mapLng}&zoom=${mapZoom}`
    : `https://www.openstreetmap.org/export/embed.html?bbox=${mapLng - openStreetMapSpan}%2C${mapLat - openStreetMapSpan * 0.7}%2C${mapLng + openStreetMapSpan}%2C${mapLat + openStreetMapSpan * 0.7}&layer=mapnik&marker=${mapLat}%2C${mapLng}`;

  const updateZoom = (direction: 1 | -1) => {
    setMapZoom((current) => Math.min(20, Math.max(12, current + direction)));
  };

  const getAddressComponent = (components: GoogleGeocodeResult["address_components"], type: string) =>
    components?.find((item) => item.types.includes(type))?.long_name || "";

  const loadColoniesByPostalCode = async (postalCode: string) => {
    setLoadingPostalCode(true);
    try {
      const loaders = [
        () => loadColoniesFromCopomex(postalCode),
        ...(googleMapsApiKey ? [() => loadColoniesFromGoogle(postalCode)] : []),
        () => loadColoniesFromOpenPostalCode(postalCode),
      ];
      let uniqueOptions: PostalCodeOption[] = [];

      for (const loader of loaders) {
        try {
          uniqueOptions = uniquePostalOptions(await loader());
          if (uniqueOptions.length > 0) break;
        } catch (error) {
          console.warn("Postal code provider failed:", error);
        }
      }

      if (uniqueOptions.length === 0) {
        throw new Error("Sin colonias válidas para ese CP");
      }

      setPostalCodeOptions(uniqueOptions);

      if (uniqueOptions.length > 0) {
        const first = uniqueOptions[0];
        setFormData((current) => ({
          ...current,
          colonia: uniqueOptions.some((option) => option.colonia === current.colonia) ? current.colonia : first.colonia,
          municipio: first.ciudad || current.municipio,
          estado_region: first.estado || current.estado_region,
          latitud: first.latitud || current.latitud,
          longitud: first.longitud || current.longitud,
        }));
      }
    } catch (error) {
      console.error("Postal code lookup error:", error);
      toast.error("No se pudieron cargar colonias para ese código postal.");
    } finally {
      setLoadingPostalCode(false);
    }
  };

  const loadColoniesFromGoogle = async (postalCode: string): Promise<PostalCodeOption[]> => {
    const url = new URL("https://maps.googleapis.com/maps/api/geocode/json");
    url.searchParams.set("address", postalCode);
    url.searchParams.set("components", `country:MX|postal_code:${postalCode}`);
    url.searchParams.set("region", "mx");
    url.searchParams.set("language", "es-419");
    url.searchParams.set("key", googleMapsApiKey);

    const response = await fetch(url.toString());
    const data = await response.json();
    const result = data.results?.[0] as GoogleGeocodeResult | undefined;
    if (!result) return [];

    const ciudad =
      getAddressComponent(result.address_components, "locality") ||
      getAddressComponent(result.address_components, "postal_town") ||
      getAddressComponent(result.address_components, "administrative_area_level_2");
    const estado = getAddressComponent(result.address_components, "administrative_area_level_1");
    const location = result.geometry?.location;

    return uniquePostalOptions((result.postcode_localities || [getAddressComponent(result.address_components, "sublocality") || ciudad])
      .filter(Boolean)
      .map((colonia) => ({
        colonia,
        ciudad,
        estado,
        latitud: location?.lat,
        longitud: location?.lng,
      })));
  };

  const loadColoniesFromCopomex = async (postalCode: string): Promise<PostalCodeOption[]> => {
    const response = await fetch(`https://api.copomex.com/query/info_cp/${postalCode}?token=${encodeURIComponent(copomexToken)}`);
    if (!response.ok) throw new Error("COPOMEX no disponible");
    const data = await response.json() as CopomexRow[];
    const rows = Array.isArray(data) ? data : [];
    const options = rows.map((row) => ({
      colonia: row.response?.asentamiento || "",
      ciudad: row.response?.municipio || row.response?.ciudad || "",
      estado: row.response?.estado || "",
    }));
    if (options.length === 0) throw new Error("Sin colonias para ese CP");
    return uniquePostalOptions(options);
  };

  const loadColoniesFromOpenPostalCode = async (postalCode: string): Promise<PostalCodeOption[]> => {
    const response = await fetch(`https://api.zippopotam.us/MX/${postalCode}`);
    if (!response.ok) return [];
    const data = await response.json();
    const ciudad = data.places?.[0]?.["place name"] || data.places?.[0]?.["admin name2"] || "";
    return uniquePostalOptions((data.places || []).map((place: any) => ({
      colonia: place["place name"],
      ciudad: place["admin name2"] || ciudad,
      estado: place.state,
      latitud: Number(place.latitude),
      longitud: Number(place.longitude),
    })));
  };

  const searchLocation = async () => {
    const query = [
      formData.direccion,
      formData.colonia,
      formData.municipio,
      formData.estado_region,
      formData.codigo_postal,
      "México",
    ].filter(Boolean).join(", ");

    if (!query.trim()) {
      toast.error("Escribe una dirección para buscarla en el mapa.");
      return;
    }

    setSearchingLocation(true);
    try {
      if (googleMapsApiKey) {
        const url = new URL("https://maps.googleapis.com/maps/api/geocode/json");
        url.searchParams.set("address", query);
        url.searchParams.set("components", `country:MX|postal_code:${formData.codigo_postal.trim()}`);
        url.searchParams.set("region", "mx");
        url.searchParams.set("language", "es-419");
        url.searchParams.set("key", googleMapsApiKey);

        const response = await fetch(url.toString());
        const data = await response.json();
        const result = data.results?.[0] as GoogleGeocodeResult | undefined;

        if (!result?.geometry?.location) {
          toast.error("No encontré esa dirección. Intenta con calle, colonia y ciudad.");
          return;
        }

        setFormData((current) => ({
          ...current,
          municipio:
            getAddressComponent(result.address_components, "locality") ||
            getAddressComponent(result.address_components, "postal_town") ||
            getAddressComponent(result.address_components, "administrative_area_level_2") ||
            current.municipio,
          estado_region: getAddressComponent(result.address_components, "administrative_area_level_1") || current.estado_region,
          latitud: Number(result.geometry.location.lat.toFixed(6)),
          longitud: Number(result.geometry.location.lng.toFixed(6)),
        }));
        toast.success("Ubicación encontrada. Ajusta el pin si hace falta.");
        return;
      }

      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&limit=1&q=${encodeURIComponent(query)}`
      );
      const results = await response.json() as LocationResult[];
      const result = results[0];

      if (!result) {
        toast.error("No encontré esa dirección. Intenta con calle, colonia y ciudad.");
        return;
      }

      const address = result.address || {};
      const street = [address.road, address.house_number].filter(Boolean).join(" ");
      setFormData((current) => ({
        ...current,
        direccion: street || current.direccion,
        colonia: address.suburb || address.neighbourhood || current.colonia,
        municipio: address.city || address.town || address.municipality || current.municipio,
        estado_region: address.state || current.estado_region,
        codigo_postal: address.postcode || current.codigo_postal,
        latitud: Number(Number(result.lat).toFixed(6)),
        longitud: Number(Number(result.lon).toFixed(6)),
      }));
      toast.success("Ubicación encontrada. Ajusta el pin si hace falta.");
    } catch (error) {
      console.error("Location search error:", error);
      toast.error("No se pudo buscar la ubicación. Revisa tu conexión e intenta de nuevo.");
    } finally {
      setSearchingLocation(false);
    }
  };

  const uploadOfficePhotos = async (psychologistProfileId: string) => {
    if (selectedFiles.length === 0) return [];

    const uploadedUrls: string[] = [];
    const token = getAuthToken();

    for (const file of selectedFiles) {
      const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const safeName = file.name
        .replace(/\.[^/.]+$/, "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-zA-Z0-9_-]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .toLowerCase() || "foto";
      const path = `${psychologistProfileId}/${Date.now()}-${crypto.randomUUID()}-${safeName}.${extension}`;
      const response = await fetch(`${supabaseUrl}/storage/v1/object/${OFFICE_PHOTOS_BUCKET}/${path}`, {
        method: "POST",
        headers: {
          apikey: publicAnonKey,
          Authorization: `Bearer ${token}`,
          "Content-Type": file.type || "image/jpeg",
          "x-upsert": "true",
        },
        body: file,
      });

      if (!response.ok) {
        const detail = await response.text();
        throw new Error(`No se pudo subir ${file.name}: ${detail}`);
      }

      uploadedUrls.push(`${supabaseUrl}/storage/v1/object/public/${OFFICE_PHOTOS_BUCKET}/${path}`);
    }

    return uploadedUrls;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !formData.nombre.trim() ||
      !formData.direccion.trim() ||
      !formData.codigo_postal.trim() ||
      !formData.colonia.trim() ||
      !formData.municipio.trim() ||
      !formData.estado_region.trim()
    ) {
      toast.error("Completa nombre, calle y número, código postal, colonia, ciudad y estado.");
      return;
    }

    if (!/^\d{5}$/.test(formData.codigo_postal.trim())) {
      toast.error("El Código Postal debe tener 5 dígitos.");
      return;
    }

    setSaving(true);

    try {
      const psychologistProfileId = await resolvePsychologistProfileId(currentPsychologistId);

      if (!psychologistProfileId) {
        toast.error("Tu usuario no tiene perfil de psicólogo vinculado.");
        return;
      }

      const uploadedPhotoUrls = await uploadOfficePhotos(psychologistProfileId);

      const payload = {
        nombre: formData.nombre.trim(),
        direccion: formData.direccion.trim(),
        colonia: formData.colonia.trim() || null,
        municipio: formData.municipio.trim(),
        estado_region: formData.estado_region.trim() || "Jalisco",
        codigo_postal: formData.codigo_postal.trim() || null,
        latitud: Number(formData.latitud) || null,
        longitud: Number(formData.longitud) || null,
        telefono: formData.telefono.trim() || null,
        descripcion: formData.descripcion.trim() || null,
        amenidades: formData.amenidades,
        fotos_urls: [...formData.fotos_urls, ...uploadedPhotoUrls],
        estado: formData.estado,
      };

      const savedOffices = await supabaseRest<OfficeRow[]>(
        isEditing ? `/consultorios?id=eq.${office?.id}` : "/consultorios",
        {
          method: isEditing ? "PATCH" : "POST",
          headers: { Prefer: "return=representation" },
          body: JSON.stringify(payload),
        }
      );

      const savedOfficeId = savedOffices[0]?.id || office?.id;

      if (savedOfficeId && psychologistProfileId) {
        const currentRelations = await supabaseRest<Array<{ id: string }>>(
          `/psicologo_consultorios?psicologo_id=eq.${psychologistProfileId}&select=id`
        );

        await supabaseRest("/psicologo_consultorios?on_conflict=psicologo_id,consultorio_id", {
          method: "POST",
          headers: { Prefer: "resolution=merge-duplicates,return=representation" },
          body: JSON.stringify({
            psicologo_id: psychologistProfileId,
            consultorio_id: savedOfficeId,
            es_principal: currentRelations.length === 0,
          }),
        });
      }

      toast.success(isEditing ? "Consultorio actualizado" : "Consultorio registrado");
      onSaved?.();
      onClose();
    } catch (error: any) {
      console.error("Save office error:", error);
      toast.error(`No se pudo guardar el consultorio. ${error?.message || "Revisa políticas de Supabase."}`);
    } finally {
      setSaving(false);
    }
  };

  const renderMapCard = (expanded = false) => (
    <div
      className={`relative overflow-hidden rounded-2xl border border-border bg-muted cursor-crosshair ${
        expanded ? "h-full min-h-0 flex-1" : "h-72"
      }`}
      onPointerDown={!googleMapsApiKey ? updatePinFromPointer : undefined}
      onPointerMove={(event) => {
        if (!googleMapsApiKey && event.buttons === 1) updatePinFromPointer(event);
      }}
    >
      {googleMapsApiKey ? (
        <GoogleOfficeMap
          lat={mapLat}
          lng={mapLng}
          expanded={expanded}
          onChange={({ lat, lng }) =>
            setFormData((current) => ({
              ...current,
              latitud: Number(lat.toFixed(6)),
              longitud: Number(lng.toFixed(6)),
            }))
          }
        />
      ) : (
        <>
          <iframe
            title="Mapa aproximado del consultorio"
            src={mapSrc}
            className="absolute inset-0 h-full w-full border-0 opacity-95 pointer-events-none"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-primary/5" />
          <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-full select-none">
            <div className="relative">
              <div className="absolute left-1/2 top-[30px] h-7 w-7 -translate-x-1/2 rounded-full bg-primary/20 animate-pulse" />
              <div className="grid h-11 w-11 place-items-center rounded-full bg-primary text-primary-foreground shadow-lg">
                <MapPin className="h-5 w-5" />
              </div>
            </div>
          </div>
          <div className="absolute right-3 top-3 flex flex-col overflow-hidden rounded-xl border border-border bg-background/95 shadow-sm">
            <button
              type="button"
              className="grid h-10 w-10 place-items-center text-foreground hover:bg-muted"
              onPointerDown={(event) => event.stopPropagation()}
              onClick={(event) => {
                event.stopPropagation();
                updateZoom(1);
              }}
              aria-label="Acercar mapa"
            >
              <Plus className="h-4 w-4" />
            </button>
            <div className="h-px bg-border" />
            <button
              type="button"
              className="grid h-10 w-10 place-items-center text-foreground hover:bg-muted"
              onPointerDown={(event) => event.stopPropagation()}
              onClick={(event) => {
                event.stopPropagation();
                updateZoom(-1);
              }}
              aria-label="Alejar mapa"
            >
              <Minus className="h-4 w-4" />
            </button>
          </div>
        </>
      )}
      <div className="absolute left-3 bottom-3 rounded-xl bg-background/90 px-3 py-2 text-xs text-muted-foreground shadow-sm">
        {googleMapsApiKey ? "Arrastra el pin o toca el mapa para ajustar" : `Toca el mapa para mover el pin · Zoom ${mapZoom}`}
      </div>
    </div>
  );

  return (
    <>
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[620px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Editar Consultorio" : "Registrar Nuevo Consultorio"}</DialogTitle>
          <DialogDescription>Complete la información del consultorio</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nombre">
              Nombre <span className="text-destructive">*</span>
            </Label>
            <Input
              id="nombre"
              placeholder="Ej: Consultorio Providencia"
              className="bg-input-background"
              value={formData.nombre}
              onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
              disabled={saving}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="direccion">
              Calle y número <span className="text-destructive">*</span>
            </Label>
            <Input
              id="direccion"
              placeholder="Ej: Av. México 1234, interior 5"
              className="bg-input-background"
              value={formData.direccion}
              onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
              disabled={saving}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="codigo_postal">
                Código Postal <span className="text-destructive">*</span>
              </Label>
              <Input
                id="codigo_postal"
                placeholder="44100"
                inputMode="numeric"
                maxLength={5}
                className="bg-input-background"
                value={formData.codigo_postal}
                onChange={(e) => {
                  const nextPostalCode = e.target.value.replace(/\D/g, "").slice(0, 5);
                  setFormData({ ...formData, codigo_postal: nextPostalCode, colonia: "" });
                }}
                disabled={saving}
                required
              />
              {loadingPostalCode && <p className="text-xs text-muted-foreground">Buscando colonias...</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="colonia">
                Colonia <span className="text-destructive">*</span>
              </Label>
              {postalCodeOptions.length > 0 ? (
                <Select
                  value={formData.colonia}
                  onValueChange={(value) => {
                    const selected = postalCodeOptions.find((option) => option.colonia === value);
                    setFormData((current) => ({
                      ...current,
                      colonia: value,
                      municipio: selected?.ciudad || current.municipio,
                      estado_region: selected?.estado || current.estado_region,
                      latitud: selected?.latitud || current.latitud,
                      longitud: selected?.longitud || current.longitud,
                    }));
                  }}
                  disabled={saving}
                >
                  <SelectTrigger id="colonia" className="bg-input-background">
                    <SelectValue placeholder="Selecciona colonia" />
                  </SelectTrigger>
                  <SelectContent>
                    {postalCodeOptions.map((option) => (
                      <SelectItem key={option.colonia} value={option.colonia}>
                        {option.colonia}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  id="colonia"
                  placeholder="Colonia"
                  className="bg-input-background"
                  value={formData.colonia}
                  onChange={(e) => setFormData({ ...formData, colonia: e.target.value })}
                  disabled={saving}
                  required
                />
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="municipio">
                Ciudad <span className="text-destructive">*</span>
              </Label>
              <Input
                id="municipio"
                placeholder="Guadalajara"
                className="bg-input-background"
                value={formData.municipio}
                disabled
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="estado_region">
                Estado <span className="text-destructive">*</span>
              </Label>
              <Input
                id="estado_region"
                placeholder="Jalisco"
                className="bg-input-background"
                value={formData.estado_region}
                disabled
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="telefono">Teléfono</Label>
              <Input
                id="telefono"
                type="tel"
                placeholder="+52 33 0000 0000"
                className="bg-input-background"
                value={formData.telefono}
                onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                disabled={saving}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Amenidades</Label>
            <div className="grid grid-cols-2 gap-3 p-4 border border-border rounded-lg bg-input-background">
              {amenityOptions.map((option) => (
                <div key={option.id} className="flex items-center gap-2">
                  <Checkbox
                    id={`amenity-${option.id}`}
                    checked={formData.amenidades.includes(option.id)}
                    onCheckedChange={(checked) => handleAmenityChange(option.id, checked as boolean)}
                    disabled={saving}
                  />
                  <Label htmlFor={`amenity-${option.id}`} className="text-sm cursor-pointer">
                    {option.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-3 rounded-xl border border-border bg-muted/20 p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <Label>Ubicación para el mapa público</Label>
                <p className="text-xs text-muted-foreground mt-1">
                  Se arma con calle, CP, colonia, ciudad y estado. Después confirma la zona moviendo el pin.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="shrink-0 gap-2"
                  onClick={searchLocation}
                  disabled={saving || searchingLocation}
                >
                  <Search className="h-4 w-4" />
                  {searchingLocation ? "Buscando..." : "Buscar ubicación"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="shrink-0 gap-2"
                  onClick={() => setMapExpanded(true)}
                >
                  <Maximize2 className="h-4 w-4" />
                  Pantalla completa
                </Button>
              </div>
            </div>
            {renderMapCard()}
          </div>

          <div className="space-y-2">
            <Label htmlFor="office_photos">Fotos públicas del consultorio</Label>
            <div className="rounded-xl border border-dashed border-primary/30 bg-primary/5 p-4">
              <label
                htmlFor="office_photos"
                className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg bg-background/70 px-4 py-6 text-center"
              >
                <ImagePlus className="h-7 w-7 text-primary" />
                <span className="font-medium text-foreground">Adjuntar fotos</span>
                <span className="text-xs text-muted-foreground">JPG, PNG o WEBP. Se mostrarán en el perfil público.</span>
              </label>
              <Input
                id="office_photos"
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(event) => setSelectedFiles(Array.from(event.target.files || []))}
                disabled={saving}
              />

              {(formData.fotos_urls.length > 0 || selectedFiles.length > 0) && (
                <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {formData.fotos_urls.map((url) => (
                    <div key={url} className="relative overflow-hidden rounded-lg border border-border bg-background">
                      <img src={url} alt="Foto del consultorio" className="h-24 w-full object-cover" />
                      <button
                        type="button"
                        className="absolute right-1 top-1 grid h-6 w-6 place-items-center rounded-full bg-background/90 text-foreground shadow"
                        onClick={() => setFormData((current) => ({
                          ...current,
                          fotos_urls: current.fotos_urls.filter((item) => item !== url),
                        }))}
                        disabled={saving}
                        aria-label="Quitar foto"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                  {selectedFiles.map((file) => (
                    <div key={`${file.name}-${file.lastModified}`} className="relative overflow-hidden rounded-lg border border-border bg-background">
                      <img src={URL.createObjectURL(file)} alt={file.name} className="h-24 w-full object-cover" />
                      <button
                        type="button"
                        className="absolute right-1 top-1 grid h-6 w-6 place-items-center rounded-full bg-background/90 text-foreground shadow"
                        onClick={() => setSelectedFiles((current) => current.filter((item) => item !== file))}
                        disabled={saving}
                        aria-label="Quitar foto"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="estado">Estado operativo</Label>
            <Select
              value={formData.estado}
              onValueChange={(value: OfficeRow["estado"]) => setFormData({ ...formData, estado: value })}
              disabled={saving}
            >
              <SelectTrigger className="bg-input-background">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="activo">Activo</SelectItem>
                <SelectItem value="inactivo">Inactivo</SelectItem>
                <SelectItem value="suspendido">Suspendido</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="descripcion">Descripción / Notas</Label>
            <Textarea
              id="descripcion"
              placeholder="Indicaciones de acceso, referencias o detalles del espacio..."
              className="bg-input-background min-h-[80px]"
              value={formData.descripcion}
              onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
              disabled={saving}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
              Cancelar
            </Button>
            <Button
              type="submit"
              className="bg-primary text-primary-foreground hover:bg-primary/90"
              disabled={saving}
            >
              {saving ? "Guardando..." : "Guardar Consultorio"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
    <Dialog open={mapExpanded} onOpenChange={setMapExpanded}>
      <DialogContent className="!fixed !inset-0 !left-0 !top-0 !h-screen !max-h-none !w-screen !max-w-none !translate-x-0 !translate-y-0 flex flex-col overflow-hidden !rounded-none border-0 p-5">
        <DialogHeader>
          <DialogTitle>Confirmar ubicación del consultorio</DialogTitle>
          <DialogDescription>
            Acerca, aleja y arrastra el marcador como en Google Maps.
          </DialogDescription>
        </DialogHeader>
        {renderMapCard(true)}
        <DialogFooter>
          <Button type="button" onClick={() => setMapExpanded(false)}>
            Confirmar ubicación
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  );
}
