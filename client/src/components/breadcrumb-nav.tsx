import { type KnowledgeNode, LEVEL_NAMES } from "@shared/schema";
import { ChevronRight, Home } from "lucide-react";
import { motion } from "framer-motion";

interface BreadcrumbNavProps {
  path: KnowledgeNode[];
  currentLevel: number;
  onNavigate: (index: number) => void;
}

export function BreadcrumbNav({ path, currentLevel, onNavigate }: BreadcrumbNavProps) {
  return (
    <nav className="flex max-w-full items-center gap-1 overflow-x-auto p-1 bg-background/40 backdrop-blur-3xl border border-foreground/10" data-testid="breadcrumb-nav">
      <button
        onClick={() => onNavigate(0)}
        className="p-2 text-foreground/40 hover:text-foreground transition-all"
        data-testid="breadcrumb-root"
      >
        <Home className="w-3.5 h-3.5" />
      </button>

      {path.map((node, index) => (
        <div key={node.id} className="flex items-center">
          <div className="text-[8px] opacity-20 mx-1">/</div>
          <button
            onClick={() => onNavigate(index + 1)}
            className={`px-3 py-1.5 text-[9px] font-black uppercase tracking-widest transition-all ${
              index === path.length - 1
                ? "text-foreground bg-foreground/5"
                : "text-foreground/40 hover:text-foreground"
            } whitespace-nowrap`}
            data-testid={`breadcrumb-item-${node.id}`}
          >
            {node.title.toUpperCase().slice(0, 15)}
          </button>
        </div>
      ))}
    </nav>
  );
}
