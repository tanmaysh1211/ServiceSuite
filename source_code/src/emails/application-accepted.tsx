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

interface ApplicationAcceptedEmailProps {
  providerName?: string;
  jobTitle?: string;
  clientName?: string;
  applicationUrl?: string;
}

const baseUrl = "http://localhost:3000";

export const ApplicationAcceptedEmail = ({
  providerName = "Valued Freelancer",
  jobTitle = "Your Job Application",
  clientName = "the client",
  applicationUrl = `${baseUrl}/dashboard/my-applications`,
}: ApplicationAcceptedEmailProps) => (
  <Html>
    <Head />
    <Preview>
      Congratulations! Your application for {jobTitle} has been accepted.
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
        <Text style={paragraph}>Hi {providerName},</Text>
        <Text style={paragraph}>
          Great news! Your application for the "{jobTitle}" position has been accepted by {clientName}.
        </Text>
        <Section style={btnContainer}>
          <Button style={button} href={applicationUrl}>
            View Application Details
          </Button>
        </Section>
        <Text style={paragraph}>
          We recommend reaching out to the client to discuss the next steps. Congratulations again!
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

export default ApplicationAcceptedEmail;

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
