import axios from "axios";

const BASE_URL = "/api/geo";

export const geoService = {
  async getCountries(): Promise<string[]> {
    try {
      const response = await axios.get(`${BASE_URL}/countries`);
      return response.data.data.map((c: any) => c.name).sort();
    } catch (error) {
      console.error("Error fetching countries:", error);
      return [];
    }
  },

  async getStates(country: string): Promise<string[]> {
    try {
      const response = await axios.post(`${BASE_URL}/states`, { country });
      return response.data.data.states.map((s: any) => s.name).sort();
    } catch (error) {
      console.error(`Error fetching states for ${country}:`, error);
      return [];
    }
  },

  async getCities(country: string, state: string): Promise<string[]> {
    try {
      const response = await axios.post(`${BASE_URL}/cities`, { country, state });
      return response.data.data.sort();
    } catch (error) {
      console.error(`Error fetching cities for ${state}, ${country}:`, error);
      return [];
    }
  }
};
