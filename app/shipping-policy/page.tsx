import { LegalPage } from "../components/legal-page";

export default function ShippingPolicyPage() {
  return (
    <LegalPage
      eyebrow="Shipping policy"
      title="This page explains how wellness product deliveries may be handled when physical items are sold through the platform."
      intro="The platform is centered on classes and wellness guidance, but if physical products are offered, shipping timelines and availability may vary by location, stock, and delivery partner."
      highlights={[
        {
          title: "Order review",
          body: "Orders may be reviewed for availability, address clarity, and operational readiness before dispatch."
        },
        {
          title: "Delivery timing",
          body: "Shipping timelines may vary depending on destination, stock readiness, and courier service conditions."
        },
        {
          title: "Support",
          body: "If there is a delivery issue, the organization may review the order and support resolution wherever reasonably possible."
        }
      ]}
      sections={[
        {
          title: "Processing and dispatch",
          body: [
            "Orders may require a short processing window before dispatch, especially if they are linked to batch enrollment, consultation follow-up, or limited inventory.",
            "Dispatch timing may vary during holidays, weekends, or periods of high order volume."
          ]
        },
        {
          title: "Delivery timelines",
          body: [
            "Estimated delivery windows are intended as general guidance and may vary depending on courier service, weather conditions, operational constraints, or regional coverage.",
            "The organization cannot guarantee exact arrival dates once a shipment is handed over to a third-party logistics provider."
          ]
        },
        {
          title: "Address accuracy",
          body: [
            "Please ensure your name, phone number, and delivery address are accurate when placing an order. Delays or failed deliveries caused by incorrect address details may require additional review.",
            "If you need to correct an order address, contact the organization as early as possible after the order is placed."
          ]
        },
        {
          title: "Damaged or missing deliveries",
          body: [
            "If a shipment arrives damaged, incomplete, or does not arrive within a reasonable period, you should contact the organization with the order details and any supporting photos if available.",
            "The team may review the issue and offer support based on courier updates, item status, and the specific nature of the problem."
          ]
        }
      ]}
    />
  );
}
