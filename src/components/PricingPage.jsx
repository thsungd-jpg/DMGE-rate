import React, { useState } from 'react';
import { PBox, PBtn } from './ui';
import { TIERS } from '../utils/subscription';
import { IconTierFree, IconTierPro, IconTierAgency, IconCheck, IconCross } from '../icons';

const CHECK = 'CHECK';
const CROSS = 'CROSS';

function FeatureRow({ label, free, pro, agency }) {
  const isIcon = (v) => v === '∞';
  const renderValue = (v, color) => {
    if (v === CHECK) return <IconCheck size={22} color={color} />;
    if (v === CROSS) return <IconCross size={22} color="#666" />;
    return v;
  };
  return (
    <div style={{
      display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr',
      borderBottom: '0.25rem solid #333', padding: '0.75rem 0', alignItems: 'center',
      fontSize: "0.6875rem", lineHeight: 1.8,
    }}>
      <div style={{ color: '#ccc' }}>{label}</div>
      <div style={{ display: 'flex', justifyContent: 'center', color: free === CROSS ? '#666' : '#9E9E9E', fontSize: isIcon(free) ? "1.125rem" : "0.6875rem" }}>{renderValue(free, '#9E9E9E')}</div>
      <div style={{ display: 'flex', justifyContent: 'center', color: pro === CROSS ? '#666' : '#FFD700', fontSize: isIcon(pro) ? "1.125rem" : "0.6875rem" }}>{renderValue(pro, '#FFD700')}</div>
      <div style={{ display: 'flex', justifyContent: 'center', color: agency === CROSS ? '#666' : '#E040FB', fontSize: isIcon(agency) ? "1.125rem" : "0.6875rem" }}>{renderValue(agency, '#E040FB')}</div>
    </div>
  );
}

export default function PricingPage({ currentTier, onSelectPlan, onBack }) {
  const [billingCycle, setBillingCycle] = useState('month'); // 'month' or 'year'

  const getPrice = (tierKey) => {
    const tier = TIERS[tierKey];
    if (!tier.prices) return 0;
    return billingCycle === 'year' ? tier.prices.annual : tier.prices.monthly;
  };

  const getIntervalLabel = () => billingCycle === 'year' ? 'PER YEAR' : 'PER MONTH';
  const getStripeInterval = () => billingCycle === 'year' ? 'year' : 'month';

  return (
    <div style={{ fontFamily: "'Press Start 2P', monospace" }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: "2.1875rem" }}>
        <PBtn small color="#FFB347" onClick={onBack} style={{ display: 'flex', alignItems: 'center', gap: "0.5rem", color: "#0A0A0A" }}>
          <IconArrowLeft size={18} color="#0A0A0A" /> CALC
        </PBtn>

        {/* Billing Toggle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', background: '#2a2a2a', padding: '0.5rem', border: '0.25rem solid #000' }}>
          <div 
            onClick={() => setBillingCycle('month')}
            style={{ 
              fontSize: '0.5625rem', padding: '0.5rem 0.75rem', cursor: 'pointer',
              background: billingCycle === 'month' ? '#FFD700' : 'transparent',
              color: billingCycle === 'month' ? '#2a2a2a' : '#fff'
            }}
          >
            MONTHLY
          </div>
          <div 
            onClick={() => setBillingCycle('year')}
            style={{ 
              fontSize: '0.5625rem', padding: '0.5rem 0.75rem', cursor: 'pointer',
              background: billingCycle === 'year' ? '#E040FB' : 'transparent',
              color: billingCycle === 'year' ? '#2a2a2a' : '#fff',
              position: 'relative'
            }}
          >
            ANNUAL
            <div style={{ 
              position: 'absolute', top: '-0.75rem', right: '-0.5rem', background: '#4CAF50', 
              color: '#fff', fontSize: '0.375rem', padding: '0.125rem 0.25rem', border: '0.125rem solid #000'
            }}>
              -20%
            </div>
          </div>
        </div>
      </div>

      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: "2.5rem" }}>
        <div style={{ fontSize: "1.375rem", color: '#2a2a2a', lineHeight: 1.8 }}>SELECT YOUR PLAN</div>
        <div style={{ fontSize: "0.75rem", color: '#6a5a7a', marginTop: "0.625rem" }}>POWER UP YOUR BUSINESS</div>
        
        {currentTier !== 'free' && (
          <div style={{ marginTop: "1.5625rem" }}>
            <PBtn small color="#FFD700" onClick={() => onSelectPlan('portal')} style={{ color: '#2a2a2a' }}>
              ⚙️ MANAGE SUBSCRIPTION
            </PBtn>
            <div style={{ fontSize: "0.5rem", color: '#666', marginTop: "0.5rem" }}>
              DOWNGRADE OR CANCEL VIA STRIPE PORTAL
            </div>
          </div>
        )}
      </div>

      {/* Tier Cards */}
      <div className="price-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: "1.25rem", marginBottom: "2.5rem" }}>

        {/* FREE CARD */}
        <PBox bg="#f5f5f5" borderColor={currentTier === 'free' ? '#9E9E9E' : '#ddd'} shadowColor={currentTier === 'free' ? '#9E9E9E' : '#ddd'} style={{ padding: "1.5625rem", textAlign: 'center' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: "0.625rem" }}>
            <IconTierFree size={30} color="#9E9E9E" />
          </div>
          <div style={{ fontSize: "1rem", color: '#9E9E9E', marginBottom: "0.9375rem" }}>FREE</div>
          <div style={{ fontSize: "1.75rem", color: '#2a2a2a', marginBottom: "0.3125rem" }}>$0</div>
          <div style={{ fontSize: "0.625rem", color: '#999', marginBottom: "1.25rem" }}>FOREVER</div>
          <div style={{ fontSize: "0.625rem", color: '#666', lineHeight: 2.2, marginBottom: "1.25rem" }}>
            {TIERS.free.limits.clients} CLIENTS<br />
            {TIERS.free.limits.templates} TEMPLATES<br />
            {TIERS.free.limits.historyDays}-DAY HISTORY<br />
            {TIERS.free.limits.pdfsPerDay} PDF/DAY
          </div>
          {currentTier === 'free' ? (
            <PBtn full color="#ddd" disabled style={{ fontSize: "0.6875rem" }}>CURRENT PLAN</PBtn>
          ) : (
            <PBtn full color="#ddd" onClick={() => onSelectPlan('free')} style={{ fontSize: "0.6875rem" }}>DOWNGRADE</PBtn>
          )}
        </PBox>

        {/* PRO CARD */}
        <PBox bg="#fffdf0" borderColor="#FFD700" shadowColor="#d4a800" style={{ padding: "1.5625rem", textAlign: 'center', position: 'relative' }}>
          <div style={{
            position: 'absolute', top: "-0.9375rem", left: '50%', transform: 'translateX(-50%)',
            background: '#FFD700', color: '#2a2a2a', fontSize: "0.5625rem", padding: '0.25rem 0.75rem',
            border: '0.25rem solid #2a2a2a',
          }}>
            MOST POPULAR
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: "0.625rem" }}>
            <IconTierPro size={30} color="#FFD700" />
          </div>
          <div style={{ fontSize: "1rem", color: '#FFD700', marginBottom: "0.9375rem" }}>PRO</div>
          <div style={{ fontSize: "1.75rem", color: '#2a2a2a', marginBottom: "0.3125rem" }}>${billingCycle === 'year' ? Math.floor(TIERS.pro.prices.annual / 12) : TIERS.pro.prices.monthly}</div>
          <div style={{ fontSize: "0.5rem", color: '#999', marginBottom: "1.25rem" }}>{billingCycle === 'year' ? `($${TIERS.pro.prices.annual} BILLED ANNUALLY)` : 'PER MONTH'}</div>
          <div style={{ fontSize: "0.625rem", color: '#666', lineHeight: 2.2, marginBottom: "1.25rem" }}>
            {TIERS.pro.limits.clients} CLIENTS<br />
            {TIERS.pro.limits.templates} TEMPLATES<br />
            {TIERS.pro.limits.historyDays}-DAY HISTORY<br />
            {TIERS.pro.limits.pdfsPerDay} PDF/DAY<br />
            OFFLINE CALC<br />
            BASIC EXPORT
          </div>
          {currentTier === 'pro' ? (
            <PBtn full color="#FFD700" disabled style={{ fontSize: "0.6875rem", color: '#2a2a2a' }}>YOUR CURRENT PLAN</PBtn>
          ) : (
            <PBtn full color="#FFD700" onClick={() => onSelectPlan('pro', getStripeInterval())} style={{ fontSize: "0.6875rem", color: '#2a2a2a' }}>
              {currentTier === 'free' ? 'UPGRADE TO PRO' : 'SWITCH TO PRO'}
            </PBtn>
          )}
        </PBox>

        {/* AGENCY CARD */}
        <PBox bg="#1a1a2e" borderColor="#E040FB" shadowColor="#9C27B0" style={{ padding: "1.5625rem", textAlign: 'center' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: "0.625rem" }}>
            <IconTierAgency size={30} color="#E040FB" />
          </div>
          <div style={{ fontSize: "1rem", color: '#E040FB', marginBottom: "0.9375rem" }}>AGENCY</div>
          <div style={{ fontSize: "1.75rem", color: '#fff', marginBottom: "0.3125rem" }}>${billingCycle === 'year' ? Math.floor(TIERS.agency.prices.annual / 12) : TIERS.agency.prices.monthly}</div>
          <div style={{ fontSize: "0.5rem", color: '#999', marginBottom: "1.25rem" }}>{billingCycle === 'year' ? `($${TIERS.agency.prices.annual} BILLED ANNUALLY)` : 'PER MONTH'}</div>
          <div style={{ fontSize: "0.625rem", color: '#aaa', lineHeight: 2.2, marginBottom: "1.25rem" }}>
            {TIERS.agency.limits.clients} CLIENTS / TEMPLATES<br />
            {TIERS.agency.limits.historyDays}-DAY JOB HISTORY<br />
            {TIERS.agency.limits.pdfsPerDay} INVOICES / DAY<br />
            CLOUD SYNC / ANALYTICS<br />
            WHITE-LABEL / PRIORITY
          </div>
          {currentTier === 'agency' ? (
            <PBtn full color="#E040FB" disabled style={{ fontSize: "0.6875rem", color: '#fff' }}>YOUR CURRENT PLAN</PBtn>
          ) : (
            <PBtn full color="#E040FB" onClick={() => onSelectPlan('agency', getStripeInterval())} style={{ fontSize: "0.6875rem", color: '#fff' }}>
              {currentTier === 'free' ? 'UPGRADE TO AGENCY' : 'SWITCH TO AGENCY'}
            </PBtn>
          )}
        </PBox>
      </div>

      {/* Feature Comparison Table */}
      <PBox bg="#1a1a2e" borderColor="#333" shadowColor="#111" style={{ padding: "1.875rem" }}>
        <div style={{ fontSize: "0.875rem", color: '#FFD700', marginBottom: "1.25rem", textAlign: 'center' }}>
          FEATURE COMPARISON
        </div>

        {/* Header Row */}
        <div style={{
          display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr',
          borderBottom: '0.25rem solid #FFD700', paddingBottom: 10, marginBottom: "0.625rem",
          fontSize: "0.6875rem", color: '#fff',
        }}>
          <div>FEATURE</div>
          <div style={{ textAlign: 'center' }}>FREE</div>
          <div style={{ textAlign: 'center' }}>PRO</div>
          <div style={{ textAlign: 'center' }}>AGENCY</div>
        </div>

        <FeatureRow label="CLIENTS" free="20" pro="100" agency="500" />
        <FeatureRow label="TEMPLATES" free="20" pro="100" agency="500" />
        <FeatureRow label="JOB HISTORY" free="30 D" pro="30 D" agency="30 D" />
        <FeatureRow label="PDF INVOICES" free="5/D" pro="25/D" agency="125/D" />
        <FeatureRow label="CSV EXPORT" free={CROSS} pro={CROSS} agency={CHECK} />
        <FeatureRow label="ANALYTICS" free={CROSS} pro={CROSS} agency={CHECK} />
        <FeatureRow label="CLOUD SYNC" free={CROSS} pro={CROSS} agency={CHECK} />
        <FeatureRow label="WHITE-LABEL" free={CROSS} pro={CROSS} agency={CHECK} />
        <FeatureRow label="PRIORITY SUPPORT" free={CROSS} pro={CROSS} agency={CHECK} />
      </PBox>
    </div>
  );
}
