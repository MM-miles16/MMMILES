import "./../styles/reset.css";
import Footer from "./components/Footer";
import Navbar from "./components/Navbar";

export const metadata = {
  title: "MM Miles | Luxury Car Rentals in Chennai",
  description:
    "Rent premium cars like Bentley, BMW, and Audi in Chennai with Urban Drive. Easy booking, great pricing, and top service.",
  openGraph: {
    title: "MM Miles | Luxury Car Rentals in Chennai",
    description:
      "Rent premium cars like Bentley, BMW, and Audi in Chennai with Urban Drive. Easy booking, great pricing, and top service.",
    url: "https://www.urbandrive.in",
    siteName: "MM Miles",
    images: [
      {
        url: "/bentley.png", // <-- full path recommended: https://www.urbandrive.in/bentley.png
        width: 1200,
        height: 630,
        alt: "Bentley luxury car for rent",
      },
    ],
    locale: "en_IN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "MM Miles | Luxury Car Rentals in Chennai",
    description:
      "Rent premium cars like Bentley, BMW, and Audi in Chennai with Urban Drive.",
    images: ["/bentley.png"],
  },
};


import { Toaster } from "react-hot-toast";

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <Navbar />
        {children}
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
            },
          }}
        />
        <Footer />
      </body>
    </html>
  );
}
