import React, { useState, useEffect } from "react";
import { 
  User, 
  Building2, 
  MapPin, 
  Zap, 
  Loader2, 
  CheckCircle2,
  X,
  Send,
  Linkedin,
  Briefcase,
  Rocket,
  MessageSquare,
  Search,
  Globe
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { SingleSelect } from "./SingleSelect";
import { geoService } from "../services/geoService";
import axios from "axios";
import { LeadFormData, SourceType } from "../types";

const INITIAL_SOURCE_DATA: LeadFormData = {
  keywords: "",
  location: {
    country: "",
    region: "",
    city: ""
  },
  job_titles: "",
  seniority_level: "",
  industries: "",
  company_size: "",
  revenue_range: "",
  founded_after: "",
  skills: "",
  budget_range: "",
  job_type: "Fixed",
  batch: "",
  stage: "",
  subreddits: "",
  min_karma: ""
};

const INITIAL_DATA: Record<SourceType, LeadFormData> = {
  Linkedin: { ...INITIAL_SOURCE_DATA },
  Upwork: { ...INITIAL_SOURCE_DATA },
  Ycombinator: { ...INITIAL_SOURCE_DATA },
  Reddit: { ...INITIAL_SOURCE_DATA }
};

const SOURCES = [
  { id: "Linkedin" as SourceType, name: "LinkedIn", color: "bg-blue-600", icon: <Linkedin size={18} />, description: "B2B professionals & companies" },
  { id: "Upwork" as SourceType, name: "Upwork", color: "bg-emerald-600", icon: <Briefcase size={18} />, description: "Freelance projects & clients" },
  { id: "Ycombinator" as SourceType, name: "Y Combinator", color: "bg-orange-600", icon: <Rocket size={18} />, description: "Startups & founders" },
  { id: "Reddit" as SourceType, name: "Reddit", color: "bg-red-600", icon: <MessageSquare size={18} />, description: "Communities & discussions" }
];

export const LeadForm: React.FC = () => {
  const [activeSource, setActiveSource] = useState<string>("LinkedIn");
  const [formData, setFormData] = useState<LeadFormData>(INITIAL_SOURCE_DATA);
  
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
    const commonValid = formData.location.country.trim() !== "";
    
    switch (activeSource.toLowerCase()) {
      case "linkedin":
        return commonValid && (formData.job_titles?.trim() !== "" && formData.industries?.trim() !== "");
      case "upwork":
        return commonValid && formData.skills?.trim() !== "";
      case "ycombinator":
        return commonValid && formData.industries?.trim() !== "";
      case "reddit":
        return commonValid && formData.subreddits?.trim() !== "";
      default:
        return commonValid;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);
    
    if (!validateForm()) {
      setValidationError(`Please fill in all required fields for ${activeSource}.`);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    
    setIsSending(true);
    setShowResults(false);
    setError(null);
    
    try {
      const payload = {
        source: activeSource,
        ...formData,
        // Process arrays if they exist
        job_titles: formData.job_titles?.split(",").map(t => t.trim()).filter(t => t) || [],
        seniority_level: formData.seniority_level?.split(",").map(t => t.trim()).filter(t => t) || [],
        keywords: formData.keywords?.split(",").map(t => t.trim()).filter(t => t) || [],
        industries: formData.industries?.split(",").map(t => t.trim()).filter(t => t) || [],
        skills: formData.skills?.split(",").map(t => t.trim()).filter(t => t) || [],
        subreddits: formData.subreddits?.split(",").map(t => t.trim()).filter(t => t) || [],
      };

      // Call the webhook directly to ensure compatibility with static hosting like Vercel
      const WEBHOOK_URL = "https://n8n-brum.srv1463595.hstgr.cloud/webhook/e1a5cdf5-7bf5-45a2-b642-ceca88537657";
      await axios.post(WEBHOOK_URL, payload, {
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12 bg-mesh min-h-screen">
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
          Define precise targeting criteria and select your preferred platforms for lead discovery.
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

      <div className="max-w-4xl mx-auto space-y-8">
        {/* Source Platform Selection */}
        <Section title="Source Platform" icon={<Globe size={18} className="text-indigo-600" />}>
          <div className="space-y-4">
            <p className="text-sm text-zinc-500">Enter the platform you want to search leads from (e.g., LinkedIn, Twitter, Reddit, etc.)</p>
            <div>
              <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2">Target Platform <span className="text-red-500">*</span></label>
              <input
                type="text"
                value={activeSource}
                onChange={(e) => setActiveSource(e.target.value)}
                placeholder="e.g. LinkedIn, Twitter, Reddit"
                className="w-full bg-zinc-50/50 border border-zinc-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
                required
              />
            </div>
          </div>
        </Section>

        {/* Main Content: Form */}
        <form onSubmit={handleSubmit} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-8">
                {/* Section 1: Source Specific Targeting */}
                <Section 
                  title="Leads Targeting" 
                  icon={SOURCES.find(s => s.id.toLowerCase() === activeSource.toLowerCase())?.icon || <Search size={18} className="text-indigo-600" />}
                >
                  <div className="space-y-6">
                    {activeSource.toLowerCase() === "linkedin" && (
                      <>
                        <div>
                          <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2">Job Titles <span className="text-red-500">*</span></label>
                          <input
                            type="text"
                            name="job_titles"
                            value={formData.job_titles}
                            onChange={handleInputChange}
                            placeholder="CEO, Founder, Co-Founder"
                            className="w-full bg-zinc-50/50 border border-zinc-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2">Seniority Level</label>
                          <input
                            type="text"
                            name="seniority_level"
                            value={formData.seniority_level}
                            onChange={handleInputChange}
                            placeholder="Owner, Director, C-Level"
                            className="w-full bg-zinc-50/50 border border-zinc-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
                          />
                        </div>
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
                      </>
                    )}

                    {activeSource.toLowerCase() === "upwork" && (
                      <>
                        <div>
                          <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2">Required Skills <span className="text-red-500">*</span></label>
                          <input
                            type="text"
                            name="skills"
                            value={formData.skills}
                            onChange={handleInputChange}
                            placeholder="React, Node.js, Python"
                            className="w-full bg-zinc-50/50 border border-zinc-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2">Job Type</label>
                          <select
                            name="job_type"
                            value={formData.job_type}
                            onChange={handleInputChange}
                            className="w-full bg-zinc-50/50 border border-zinc-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
                          >
                            <option value="Fixed">Fixed Price</option>
                            <option value="Hourly">Hourly</option>
                            <option value="Both">Both</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2">Budget Range</label>
                          <input
                            type="text"
                            name="budget_range"
                            value={formData.budget_range}
                            onChange={handleInputChange}
                            placeholder="e.g. $1000 - $5000"
                            className="w-full bg-zinc-50/50 border border-zinc-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
                          />
                        </div>
                      </>
                    )}

                    {activeSource.toLowerCase() === "ycombinator" && (
                      <>
                        <div>
                          <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2">YC Batch</label>
                          <input
                            type="text"
                            name="batch"
                            value={formData.batch}
                            onChange={handleInputChange}
                            placeholder="W24, S23, All"
                            className="w-full bg-zinc-50/50 border border-zinc-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2">Industries <span className="text-red-500">*</span></label>
                          <input
                            type="text"
                            name="industries"
                            value={formData.industries}
                            onChange={handleInputChange}
                            placeholder="AI, B2B, Consumer"
                            className="w-full bg-zinc-50/50 border border-zinc-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2">Company Stage</label>
                          <input
                            type="text"
                            name="stage"
                            value={formData.stage}
                            onChange={handleInputChange}
                            placeholder="Early, Growth, Public"
                            className="w-full bg-zinc-50/50 border border-zinc-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
                          />
                        </div>
                      </>
                    )}

                    {activeSource.toLowerCase() === "reddit" && (
                      <>
                        <div>
                          <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2">Subreddits <span className="text-red-500">*</span></label>
                          <input
                            type="text"
                            name="subreddits"
                            value={formData.subreddits}
                            onChange={handleInputChange}
                            placeholder="r/startups, r/saas"
                            className="w-full bg-zinc-50/50 border border-zinc-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2">Minimum User Karma</label>
                          <input
                            type="number"
                            name="min_karma"
                            value={formData.min_karma}
                            onChange={handleInputChange}
                            placeholder="100"
                            className="w-full bg-zinc-50/50 border border-zinc-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
                          />
                        </div>
                      </>
                    )}
                  </div>
                </Section>

                {/* Section 2: Common Filters */}
                <Section title="General Filters" icon={<Search size={18} className="text-indigo-600" />}>
                  <div className="space-y-6">
                    <div>
                      <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2">Keywords</label>
                      <input
                        type="text"
                        name="keywords"
                        value={formData.keywords}
                        onChange={handleInputChange}
                        placeholder="AI, Automation, Remote"
                        className="w-full bg-zinc-50/50 border border-zinc-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
                      />
                    </div>
                    {activeSource.toLowerCase() === "linkedin" && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2">Company Size</label>
                          <input
                            type="text"
                            name="company_size"
                            value={formData.company_size}
                            onChange={handleInputChange}
                            placeholder="1-10, 11-50"
                            className="w-full bg-zinc-50/50 border border-zinc-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2">Revenue Range</label>
                          <input
                            type="text"
                            name="revenue_range"
                            value={formData.revenue_range}
                            onChange={handleInputChange}
                            placeholder="$1M - $10M"
                            className="w-full bg-zinc-50/50 border border-zinc-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </Section>
              </div>

              <div className="space-y-8">
                {/* Section 3: Location Filters */}
                <Section title="Location Targeting" icon={<Globe size={18} className="text-indigo-600" />}>
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
            </div>

      <div className="pt-8">
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
