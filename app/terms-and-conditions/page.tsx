import { LegalPage } from "../components/legal-page";

export default function TermsPage() {
  return (
    <LegalPage
      eyebrow="Terms and conditions"
      title="These terms explain how the website, classes, and inquiry flow are expected to be used."
      intro="By using the website, browsing programs, submitting a form, or joining a class, you agree to use the platform respectfully and for lawful personal use."
      highlights={[
        {
          title: "Website use",
          body: "The website is intended to help people understand programs, submit inquiries, and connect with the organization."
        },
        {
          title: "Program access",
          body: "Joining a program or Zoom batch may require review of your submitted details and confirmation from the team."
        },
        {
          title: "Content purpose",
          body: "Website information is provided for general wellness guidance and introductory understanding of the platform."
        }
      ]}
      sections={[
        {
          title: "Use of the website",
          body: [
            "You agree to use the website for personal, genuine, and lawful purposes. You must not attempt to misuse forms, interfere with site performance, or submit misleading information.",
            "All design elements, written content, and branding on the website remain the property of the organization unless stated otherwise."
          ]
        },
        {
          title: "Program and batch participation",
          body: [
            "Submitting an inquiry does not automatically guarantee enrollment in a specific class or batch. The team may review your details and suggest a more suitable option based on timing, availability, and wellness needs.",
            "Students are expected to follow session instructions responsibly, arrive on time for Zoom classes, and communicate honestly about health conditions where relevant."
          ]
        },
        {
          title: "Wellness guidance",
          body: [
            "The information shared through the website or classes is intended to support wellness routines and informed participation in the platform. It should not be treated as a substitute for emergency, diagnostic, or specialist medical care.",
            "If you have a serious or urgent health issue, you should consult an appropriate licensed medical professional."
          ]
        },
        {
          title: "Changes to the platform",
          body: [
            "Programs, schedules, instructors, product listings, and supporting information may be updated from time to time to improve the platform or reflect operational changes.",
            "The organization may revise these terms as needed. Updated versions can be published on the website when changes are made."
          ]
        }
      ]}
    />
  );
}
