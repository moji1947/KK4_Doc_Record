import * as React from "react";
import { ChevronDown, Check, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ComboboxOption {
  code: string;
  description: string;
  subText?: string;
  disabled?: boolean;
}

interface CodeDescriptionComboboxProps {
  options: ComboboxOption[];
  value?: string;
  onChange: (code: string) => void;
  placeholder?: string;
  label?: string;
  error?: string;
  disabled?: boolean;
  className?: string;
  required?: boolean;
}

/**
 * Reusable CodeDescriptionCombobox Component
 * UX Requirement:
 * - ตอนเปิดดรอปดาวน์เลือก: แสดงรหัส + คำอธิบายเต็ม (เช่น "FD — Fabrication Drawing")
 * - หลังเลือกเสร็จแล้ว: ในช่องแสดงเฉพาะรหัสสั้นๆ (เช่น "FD")
 */
export function CodeDescriptionCombobox({
  options,
  value,
  onChange,
  placeholder = "Select...",
  label,
  error,
  disabled = false,
  className,
  required = false,
}: CodeDescriptionComboboxProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const containerRef = React.useRef<HTMLDivElement>(null);
  const searchInputRef = React.useRef<HTMLInputElement>(null);

  const selectedOption = options.find((opt) => opt.code === value);

  // Close dropdown when clicked outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Auto focus search input when opened
  React.useEffect(() => {
    if (isOpen && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 50);
    } else {
      setSearch("");
    }
  }, [isOpen]);

  const filteredOptions = options.filter(
    (opt) =>
      opt.code.toLowerCase().includes(search.toLowerCase()) ||
      opt.description.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className={cn("relative flex flex-col space-y-1.5", className)} ref={containerRef}>
      {label && (
        <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
      )}

      {/* Selected Box: Shows ONLY the short CODE */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={cn(
          "flex h-10 w-full items-center justify-between rounded-lg border bg-slate-900/90 px-3 py-2 text-sm text-left transition-all",
          isOpen
            ? "border-scg-500 ring-2 ring-scg-500/20"
            : "border-slate-700 hover:border-slate-600",
          error && "border-rose-500 ring-rose-500/20",
          disabled && "opacity-50 cursor-not-allowed bg-slate-900/40"
        )}
      >
        <span
          className={cn(
            "font-mono font-medium truncate",
            selectedOption ? "text-slate-100 font-semibold" : "text-slate-500 font-sans"
          )}
        >
          {selectedOption ? selectedOption.code : placeholder}
        </span>
        <ChevronDown
          className={cn(
            "h-4 w-4 text-slate-400 transition-transform duration-200",
            isOpen && "rotate-180 text-scg-400"
          )}
        />
      </button>

      {/* Floating Popover: Shows CODE — FULL DESCRIPTION */}
      {isOpen && (
        <div className="absolute top-full left-0 z-50 mt-1 w-full min-w-[280px] rounded-lg border border-slate-700 bg-slate-900 p-2 shadow-2xl backdrop-blur-xl animate-in fade-in-50 zoom-in-95 duration-100">
          {/* Quick Search */}
          <div className="relative mb-2">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <input
              ref={searchInputRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search code or description..."
              className="h-8 w-full rounded-md border border-slate-700 bg-slate-950 pl-8 pr-7 text-xs text-slate-100 placeholder:text-slate-500 focus:border-scg-500 focus:outline-none"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-2 top-2 text-slate-400 hover:text-slate-200"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Options List */}
          <div className="max-h-56 overflow-y-auto space-y-0.5 pr-1">
            {filteredOptions.length === 0 ? (
              <div className="px-3 py-4 text-center text-xs text-slate-500">
                No matching items found
              </div>
            ) : (
              filteredOptions.map((opt) => {
                const isSelected = opt.code === value;
                return (
                  <button
                    key={opt.code}
                    type="button"
                    disabled={opt.disabled}
                    onClick={() => {
                      onChange(opt.code);
                      setIsOpen(false);
                    }}
                    className={cn(
                      "flex w-full items-center justify-between rounded-md px-2.5 py-2 text-xs text-left transition-colors",
                      isSelected
                        ? "bg-scg-red/20 text-scg-200 font-semibold"
                        : "text-slate-200 hover:bg-slate-800",
                      opt.disabled && "opacity-40 cursor-not-allowed hover:bg-transparent"
                    )}
                  >
                    <div className="flex flex-col pr-2">
                      <div className="flex items-center space-x-2">
                        <span className="font-mono font-bold text-slate-100 text-xs bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700">
                          {opt.code}
                        </span>
                        <span className="text-slate-300 font-medium text-xs">
                          {opt.description}
                        </span>
                      </div>
                      {opt.subText && (
                        <span className="text-[10px] text-slate-400 mt-0.5 ml-0.5">
                          {opt.subText}
                        </span>
                      )}
                    </div>
                    {isSelected && <Check className="h-4 w-4 text-scg-400 shrink-0" />}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}

      {error && <p className="text-xs text-rose-400 font-medium">{error}</p>}
    </div>
  );
}
