import React, { useState, useEffect } from "react";
import { 
  User, 
  Building2, 
  MapPin, 
  Zap, 
  Loader2, 
  CheckCircle2,
  X,
  Send
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { SingleSelect } from "./SingleSelect";
import { geoService } from "../services/geoService";
import axios from "axios";
import { LeadFormData } from "../types";

const INITIAL_DATA: LeadFormData = {
  job_titles: "",
  seniority_level: "",
  keywords: "",
  industries: "",
  company_size: "",
  revenue_range: "",
  founded_after: "",
  location: {
    country: "",
    region: "",
    city: ""
  }
};

export const LeadForm: React.FC = () => {
  const [formData, setFormData] = useState<LeadFormData>(INITIAL_DATA);
  const [isSending, setIsSending] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  const [countries, setCountries] = useState<string[]>([]);
  const [states, setStates] = useState<string[]>([]);
  const [cities, setCities] = useState<string[]>([]);
  const [isLoadingGeo, setIsLoadingGeo] = useState({ countries: false, states: false, cities: false });

  useEffect(() => {
    const fetchCountries = async () => {
      setIsLoadingGeo(prev => ({ ...prev, countries: true }));
      const data = await geoService.getCountries();
      setCountries(data);
      setIsLoadingGeo(prev => ({ ...prev, countries: false }));
    };
    fetchCountries();
  }, []);

  useEffect(() => {
    const fetchStates = async () => {
      if (formData.location.country) {
        setIsLoadingGeo(prev => ({ ...prev, states: true }));
        const data = await geoService.getStates(formData.location.country);
        setStates(data);
        setIsLoadingGeo(prev => ({ ...prev, states: false }));
      } else {
        setStates([]);
      }
    };
    fetchStates();
  }, [formData.location.country]);

  useEffect(() => {
    const fetchCities = async () => {
      if (formData.location.country && formData.location.region) {
        setIsLoadingGeo(prev => ({ ...prev, cities: true }));
        const data = await geoService.getCities(formData.location.country, formData.location.region);
        setCities(data);
        setIsLoadingGeo(prev => ({ ...prev, cities: false }));
      } else {
        setCities([]);
      }
    };
    fetchCities();
  }, [formData.location.country, formData.location.region]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (name.startsWith("location.")) {
      const field = name.split(".")[1];
      
      setFormData(prev => {
        const newLocation = { ...prev.location, [field]: value };
        
        // Reset dependent fields
        if (field === "country") {
          newLocation.region = "";
          newLocation.city = "";
        } else if (field === "region") {
          newLocation.city = "";
        }
        
        return { ...prev, location: newLocation };
      });
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSingleSelectChange = (name: string, value: string) => {
    if (name.startsWith("location.")) {
      const field = name.split(".")[1];
      setFormData(prev => {
        const newLocation = { ...prev.location, [field]: value };
        if (field === "country") {
          newLocation.region = "";
          newLocation.city = "";
        } else if (field === "region") {
          newLocation.city = "";
        }
        return { ...prev, location: newLocation };
      });
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const validateForm = () => {
    return (
      formData.job_titles.trim() !== "" &&
      formData.industries.trim() !== "" &&
      formData.location.country.trim() !== "" &&
      formData.company_size.trim() !== ""
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);
    
    if (!validateForm()) {
      setValidationError("Please fill in all required fields: Job Titles, Industry, Country, and Company Size.");
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    
    setIsSending(true);
    setShowResults(false);
    setError(null);
    
    try {
      // Convert strings to arrays for the webhook if needed
      const payload = {
        ...formData,
        job_titles: formData.job_titles.split(",").map(t => t.trim()).filter(t => t),
        seniority_level: formData.seniority_level.split(",").map(t => t.trim()).filter(t => t),
        keywords: formData.keywords.split(",").map(t => t.trim()).filter(t => t),
        industries: formData.industries.split(",").map(t => t.trim()).filter(t => t),
        company_size: formData.company_size.split(",").map(t => t.trim()).filter(t => t),
      };

      // Call the local proxy route to bypass CORS issues
      await axios.post("/api/submit-leads", payload, {
        headers: { 'Content-Type': 'application/json' }
      });
      
      setShowResults(true);
    } catch (err: any) {
      console.error("Webhook error:", err);
      let errorMessage = "Failed to connect to webhook. Please check the URL and CORS settings.";
      
      if (err.response?.data) {
        errorMessage = typeof err.response.data === 'string' 
          ? err.response.data 
          : JSON.stringify(err.response.data);
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
      setShowResults(true);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12 bg-mesh min-h-screen">
      <header className="text-center space-y-4 max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 text-indigo-600 text-xs font-bold uppercase tracking-widest border border-indigo-100"
        >
          <Zap size={14} />
          Lead Generation Engine
        </motion.div>
        <h1 className="text-4xl sm:text-5xl font-black text-zinc-900 tracking-tight leading-tight">
          Find Your Ideal <span className="text-gradient">Target Leads</span>
        </h1>
        <p className="text-zinc-500 text-lg">
          Define precise targeting criteria to generate high-quality CEO leads for LinkedIn outreach.
        </p>
      </header>

      <AnimatePresence>
        {validationError && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="max-w-2xl mx-auto p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-700 text-sm font-medium"
          >
            <X size={18} className="shrink-0" />
            {validationError}
            <button 
              onClick={() => setValidationError(null)}
              className="ml-auto p-1 hover:bg-red-100 rounded-lg transition-colors"
            >
              <X size={14} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-8">
          {/* Section 1: Target Person */}
          <Section title="Target Person" icon={<User size={18} className="text-indigo-600" />}>
            <div className="space-y-6">
              <div>
                <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2">Job Titles <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  name="job_titles"
                  value={formData.job_titles}
                  onChange={handleInputChange}
                  placeholder="CEO, Founder, Co-Founder, Managing Director"
                  className="w-full bg-zinc-50/50 border border-zinc-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
                  required
                />
                <p className="mt-2 text-[10px] text-zinc-400 font-medium">Separate multiple titles with commas.</p>
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2">Seniority Level</label>
                <input
                  type="text"
                  name="seniority_level"
                  value={formData.seniority_level}
                  onChange={handleInputChange}
                  placeholder="Owner, Founder, C-Level, Director"
                  className="w-full bg-zinc-50/50 border border-zinc-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
                />
                <p className="mt-2 text-[10px] text-zinc-400 font-medium">Separate multiple levels with commas.</p>
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2">Profile Keywords</label>
                <input
                  type="text"
                  name="keywords"
                  value={formData.keywords}
                  onChange={handleInputChange}
                  placeholder="AI, Ecommerce, SaaS"
                  className="w-full bg-zinc-50/50 border border-zinc-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
                />
              </div>
            </div>
          </Section>

          {/* Section 2: Company Information */}
          <Section title="Company Information" icon={<Building2 size={18} className="text-indigo-600" />}>
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2">Industries <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    name="industries"
                    value={formData.industries}
                    onChange={handleInputChange}
                    placeholder="SaaS, Ecommerce, Fintech"
                    className="w-full bg-zinc-50/50 border border-zinc-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2">Company Size <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    name="company_size"
                    value={formData.company_size}
                    onChange={handleInputChange}
                    placeholder="1-10, 11-50, 51-200, 500+"
                    className="w-full bg-zinc-50/50 border border-zinc-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2">Estimated Revenue</label>
                  <input
                    type="text"
                    name="revenue_range"
                    value={formData.revenue_range}
                    onChange={handleInputChange}
                    placeholder="e.g. $1M - $10M"
                    className="w-full bg-zinc-50/50 border border-zinc-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2">Founded After</label>
                  <input
                    type="number"
                    name="founded_after"
                    value={formData.founded_after}
                    onChange={handleInputChange}
                    placeholder="e.g. 2018"
                    className="w-full bg-zinc-50/50 border border-zinc-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
                  />
                </div>
              </div>
            </div>
          </Section>
        </div>

        <div className="space-y-8">
          {/* Section 3: Location Filters */}
          <Section title="Location Filters" icon={<MapPin size={18} className="text-indigo-600" />}>
            <div className="space-y-6">
              <SingleSelect
                label="Country"
                required
                options={countries}
                value={formData.location.country}
                onChange={(val) => handleSingleSelectChange("location.country", val)}
                isLoading={isLoadingGeo.countries}
                placeholder="Select country..."
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <SingleSelect
                  label="Region / State"
                  options={states}
                  value={formData.location.region}
                  onChange={(val) => handleSingleSelectChange("location.region", val)}
                  isLoading={isLoadingGeo.states}
                  disabled={!formData.location.country}
                  placeholder={formData.location.country ? "Select state..." : "Select country first"}
                />
                <SingleSelect
                  label="City"
                  options={cities}
                  value={formData.location.city}
                  onChange={(val) => handleSingleSelectChange("location.city", val)}
                  isLoading={isLoadingGeo.cities}
                  disabled={!formData.location.region}
                  placeholder={formData.location.region ? "Select city..." : "Select state first"}
                />
              </div>
            </div>
          </Section>
        </div>

        <div className="lg:col-span-2 pt-8">
          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            type="submit"
            disabled={isSending}
            className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-bold py-4 rounded-2xl shadow-xl shadow-indigo-500/25 hover:shadow-indigo-500/40 transition-all flex items-center justify-center gap-3 disabled:opacity-70 disabled:cursor-not-allowed text-lg"
          >
            {isSending ? (
              <>
                <Loader2 size={24} className="animate-spin" />
                Sending to Webhook...
              </>
            ) : (
              <>
                <Send size={24} />
                Submit Lead Criteria
              </>
            )}
          </motion.button>
        </div>
      </form>

      {/* Results Display */}
      <AnimatePresence>
        {showResults && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className={`max-w-2xl mx-auto p-6 rounded-3xl shadow-xl border flex items-center justify-between gap-4 ${
              error ? 'bg-red-50 border-red-100 text-red-800' : 'bg-emerald-50 border-emerald-100 text-emerald-800'
            }`}
          >
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${
                error ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'
              }`}>
                {error ? <X size={24} /> : <CheckCircle2 size={24} />}
              </div>
              <div>
                <h3 className="text-lg font-bold">{error ? 'Submission Failed' : 'Submission Successful'}</h3>
                <p className="text-sm opacity-80">
                  {error ? error : 'Your lead criteria have been sent to the workflow successfully.'}
                </p>
              </div>
            </div>
            <button 
              onClick={() => setShowResults(false)}
              className={`p-2 rounded-full transition-colors ${
                error ? 'hover:bg-red-100 text-red-400' : 'hover:bg-emerald-100 text-emerald-400'
              }`}
            >
              <X size={20} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

interface SectionProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}

const Section: React.FC<SectionProps> = ({ title, icon, children }) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    className="bg-white border border-zinc-200 rounded-3xl shadow-sm hover:shadow-md transition-shadow duration-300 relative"
  >
    <div className="px-8 py-5 border-b border-zinc-100 bg-zinc-50/30 flex items-center gap-4">
      <div className="p-2 rounded-xl bg-white border border-zinc-100 shadow-sm">
        {icon}
      </div>
      <h2 className="text-sm font-black text-zinc-800 uppercase tracking-widest">{title}</h2>
    </div>
    <div className="p-8">
      {children}
    </div>
  </motion.div>
);
