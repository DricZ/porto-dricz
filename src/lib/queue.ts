import { Queue, Worker } from "bullmq"
import { redis } from "./redis"
import nodemailer from "nodemailer"
import { prisma } from "./auth"

export const emailQueue = new Queue("emailQueue", { connection: redis as any })

declare global {
  var emailWorker: Worker | undefined
}

// SMTP Configuration for Worker
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "localhost",
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: process.env.SMTP_PORT === "465",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
})

// Initialize the worker globally so we only have one instance in Next.js development
export const emailWorker = global.emailWorker || new Worker("emailQueue", async (job) => {
  if (job.name === "send-contact-email") {
    const { name, email, message, createdAt } = job.data

    const users = await prisma.user.findMany({ select: { email: true } })
    const adminEmails = users.map(u => u.email).filter(Boolean)

    const contacts = await prisma.contact.findMany({
      orderBy: { order: "asc" },
    })

    const footerLinksHtml = contacts
      .filter((c) => c.href)
      .map(
        (c) =>
          `<a href="${c.href}" style="color: #3b82f6; text-decoration: none; margin: 0 12px; font-weight: 500;">${c.label}</a>`
      )
      .join("")

    if (adminEmails.length > 0 && process.env.SMTP_USER) {
      console.log(`[EmailWorker] Processing email for ${email}... sending to ${adminEmails.length} admins`)
      for (const adminEmail of adminEmails) {
        await transporter.sendMail({
          from: {
            name: "Contact Form",
            address: process.env.SMTP_USER,
          },
          to: adminEmail,
          subject: `New Contact Message from ${name}`,
          text: `You have received a new message from your portfolio contact form.\n\nName: ${name}\nEmail: ${email}\nMessage:\n${message}\n\nSubmitted at: ${createdAt}`,
          html: `<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; background-color: #fafafa; padding: 40px 20px; margin: 0;">
  <div style="max-width: 600px; margin: 0 auto; padding: 32px; border: 1px solid #eaeaea; border-radius: 12px; background-color: #ffffff; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">
    <div style="border-bottom: 2px solid #f0f0f0; padding-bottom: 24px; margin-bottom: 24px; text-align: center;">
      <h1 style="font-size: 24px; font-weight: 800; color: #111; letter-spacing: -0.5px; margin: 0;">New Contact Message</h1>
    </div>
    <div style="font-size: 16px; color: #444;">
      <p style="margin-top: 0;">You have received a new message from your portfolio contact form.</p>
      <table style="width: 100%; border-collapse: collapse; margin: 24px 0;">
        <tr>
          <td style="padding: 12px 0; border-bottom: 1px solid #eaeaea; width: 100px; font-weight: 600; color: #888;">Name</td>
          <td style="padding: 12px 0; border-bottom: 1px solid #eaeaea; font-weight: 500; color: #111;">${name}</td>
        </tr>
        <tr>
          <td style="padding: 12px 0; border-bottom: 1px solid #eaeaea; font-weight: 600; color: #888;">Email</td>
          <td style="padding: 12px 0; border-bottom: 1px solid #eaeaea; font-weight: 500; color: #111;"><a href="mailto:${email}" style="color: #3b82f6; text-decoration: none;">${email}</a></td>
        </tr>
        <tr>
          <td style="padding: 12px 0; border-bottom: 1px solid #eaeaea; font-weight: 600; color: #888;">Date</td>
          <td style="padding: 12px 0; border-bottom: 1px solid #eaeaea; font-weight: 500; color: #111;">${new Date(createdAt).toLocaleString('id-ID')}</td>
        </tr>
      </table>
      <p style="font-weight: 600; color: #888; margin-bottom: 8px;">Message:</p>
      <div style="background-color: #f9fafb; border-left: 4px solid #10b981; padding: 16px 20px; border-radius: 0 8px 8px 0; font-style: normal; color: #333;">
        ${message.replace(/\n/g, '<br/>')}
      </div>
    </div>
    <div style="margin-top: 40px; padding-top: 24px; border-top: 1px solid #eaeaea; font-size: 14px; color: #888; text-align: center;">
      <p style="margin: 0 0 12px 0;">Sent from your Portfolio Application</p>
      <div style="display: inline-block;">
        ${footerLinksHtml}
      </div>
    </div>
  </div>
</div>`,
        })
        console.log(`[EmailWorker] Email sent to ${adminEmail}`)
      }
    }

    // Send auto-reply to the user who submitted the form
    if (process.env.SMTP_USER) {
      try {
        await transporter.sendMail({
          from: {
            name: "Contact Form",
            address: process.env.SMTP_USER,
          },
          to: email,
          subject: `Thank you for reaching out!`,
          text: `Hi ${name},\n\nThank you for getting in touch. I have received your message and will get back to you as soon as possible.\n\nYour message:\n${message}\n\nBest regards,\nAudrico`,
          html: `<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; background-color: #fafafa; padding: 40px 20px; margin: 0;">
  <div style="max-width: 600px; margin: 0 auto; padding: 32px; border: 1px solid #eaeaea; border-radius: 12px; background-color: #ffffff; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">
    <div style="border-bottom: 2px solid #f0f0f0; padding-bottom: 24px; margin-bottom: 24px; text-align: center;">
      <h1 style="font-size: 24px; font-weight: 800; color: #111; letter-spacing: -0.5px; margin: 0;">Audrico<span style="color: #3b82f6;">.</span></h1>
    </div>
    <div style="font-size: 16px; color: #444;">
      <p style="margin-top: 0;">Hi <strong style="color: #111;">${name}</strong>,</p>
      <p>Thank you for getting in touch! I have received your message and will get back to you as soon as possible.</p>
      <p>Here is a copy of your message for your records:</p>
      <div style="background-color: #f9fafb; border-left: 4px solid #3b82f6; padding: 16px 20px; margin: 24px 0; border-radius: 0 8px 8px 0; font-style: italic; color: #555;">
        ${message.replace(/\n/g, '<br/>')}
      </div>
      <p style="margin-bottom: 0;">Best regards,<br/><strong style="color: #111;">Audrico</strong></p>
    </div>
    <div style="margin-top: 40px; padding-top: 24px; border-top: 1px solid #eaeaea; font-size: 14px; color: #888; text-align: center;">
      <p style="margin: 0 0 12px 0;">This is an automated reply. Please do not reply directly to this email.</p>
      <div style="display: inline-block;">
        ${footerLinksHtml}
      </div>
    </div>
  </div>
</div>`,
        })
        console.log(`[EmailWorker] Auto-reply sent to ${email}`)
      } catch (err) {
        console.error(`[EmailWorker] Failed to send auto-reply to ${email}`, err)
      }
    }
  }
}, { connection: redis as any })

if (process.env.NODE_ENV !== "production") {
  global.emailWorker = emailWorker
}
