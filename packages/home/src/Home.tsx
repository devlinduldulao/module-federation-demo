import { useCallback, memo } from "react";
import { useActiveTheme } from "./lib/theme";
import { ModuleDestination } from "./types";
import "./index.css";

const MODULE_DESTINATIONS: readonly ModuleDestination[] = [
  {
    id: "records",
    label: "Records",
    description: "Access patient medical records including lab results, imaging reports, and clinical consultations.",
    port: "3001",
    path: "/records",
    icon: "REC",
  },
  {
    id: "prescriptions",
    label: "Prescriptions",
    description: "Manage active prescription orders, adjust refill counts, and submit for pharmacy review.",
    port: "3002",
    path: "/prescriptions",
    icon: "Rx",
  },
  {
    id: "analytics",
    label: "Analytics",
    description: "Monitor real-time clinical metrics, patient activity feed, and operational insights.",
    port: "3003",
    path: "/analytics",
    icon: "STAT",
  },
] as const;

const ARCHITECTURE_HIGHLIGHTS: readonly { readonly label: string; readonly value: string }[] = [
  { label: "Pattern", value: "Module Federation" },
  { label: "Runtime", value: "React 19" },
  { label: "Bundler", value: "Rspack" },
  { label: "Modules", value: "4 Remotes" },
] as const;

const DestinationCard = memo<{
  destination: ModuleDestination;
  index: number;
  onNavigate: (destination: ModuleDestination) => void;
}>(({ destination, index, onNavigate }) => (
  <article
    className="group bg-noir flex flex-col animate-fade-in-up"
    style={{ animationDelay: `${index * 80}ms` }}
    role="article"
    aria-label={`Navigate to ${destination.label}`}
  >
    {/* Icon placeholder */}
    <div className="aspect-[16/9] min-h-[120px] max-h-[140px] bg-elevated relative overflow-hidden flex items-center justify-center">
      <span className="font-mono text-sm text-dim tracking-widest group-hover:text-citrine transition-colors duration-500">
        {destination.icon}
      </span>
      {/* Citrine reveal line */}
      <div className="absolute bottom-0 left-0 w-full h-0.5 bg-citrine scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left" />
    </div>

    <div className="p-5 sm:p-6 flex flex-col flex-1 h-full">
      <div className="flex items-start justify-between gap-3 mb-2">
        <h3 className="font-display text-lg sm:text-xl italic text-cream group-hover:text-citrine transition-colors duration-300">
          {destination.label}
        </h3>
        <span className="font-mono text-[10px] tracking-[0.2em] text-dim shrink-0 pt-1">
          :{destination.port}
        </span>
      </div>
      <p className="text-stone text-xs sm:text-sm leading-relaxed mb-5 flex-1">
        {destination.description}
      </p>

      <button
        onClick={() => onNavigate(destination)}
        className="w-full font-mono text-[11px] tracking-wider text-citrine border border-edge px-4 py-2.5 hover:border-citrine hover:bg-citrine hover:text-ink transition-all duration-300 text-center uppercase mt-auto"
        aria-label={`Go to ${destination.label} module`}
      >
        Enter {destination.label} &rarr;
      </button>
    </div>
  </article>
));

DestinationCard.displayName = "DestinationCard";

function Home() {
  const { label: themeLabel } = useActiveTheme();

  const handleNavigate = useCallback((destination: ModuleDestination) => {
    try {
      window.dispatchEvent(
        new CustomEvent("navigateToModule", {
          detail: { module: destination.id },
          bubbles: true,
        })
      );
      window.dispatchEvent(
        new CustomEvent("showNotification", {
          detail: {
            type: "info",
            message: `Navigating to ${destination.label}`,
          },
        })
      );
    } catch (error) {
      console.error("Failed to navigate:", error);
    }
  }, []);

  return (
    <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12 animate-fade-in" role="main">
      {/* Hero Section */}
      <header className="mb-10 lg:mb-14 animate-fade-in-up">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <span className="font-mono text-[10px] tracking-[0.25em] text-dim uppercase block mb-2">
              Micro-Frontend Architecture
            </span>
            <h2 className="font-display text-2xl sm:text-3xl lg:text-4xl italic text-cream tracking-tight leading-snug mb-2">
              A Modular Federation Showcase
            </h2>
            <p className="font-mono text-[11px] text-dim uppercase tracking-wider mb-3">
              Healthcare platform
            </p>
            <p className="text-stone text-sm max-w-2xl leading-relaxed">
              A demonstration of Module Federation with independently deployed micro-frontends.
              Each module runs on its own port, ships its own bundle, and can be developed in isolation.
            </p>
          </div>
          <div className="flex items-center gap-3 self-start lg:self-auto">
            <span className="font-mono text-[10px] tracking-[0.25em] text-dim uppercase">
              Theme
            </span>
            <span className="border border-edge bg-surface/70 px-2.5 py-1 font-mono text-[10px] tracking-[0.2em] text-stone uppercase">
              {themeLabel}
            </span>
          </div>
        </div>
      </header>

      {/* Architecture Stats */}
      <section
        className="mb-10 animate-fade-in-up"
        style={{ animationDelay: "80ms" }}
        aria-label="Architecture overview"
      >
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-edge overflow-hidden border border-edge">
          {ARCHITECTURE_HIGHLIGHTS.map((item, index) => (
            <div
              key={item.label}
              className="bg-noir p-4 sm:p-5 animate-fade-in-up flex flex-col justify-center min-h-[88px]"
              style={{ animationDelay: `${(index + 1) * 80}ms` }}
            >
              <span className="font-mono text-[10px] tracking-[0.25em] text-dim uppercase block mb-1.5">
                {item.label}
              </span>
              <span className="font-display text-sm sm:text-base italic text-cream">
                {item.value}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Module Destinations */}
      <section aria-label="Available modules">
        <div
          className="flex items-center justify-between mb-5 animate-fade-in-up"
          style={{ animationDelay: "160ms" }}
        >
          <div>
            <span className="font-mono text-[10px] tracking-[0.25em] text-dim uppercase block mb-1.5">
              Explore Modules
            </span>
            <h3 className="font-display text-lg sm:text-xl italic text-cream">
              Where would you like to go?
            </h3>
          </div>
          <span className="font-mono text-[10px] text-dim hidden sm:block">
            {MODULE_DESTINATIONS.length} module{MODULE_DESTINATIONS.length !== 1 ? "s" : ""} available
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 xl:gap-6">
          {MODULE_DESTINATIONS.map((destination, index) => (
            <div key={destination.id} className="bg-edge p-px">
              <DestinationCard
                destination={destination}
                index={index}
                onNavigate={handleNavigate}
              />
            </div>
          ))}
        </div>
      </section>

      {/* Footer Note */}
      <section
        className="mt-10 pt-6 border-t border-edge animate-fade-in-up"
        style={{ animationDelay: "400ms" }}
        aria-label="Architecture details"
      >
        <div className="text-center max-w-2xl mx-auto">
          <span className="font-mono text-[10px] tracking-[0.25em] text-dim uppercase block mb-2">
            How It Works
          </span>
          <p className="text-stone text-xs sm:text-sm leading-relaxed mb-4">
            Each module above is a standalone React application served from its own development server.
            The shell orchestrates routing, theme state, and inter-module communication through
            custom events and shared React context.
          </p>
          <div className="flex flex-wrap justify-center gap-4 font-mono text-[10px] tracking-wider text-dim uppercase">
            <span>Independent Builds</span>
            <span className="text-edge-bright">/</span>
            <span>Shared Dependencies</span>
            <span className="text-edge-bright">/</span>
            <span>Runtime Integration</span>
            <span className="text-edge-bright">/</span>
            <span>Fault Isolation</span>
          </div>
        </div>
      </section>
    </div>
  );
}

Home.displayName = "Home";

export default Home;
