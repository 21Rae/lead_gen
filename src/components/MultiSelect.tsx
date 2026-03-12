import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { SelectOption } from "../types";

interface MultiSelectProps {
  options: SelectOption[];
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  label?: string;
}

export const MultiSelect: React.FC<MultiSelectProps> = ({
  options,
  value,
  onChange,
  placeholder = "Select options...",
  label,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleOption = (optionValue: string) => {
    const newValue = value.includes(optionValue)
      ? value.filter((v) => v !== optionValue)
      : [...value, optionValue];
    onChange(newValue);
  };

  const removeOption = (optionValue: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(value.filter((v) => v !== optionValue));
  };

  return (
    <div className="w-full" ref={containerRef}>
      {label && <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">{label}</label>}
      <div className="relative">
        <div
          className="min-h-[46px] w-full bg-white border border-zinc-200 rounded-xl px-4 py-2 flex flex-wrap gap-2 items-center cursor-pointer hover:border-indigo-400 hover:shadow-sm transition-all duration-200 group"
          onClick={() => setIsOpen(!isOpen)}
        >
          {value.length === 0 && (
            <span className="text-zinc-400 text-sm select-none">{placeholder}</span>
          )}
          <AnimatePresence>
            {value.map((v) => {
              const option = options.find((o) => o.value === v);
              return (
                <motion.span
                  key={v}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="inline-flex items-center gap-1.5 bg-indigo-50 text-indigo-700 text-xs font-semibold px-2.5 py-1 rounded-lg border border-indigo-100 group-hover:bg-indigo-100/50 transition-colors"
                >
                  {option?.label || v}
                  <X
                    size={14}
                    className="cursor-pointer hover:text-indigo-900 p-0.5 rounded-full hover:bg-indigo-200/50 transition-colors"
                    onClick={(e) => removeOption(v, e)}
                  />
                </motion.span>
              );
            })}
          </AnimatePresence>
          <div className="ml-auto pl-2">
            <ChevronDown 
              size={18} 
              className={`text-zinc-400 group-hover:text-indigo-500 transition-all duration-300 ${isOpen ? "rotate-180 text-indigo-600" : ""}`} 
            />
          </div>
        </div>

        <AnimatePresence>
          {isOpen && (
            <motion.div 
              initial={{ opacity: 0, y: 10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.98 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="absolute z-50 w-full mt-2 bg-white border border-zinc-200 rounded-xl shadow-xl max-h-64 overflow-hidden flex flex-col"
            >
              <div className="overflow-y-auto py-1.5">
                {options.map((option) => (
                  <div
                    key={option.value}
                    className={`px-4 py-2.5 text-sm cursor-pointer hover:bg-indigo-50/50 flex items-center gap-3 transition-colors ${
                      value.includes(option.value) ? "bg-indigo-50/30 font-semibold text-indigo-700" : "text-zinc-600"
                    }`}
                    onClick={() => toggleOption(option.value)}
                  >
                    <div className={`w-5 h-5 border rounded-md flex items-center justify-center transition-all ${
                      value.includes(option.value) ? "bg-indigo-600 border-indigo-600 shadow-sm" : "border-zinc-300 bg-zinc-50"
                    }`}>
                      {value.includes(option.value) && (
                        <motion.div 
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="w-2 h-2 bg-white rounded-full shadow-sm" 
                        />
                      )}
                    </div>
                    {option.label}
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
