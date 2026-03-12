import React, { useState, useRef, useEffect, useMemo } from "react";
import { ChevronDown, Search, X, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface SingleSelectProps {
  options: string[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  disabled?: boolean;
  isLoading?: boolean;
  required?: boolean;
}

export const SingleSelect: React.FC<SingleSelectProps> = ({
  options,
  value,
  onChange,
  placeholder = "Select an option...",
  label,
  disabled = false,
  isLoading = false,
  required = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredOptions = useMemo(() => {
    if (!searchTerm) return options;
    return options.filter((opt) =>
      opt.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [options, searchTerm]);

  const handleSelect = (option: string) => {
    onChange(option);
    setIsOpen(false);
    setSearchTerm("");
  };

  const clearSelection = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange("");
    setSearchTerm("");
  };

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  return (
    <div className="w-full" ref={containerRef}>
      {label && (
        <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2 flex items-center gap-2">
          {label} {required && <span className="text-red-500">*</span>}
          {isLoading && <Loader2 size={12} className="animate-spin text-indigo-500" />}
        </label>
      )}
      <div className="relative">
        <div
          className={`min-h-[46px] w-full bg-zinc-50/50 border border-zinc-200 rounded-xl px-4 py-3 flex items-center gap-2 cursor-pointer transition-all duration-200 group ${
            disabled ? "opacity-50 cursor-not-allowed" : "hover:border-indigo-400 hover:shadow-sm"
          } ${isOpen ? "ring-4 ring-indigo-500/10 border-indigo-500 bg-white" : ""}`}
          onClick={() => !disabled && setIsOpen(!isOpen)}
        >
          <div className="flex-1 truncate text-sm">
            {value ? (
              <span className="text-zinc-900 font-medium">{value}</span>
            ) : (
              <span className="text-zinc-400">{placeholder}</span>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            {value && !disabled && (
              <X
                size={16}
                className="text-zinc-300 hover:text-zinc-500 transition-colors"
                onClick={clearSelection}
              />
            )}
            <ChevronDown
              size={18}
              className={`text-zinc-400 transition-transform duration-300 ${
                isOpen ? "rotate-180 text-indigo-600" : "group-hover:text-indigo-500"
              }`}
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
              className="absolute z-[100] w-full mt-2 bg-white border border-zinc-200 rounded-2xl shadow-2xl overflow-hidden flex flex-col"
            >
              <div className="p-2 border-b border-zinc-50">
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                  <input
                    ref={inputRef}
                    type="text"
                    className="w-full bg-zinc-50 border-none rounded-lg pl-9 pr-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
                    placeholder="Search..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
              </div>

              <div className="max-h-60 overflow-y-auto py-1 scrollbar-thin scrollbar-thumb-zinc-200 scrollbar-track-transparent">
                {filteredOptions.length > 0 ? (
                  filteredOptions.map((option) => (
                    <div
                      key={option}
                      className={`px-4 py-2.5 text-sm cursor-pointer hover:bg-indigo-50/50 flex items-center justify-between transition-colors ${
                        value === option ? "bg-indigo-50/30 font-semibold text-indigo-700" : "text-zinc-600"
                      }`}
                      onClick={() => handleSelect(option)}
                    >
                      {option}
                      {value === option && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="w-1.5 h-1.5 bg-indigo-600 rounded-full"
                        />
                      )}
                    </div>
                  ))
                ) : (
                  <div className="px-4 py-8 text-center text-zinc-400 text-xs italic">
                    No results found
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
