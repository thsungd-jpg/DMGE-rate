import React from "react";
import { Chip, Desc, Group, Money, Row, Stepper, useDescribe } from "../../world/controls";
import { complexityMods } from "../../utils/pricing";
import { askQuantity, groupModels, modelKind, sizesOf, sizeMultFor, unitNoun } from "../../utils/rateModels";
import { money, qtyStep } from "./common";
import { COMPLEXITY, describeModel, describeSize } from "./describe";

// Step 2: the job itself. How you charge (grouped by time, by deliverable, share of a deal), how many of that unit, and how demanding it is.
export default function JobStation({ ctx, patch }) {
  const { form, handleResetModel, model, modelIdx, rate, role, set, setModelIdx } = ctx;
  const kind = modelKind(model), noun = unitNoun(model), groups = groupModels(role.models);
  const deal = form.deal || { pct: model.base, amount: "" };
  const [dm, peekM] = useDescribe(), [dc, peekC] = useDescribe(), [dz, peekZ] = useDescribe();
  const sizes = sizesOf(model), size = sizes && (sizes.find((x) => x.label === form.size) || sizes.find((x) => x.mult === sizeMultFor(model, undefined)) || sizes[0]);

  const pickModel = (i) => { if (i === modelIdx) return; setModelIdx(i); handleResetModel(role.models[i]); };
  const patchDeal = (obj) => patch({ deal: { ...deal, ...obj } });

  return (
    <>
      <div className="qw-in">
        <Group label="How you charge">
          {groups.map((g) => (
            <div className="qw-kind" key={g.kind}>
              {groups.length > 1 && <p className="qw-sublab">{g.label}</p>}
              <Row>{g.items.map(({ model: m, index }) => <Chip key={index} tone="mint" on={index === modelIdx} sub={m.unit} onClick={() => pickModel(index)} {...peekM({ name: m.type, text: describeModel(m) })}>{m.type}</Chip>)}</Row>
            </div>
          ))}
          <Desc d={dm} selected={{ name: model.type, text: describeModel(model) }} tone="mint" />
        </Group>
      </div>

      {sizes && (
        <div className="qw-in">
          <Group label="Size">
            <Row>{sizes.map((z) => <Chip key={z.label} tone="lilac" on={z.label === size.label} sub={z.mult === 1 ? "standard" : `×${z.mult}`} onClick={() => patch({ size: z.label })} {...peekZ({ name: z.label, text: describeSize(model, z) })}>{z.label}</Chip>)}</Row>
            <Desc d={dz} selected={{ name: size.label, text: describeSize(model, size) }} tone="lilac" />
          </Group>
        </div>
      )}

      {kind === "percent" && form.deal ? (
        <>
          <div className="qw-in">
            <Group label="Your cut" hint={`A typical cut for this role is ${model.base}%. Negotiate it, then set it here.`}>
              <Stepper value={deal.pct} onChange={(v) => patchDeal({ pct: v })} min={0.1} step={0.5} label="Your cut, in percent" />
            </Group>
          </div>
          <div className="qw-in">
            <Group label="Of what amount?" hint="What your cut is a share of (the deal, the ad spend, the sales), in dollars.">
              <Money value={deal.amount} onChange={(v) => patchDeal({ amount: v })} label="Deal amount in dollars" placeholder="20,000" />
            </Group>
            {rate.mode === "deal" && rate.rate > 0 && <p className="qw-keep" role="status">That makes a fee of <b>{money(rate.rate)}</b>.</p>}
          </div>
        </>
      ) : (
        <div className="qw-in">
          <Group label={askQuantity(model)} hint={`The rate for one ${noun.one} comes next.`}>
            <Stepper value={form.units} onChange={set("units")} min={0.1} step={qtyStep(model)} label={`Number of ${noun.many}`} />
          </Group>
        </div>
      )}

      <div className="qw-in">
        <Group label="Complexity">
          <Row>{Object.entries(complexityMods).map(([k, v]) => <Chip key={k} tone="butter" on={form.complexity === k} sub={`×${v}`} onClick={() => set("complexity")(k)} {...peekC({ name: k, text: COMPLEXITY[k] })}>{k}</Chip>)}</Row>
          <Desc d={dc} selected={{ name: form.complexity, text: COMPLEXITY[form.complexity] }} tone="butter" />
        </Group>
      </div>
    </>
  );
}
