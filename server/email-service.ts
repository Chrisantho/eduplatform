import http from "http";
import sgMail from "@sendgrid/mail";

async function getCredentials(): Promise<{ apiKey: string; email: string }> {
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY
    ? "repl " + process.env.REPL_IDENTITY
    : process.env.WEB_REPL_RENEWAL
      ? "depl " + process.env.WEB_REPL_RENEWAL
      : null;

  if (!xReplitToken) {
    throw new Error("X_REPLIT_TOKEN not found for repl/depl");
  }

  const res = await fetch(
    "https://" + hostname + "/api/v2/connection?include_secrets=true&connector_names=sendgrid",
    {
      headers: {
        Accept: "application/json",
        X_REPLIT_TOKEN: xReplitToken,
      },
    }
  );
  const data = await res.json();
  const connectionSettings = data.items?.[0];

  if (!connectionSettings || !connectionSettings.settings.api_key || !connectionSettings.settings.from_email) {
    throw new Error("SendGrid not connected");
  }
  return { apiKey: connectionSettings.settings.api_key, email: connectionSettings.settings.from_email };
}

export async function sendEmail(to: string, subject: string, htmlContent: string): Promise<void> {
  const { apiKey, email: fromEmail } = await getCredentials();
  sgMail.setApiKey(apiKey);

  await sgMail.send({
    to,
    from: fromEmail,
    subject,
    html: htmlContent,
  });
}

export function startEmailService(port: number, logFn: (msg: string, src?: string) => void): http.Server {
  const server = http.createServer(async (req, res) => {
    if (req.method === "POST" && req.url === "/send-email") {
      let body = "";
      req.on("data", (chunk: Buffer) => { body += chunk.toString(); });
      req.on("end", async () => {
        try {
          const { to, subject, html } = JSON.parse(body);
          if (!to || !subject || !html) {
            res.writeHead(400, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ error: "Missing required fields: to, subject, html" }));
            return;
          }
          await sendEmail(to, subject, html);
          logFn(`Email sent to ${to}: ${subject}`, "email");
          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ success: true }));
        } catch (err: any) {
          const errorDetail = err.response?.body?.errors
            ? JSON.stringify(err.response.body.errors)
            : err.message;
          logFn(`Email send failed: ${errorDetail}`, "email");
          res.writeHead(500, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: errorDetail }));
        }
      });
    } else {
      res.writeHead(404);
      res.end();
    }
  });

  server.listen(port, "127.0.0.1", () => {
    logFn(`Email service running on internal port ${port}`, "email");
  });

  return server;
}
