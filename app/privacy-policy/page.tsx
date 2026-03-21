import { LegalPage } from "../components/legal-page";

export default function PrivacyPolicyPage() {
  return (
    <LegalPage
      eyebrow="Privacy policy"
      title="Your information is collected only to guide your wellness journey and support your booking flow."
      intro="This page explains what details may be collected when you browse the website, submit the join form, or communicate with the team."
      highlights={[
        {
          title: "What we collect",
          body: "Basic contact details, wellness goals, blood group, health concern, and any notes you share in the form."
        },
        {
          title: "Why we collect it",
          body: "To guide batch placement, respond to inquiries, share relevant support details, and improve the student experience."
        },
        {
          title: "How it is handled",
          body: "Information is used only for operational, support, and communication purposes connected to this wellness platform."
        }
      ]}
      sections={[
        {
          title: "Information we may collect",
          body: [
            "When you submit a form, contact the team, or request guidance, the website may collect your name, phone number, email address, blood group, health concern, preferred batch type, and any notes you choose to provide.",
            "Basic technical information such as browser type or site usage patterns may also be collected to improve website performance and reliability."
          ]
        },
        {
          title: "How your information is used",
          body: [
            "Your information may be used to recommend the right Zoom batch, respond to your inquiry, follow up on a booking request, share relevant class details, or provide support related to diet charts and wellness guidance.",
            "The platform may also use limited information to improve the website experience, understand common user needs, and manage support operations more clearly."
          ]
        },
        {
          title: "Sharing and storage",
          body: [
            "Information is not intended to be sold to third parties. It may only be shared with trusted tools or service providers required to run the website, store submissions, or send booking-related communication.",
            "Reasonable steps are taken to store and handle submitted information responsibly, but no internet-based system can promise absolute security."
          ]
        },
        {
          title: "Your choices",
          body: [
            "You may contact the organization if you want to review, update, or request removal of the information you submitted through the website.",
            "If you do not want to share optional details, you may simply leave those fields blank unless they are clearly marked as required."
          ]
        }
      ]}
    />
  );
}
