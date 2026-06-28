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

interface NewApplicationAlertEmailProps {
  clientName?: string;
  jobTitle?: string;
  providerName?: string;
  applicationsUrl?: string;
}

// const baseUrl = process.env.VERCEL_URL
//   ? `https://${process.env.VERCEL_URL}`
//   : "http://localhost:3000";

const baseUrl = "http://localhost:3000";

export const NewApplicationAlertEmail = ({
  clientName = "Valued Client",
  jobTitle = "Your Job Posting",
  providerName = "a talented freelancer",
  applicationsUrl = `${baseUrl}/dashboard/my-jobs`,
}: NewApplicationAlertEmailProps) => (
  <Html>
    <Head />
    <Preview>
      You've received a new application for {jobTitle}!
    </Preview>
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
          Good news! You have received a new application for your job posting, "{jobTitle}", from {providerName}.
        </Text>
        <Section style={btnContainer}>
          <Button style={button} href={applicationsUrl}>
            View Application
          </Button>
        </Section>
        <Text style={paragraph}>
          You can review this new application, along with all others, from your dashboard.
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

export default NewApplicationAlertEmail;

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