import React from "react";
import { Chip, Desc, Group, Row, useDescribe } from "../../world/controls";
import { CLIENT, EXCLUSIVITY, TERM, USAGE } from "./describe";
import { PSelect } from "../../components/ui";
import { clientMods, hasLicensing, usageRightsMods, usageTermMods } from "../../utils/pricing";

// Step 4: who is paying. Step 5: how the work will be used.

export function WhoStation({ ctx }) {
  const { clients, form, selectedClientId, set, setForm, setPrice, setSelectedClientId } = ctx;
  const [d, peek] = useDescribe();
  return (
    <>
      <div className="qw-in"><Group label="Client type">
        <Row>{Object.entries(clientMods).map(([k, v]) => <Chip key={k} tone="blue" on={form.clientType === k} sub={`×${v}`} onClick={() => set("clientType")(k)} {...peek({ name: k, text: CLIENT[k] })}>{k}</Chip>)}</Row>
        <Desc d={d} selected={{ name: form.clientType, text: CLIENT[form.clientType] }} tone="blue" />
      </Group></div>
      <div className="qw-in"><Group label="Quote for" hint="A saved client brings their own rate multiplier and preferences.">
        <PSelect
          label="Quote for"
          value={selectedClientId}
          onChange={(id) => {
            setSelectedClientId(id);
            const c = clients.find((cl) => cl.id === id);
            if (c) setForm((f) => ({ ...f, complexity: c.preferredComplexity, usage: c.preferredUsageRights, clientType: c.preferredClientType }));
            setPrice(null);
          }}
          options={[{ label: "No client (default rates)", value: "" }, ...clients.map((c) => ({ label: `${c.name} (${c.rateMultiplier}x)`, value: c.id }))]}
          iconType="none"
        />
      </Group></div>
    </>
  );
}

export function RightsStation({ ctx, patch }) {
  const { category, form, role, set } = ctx;
  const licensing = hasLicensing(category, role.name), term = form.usageTerm || "1 year";
  const [du, peekU] = useDescribe(), [dt, peekT] = useDescribe(), [de, peekE] = useDescribe();
  const exName = form.exclusive ? "Exclusive" : "Not exclusive";
  return (
    <>
      <div className="qw-in"><Group label="Usage rights">
        <Row>{Object.entries(usageRightsMods).map(([k, v]) => <Chip key={k} tone="mint" on={form.usage === k} sub={`×${v}`} onClick={() => set("usage")(k)} {...peekU({ name: k, text: USAGE[k] })}>{k}</Chip>)}</Row>
        <Desc d={du} selected={{ name: form.usage, text: USAGE[form.usage] }} tone="mint" />
      </Group></div>
      {licensing && (
        <>
          <div className="qw-in"><Group label="Licence term">
            <Row>{Object.keys(usageTermMods).map((k) => <Chip key={k} tone="lilac" on={term === k} onClick={() => patch({ usageTerm: k })} {...peekT({ name: k, text: TERM[k] })}>{k}</Chip>)}</Row>
            <Desc d={dt} selected={{ name: term, text: TERM[term] }} tone="lilac" />
          </Group></div>
          <div className="qw-in"><Group label="Category exclusivity">
            <Row>
              <Chip tone="pink" on={!form.exclusive} onClick={() => patch({ exclusive: false })} {...peekE({ name: "Not exclusive", text: EXCLUSIVITY["Not exclusive"] })}>Not exclusive</Chip>
              <Chip tone="pink" on={!!form.exclusive} onClick={() => patch({ exclusive: true })} {...peekE({ name: "Exclusive", text: EXCLUSIVITY.Exclusive })}>Exclusive</Chip>
            </Row>
            <Desc d={de} selected={{ name: exName, text: EXCLUSIVITY[exName] }} tone="pink" />
          </Group></div>
        </>
      )}
    </>
  );
}
