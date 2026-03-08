import React from "react";
import Link from "next/link";

export default function NotFound() {
  return (
    <main className="section" role="alert" aria-live="assertive">
      <div className="sectionInner">
        <div className="calloutCard">
          <p className="kicker">404</p>
          <h1 className="sectionTitle" style={{ marginTop: 8 }}>
            Page Not Found
          </h1>
          <p className="sectionText">
            The page you’re looking for doesn’t exist.
          </p>
          <div className="btnRow" style={{ marginTop: 14 }}>
            <Link className="button buttonPrimary" href="/">
              Back to invitation
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
