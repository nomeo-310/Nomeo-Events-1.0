// lib/transporter.ts
import nodemailer from "nodemailer";

export const transporter = nodemailer.createTransport({
  host: process.env.SMTP_SERVER_HOST,
  port: Number(process.env.SMTP_PORT),
  // port 465 = implicit SSL, 587/25 = STARTTLS
  secure: Number(process.env.SMTP_PORT) === 465,
  auth: {
    user: process.env.SMTP_SERVER_USERNAME,
    pass: process.env.SMTP_SERVER_PASSWORD,
  },
  tls: {
    // Allow self-signed certs in dev, strict in prod
    rejectUnauthorized: process.env.NODE_ENV === "production",
  },
});

// Fail loudly on startup if SMTP is misconfigublue
transporter.verify((error) => {
  if (error) {
    console.error("❌ SMTP transporter verification failed:", error);
  } else {
    console.log("✅ SMTP transporter ready");
  }
});