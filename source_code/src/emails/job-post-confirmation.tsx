import {
  Body,
  Button,
  Container,
  Head,
  Hr,
  Html,
  Img,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import * as React from "react";

interface JobPostConfirmationEmailProps {
  clientName?: string;
  jobTitle?: string;
  jobUrl?: string;
}

// const baseUrl = process.env.VERCEL_URL
//   ? `https://${process.env.VERCEL_URL}`
//   : "http://localhost:3000";


const baseUrl = "http://localhost:3000";

export const JobPostConfirmationEmail = ({
  clientName = "Valued Client",
  jobTitle = "Your Recent Job Posting",
  jobUrl = `${baseUrl}/dashboard/my-jobs`,
}: JobPostConfirmationEmailProps) => (
  <Html>
    <Head />
    <Preview>Your job is now live on ServiceSuite!</Preview>
    <Body style={main}>
      <Container style={container}>
        <Img
          src={`${baseUrl}/static/ServiceSuite_logo.png`}
          width="170"
          height="50"
          alt="ServiceSuite"
          style={logo}
        />
        <Text style={paragraph}>Hi {clientName},</Text>
        <Text style={paragraph}>
          Thank you for posting a new job on ServiceSuite! Your listing for "{jobTitle}" is now live and visible to our talented community of freelancers.
        </Text>
        <Section style={btnContainer}>
          <Button style={button} href={jobUrl}>
            View Your Job Posting
          </Button>
        </Section>
        <Text style={paragraph}>
          You will receive notifications as freelancers start applying to your job. You can view and manage all applications directly from your dashboard.
          <br />
          <br />
          Best,
          <br />
          The ServiceSuite Team
        </Text>
        <Hr style={hr} />
        <Text style={footer}>
          ServiceSuite - Connecting talent with opportunity.
        </Text>
      </Container>
    </Body>
  </Html>
);

export default JobPostConfirmationEmail;

const main = {
  backgroundColor: "#ffffff",
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif',
};

const container = {
  margin: "0 auto",
  padding: "20px 0 48px",
};

const logo = {
  margin: "0 auto",
};

const paragraph = {
  fontSize: "16px",
  lineHeight: "26px",
};

const btnContainer = {
  textAlign: "center" as const,
};

const button = {
  backgroundColor: "#5F51E8",
  borderRadius: "3px",
  color: "#fff",
  fontSize: "16px",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "block",
  padding: "12px",
};

const hr = {
  borderColor: "#cccccc",
  margin: "20px 0",
};

const footer = {
  color: "#8898aa",
  fontSize: "12px",
}; 