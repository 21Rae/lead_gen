import React, { useState, useEffect } from "react";
import { 
  User, 
  Building2, 
  MapPin, 
  Zap, 
  Settings, 
  Search, 
  Save, 
  Loader2, 
  CheckCircle2,
  Trash2,
  Plus,
  ChevronDown,
  X,
  Briefcase,
  Download,
  Globe,
  Send
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import axios from "axios";
import { LeadFormData, SavedTemplate } from "../types";
import { 
  SENIORITY_LEVELS, 
  INDUSTRIES, 
  COMPANY_SIZES, 
  REVENUE_RANGES, 
  TECH_STACKS, 
  GROWTH_SIGNALS, 
  LEAD_LIMITS
} from "../constants";
import { MultiSelect } from "./MultiSelect";
import { SingleSelect } from "./SingleSelect";
import { geoService } from "../services/geoService";

const INITIAL_DATA: LeadFormData = {
  job_titles: "",
  seniority_level: [],
  keywords: "",
  industries: [],
  company_size: [],
  revenue_range: "",
  founded_after: "",
  location: {
    country: "",
    region: "",
    city: ""
  },
  tech_stack: [],
  signals: [],
  lead_limit: 50,
  service_offered: "",
  problem_solved: "",
  business_details: {
    name: "",
    description: "",
    target_audience: "",
    usp: ""
  }
};

export const LeadForm: React.FC = () => {
  const [formData, setFormData] = useState<LeadFormData>(INITIAL_DATA);
  const [isSending, setIsSending] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [savedTemplates, setSavedTemplates] = useState<SavedTemplate[]>([]);
  const [templateName, setTemplateName] = useState("");
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [csvData, setCsvData] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [webhookUrl, setWebhookUrl] = useState("https://n8n-brum.srv1463595.hstgr.cloud/webhook/e1a5cdf5-7bf5-45a2-b642-ceca88537657");
  const [showWebhookSettings, setShowWebhookSettings] = useState(false);
  const [isTestingWebhook, setIsTestingWebhook] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

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

  useEffect(() => {
    const saved = localStorage.getItem("leadgen_templates");
    if (saved) {
      setSavedTemplates(JSON.parse(saved));
    }
  }, []);

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
    } else if (name.startsWith("business_details.")) {
      const field = name.split(".")[1];
      setFormData(prev => ({
        ...prev,
        business_details: {
          ...prev.business_details!,
          [field]: value
        }
      }));
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

  const handleMultiSelectChange = (name: keyof LeadFormData, value: string[]) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSignalToggle = (signal: string) => {
    setFormData(prev => ({
      ...prev,
      signals: prev.signals.includes(signal)
        ? prev.signals.filter(s => s !== signal)
        : [...prev.signals, signal]
    }));
  };

  const validateForm = () => {
    return (
      formData.job_titles.trim() !== "" &&
      formData.industries.length > 0 &&
      formData.location.country !== "" &&
      formData.company_size.length > 0
    );
  };

  const handleTestWebhook = async () => {
    setIsTestingWebhook(true);
    setTestResult(null);
    try {
      const response = await axios.post("/api/submit-leads", {
        webhookUrl,
        test_connection: true,
        timestamp: new Date().toISOString()
      });
      setTestResult({ 
        success: true, 
        message: `Success! n8n responded with status ${response.status}. Your URL is working.` 
      });
    } catch (err: any) {
      const msg = err.response?.data || err.message;
      setTestResult({ 
        success: false, 
        message: msg.includes("404") 
          ? "404 Error: n8n says this URL doesn't exist. Check if the workflow is ACTIVE or use the TEST URL." 
          : `Error: ${msg}` 
      });
    } finally {
      setIsTestingWebhook(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      alert("Please fill in all required fields: Job Titles, Industry, Country, and Company Size.");
      return;
    }
    
    setIsSending(true);
    setShowResults(false);
    setCsvData(null);
    setError(null);
    
    try {
      // Call the local proxy route to bypass CORS issues
      const response = await axios.post("/api/submit-leads", {
        ...formData,
        webhookUrl
      }, {
        headers: { 'Content-Type': 'application/json' }
      });
      
      // Assume the response is the CSV content or contains it
      const data = response.data;
      if (typeof data === 'string') {
        setCsvData(data);
      } else {
        // If it's JSON, convert to a simple CSV for demonstration
        setCsvData(JSON.stringify(data, null, 2));
      }
      
      setShowResults(true);
    } catch (err: any) {
      console.error("Webhook error:", err);
      const errorMessage = err.response?.data || err.message || "Failed to connect to webhook. Please check the URL and CORS settings.";
      setError(errorMessage);
      setShowResults(true);
    } finally {
      setIsSending(false);
    }
  };

  const downloadCsv = () => {
    if (!csvData) return;
    const blob = new Blob([csvData], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', `leads_${Date.now()}.csv`);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const saveTemplate = () => {
    if (!templateName) return;
    const newTemplate: SavedTemplate = {
      id: crypto.randomUUID(),
      name: templateName,
      data: { ...formData },
      timestamp: Date.now()
    };
    const updated = [newTemplate, ...savedTemplates];
    setSavedTemplates(updated);
    localStorage.setItem("leadgen_templates", JSON.stringify(updated));
    setTemplateName("");
    setShowSaveModal(false);
  };

  const loadTemplate = (template: SavedTemplate) => {
    setFormData(template.data);
  };

  const deleteTemplate = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = savedTemplates.filter(t => t.id !== id);
    setSavedTemplates(updated);
    localStorage.setItem("leadgen_templates", JSON.stringify(updated));
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

      <div className="flex flex-wrap justify-center gap-4">
        <button 
          onClick={() => setShowSaveModal(true)}
          className="group flex items-center gap-2 px-5 py-2.5 bg-white border border-zinc-200 rounded-xl text-sm font-semibold text-zinc-700 hover:border-indigo-500 hover:text-indigo-600 hover:shadow-md transition-all duration-300"
        >
          <Save size={18} className="group-hover:scale-110 transition-transform" />
          Save Current Search
        </button>
        
        {savedTemplates.length > 0 && (
          <div className="relative group/templates">
            <button className="flex items-center gap-2 px-5 py-2.5 bg-white border border-zinc-200 rounded-xl text-sm font-semibold text-zinc-700 hover:border-indigo-500 hover:text-indigo-600 hover:shadow-md transition-all duration-300">
              <Plus size={18} />
              Load Template
              <ChevronDown size={14} className="ml-1 opacity-50" />
            </button>
            <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-72 bg-white border border-zinc-200 rounded-2xl shadow-2xl opacity-0 invisible group-hover/templates:opacity-100 group-hover/templates:visible transition-all z-50 py-2 overflow-hidden">
              <div className="px-4 py-2 text-[10px] font-bold text-zinc-400 uppercase tracking-widest border-b border-zinc-50 mb-1">
                Saved Templates
              </div>
              <div className="max-h-64 overflow-y-auto">
                {savedTemplates.map(t => (
                  <div 
                    key={t.id} 
                    onClick={() => loadTemplate(t)}
                    className="px-4 py-3 hover:bg-indigo-50/50 cursor-pointer flex justify-between items-center text-sm group/item transition-colors"
                  >
                    <div className="flex flex-col min-w-0">
                      <span className="font-semibold text-zinc-700 truncate">{t.name}</span>
                      <span className="text-[10px] text-zinc-400">{new Date(t.timestamp).toLocaleDateString()}</span>
                    </div>
                    <button 
                      onClick={(e) => deleteTemplate(t.id, e)}
                      className="p-1.5 rounded-lg text-zinc-300 hover:text-red-500 hover:bg-red-50 transition-all opacity-0 group-hover/item:opacity-100"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="lg:col-span-2">
          <Section title="Your Business Details" icon={<Briefcase size={18} className="text-indigo-600" />}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-6">
                <div>
                  <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2">Business Name</label>
                  <input
                    type="text"
                    name="business_details.name"
                    value={formData.business_details?.name}
                    onChange={handleInputChange}
                    placeholder="e.g. Acme Automation"
                    className="w-full bg-zinc-50/50 border border-zinc-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2">Unique Selling Proposition (USP)</label>
                  <input
                    type="text"
                    name="business_details.usp"
                    value={formData.business_details?.usp}
                    onChange={handleInputChange}
                    placeholder="e.g. 10x faster lead generation with AI"
                    className="w-full bg-zinc-50/50 border border-zinc-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
                  />
                </div>
              </div>
              <div className="space-y-6">
                <div>
                  <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2">Business Description</label>
                  <textarea
                    name="business_details.description"
                    value={formData.business_details?.description}
                    onChange={handleInputChange}
                    placeholder="Briefly describe what your business does..."
                    rows={1}
                    className="w-full bg-zinc-50/50 border border-zinc-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all resize-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2">Target Audience Context</label>
                  <textarea
                    name="business_details.target_audience"
                    value={formData.business_details?.target_audience}
                    onChange={handleInputChange}
                    placeholder="Who are you specifically trying to help?"
                    rows={1}
                    className="w-full bg-zinc-50/50 border border-zinc-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all resize-none"
                  />
                </div>
              </div>
            </div>
          </Section>
        </div>

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
              <MultiSelect
                label="Seniority Level"
                options={SENIORITY_LEVELS}
                value={formData.seniority_level}
                onChange={(val) => handleMultiSelectChange("seniority_level", val)}
              />
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
                <MultiSelect
                  label="Industries *"
                  options={INDUSTRIES}
                  value={formData.industries}
                  onChange={(val) => handleMultiSelectChange("industries", val)}
                />
                <MultiSelect
                  label="Company Size *"
                  options={COMPANY_SIZES}
                  value={formData.company_size}
                  onChange={(val) => handleMultiSelectChange("company_size", val)}
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <SingleSelect
                  label="Estimated Revenue"
                  options={REVENUE_RANGES.map(r => r.label)}
                  value={REVENUE_RANGES.find(r => r.value === formData.revenue_range)?.label || ""}
                  onChange={(label) => {
                    const val = REVENUE_RANGES.find(r => r.label === label)?.value || "";
                    handleSingleSelectChange("revenue_range", val);
                  }}
                  placeholder="Select range..."
                />
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

          {/* Section 4: Technology and Signals */}
          <Section title="Technology and Signals" icon={<Zap size={18} className="text-indigo-600" />}>
            <div className="space-y-6">
              <MultiSelect
                label="Technology Stack"
                options={TECH_STACKS}
                value={formData.tech_stack}
                onChange={(val) => handleMultiSelectChange("tech_stack", val)}
              />
              <div>
                <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-3">Growth Signals</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {GROWTH_SIGNALS.map(signal => (
                    <label 
                      key={signal.value}
                      className={`flex items-center gap-3 p-3 border rounded-xl cursor-pointer transition-all duration-200 ${
                        formData.signals.includes(signal.value) 
                          ? "bg-indigo-50 border-indigo-200 shadow-sm" 
                          : "bg-zinc-50/50 border-zinc-200 hover:border-indigo-200 hover:bg-zinc-50"
                      }`}
                    >
                      <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${
                        formData.signals.includes(signal.value) ? "bg-indigo-600 border-indigo-600" : "bg-white border-zinc-300"
                      }`}>
                        {formData.signals.includes(signal.value) && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                      </div>
                      <input
                        type="checkbox"
                        checked={formData.signals.includes(signal.value)}
                        onChange={() => handleSignalToggle(signal.value)}
                        className="hidden"
                      />
                      <span className={`text-xs font-medium ${formData.signals.includes(signal.value) ? "text-indigo-700" : "text-zinc-600"}`}>
                        {signal.label}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </Section>

          {/* Section 5: Search Settings */}
          <Section title="Search Settings" icon={<Settings size={18} className="text-indigo-600" />}>
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <SingleSelect
                  label="Lead Limit"
                  required
                  options={LEAD_LIMITS.map(l => l.label)}
                  value={LEAD_LIMITS.find(l => l.value === formData.lead_limit.toString())?.label || ""}
                  onChange={(label) => {
                    const val = LEAD_LIMITS.find(l => l.label === label)?.value || "50";
                    handleSingleSelectChange("lead_limit", val);
                  }}
                />
                <div>
                  <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2">Service Offered</label>
                  <input
                    type="text"
                    name="service_offered"
                    value={formData.service_offered}
                    onChange={handleInputChange}
                    placeholder="e.g. AI automation"
                    className="w-full bg-zinc-50/50 border border-zinc-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2">Problem Solved</label>
                <input
                  type="text"
                  name="problem_solved"
                  value={formData.problem_solved}
                  onChange={handleInputChange}
                  placeholder="e.g. Manual business processes"
                  className="w-full bg-zinc-50/50 border border-zinc-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
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

      {/* Webhook Settings */}
      <div className="mt-8 mb-4">
        <button 
          onClick={() => setShowWebhookSettings(!showWebhookSettings)}
          className="flex items-center gap-2 text-xs font-bold text-zinc-400 uppercase tracking-widest hover:text-indigo-600 transition-colors"
        >
          <Settings size={14} className={showWebhookSettings ? 'animate-spin-slow' : ''} />
          {showWebhookSettings ? 'Hide Webhook Settings' : 'Webhook Settings (Advanced)'}
        </button>
        
        <AnimatePresence>
          {showWebhookSettings && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="mt-4 p-6 bg-zinc-50 border border-zinc-200 rounded-2xl">
                <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2">Target Webhook URL</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={webhookUrl}
                    onChange={(e) => setWebhookUrl(e.target.value)}
                    placeholder="https://n8n.your-domain.com/webhook/..."
                    className="flex-1 bg-white border border-zinc-200 rounded-xl px-4 py-2 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                  />
                  <button 
                    onClick={handleTestWebhook}
                    disabled={isTestingWebhook}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-[10px] font-bold hover:bg-indigo-700 transition-all disabled:opacity-50 flex items-center gap-2"
                  >
                    {isTestingWebhook ? <Loader2 size={12} className="animate-spin" /> : <Zap size={12} />}
                    Test Webhook
                  </button>
                  <button 
                    onClick={() => {
                      setWebhookUrl("https://n8n-brum.srv1463595.hstgr.cloud/webhook/e1a5cdf5-7bf5-45a2-b642-ceca88537657");
                      setTestResult(null);
                    }}
                    className="px-3 py-2 bg-zinc-200 text-zinc-600 rounded-xl text-[10px] font-bold hover:bg-zinc-300 transition-colors"
                  >
                    Reset
                  </button>
                </div>
                
                {testResult && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`mt-3 p-3 rounded-xl text-[10px] font-medium flex items-center gap-2 ${testResult.success ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-red-50 text-red-700 border border-red-100'}`}
                  >
                    {testResult.success ? <CheckCircle2 size={14} /> : <X size={14} />}
                    {testResult.message}
                  </motion.div>
                )}
                <p className="mt-2 text-[10px] text-zinc-400 leading-relaxed">
                  <span className="font-bold text-amber-600">Note:</span> If you are testing your n8n workflow, paste your <strong>Test URL</strong> here. 
                  If using a <strong>Production URL</strong>, ensure the workflow is set to <strong>Active</strong> in n8n.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Results Display */}
      <AnimatePresence>
        {showResults && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="glass rounded-3xl p-8 text-zinc-800 shadow-2xl relative overflow-hidden group"
          >
            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
              <Search size={120} />
            </div>
            
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${error ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'}`}>
                  {error ? <X size={24} /> : <CheckCircle2 size={24} />}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-zinc-900">{error ? 'Search Failed' : 'Search Ready'}</h3>
                  <p className="text-sm text-zinc-500">{error ? error : 'Structured data generated and processed successfully.'}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {csvData && !error && (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={downloadCsv}
                    className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-emerald-500/20 hover:bg-emerald-700 transition-all"
                  >
                    <Download size={18} />
                    Download CSV
                  </motion.button>
                )}
                <button 
                  onClick={() => setShowResults(false)}
                  className="p-2 hover:bg-zinc-100 rounded-full transition-colors"
                >
                  <X size={20} className="text-zinc-400" />
                </button>
              </div>
            </div>

            <div className="bg-zinc-900 rounded-2xl p-6 text-indigo-300 font-mono text-xs overflow-x-auto border border-zinc-800">
              <div className="flex justify-between items-center mb-4 border-b border-zinc-800 pb-2">
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                  {error ? 'Error Details' : (csvData ? 'Webhook Response / CSV Preview' : 'Payload Data')}
                </span>
              </div>
              <pre className="whitespace-pre-wrap">
                {error ? error : (csvData ? csvData : JSON.stringify({
                  ...formData,
                  job_titles: formData.job_titles.split(",").map(t => t.trim()).filter(t => t),
                  keywords: formData.keywords.split(",").map(k => k.trim()).filter(k => k),
                }, null, 2))}
              </pre>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Save Template Modal */}
      <AnimatePresence>
        {showSaveModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowSaveModal(false)}
              className="absolute inset-0 bg-zinc-900/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                  <Save size={20} />
                </div>
                <h3 className="text-xl font-bold text-zinc-900">Save Template</h3>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2">Template Name</label>
                  <input
                    type="text"
                    value={templateName}
                    onChange={(e) => setTemplateName(e.target.value)}
                    placeholder="e.g. UK Ecommerce CEOs"
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
                    autoFocus
                  />
                </div>
                
                <div className="flex gap-3 pt-4">
                  <button 
                    onClick={() => setShowSaveModal(false)}
                    className="flex-1 px-4 py-3 border border-zinc-200 rounded-xl text-sm font-bold text-zinc-500 hover:bg-zinc-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={saveTemplate}
                    disabled={!templateName}
                    className="flex-1 px-4 py-3 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-500/20 transition-all disabled:opacity-50"
                  >
                    Save Template
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
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
