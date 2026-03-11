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
    <nav className="mt-6" data-testid="breadcrumb-nav">
      <div className="flex items-center gap-1 text-sm overflow-x-auto pb-1 scrollbar-hide">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => onNavigate(0)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap ${
            currentLevel === 0
              ? "bg-primary/10 text-primary font-medium"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
          }`}
          data-testid="breadcrumb-root"
        >
          <Home className="w-3.5 h-3.5" />
          Cogito
        </motion.button>

        {path.map((node, index) => (
          <div key={node.id} className="flex items-center gap-1">
            <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/50 flex-shrink-0" />
            <motion.button
              initial={{ opacity: 0, x: -5 }}
              animate={{ opacity: 1, x: 0 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onNavigate(index + 1)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap ${
                index === path.length - 1
                  ? "bg-primary/10 text-primary font-medium"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              }`}
              data-testid={`breadcrumb-item-${node.id}`}
            >
              <span className="text-[10px] font-mono opacity-50">
                L{node.level}
              </span>
              {node.title}
            </motion.button>
          </div>
        ))}

        {currentLevel > 0 && (
          <div className="ml-2 flex items-center">
            <span className="text-[10px] font-mono text-muted-foreground bg-muted/50 px-2 py-0.5 rounded">
              {LEVEL_NAMES[currentLevel]}
            </span>
          </div>
        )}
      </div>

      <div className="mt-3 flex gap-0.5" data-testid="level-indicator">
        {LEVEL_NAMES.map((name, i) => (
          <div
            key={name}
            className="relative group flex-1"
          >
            <div
              className={`h-1 rounded-full transition-all duration-300 ${
                i <= currentLevel
                  ? "bg-primary"
                  : "bg-muted"
              }`}
              style={{
                opacity: i <= currentLevel ? 1 - i * 0.08 : 0.3,
              }}
            />
            <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
              <span className="text-[10px] text-muted-foreground whitespace-nowrap bg-popover px-1.5 py-0.5 rounded shadow-sm border border-border">
                {name}
              </span>
            </div>
          </div>
        ))}
      </div>
    </nav>
  );
}
