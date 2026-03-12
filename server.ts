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

  // Proxy route to handle the webhook submission and bypass CORS
  app.post("/api/submit-leads", async (req, res) => {
    const { webhookUrl, ...payload } = req.body;
    const WEBHOOK_URL = webhookUrl || "https://n8n-brum.srv1463595.hstgr.cloud/webhook/e1a5cdf5-7bf5-45a2-b642-ceca88537657";
    
    console.log(`Forwarding request to: ${WEBHOOK_URL}`);
    console.log("Payload:", JSON.stringify(payload, null, 2));

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
        validateStatus: (status) => status < 500 // Allow 404 to be handled in catch or as a result
      });
      
      console.log(`n8n responded with status: ${response.status}`);
      res.status(response.status).send(response.data);
    } catch (error: any) {
      const status = error.response?.status || 500;
      const message = error.response?.data || error.message || "Internal Server Error";
      
      console.error(`Proxy error [${status}]:`, message);

      if (status === 404) {
        res.status(404).send(`n8n Webhook Not Found (404) at: ${WEBHOOK_URL}. \n\nIMPORTANT: Ensure your n8n workflow is 'Active' if using a Production URL, or use a 'Test URL' if you are currently testing.`);
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
