import { LegalPage } from "../components/legal-page";

export default function RefundPolicyPage() {
  return (
    <LegalPage
      eyebrow="Refund policy"
      title="This policy explains how refund requests may be reviewed for classes, batches, and wellness purchases."
      intro="Because wellness services may include reserved class spots, guidance time, and digital coordination, refund decisions may depend on the type of purchase and the stage of delivery."
      highlights={[
        {
          title: "Batch bookings",
          body: "Refund requests for booked batches may be reviewed based on timing, seat reservation, and whether classes have already started."
        },
        {
          title: "Consultation or intake",
          body: "If a call or intake review has already been delivered, it may be treated as a completed service."
        },
        {
          title: "Products",
          body: "Physical wellness products may be considered separately depending on delivery status and item condition."
        }
      ]}
      sections={[
        {
          title: "Class and batch payments",
          body: [
            "If a payment is made for a Zoom batch or guided wellness program, refund eligibility may depend on whether the batch seat was reserved, whether onboarding was already completed, and whether the classes have begun.",
            "In some cases, transfer to a different batch or future schedule may be offered instead of a refund when that is operationally more suitable."
          ]
        },
        {
          title: "Consultation, intake, and guidance sessions",
          body: [
            "If the organization has already reviewed your intake, provided personalized guidance, or delivered a consultation call, that service may be treated as completed.",
            "Requests related to scheduling conflicts or rescheduling may still be reviewed in a reasonable and case-specific way."
          ]
        },
        {
          title: "Wellness product refunds",
          body: [
            "If physical products are offered through the website, refund or replacement requests may depend on whether the order has already shipped, whether the package is damaged, or whether the item was received in unusable condition.",
            "Opened, used, or unsuitable wellness items may not always qualify for return or refund unless required by applicable law."
          ]
        },
        {
          title: "How to request a review",
          body: [
            "If you believe a refund request should be reviewed, contact the organization with your order or booking details, the reason for the request, and any relevant supporting information.",
            "Each request may be reviewed in a fair, reasonable, and case-specific manner."
          ]
        }
      ]}
    />
  );
}
