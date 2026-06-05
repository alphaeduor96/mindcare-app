import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { X, ChevronLeft, ChevronRight, Check } from "lucide-react";

interface TourStep {
  target: string;
  title: string;
  content: string;
  placement?: "top" | "bottom" | "left" | "right";
}

interface OnboardingTourProps {
  isOpen: boolean;
  onClose: () => void;
  steps: TourStep[];
}

export function OnboardingTour({ isOpen, onClose, steps }: OnboardingTourProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [elementPosition, setElementPosition] = useState<{ top: number; left: number; width: number; height: number } | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    const updatePosition = () => {
      const element = document.querySelector(steps[currentStep]?.target);
      if (element) {
        const rect = element.getBoundingClientRect();
        setElementPosition({
          top: rect.top + window.scrollY,
          left: rect.left + window.scrollX,
          width: rect.width,
          height: rect.height,
        });
        
        // Scroll element into view smoothly
        element.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    };

    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition);

    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition);
    };
  }, [currentStep, isOpen, steps]);

  if (!isOpen || !steps[currentStep]) return null;

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onClose();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    onClose();
  };

  const getTooltipPosition = () => {
    if (!elementPosition) return { top: "50%", left: "50%", transform: "translate(-50%, -50%)" };

    const placement = steps[currentStep].placement || "bottom";
    const padding = 20;
    const tooltipWidth = 448; // max-w-md = 28rem = 448px
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    let position = { top: "0px", left: "0px", transform: "" };

    switch (placement) {
      case "top":
        position = {
          top: `${elementPosition.top - padding}px`,
          left: `${elementPosition.left + elementPosition.width / 2}px`,
          transform: "translate(-50%, -100%)",
        };
        break;
      case "bottom":
        position = {
          top: `${elementPosition.top + elementPosition.height + padding}px`,
          left: `${elementPosition.left + elementPosition.width / 2}px`,
          transform: "translate(-50%, 0)",
        };
        break;
      case "left":
        position = {
          top: `${elementPosition.top + elementPosition.height / 2}px`,
          left: `${elementPosition.left - padding}px`,
          transform: "translate(-100%, -50%)",
        };
        break;
      case "right":
        position = {
          top: `${elementPosition.top + elementPosition.height / 2}px`,
          left: `${elementPosition.left + elementPosition.width + padding}px`,
          transform: "translate(0, -50%)",
        };
        break;
      default:
        position = {
          top: `${elementPosition.top + elementPosition.height + padding}px`,
          left: `${elementPosition.left + elementPosition.width / 2}px`,
          transform: "translate(-50%, 0)",
        };
    }

    // Parse position values to check boundaries
    const topValue = parseFloat(position.top);
    let leftValue = parseFloat(position.left);

    // Adjust horizontal position to keep tooltip on screen
    // Calculate where the tooltip would actually end up after transform
    let actualLeft = leftValue;
    if (position.transform.includes("-50%")) {
      actualLeft = leftValue - tooltipWidth / 2;
    } else if (position.transform.includes("-100%")) {
      actualLeft = leftValue - tooltipWidth;
    }

    // If tooltip would go off the left edge, adjust it
    if (actualLeft < padding) {
      leftValue = tooltipWidth / 2 + padding;
      position.left = `${leftValue}px`;
      position.transform = position.transform.replace("translate(-50%", "translate(-50%").replace("translate(-100%", "translate(-50%");
    }
    
    // If tooltip would go off the right edge, adjust it
    if (actualLeft + tooltipWidth > viewportWidth - padding) {
      leftValue = viewportWidth - tooltipWidth / 2 - padding;
      position.left = `${leftValue}px`;
      position.transform = position.transform.replace("translate(0,", "translate(-50%,");
    }

    // Adjust vertical position to keep tooltip on screen
    let actualTop = topValue;
    if (position.transform.includes("-100%")) {
      actualTop = topValue - 300; // Approximate tooltip height
    } else if (position.transform.includes("-50%")) {
      actualTop = topValue - 150;
    }

    if (actualTop < padding) {
      position.top = `${elementPosition.top + elementPosition.height + padding}px`;
      position.transform = position.transform.replace("-100%", "0").replace("-50%", "-50%");
    }

    if (actualTop + 300 > viewportHeight - padding) {
      position.top = `${elementPosition.top - padding}px`;
      position.transform = position.transform.replace(", 0)", ", -100%)").replace(", -50%)", ", -100%)");
    }

    return position;
  };

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/60 z-[9998]" onClick={handleSkip} />
      
      {/* Spotlight highlight */}
      {elementPosition && (
        <>
          <div
            className="fixed z-[9999] pointer-events-none animate-pulse"
            style={{
              top: `${elementPosition.top - 8}px`,
              left: `${elementPosition.left - 8}px`,
              width: `${elementPosition.width + 16}px`,
              height: `${elementPosition.height + 16}px`,
              boxShadow: "0 0 0 4px rgba(126, 87, 194, 0.8), 0 0 0 9999px rgba(0, 0, 0, 0.7)",
              borderRadius: "12px",
              transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
            }}
          />
          <div
            className="fixed z-[9999] pointer-events-none"
            style={{
              top: `${elementPosition.top - 4}px`,
              left: `${elementPosition.left - 4}px`,
              width: `${elementPosition.width + 8}px`,
              height: `${elementPosition.height + 8}px`,
              border: "2px solid rgba(126, 87, 194, 1)",
              borderRadius: "10px",
              transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
            }}
          />
        </>
      )}

      {/* Tooltip */}
      <Card
        className="fixed z-[10000] w-full max-w-md border-2 border-[#7E57C2] shadow-2xl mx-4"
        style={getTooltipPosition()}
      >
        <CardContent className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-6 h-6 rounded-full bg-[#7E57C2] text-white flex items-center justify-center text-xs">
                  {currentStep + 1}
                </div>
                <span className="text-xs text-muted-foreground">
                  Paso {currentStep + 1} de {steps.length}
                </span>
              </div>
              <h3 className="text-lg text-foreground mb-2">
                {steps[currentStep].title}
              </h3>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSkip}
              className="h-8 w-8 p-0 hover:bg-destructive/10"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          <p className="text-sm text-muted-foreground mb-6">
            {steps[currentStep].content}
          </p>

          {/* Progress dots */}
          <div className="flex items-center justify-center gap-2 mb-6">
            {steps.map((_, index) => (
              <div
                key={index}
                className={`h-2 rounded-full transition-all ${
                  index === currentStep
                    ? "w-6 bg-[#7E57C2]"
                    : index < currentStep
                    ? "w-2 bg-[#7E57C2]/50"
                    : "w-2 bg-muted"
                }`}
              />
            ))}
          </div>

          <div className="flex items-center justify-between gap-3">
            <Button
              variant="outline"
              onClick={handleSkip}
              size="sm"
              className="text-muted-foreground"
            >
              Saltar Tutorial
            </Button>
            <div className="flex items-center gap-2">
              {currentStep > 0 && (
                <Button
                  variant="outline"
                  onClick={handlePrevious}
                  size="sm"
                  className="gap-2"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Anterior
                </Button>
              )}
              <Button
                onClick={handleNext}
                size="sm"
                className="bg-[#7E57C2] text-white hover:bg-[#7E57C2]/90 gap-2"
              >
                {currentStep === steps.length - 1 ? (
                  <>
                    Finalizar
                    <Check className="w-4 h-4" />
                  </>
                ) : (
                  <>
                    Siguiente
                    <ChevronRight className="w-4 h-4" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
