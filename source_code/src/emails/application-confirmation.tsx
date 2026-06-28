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

interface ApplicationConfirmationEmailProps {
  providerName?: string;
  jobTitle?: string;
  applicationUrl?: string;
}

// const baseUrl = process.env.VERCEL_URL
//   ? `https://${process.env.VERCEL_URL}`
//   : "http://localhost:3000";

const baseUrl = "http://localhost:3000";

export const ApplicationConfirmationEmail = ({
  providerName = "Valued Freelancer",
  jobTitle = "Your Recent Job Application",
  applicationUrl = `${baseUrl}/dashboard/my-applications`,
}: ApplicationConfirmationEmailProps) => (
  <Html>
    <Head />
    <Preview>Your application for {jobTitle} has been received.</Preview>
    <Body style={main}>
      <Container style={container}>
        <Img
          src={`${baseUrl}/static/ServiceSuite_logo.png`}
          width="170"
          height="50"
          alt="ServiceSuite"
          style={logo}
        />
        <Text style={paragraph}>Hi {providerName},</Text>
        <Text style={paragraph}>
          Thank you for applying for the "{jobTitle}" position on ServiceSuite. We have received your application and the client has been notified.
        </Text>
        <Section style={btnContainer}>
          <Button style={button} href={applicationUrl}>
            View Your Application
          </Button>
        </Section>
        <Text style={paragraph}>
          You can track the status of your application in your dashboard. We wish you the best of luck!
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

export default ApplicationConfirmationEmail;

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