import React, { useState, useEffect, useCallback } from "react";

export default function DMGEInvoiceEditor({ job, profile, clients, onUpdate }) {
  const client = (clients || []).find(c => c.id === job.clientId) || { name: 'CLIENT NAME / CO.', email: '', phone: '', address: '', city: '' };

  // Initial state derived from job and profile
  const [invoiceData, setInvoiceData] = useState({
    invoiceNumber: job.invoiceNumber || "#INV-0001",
    issuedDate: job.invoiceDate ? new Date(job.invoiceDate).toLocaleDateString() : new Date().toLocaleDateString(),
    dueDate: job.dueDate ? new Date(job.dueDate).toLocaleDateString() : new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toLocaleDateString(),
    status: (job.status || "UNPAID").toUpperCase(),
    fromName: profile.companyName || profile.name || "DMGE RATE SYSTEM",
    fromAddress: profile.companyAddress || "Your Street Address\nCity, State ZIP\nhello@dmgeratesystem.com\n+1 (000) 000-0000",
    toName: client.name || "CLIENT NAME / CO.",
    toAddress: `${client.address || "Client Street Address"}\n${client.city || "City, State ZIP"}\n${client.email || "client@email.com"}\n${client.phone || "+1 (000) 000-0000"}`,
    items: [],
    discount: 0,
    taxRate: 0,
    notes: job.notes || "Thank you for your business.\nReach out with any questions\nregarding this invoice.",
    paymentDetails: [
      { key: "PAYPAL", val: profile.paypalEmail || "pay@dmgeratesystem.com" }
    ],
    footerNote: "questions? hello@dmgeratesystem.com"
  });

  // Populate items from job
  useEffect(() => {
    const initialItems = [];
    
    // Primary role item
    initialItems.push({
      id: "primary",
      desc: `${job.role} - ${job.category}`,
      note: `// ${job.model} (${job.complexity || 'Standard'}, ${job.usage || 'Personal'})`,
      qty: job.units || 1,
      rate: job.baseRate || 0,
      amount: (job.units || 1) * (job.baseRate || 0)
    });

    // Materials
    if (job.materials && job.materials.length > 0) {
      job.materials.forEach((m, idx) => {
        initialItems.push({
          id: `mat-${idx}`,
          desc: `Material: ${m.name}`,
          note: `// Unit cost: $${m.cost}`,
          qty: m.qty,
          rate: m.cost,
          amount: m.qty * m.cost
        });
      });
    }

    // Travel
    if (job.travelExpense > 0) {
      initialItems.push({
        id: "travel",
        desc: "Travel Expenses",
        note: "// Direct commute costs",
        qty: 1,
        rate: job.travelExpense,
        amount: job.travelExpense
      });
    }

    setInvoiceData(prev => ({ ...prev, items: initialItems }));
  }, [job]);

  // Recalculate totals
  const subtotal = invoiceData.items.reduce((sum, item) => sum + (item.amount || 0), 0);
  const taxAmount = (subtotal - invoiceData.discount) * (invoiceData.taxRate / 100);
  const totalDue = Math.max(0, subtotal - invoiceData.discount + taxAmount);

  // Notify parent of updates
  useEffect(() => {
    if (onUpdate) {
      onUpdate({ ...invoiceData, subtotal, taxAmount, totalDue });
    }
  }, [invoiceData, subtotal, taxAmount, totalDue, onUpdate]);

  const handleFieldChange = (field, value) => {
    setInvoiceData(prev => ({ ...prev, [field]: value }));
  };

  const handleItemChange = (id, field, value) => {
    setInvoiceData(prev => {
      const newItems = prev.items.map(item => {
        if (item.id === id) {
          const updated = { ...item, [field]: value };
          if (field === 'qty' || field === 'rate') {
            const q = parseFloat(String(updated.qty).replace(/[^0-9.-]/g, '')) || 0;
            const r = parseFloat(String(updated.rate).replace(/[^0-9.-]/g, '')) || 0;
            updated.qty = q;
            updated.rate = r;
            updated.amount = q * r;
          }
          return updated;
        }
        return item;
      });
      return { ...prev, items: newItems };
    });
  };

  const addRow = () => {
    const newItem = {
      id: "new-" + Date.now(),
      desc: "Service / Project Name",
      note: "// Brief description",
      qty: 1,
      rate: 0,
      amount: 0
    };
    setInvoiceData(prev => ({ ...prev, items: [...prev.items, newItem] }));
  };

  const removeRow = (id) => {
    if (invoiceData.items.length <= 1) return;
    setInvoiceData(prev => ({ ...prev, items: prev.items.filter(item => item.id !== id) }));
  };

  const fmt = (n) => {
    const num = Number(n) || 0;
    const isWhole = num % 1 === 0;
    return "$" + num.toLocaleString(undefined, { 
      minimumFractionDigits: isWhole ? 0 : 2, 
      maximumFractionDigits: 2 
    });
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const text = e.clipboardData ? e.clipboardData.getData('text/plain') : '';
    document.execCommand('insertText', false, text);
  };

  return (
    <div className="dmge-invoice-container" style={{ 
      background: "#050505", 
      padding: "clamp(8px, 2vw, 20px)", 
      display: "flex", 
      justifyContent: "center",
      fontFamily: "'Share Tech Mono', monospace"
    }}>
      <style>{`
        .dmge-invoice-page { 
          background: #080808; 
          width: 100%; 
          max-width: 1000px;
          position: relative; 
          border: 1px solid #2E2E2E; 
          overflow: hidden; 
          color: #E8D8B0;
        }
        .dmge-invoice-page::before { 
          content: ''; position: absolute; inset: 0; 
          background: repeating-linear-gradient(to bottom, transparent 0, transparent 3px, rgba(255,179,71,0.04) 3px, rgba(255,179,71,0.04) 4px); 
          pointer-events: none; z-index: 10; 
        }
        .dmge-top-bar { height: 6px; background: linear-gradient(90deg, #FF3D8C 0%, #FFB347 40%, #FFB347 60%, #FF3D8C 100%); }
        .dmge-header { padding: clamp(20px, 4vw, 44px) clamp(16px, 5vw, 60px) clamp(16px, 3vw, 36px); display: flex; align-items: flex-start; justify-content: space-between; border-bottom: 1px solid #2E2E2E; position: relative; gap: 16px; flex-wrap: wrap; }
        .dmge-header::after { content: ''; position: absolute; bottom: -1px; left: clamp(16px, 5vw, 60px); width: 60px; height: 3px; background: #FFB347; }
        
        .dmge-logo-group { transform: scale(0.9); transform-origin: left top; flex-shrink: 0; }
        .dmge-logo-main { font-family: 'Press Start 2P', monospace; font-size: clamp(18px, 4vw, 28px); color: #FFB347; letter-spacing: 4px; line-height: 1; text-shadow: 4px 4px 0 #7A4A00; }
        .dmge-logo-sub { font-family: 'Press Start 2P', monospace; font-size: clamp(6px, 1.2vw, 8px); color: #FF3D8C; letter-spacing: 5px; margin-top: 10px; }
        
        .dmge-meta { text-align: right; flex-shrink: 0; }
        .dmge-meta-title { font-family: 'Press Start 2P', monospace; font-size: clamp(14px, 3vw, 22px); color: #FFB347; letter-spacing: 3px; margin-bottom: 15px; text-shadow: 3px 3px 0 #7A4A00; }
        
        .dmge-row { display: flex; justify-content: flex-end; align-items: baseline; gap: 12px; margin-bottom: 6px; }
        .dmge-key { font-size: clamp(9px, 1.5vw, 12px); color: #7A6A50; text-transform: uppercase; letter-spacing: 1px; }
        .dmge-val { font-size: clamp(12px, 2vw, 15px); color: #E8D8B0; min-width: 80px; text-align: right; border-bottom: 1px dashed rgba(255,179,71,0.2); outline: none; }
        .dmge-val:focus { border-bottom-color: #FFB347; background: rgba(255,179,71,0.04); }

        .dmge-address-grid { padding: clamp(16px, 3vw, 32px) clamp(16px, 5vw, 60px); display: grid; grid-template-columns: 1fr 1fr; gap: clamp(16px, 3vw, 40px); border-bottom: 1px solid #2E2E2E; }
        .dmge-label { font-family: 'Press Start 2P', monospace; font-size: clamp(7px, 1.2vw, 9px); color: #FFB347; letter-spacing: 2px; margin-bottom: 12px; display: flex; align-items: center; gap: 8px; }
        .dmge-label::before { content: '▶'; color: #FF3D8C; font-size: 6px; }
        
        .dmge-addr-name { font-size: clamp(14px, 2.5vw, 18px); color: #E8D8B0; margin-bottom: 6px; outline: none; border-bottom: 1px dashed rgba(255,179,71,0.2); display: inline-block; }
        .dmge-addr-block { font-size: clamp(12px, 1.8vw, 14px); color: #7A6A50; line-height: 1.8; outline: none; white-space: pre-wrap; border: 1px dashed rgba(255,179,71,0.1); padding: 4px; }
        .dmge-addr-block:focus { border-color: #FFB347; background: rgba(255,179,71,0.04); }

        .dmge-items-section { padding: clamp(16px, 3vw, 32px) clamp(16px, 5vw, 60px) 10px; }
        .dmge-table { width: 100%; border-collapse: collapse; }
        .dmge-table thead tr { background: #222; border-top: 1px solid #3A3A3A; border-bottom: 1px solid #3A3A3A; }
        .dmge-table th { font-family: 'Press Start 2P', monospace; font-size: clamp(6px, 1.2vw, 8px); color: #7A6A50; padding: clamp(8px, 1.5vw, 12px); text-align: left; }
        .dmge-table th.right { text-align: right; }
        .dmge-table td { padding: clamp(8px, 1.5vw, 12px); border-bottom: 1px solid #2E2E2E; vertical-align: middle; }
        
        .dmge-item-desc { font-size: clamp(13px, 2.2vw, 16px); color: #E8D8B0; outline: none; margin-bottom: 4px; }
        .dmge-item-note { font-size: clamp(10px, 1.6vw, 13px); color: #4A3E2E; outline: none; }
        .dmge-td-qty, .dmge-td-rate, .dmge-td-amt { font-size: clamp(12px, 2vw, 15px); text-align: right; outline: none; color: #7A6A50; }
        .dmge-td-amt { color: #FFB347; font-size: clamp(13px, 2.2vw, 16px); }

        .dmge-add-btn { display: block; width: calc(100% - clamp(32px, 10vw, 120px)); margin: 0 clamp(16px, 5vw, 60px) 20px; font-family: 'Press Start 2P', monospace; font-size: clamp(6px, 1.2vw, 8px); color: #C47D1A; background: transparent; border: 1px dashed #2E2E2E; padding: 10px; cursor: pointer; text-align: left; transition: all 0.2s; }
        .dmge-add-btn:hover { border-color: #C47D1A; color: #FFB347; background: rgba(255,179,71,0.04); }
        
        .dmge-totals-section { padding: 0 clamp(16px, 5vw, 60px) clamp(20px, 3vw, 40px); display: flex; justify-content: flex-end; }
        .dmge-totals-box { width: clamp(240px, 50vw, 340px); }
        .dmge-total-row { display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid #2E2E2E; }
        .dmge-t-key { font-size: clamp(10px, 1.6vw, 13px); color: #7A6A50; text-transform: uppercase; letter-spacing: 1px; }
        .dmge-t-val { font-size: clamp(13px, 2.2vw, 16px); color: #E8D8B0; }
        
        .dmge-due-block { margin-top: 14px; border: 1px solid #C47D1A; background: #222; padding: clamp(12px, 2vw, 18px) clamp(12px, 2vw, 20px); display: flex; justify-content: space-between; align-items: center; position: relative; }
        .dmge-due-block::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 3px; background: linear-gradient(90deg, #FF3D8C, #FFB347, #FF3D8C); }
        .dmge-due-label { font-family: 'Press Start 2P', monospace; font-size: clamp(7px, 1.3vw, 9px); color: #FF3D8C; line-height: 1.8; flex-shrink: 0; margin-right: 15px; }
        .dmge-due-amount { font-family: 'Press Start 2P', monospace; font-size: clamp(10px, 4vw, 18px); color: #FFB347; text-shadow: 2px 2px 0 #7A4A00; text-align: right; word-break: break-all; }

        .dmge-footer-info { padding: clamp(16px, 3vw, 32px) clamp(16px, 5vw, 60px); display: grid; grid-template-columns: 1fr 1fr; gap: clamp(16px, 3vw, 40px); border-top: 1px solid #2E2E2E; }
        .dmge-pay-row { display: flex; gap: 10px; margin-bottom: 6px; align-items: baseline; }
        .dmge-pay-key { font-size: clamp(10px, 1.6vw, 13px); color: #C47D1A; min-width: 60px; text-transform: uppercase; border-bottom: 1px dashed transparent; outline: none; }
        .dmge-pay-val { font-size: clamp(11px, 1.8vw, 14px); color: #7A6A50; border-bottom: 1px dashed transparent; outline: none; }
        .dmge-pay-key:focus, .dmge-pay-val:focus { border-bottom-color: #FFB347; }

        .dmge-page-footer { padding: clamp(10px, 2vw, 15px) clamp(16px, 5vw, 60px); background: #111; display: flex; justify-content: space-between; align-items: center; border-top: 1px solid #2E2E2E; flex-wrap: wrap; gap: 8px; }
        .dmge-footer-brand { font-family: 'Press Start 2P', monospace; font-size: clamp(5px, 1vw, 7px); color: #C47D1A; opacity: 0.7; }
        .dmge-footer-note { font-size: clamp(10px, 1.6vw, 13px); color: #4A3E2E; outline: none; }

        .dmge-del-btn { color: #4A3E2E; background: transparent; border: none; cursor: pointer; font-size: 12px; margin-left: 8px; padding: 4px; }
        .dmge-del-btn:hover { color: #FF3D8C; }

        input.dmge-inline-input { background: transparent; border: none; border-bottom: 1px dashed rgba(255,179,71,0.2); color: inherit; font-family: inherit; font-size: inherit; text-align: right; width: 55px; outline: none; }
        input.dmge-inline-input:focus { border-bottom-color: #FFB347; background: rgba(255,179,71,0.04); }

        /* ── MOBILE RESPONSIVE ── */
        @media (max-width: 640px) {
          .dmge-header { flex-direction: column; gap: 20px; }
          .dmge-meta { text-align: left; }
          .dmge-row { justify-content: flex-start; }
          .dmge-address-grid { grid-template-columns: 1fr; }
          .dmge-footer-info { grid-template-columns: 1fr; }
          .dmge-totals-section { justify-content: stretch; }
          .dmge-totals-box { width: 100%; }
          .dmge-table th:nth-child(2), .dmge-table td:nth-child(2) { display: none; }
        }
      `}</style>

      <div className="dmge-invoice-page">
        <div className="dmge-top-bar"></div>
        
        <div className="dmge-header">
          <div className="dmge-logo-group">
            <div className="dmge-logo-main">DMGE</div>
            <div className="dmge-logo-sub">RATE SYSTEM</div>
          </div>
          <div className="dmge-meta">
            <div className="dmge-meta-title">INVOICE</div>
            <div className="dmge-row">
              <span className="dmge-key">INV NO.</span>
              <span 
                className="dmge-val" 
                contentEditable onPaste={handlePaste} 
                onBlur={e => handleFieldChange('invoiceNumber', e.target.innerText)}
                suppressContentEditableWarning
              >{invoiceData.invoiceNumber}</span>
            </div>
            <div className="dmge-row">
              <span className="dmge-key">ISSUED</span>
              <span 
                className="dmge-val" 
                contentEditable onPaste={handlePaste} 
                onBlur={e => handleFieldChange('issuedDate', e.target.innerText)}
                suppressContentEditableWarning
              >{invoiceData.issuedDate}</span>
            </div>
            <div className="dmge-row">
              <span className="dmge-key">DUE</span>
              <span 
                className="dmge-val" 
                contentEditable onPaste={handlePaste} 
                onBlur={e => handleFieldChange('dueDate', e.target.innerText)}
                suppressContentEditableWarning
              >{invoiceData.dueDate}</span>
            </div>
            <div className="dmge-row" style={{ marginTop: "8px" }}>
              <span className="dmge-key">STATUS</span>
              <span 
                className="dmge-val" 
                contentEditable onPaste={handlePaste} 
                onBlur={e => handleFieldChange('status', e.target.innerText)}
                suppressContentEditableWarning
                style={{ color: "#FF3D8C", border: "1px solid #FF3D8C", padding: "2px 6px", fontSize: "10px", fontFamily: "'Press Start 2P'" }}
              >{invoiceData.status}</span>
            </div>
          </div>
        </div>

        <div className="dmge-address-grid">
          <div>
            <div className="dmge-label">FROM</div>
            <div 
              className="dmge-addr-name" 
              contentEditable onPaste={handlePaste} 
              onBlur={e => handleFieldChange('fromName', e.target.innerText)}
              suppressContentEditableWarning
            >{invoiceData.fromName}</div>
            <div 
              className="dmge-addr-block" 
              contentEditable onPaste={handlePaste} 
              onBlur={e => handleFieldChange('fromAddress', e.target.innerText)}
              suppressContentEditableWarning
            >{invoiceData.fromAddress}</div>
          </div>
          <div>
            <div className="dmge-label">BILLED TO</div>
            <div 
              className="dmge-addr-name" 
              contentEditable onPaste={handlePaste} 
              onBlur={e => handleFieldChange('toName', e.target.innerText)}
              suppressContentEditableWarning
            >{invoiceData.toName}</div>
            <div 
              className="dmge-addr-block" 
              contentEditable onPaste={handlePaste} 
              onBlur={e => handleFieldChange('toAddress', e.target.innerText)}
              suppressContentEditableWarning
            >{invoiceData.toAddress}</div>
          </div>
        </div>

        <div className="dmge-items-section">
          <div className="dmge-label">SERVICES</div>
          <table className="dmge-table">
            <thead>
              <tr>
                <th style={{ width: "45%" }}>DESCRIPTION</th>
                <th className="right" style={{ width: "12%" }}>QTY</th>
                <th className="right" style={{ width: "18%" }}>RATE</th>
                <th className="right" style={{ width: "20%" }}>AMOUNT</th>
                <th style={{ width: "5%" }}></th>
              </tr>
            </thead>
            <tbody>
              {invoiceData.items.map(item => (
                <tr key={item.id}>
                  <td>
                    <div 
                      className="dmge-item-desc" 
                      contentEditable onPaste={handlePaste} 
                      onBlur={e => handleItemChange(item.id, 'desc', e.target.innerText)}
                      suppressContentEditableWarning
                    >{item.desc}</div>
                    <div 
                      className="dmge-item-note" 
                      contentEditable onPaste={handlePaste} 
                      onBlur={e => handleItemChange(item.id, 'note', e.target.innerText)}
                      suppressContentEditableWarning
                    >{item.note}</div>
                  </td>
                  <td className="dmge-td-qty">
                    <span 
                      contentEditable onPaste={handlePaste} 
                      onBlur={e => handleItemChange(item.id, 'qty', e.target.innerText)}
                      suppressContentEditableWarning
                    >{item.qty}</span>
                  </td>
                  <td className="dmge-td-rate">
                    <span 
                      contentEditable onPaste={handlePaste} 
                      onBlur={e => handleItemChange(item.id, 'rate', e.target.innerText)}
                      suppressContentEditableWarning
                    >{fmt(item.rate)}</span>
                  </td>
                  <td className="dmge-td-amt">{fmt(item.amount)}</td>
                  <td>
                    <button className="dmge-del-btn" onClick={() => removeRow(item.id)}>✕</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <button className="dmge-add-btn" onClick={addRow}>▶ + ADD LINE ITEM</button>

        <div className="dmge-totals-section">
          <div className="dmge-totals-box">
            <div className="dmge-total-row">
              <span className="dmge-t-key">SUBTOTAL</span>
              <span className="dmge-t-val">{fmt(subtotal)}</span>
            </div>
            <div className="dmge-total-row">
              <span className="dmge-t-key">DISCOUNT</span>
              <span className="dmge-t-val">
                - $
                <input 
                  type="number" 
                  className="dmge-inline-input" 
                  value={invoiceData.discount}
                  onChange={e => handleFieldChange('discount', parseFloat(e.target.value) || 0)}
                />
              </span>
            </div>
            <div className="dmge-total-row">
              <span className="dmge-t-key">
                TAX (
                <input 
                  type="number" 
                  className="dmge-inline-input" 
                  value={invoiceData.taxRate}
                  onChange={e => handleFieldChange('taxRate', parseFloat(e.target.value) || 0)}
                  style={{ width: "35px" }}
                />%)
              </span>
              <span className="dmge-t-val">{fmt(taxAmount)}</span>
            </div>
            <div className="dmge-due-block">
              <div className="dmge-due-label">TOTAL<br/>DUE</div>
              <div className="dmge-due-amount">{fmt(totalDue)}</div>
            </div>
          </div>
        </div>

        <div className="dmge-footer-info">
          <div>
            <div className="dmge-label">NOTES</div>
            <div 
              className="dmge-addr-block" 
              contentEditable onPaste={handlePaste} 
              style={{ minHeight: "80px" }}
              onBlur={e => handleFieldChange('notes', e.target.innerText)}
              suppressContentEditableWarning
            >{invoiceData.notes}</div>
          </div>
          <div>
            <div className="dmge-label">PAYMENT DETAILS</div>
            {invoiceData.paymentDetails.map((pay, idx) => (
              <div className="dmge-pay-row" key={idx}>
                <span 
                  className="dmge-pay-key" 
                  contentEditable onPaste={handlePaste} 
                  onBlur={e => {
                    const newDetails = [...invoiceData.paymentDetails];
                    newDetails[idx].key = e.target.innerText;
                    handleFieldChange('paymentDetails', newDetails);
                  }}
                  suppressContentEditableWarning
                >{pay.key}</span>
                <span 
                  className="dmge-pay-val" 
                  contentEditable onPaste={handlePaste} 
                  onBlur={e => {
                    const newDetails = [...invoiceData.paymentDetails];
                    newDetails[idx].val = e.target.innerText;
                    handleFieldChange('paymentDetails', newDetails);
                  }}
                  suppressContentEditableWarning
                >{pay.val}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="dmge-page-footer">
          <div className="dmge-footer-brand">DMGE RATE SYSTEM</div>
        </div>
      </div>
    </div>
  );
}
