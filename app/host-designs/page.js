import ClosingCta from "../components/landing/ClosingCta";
import HostDark from "../components/landing/host-options/HostDark";
import HostMapStory from "../components/landing/host-options/HostMapStory";
import HostSpotlight from "../components/landing/host-options/HostSpotlight";
import ui from "../components/landing/ui.module.css";

// TEMPORARY preview page: compare host-section designs, then delete this route and the unused options.
export const metadata = {
  title: "Host section designs (preview)",
  robots: { index: false, follow: false },
};

const OPTIONS = [
  ["Option 1", "Solutions board", "Your reference layout: map top right, five numbered cards staggered below.", ClosingCta],
  ["Option 2", "Host spotlight", "A real host's portrait with floating payout, OTP and support badges.", HostSpotlight],
  ["Option 3", "Map story", "A large map is the hero, with the host's words over the sea.", HostMapStory],
  ["Option 4", "Midnight", "Dark panel, glowing map and glass feature tiles.", HostDark],
];

export default function HostDesignsPage() {
  return (
    <main className={ui.homeType}>
      {OPTIONS.map(([n, name, note, Section]) => (
        <div key={n} style={{ paddingTop: 28 }}>
          <div className={ui.container}>
            <p style={{ margin: 0, fontFamily: "var(--mm-font)", fontSize: 15, color: "var(--mm-muted)" }}>
              <b style={{ marginRight: 10, color: "var(--mm-ink)" }}>
                {n}: {name}
              </b>
              {note}
            </p>
          </div>
          <Section />
        </div>
      ))}
    </main>
  );
}
