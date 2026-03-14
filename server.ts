import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import axios from "axios";
import cors from "cors";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());

  // Proxy routes for geographical data to bypass CORS and improve reliability
  const GEO_BASE_URL = "https://countriesnow.space/api/v0.1/countries";

  app.get("/api/geo/countries", async (req, res) => {
    try {
      const response = await axios.get(`${GEO_BASE_URL}/info?returns=none`);
      res.json(response.data);
    } catch (error: any) {
      res.status(error.response?.status || 500).send(error.message);
    }
  });

  app.post("/api/geo/states", async (req, res) => {
    try {
      const response = await axios.post(`${GEO_BASE_URL}/states`, req.body);
      res.json(response.data);
    } catch (error: any) {
      res.status(error.response?.status || 500).send(error.message);
    }
  });

  app.post("/api/geo/cities", async (req, res) => {
    try {
      const response = await axios.post(`${GEO_BASE_URL}/state/cities`, req.body);
      res.json(response.data);
    } catch (error: any) {
      res.status(error.response?.status || 500).send(error.message);
    }
  });

  // Proxy route to handle the webhook submission and bypass CORS
  app.post("/api/submit-leads", async (req, res) => {
    const payload = req.body;
    const WEBHOOK_URL = "https://n8n-brum.srv1463595.hstgr.cloud/webhook/e1a5cdf5-7bf5-45a2-b642-ceca88537657";
    
    console.log("--------------------------------------------------");
    console.log(`[${new Date().toISOString()}] NEW WEBHOOK REQUEST`);
    console.log(`Target URL: ${WEBHOOK_URL} (Production Mode)`);
    console.log(`Payload size: ${JSON.stringify(payload).length} bytes`);
    
    try {
      const response = await axios({
        method: 'post',
        url: WEBHOOK_URL,
        data: payload,
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json, text/csv, */*',
          'User-Agent': 'LeadGen-App/1.0'
        },
        timeout: 30000,
        validateStatus: (status) => status < 500
      });
      
      console.log(`Response Status: ${response.status}`);
      console.log(`Response Data Type: ${typeof response.data}`);
      console.log("--------------------------------------------------");
      
      res.status(response.status).send(response.data);
    } catch (error: any) {
      const status = error.response?.status || 500;
      const message = error.response?.data || error.message || "Internal Server Error";
      
      console.error(`[ERROR] Webhook Proxy failed with status ${status}`);
      console.error(`Error Message: ${JSON.stringify(message)}`);
      console.log("--------------------------------------------------");
 
      if (status === 404) {
        res.status(404).send(`n8n Webhook Not Found (404) at: ${WEBHOOK_URL}. \n\nIMPORTANT: \nEnsure you have clicked 'Execute Workflow' in n8n and it is currently 'Waiting for Webhook Call'.`);
      } else {
        res.status(status).send(message);
      }
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
