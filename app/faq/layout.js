export const metadata = {
  title: "Self Drive Car Rental FAQs Chennai",
  description:
    "Answers to all your self drive car rental questions in Chennai. Security deposit, documents needed, unlimited km, home delivery, fuel policy, insurance coverage and more.",
  keywords: [
    "self drive car rental FAQ Chennai",
    "car rental questions Chennai",
    "MM Miles FAQ",
    "self drive car rental rules Chennai",
    "car rental documents Chennai",
    "no deposit car rental FAQ",
  ].join(", "),
  alternates: {
    canonical: "https://www.mmmiles.com/faq",
  },
  openGraph: {
    title: "Self Drive Car Rental FAQs Chennai | MM Miles",
    description:
      "All your self drive car rental questions answered. Zero deposit, unlimited km, home delivery and more.",
    url: "https://www.mmmiles.com/faq",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-snippet": -1,
      "max-image-preview": "large",
    },
  },
};

export default function FAQLayout({ children }) {
  return <>{children}</>;
}
