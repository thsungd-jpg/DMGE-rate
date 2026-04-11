import React from 'react';
import { PBox, PBtn } from './ui';
import { TIERS } from '../utils/subscription';
import { IconTierFree, IconTierPro, IconTierAgency, IconLock } from '../icons';

export default function UpgradeModal({ isOpen, onClose, feature, currentTier, onUpgrade }) {
  if (!isOpen) return null;

  const tierInfo = TIERS[currentTier] || TIERS.free;
  const isOnFree = currentTier === 'free';

  const featureMessages = {
    clients: { title: 'CLIENT LIMIT REACHED', desc: `FREE TIER ALLOWS ${TIERS.free.limits.clients} CLIENTS. UPGRADE TO PRO (100) OR AGENCY (500).` },
    templates: { title: 'TEMPLATE LIMIT REACHED', desc: `FREE TIER ALLOWS ${TIERS.free.limits.templates} TEMPLATES. UPGRADE TO PRO (100) OR AGENCY (500).` },
    analytics: { title: 'ANALYTICS LOCKED', desc: 'ANALYTICS DASHBOARD IS AN AGENCY FEATURE. UPGRADE TO UNLOCK.' },
    csv: { title: 'CSV EXPORT LOCKED', desc: 'CSV EXPORT IS AN AGENCY FEATURE. UPGRADE TO EXPORT DATA.' },
    pdf: { title: 'PDF LIMIT REACHED', desc: `YOUR TIER ALLOWS ${TIERS[currentTier]?.limits.pdfsPerDay} PDF/DAY. UPGRADE TO THE NEXT TIER FOR MORE.` },
    whiteLabel: { title: 'WHITE-LABEL LOCKED', desc: 'CUSTOM BRANDING IS AN AGENCY FEATURE. UPGRADE TO UNLOCK.' },
    history: { title: 'HISTORY LIMITED', desc: `YOUR TIER SHOWS THE LAST ${TIERS[currentTier]?.limits.historyDays} DAYS OF JOBS.` },
  };

  const msg = featureMessages[feature] || { title: 'UPGRADE REQUIRED', desc: 'THIS FEATURE REQUIRES A HIGHER TIER.' };

  return (
    <div className="modal-overlay" style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.75)', zIndex: 2000,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: "2.5rem", fontFamily: "'Press Start 2P', monospace",
    }}>
      <PBox bg="#2a2a2a" borderColor="#FFD700" shadowColor="#d94a8a" style={{ maxWidth: "34.375rem", width: '100%', padding: "2.5rem" }}>
        {/* Lock Icon */}
        <div style={{ textAlign: 'center', marginBottom: "1.25rem", display: 'flex', justifyContent: 'center' }}><IconLock size={75} color="#FFD700" /></div>

        {/* Title */}
        <div style={{ fontSize: "1rem", color: '#FFD700', textAlign: 'center', marginBottom: "1.25rem", lineHeight: 1.8 }}>
          {msg.title}
        </div>

        {/* Description */}
        <div style={{ fontSize: "0.6875rem", color: '#ccc', textAlign: 'center', marginBottom: "1.875rem", lineHeight: 2 }}>
          {msg.desc}
        </div>

        {/* Current Tier Badge */}
        <div style={{ textAlign: 'center', marginBottom: "1.5625rem" }}>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: "0.375rem", padding: '0.5rem 1rem',
            background: tierInfo.color + '33', border: `0.25rem solid ${tierInfo.color}`,
            color: tierInfo.color, fontSize: "0.75rem",
          }}>
            CURRENT: 
            {currentTier === 'free' && <IconTierFree size={16} color={tierInfo.color} />}
            {currentTier === 'pro' && <IconTierPro size={16} color={tierInfo.color} />}
            {currentTier === 'agency' && <IconTierAgency size={16} color={tierInfo.color} />}
            {tierInfo.badge}
          </span>
        </div>

        {/* Upgrade Buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: "0.75rem" }}>
          {isOnFree && (
            <PBtn full color="#FFD700" onClick={() => onUpgrade('pro')} style={{ fontSize: "0.875rem", color: '#2a2a2a', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: "0.5rem" }}>
              <IconTierPro size={16} color="#2a2a2a" /> UPGRADE TO PRO — $9/MO
            </PBtn>
          )}
          {(isOnFree || currentTier === 'pro') && (
            <PBtn full color="#E040FB" onClick={() => onUpgrade('agency')} style={{ fontSize: "0.875rem", color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: "0.5rem" }}>
              <IconTierAgency size={16} color="#fff" /> UPGRADE TO AGENCY — $29/MO
            </PBtn>
          )}
          <PBtn full color="#555" onClick={onClose} style={{ fontSize: "0.75rem", color: '#aaa' }}>
            MAYBE LATER
          </PBtn>
        </div>
      </PBox>
    </div>
  );
}
