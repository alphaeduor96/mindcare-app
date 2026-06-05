import { useState } from "react";
import { Card, CardContent, CardHeader, CardDescription } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Textarea } from "./ui/textarea";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";
import { toast } from "sonner";
import {
  Lightbulb,
  ThumbsUp,
  MessageSquare,
  TrendingUp,
  Sparkles,
  Send,
  CheckCircle2,
  DollarSign,
} from "lucide-react";

interface FeatureSuggestion {
  id: string;
  title: string;
  description: string;
  votes: number;
  category: string;
  willingToPay: "yes" | "no" | "maybe";
  maxPrice: string;
  status: "nuevo" | "en-revision" | "planificado" | "implementado";
}

const mockSuggestions: FeatureSuggestion[] = [
  {
    id: "1",
    title: "Integración con WhatsApp",
    description: "Poder enviar recordatorios automáticos a pacientes vía WhatsApp",
    votes: 45,
    category: "Comunicación",
    willingToPay: "yes",
    maxPrice: "$100/mes",
    status: "en-revision",
  },
  {
    id: "2",
    title: "Videollamadas integradas",
    description: "Sistema de videollamadas nativo sin necesidad de enlaces externos",
    votes: 38,
    category: "Sesiones",
    willingToPay: "yes",
    maxPrice: "$150/mes",
    status: "planificado",
  },
  {
    id: "3",
    title: "Plantillas de notas clínicas",
    description: "Plantillas predefinidas para diferentes tipos de sesiones y diagnósticos",
    votes: 32,
    category: "Documentación",
    willingToPay: "maybe",
    maxPrice: "$50/mes",
    status: "nuevo",
  },
  {
    id: "4",
    title: "App móvil nativa",
    description: "Aplicación iOS y Android para gestionar el consultorio desde el celular",
    votes: 56,
    category: "Plataforma",
    willingToPay: "yes",
    maxPrice: "$200/mes",
    status: "en-revision",
  },
  {
    id: "5",
    title: "Firma electrónica de documentos",
    description: "Sistema para que pacientes firmen consentimientos y documentos digitalmente",
    votes: 28,
    category: "Legal",
    willingToPay: "yes",
    maxPrice: "$75/mes",
    status: "implementado",
  },
];

export function FeatureFeedback() {
  const [suggestions, setSuggestions] = useState<FeatureSuggestion[]>(mockSuggestions);
  const [showForm, setShowForm] = useState(false);
  const [votedIds, setVotedIds] = useState<Set<string>>(new Set());
  
  const [newSuggestion, setNewSuggestion] = useState({
    title: "",
    description: "",
    category: "",
    willingToPay: "no" as "yes" | "no" | "maybe",
    maxPrice: "",
  });

  const handleVote = (id: string) => {
    if (votedIds.has(id)) {
      toast.error("Ya votaste por esta sugerencia");
      return;
    }
    
    setSuggestions(suggestions.map(s => 
      s.id === id ? { ...s, votes: s.votes + 1 } : s
    ));
    setVotedIds(new Set(votedIds).add(id));
    toast.success("¡Voto registrado!");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newSuggestion.title || !newSuggestion.description) {
      toast.error("Por favor completa todos los campos requeridos");
      return;
    }

    const suggestion: FeatureSuggestion = {
      id: Date.now().toString(),
      title: newSuggestion.title,
      description: newSuggestion.description,
      votes: 1,
      category: newSuggestion.category || "General",
      willingToPay: newSuggestion.willingToPay,
      maxPrice: newSuggestion.maxPrice,
      status: "nuevo",
    };

    setSuggestions([suggestion, ...suggestions]);
    setNewSuggestion({
      title: "",
      description: "",
      category: "",
      willingToPay: "no",
      maxPrice: "",
    });
    setShowForm(false);
    toast.success("¡Gracias por tu sugerencia! La revisaremos pronto.");
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      "nuevo": "bg-blue-100 text-blue-700",
      "en-revision": "bg-yellow-100 text-yellow-700",
      "planificado": "bg-purple-100 text-purple-700",
      "implementado": "bg-green-100 text-green-700",
    };
    return styles[status as keyof typeof styles] || styles.nuevo;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#7E57C2] to-[#9575CD] flex items-center justify-center">
            <Lightbulb className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-3xl text-foreground">Sugerencias de Funcionalidades</h1>
            <p className="text-muted-foreground">
              Ayúdanos a mejorar MindCare con tus ideas
            </p>
          </div>
        </div>
      </div>

      {/* Info Card */}
      <Card className="border-[#7E57C2]/20 bg-gradient-to-br from-[#7E57C2]/5 to-transparent">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <Sparkles className="w-6 h-6 text-[#7E57C2] flex-shrink-0 mt-1" />
            <div>
              <h3 className="text-foreground mb-2">Tu opinión es importante</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Queremos construir el mejor sistema de gestión para psicólogos. 
                Comparte qué funcionalidades te gustaría ver, vota por las ideas de otros, 
                y ayúdanos a entender qué valor tendría para ti.
              </p>
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary" className="gap-1">
                  <MessageSquare className="w-3 h-3" />
                  {suggestions.length} sugerencias
                </Badge>
                <Badge variant="secondary" className="gap-1">
                  <ThumbsUp className="w-3 h-3" />
                  {suggestions.reduce((acc, s) => acc + s.votes, 0)} votos totales
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Button */}
      {!showForm && (
        <Button
          onClick={() => setShowForm(true)}
          size="lg"
          className="w-full bg-[#7E57C2] text-white hover:bg-[#7E57C2]/90 gap-2"
        >
          <Sparkles className="w-5 h-5" />
          Proponer Nueva Funcionalidad
        </Button>
      )}

      {/* Suggestion Form */}
      {showForm && (
        <Card className="border-[#7E57C2]">
          <CardHeader>
            <h2 className="text-xl text-foreground">Nueva Sugerencia</h2>
            <CardDescription>
              Describe la funcionalidad que te gustaría ver en MindCare
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="title">Título de la Funcionalidad *</Label>
                <Input
                  id="title"
                  placeholder="Ej: Integración con Google Calendar"
                  value={newSuggestion.title}
                  onChange={(e) => setNewSuggestion({ ...newSuggestion, title: e.target.value })}
                  required
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Descripción Detallada *</Label>
                <Textarea
                  id="description"
                  placeholder="Explica cómo funcionaría esta característica y cómo te ayudaría..."
                  value={newSuggestion.description}
                  onChange={(e) => setNewSuggestion({ ...newSuggestion, description: e.target.value })}
                  rows={4}
                  required
                />
              </div>

              {/* Category */}
              <div className="space-y-2">
                <Label htmlFor="category">Categoría</Label>
                <Input
                  id="category"
                  placeholder="Ej: Comunicación, Reportes, Sesiones..."
                  value={newSuggestion.category}
                  onChange={(e) => setNewSuggestion({ ...newSuggestion, category: e.target.value })}
                />
              </div>

              {/* Willing to Pay */}
              <div className="space-y-3">
                <Label>¿Estarías dispuesto a pagar más por esta funcionalidad?</Label>
                <RadioGroup
                  value={newSuggestion.willingToPay}
                  onValueChange={(value: "yes" | "no" | "maybe") => 
                    setNewSuggestion({ ...newSuggestion, willingToPay: value })
                  }
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="yes" id="yes" />
                    <Label htmlFor="yes" className="cursor-pointer">
                      Sí, definitivamente
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="maybe" id="maybe" />
                    <Label htmlFor="maybe" className="cursor-pointer">
                      Tal vez, dependiendo del precio
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="no" id="no" />
                    <Label htmlFor="no" className="cursor-pointer">
                      No, debería estar incluido
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              {/* Max Price */}
              {(newSuggestion.willingToPay === "yes" || newSuggestion.willingToPay === "maybe") && (
                <div className="space-y-2">
                  <Label htmlFor="maxPrice">¿Cuánto estarías dispuesto a pagar mensualmente?</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="maxPrice"
                      placeholder="Ej: $50/mes, $100/mes..."
                      value={newSuggestion.maxPrice}
                      onChange={(e) => setNewSuggestion({ ...newSuggestion, maxPrice: e.target.value })}
                      className="pl-9"
                    />
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowForm(false)}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  className="flex-1 bg-[#7E57C2] text-white hover:bg-[#7E57C2]/90 gap-2"
                >
                  <Send className="w-4 h-4" />
                  Enviar Sugerencia
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Suggestions List */}
      <div className="space-y-4">
        <h2 className="text-xl text-foreground flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-[#7E57C2]" />
          Sugerencias de la Comunidad
        </h2>

        {suggestions.map((suggestion) => (
          <Card key={suggestion.id} className="border-border hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                {/* Vote Button */}
                <div className="flex flex-col items-center gap-1 flex-shrink-0">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleVote(suggestion.id)}
                    disabled={votedIds.has(suggestion.id)}
                    className={`h-auto flex-col gap-1 px-3 py-2 ${
                      votedIds.has(suggestion.id)
                        ? "bg-[#7E57C2]/10 border-[#7E57C2]"
                        : "hover:bg-[#7E57C2]/5"
                    }`}
                  >
                    <ThumbsUp className={`w-4 h-4 ${votedIds.has(suggestion.id) ? "text-[#7E57C2]" : ""}`} />
                    <span className="text-sm">{suggestion.votes}</span>
                  </Button>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <h3 className="text-lg text-foreground">{suggestion.title}</h3>
                    <Badge className={getStatusBadge(suggestion.status)}>
                      {suggestion.status === "nuevo" && "Nuevo"}
                      {suggestion.status === "en-revision" && "En Revisión"}
                      {suggestion.status === "planificado" && "Planificado"}
                      {suggestion.status === "implementado" && (
                        <>
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          Implementado
                        </>
                      )}
                    </Badge>
                  </div>

                  <p className="text-sm text-muted-foreground mb-3">
                    {suggestion.description}
                  </p>

                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="secondary" className="text-xs">
                      {suggestion.category}
                    </Badge>
                    {suggestion.willingToPay === "yes" && (
                      <Badge variant="secondary" className="text-xs gap-1 bg-green-100 text-green-700">
                        <DollarSign className="w-3 h-3" />
                        Dispuesto a pagar: {suggestion.maxPrice}
                      </Badge>
                    )}
                    {suggestion.willingToPay === "maybe" && (
                      <Badge variant="secondary" className="text-xs gap-1 bg-yellow-100 text-yellow-700">
                        <DollarSign className="w-3 h-3" />
                        Tal vez: {suggestion.maxPrice}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
