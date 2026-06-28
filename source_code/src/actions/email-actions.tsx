"use server";

import { Resend } from "resend";
import { render } from "@react-email/render";
import JobPostConfirmationEmail from "@/emails/job-post-confirmation";
import ApplicationConfirmationEmail from "@/emails/application-confirmation";
import NewApplicationAlertEmail from "@/emails/new-application-alert";
import ApplicationAcceptedEmail from "@/emails/application-accepted";

const resend = new Resend(process.env.RESEND_API_KEY);
const fromEmail = process.env.FROM_EMAIL || "onboarding@resend.dev";

export const sendJobPostConfirmationEmail = async (
  to: string,
  clientName: string,
  jobTitle: string,
  jobUrl: string
) => {
  const emailHtml = render(
    <JobPostConfirmationEmail
      clientName={clientName}
      jobTitle={jobTitle}
      jobUrl={jobUrl}
    />
  );

  try {
    await resend.emails.send({
      from: fromEmail,
      to,
      subject: "Your Job Posting is Live!",
      html: await emailHtml,
    });
  } catch (error) {
    console.error("Error sending job post confirmation email:", error);
    // Optionally, re-throw or handle the error as needed
  }
};

export const sendApplicationConfirmationEmail = async (
  to: string,
  providerName: string,
  jobTitle: string,
  applicationUrl: string
) => {
  const emailHtml = render(
    <ApplicationConfirmationEmail
      providerName={providerName}
      jobTitle={jobTitle}
      applicationUrl={applicationUrl}
    />
  );

  try {
    await resend.emails.send({
      from: fromEmail,
      to,
      subject: "Application Received!",
      html: await emailHtml,
    });
  } catch (error) {
    console.error("Error sending application confirmation email:", error);
  }
};

export const sendNewApplicationAlertEmail = async (
  to: string,
  clientName: string,
  jobTitle: string,
  providerName: string,
  applicationsUrl: string
) => {
  const emailHtml = render(
    <NewApplicationAlertEmail
      clientName={clientName}
      jobTitle={jobTitle}
      providerName={providerName}
      applicationsUrl={applicationsUrl}
    />
  );

  try {
    await resend.emails.send({
      from: fromEmail,
      to,
      subject: "New Application for Your Job Posting!",
      html: await emailHtml,
    });
  } catch (error) {
    console.error("Error sending new application alert email:", error);
  }
};

export const sendApplicationAcceptedEmail = async (
  to: string,
  providerName: string,
  jobTitle: string,
  clientName: string,
  applicationUrl: string
) => {
  const emailHtml = render(
    <ApplicationAcceptedEmail
      providerName={providerName}
      jobTitle={jobTitle}
      clientName={clientName}
      applicationUrl={applicationUrl}
    />
  );

  try {
    await resend.emails.send({
      from: fromEmail,
      to,
      subject: "Congratulations! Your Application was Accepted!",
      html: await emailHtml,
    });
  } catch (error) {
    console.error("Error sending application accepted email:", error);
  }
}; 