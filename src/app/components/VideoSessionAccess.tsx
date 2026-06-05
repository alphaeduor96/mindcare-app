import { useEffect, useRef, useState } from "react";
import { KeyRound, Lock, Mic, Video, VideoOff } from "lucide-react";
import { toast } from "sonner";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";

interface VideoSessionAccessProps {
  token: string;
}

export function VideoSessionAccess({ token }: VideoSessionAccessProps) {
  const [accessCode, setAccessCode] = useState("");
  const [joined, setJoined] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  const handleJoin = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!accessCode.trim()) {
      toast.error("Ingresa la contraseña de la sesión.");
      return;
    }

    setJoined(true);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
      setCameraReady(true);
    } catch (error) {
      console.error("Video preview error:", error);
      toast.error("No se pudo activar cámara/micrófono. Revisa permisos del navegador.");
    }
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-5xl items-center justify-center">
        <Card className="w-full border-border">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-md bg-primary/10">
                <Video className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle>Videollamada MindCare</CardTitle>
                <p className="text-sm text-muted-foreground">Sala privada protegida con contraseña</p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {!joined ? (
              <form className="mx-auto max-w-md space-y-4" onSubmit={handleJoin}>
                <div className="rounded-md border border-border bg-muted/30 p-4 text-sm text-muted-foreground">
                  Ingresa la contraseña que te compartió tu psicóloga para preparar tu acceso a la sala.
                </div>
                <div className="space-y-2">
                  <Label>Contraseña</Label>
                  <div className="relative">
                    <KeyRound className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      className="pl-9"
                      value={accessCode}
                      onChange={(event) => setAccessCode(event.target.value.toUpperCase())}
                      placeholder="Ej. A1B2C3"
                    />
                  </div>
                </div>
                <Button type="submit" className="w-full gap-2">
                  <Lock className="h-4 w-4" />
                  Entrar a la sala
                </Button>
                <p className="text-center text-xs text-muted-foreground">
                  Sesión: {token.slice(0, 8)}...
                </p>
              </form>
            ) : (
              <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_320px]">
                <div className="aspect-video overflow-hidden rounded-md border border-border bg-slate-950">
                  <video ref={videoRef} autoPlay playsInline muted className="h-full w-full object-cover" />
                  {!cameraReady && (
                    <div className="flex h-full items-center justify-center text-white">
                      <VideoOff className="mr-2 h-5 w-5" />
                      Esperando permisos de cámara
                    </div>
                  )}
                </div>
                <div className="space-y-4">
                  <div className="rounded-md border border-border p-4">
                    <p className="text-sm text-foreground">Sala lista</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Esta pantalla ya prepara permisos de audio/video. Falta conectar el motor WebRTC para unir a psicóloga y paciente en tiempo real.
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" className="flex-1 gap-2">
                      <Mic className="h-4 w-4" />
                      Mic
                    </Button>
                    <Button variant="outline" className="flex-1 gap-2">
                      <Video className="h-4 w-4" />
                      Cámara
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
