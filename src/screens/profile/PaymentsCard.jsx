import React, { useEffect, useState } from "react";
import { PBtn } from "../../components/ui";
import { Pill } from "../../components/kit";
import { IconCheck, IconLock, IconSend } from "../../icons";
import { getConnectStatus, startConnectOnboarding } from "../../utils/payments";
import SettingsCard from "./SettingsCard";

/** "Get paid online": connect the freelancer's own Stripe account so clients can pay invoices by card (Agency). */
export default function PaymentsCard({ userTier, setTab }) {
  const agency = userTier === "agency";
  const [status, setStatus] = useState(null); // null = loading, { connected, ready } or { error }
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!agency) return undefined;
    let live = true;
    getConnectStatus()
      .then((s) => live && setStatus(s))
      .catch((e) => live && setStatus({ error: e.message }));
    return () => { live = false; };
  }, [agency]);

  const connect = async () => {
    setBusy(true); setError("");
    try { await startConnectOnboarding(); } catch (e) { setError(e.message); setBusy(false); }
  };

  const ready = status?.ready;
  const connected = status?.connected;

  return (
    <SettingsCard
      id="payments" iconTone="mint" icon={<IconSend size={22} />}
      title="Get paid online"
      description="Add a pay link to your invoices. Clients pay by card and the money goes straight to your own Stripe account."
      aside={agency
        ? (ready ? <Pill tone="mint">Ready</Pill> : connected ? <Pill tone="butter">Finish setup</Pill> : null)
        : <Pill tone="lilac"><IconLock size={13} /> Agency</Pill>}
    >
      {!agency ? (
        <div className="prof-row">
          <p className="prof-row-text"><strong>Part of the Agency plan</strong>Upgrade to connect Stripe and send pay links with your invoices.</p>
          <PBtn color="var(--lilac)" onClick={() => setTab("pricing")}>See plans</PBtn>
        </div>
      ) : (
        <div className="prof-row">
          <p className="prof-row-text">
            {ready
              ? <><strong>Stripe is connected</strong>Use "Pay link" on any unpaid job in Jobs. Paid invoices are marked for you.</>
              : connected
                ? <><strong>One more step</strong>Stripe still needs a few details before you can take payments.</>
                : <><strong>Connect Stripe</strong>Stripe checks your identity and bank details. DMGE never sees your card or bank numbers.</>}
          </p>
          {ready
            ? <span className="prof-ok"><IconCheck size={18} /> Connected</span>
            : <PBtn color="var(--butter)" onClick={connect} disabled={busy || status === null}>{busy ? "Opening Stripe..." : connected ? "Finish setup" : "Connect Stripe"}</PBtn>}
        </div>
      )}
      {agency && status?.error && <p className="prof-msg" role="alert">Couldn't check Stripe yet: {status.error}</p>}
      {error && <p className="prof-msg" role="alert">{error}</p>}
    </SettingsCard>
  );
}
