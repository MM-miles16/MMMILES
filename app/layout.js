import "./../styles/reset.css";
import "./../styles/tokens.css";
import "./globals.css";
import LayoutWrapper from "./components/LayoutWrapper";
import ChatSupport from "./components/ChatSupport";

import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import { Toaster } from "react-hot-toast";

import {
  Frank_Ruhl_Libre,
  Darker_Grotesque,
  Sanchez,
  Poppins,
  IBM_Plex_Sans,
} from "next/font/google";


/* =========================
   Fonts — UNCHANGED
========================= */
const frankRuhl = Frank_Ruhl_Libre({
  subsets: ["latin"],
  weight: ["300", "400", "500", "700", "900"],
  variable: "--font-frank-ruhl",
});

const darkerGrotesque = Darker_Grotesque({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  variable: "--font-darker-grotesque",
});

const sanchez = Sanchez({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-sanchez",
});

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-poppins",
});
const ibmPlexSans = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-ibm-plex",
});

/* =========================
   Metadata
========================= */
export const metadata = {
  // metadataBase: CRITICAL FIX
  // Your original had this but OG description was weak and robots was missing.
  // Without robots config, Google ignores snippet length limits.
  metadataBase: new URL("https://www.mmmiles.com"),

  // Title template: child pages set title: "X" → renders "X | MM Miles"
  // Your original said "MM Miles | Car Rentals in Chennai" — weak, no USPs
  title: {
    default: "Self Drive Car Rental in Chennai | No Deposit, Unlimited KM | MM Miles",
    template: "%s | MM Miles",
  },

  // Your original: "Rent cars in Chennai with MM Miles. Flexible car rentals..."
  // Problem: no price, no USP, "professionals" limits your audience
  description:
    "Rent self drive cars in Chennai from ₹799/day. SUVs, sedans & hatchbacks. Zero security deposit, unlimited km, home delivery across all Chennai areas. 10,000+ happy customers.",

  // NEW: keywords help Google understand your entity (not a direct ranking factor
  // but helps with entity disambiguation and AI overview inclusion)
  keywords: [
    "self drive car rental Chennai",
    "car rental in Chennai",
    "self drive cars Chennai",
    "rent a car Chennai",
    "no deposit car rental Chennai",
    "unlimited km car rental Chennai",
    "MM Miles",
  ].join(", "),

  // NEW: explicit robots config — tells Google exactly how to handle snippets
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-snippet": -1,            // allow Google to show full snippet length
      "max-image-preview": "large", // allow large images in search results
      "max-video-preview": -1,
    },
  },

  // Your original OG description said "Drive premium cars without ownership"
  // That's a B2B/LinkedIn angle — hurts B2C conversion from Google search
  openGraph: {
    title: "Self Drive Car Rental in Chennai | No Deposit, Unlimited KM | MM Miles",
    description:
      "Rent self drive cars in Chennai from ₹799/day. Zero deposit, unlimited km, home delivery. 10,000+ happy customers.",
    url: "https://www.mmmiles.com",
    siteName: "MM Miles",
    type: "website",
    locale: "en_IN",
    images: [
      {
        url: "/mmmiles-og.jpg",
        width: 1200,
        height: 630,
        alt: "MM Miles – Self Drive Car Rental Chennai",
      },
    ],
  },

  // NEW: twitter site + creator handles (needed for Twitter card to show verified)
  twitter: {
    card: "summary_large_image",
    site: "@mmmiles",
    creator: "@mmmiles",
    title: "Self Drive Car Rental in Chennai | MM Miles",
    description:
      "Rent self drive cars in Chennai. Zero deposit, unlimited km. Book now!",
    images: ["/mmmiles-og.jpg"],
  },

  // NEW: helps Google understand MM Miles as a named entity
  applicationName: "MM Miles",
  authors: [{ name: "MM Miles", url: "https://www.mmmiles.com" }],
  category: "Car Rental",

  // Add your Google Search Console verification token here:
  // verification: {
  //   google: "YOUR_TOKEN_FROM_SEARCH_CONSOLE",
  // },
};

/* =========================
   Root Layout — UNCHANGED
========================= */
export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${frankRuhl.variable} ${darkerGrotesque.variable} ${ibmPlexSans.variable} ${sanchez.variable} ${poppins.variable}`}
      >
        <LayoutWrapper>

        {children}
        <ChatSupport />

        <Toaster
          position="top-center"
          toastOptions={{
            duration: 4000,
            style: {
              background: "#F9F4EC",
              color: "#333",
              borderRadius: "10px",
              border: "1px solid #d4a762",
              fontSize: "14px",
              fontWeight: "500",
              fontFamily: "Frank Ruhl Libre",
            },
          }}
        />

        
           </LayoutWrapper>
           
        
      </body>
    </html>
  );
}
