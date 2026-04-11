import html2pdf from 'html2pdf.js';
import { buildInvoiceFigures } from './pricing';

export async function generateInvoicePDF(job, profile, clients = [], catData = null, returnBase64 = false, editorData = null) {
  const client = clients.find(c => c.id === job.clientId) || { name: 'Valued Client', email: '', phone: '' };
  const fmt = (val) => {
    const num = Number(val) || 0;
    const isWhole = num % 1 === 0;
    return num.toLocaleString(undefined, { 
      minimumFractionDigits: isWhole ? 0 : 2, 
      maximumFractionDigits: 2 
    });
  };

  let invoiceHTML = "";

  if (editorData) {
    // ──────────────────────────────────────────────────────────────
    // PIXEL-PERFECT REPLICA OF dmge-invoice-template.html
    // ALL CSS variables inlined, ALL pseudo-elements replaced with
    // real divs so html2canvas renders them correctly.
    // ──────────────────────────────────────────────────────────────

    const itemsRows = editorData.items.map(item => `
      <tr>
        <td>
          <div style="font-size:15px;color:#E8D8B0;padding:16px 14px 3px;letter-spacing:0.5px;">${item.desc}</div>
          <div style="font-size:12px;color:#4A3E2E;padding:0 14px 16px;">// ${item.note.replace(/^\/\/\s*/, '')}</div>
        </td>
        <td style="font-size:14px;color:#7A6A50;padding:16px 14px;text-align:right;vertical-align:middle;">${item.qty}</td>
        <td style="font-size:14px;color:#7A6A50;padding:16px 14px;text-align:right;vertical-align:middle;">$${fmt(item.rate)}</td>
        <td style="font-size:15px;color:#FFB347;padding:16px 14px;text-align:right;vertical-align:middle;">$${fmt(item.amount)}</td>
      </tr>
    `).join("");

    const paymentRows = editorData.paymentDetails.map(p => `
      <div style="display:flex;gap:12px;margin-bottom:7px;">
        <span style="font-size:12px;color:#C47D1A;min-width:72px;text-transform:uppercase;letter-spacing:0.5px;">${p.key}</span>
        <span style="font-size:13px;color:#7A6A50;">${p.val}</span>
      </div>
    `).join("");

    const notesHtml = (editorData.notes || "").split('\n').join('<br>');
    const fromAddressHtml = (editorData.fromAddress || "").split('\n').join('<br>');
    const toAddressHtml = (editorData.toAddress || "").split('\n').join('<br>');

    invoiceHTML = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<style>
  @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&family=Share+Tech+Mono&display=swap');
  * { margin:0; padding:0; box-sizing:border-box; }
  body {
    background: #050505;
    font-family: 'Share Tech Mono', 'Courier New', monospace;
    color: #E8D8B0;
    padding: 0;
    margin: 0;
  }
</style>
</head>
<body>
<div style="background:#080808;width:760px;min-height:1120px;position:relative;border:1px solid #2E2E2E;overflow:hidden;margin:0 auto;">

  <!-- Scanlines (real div, not pseudo) -->
  <div style="position:absolute;inset:0;background:repeating-linear-gradient(to bottom,transparent 0px,transparent 3px,rgba(255,179,71,0.04) 3px,rgba(255,179,71,0.04) 4px);pointer-events:none;z-index:10;"></div>

  <!-- Corner ornaments -->
  <div style="position:absolute;top:14px;left:14px;width:10px;height:10px;border-top:2px solid #C47D1A;border-left:2px solid #C47D1A;opacity:0.4;"></div>
  <div style="position:absolute;top:14px;right:14px;width:10px;height:10px;border-top:2px solid #C47D1A;border-right:2px solid #C47D1A;opacity:0.4;"></div>
  <div style="position:absolute;bottom:14px;left:14px;width:10px;height:10px;border-bottom:2px solid #C47D1A;border-left:2px solid #C47D1A;opacity:0.4;"></div>
  <div style="position:absolute;bottom:14px;right:14px;width:10px;height:10px;border-bottom:2px solid #C47D1A;border-right:2px solid #C47D1A;opacity:0.4;"></div>

  <!-- Top accent bar -->
  <div style="height:6px;background:linear-gradient(90deg,#FF3D8C 0%,#FFB347 40%,#FFB347 60%,#FF3D8C 100%);position:relative;">
    <div style="position:absolute;top:0;left:0;width:6px;height:6px;background:#FF3D8C;"></div>
    <div style="position:absolute;top:0;right:0;width:6px;height:6px;background:#FF3D8C;"></div>
  </div>

  <!-- Header -->
  <div style="padding:44px 60px 36px;display:flex;align-items:flex-start;justify-content:space-between;border-bottom:1px solid #2E2E2E;position:relative;">
    <!-- Header accent line -->
    <div style="position:absolute;bottom:-1px;left:60px;width:60px;height:3px;background:#FFB347;"></div>
    
    <div>
      <div style="font-family:'Press Start 2P',monospace;font-size:28px;color:#FFB347;letter-spacing:4px;line-height:1;text-shadow:4px 4px 0 #7A4A00,8px 8px 0 rgba(0,0,0,0.5);">DMGE</div>
      <div style="font-family:'Press Start 2P',monospace;font-size:7px;color:#FF3D8C;letter-spacing:5px;margin-top:10px;text-shadow:0 0 8px rgba(255,61,140,0.4);">RATE SYSTEM</div>
    </div>
    <div style="text-align:right;">
      <div style="font-family:'Press Start 2P',monospace;font-size:22px;color:#FFB347;letter-spacing:3px;margin-bottom:20px;text-shadow:3px 3px 0 #7A4A00,0 0 20px rgba(255,179,71,0.3);">INVOICE</div>
      <div style="display:flex;justify-content:flex-end;align-items:baseline;gap:16px;margin-bottom:6px;">
        <span style="font-size:11px;color:#7A6A50;text-transform:uppercase;letter-spacing:1px;">INV NO.</span>
        <span style="font-size:14px;color:#E8D8B0;min-width:130px;text-align:right;">${editorData.invoiceNumber}</span>
      </div>
      <div style="display:flex;justify-content:flex-end;align-items:baseline;gap:16px;margin-bottom:6px;">
        <span style="font-size:11px;color:#7A6A50;text-transform:uppercase;letter-spacing:1px;">ISSUED</span>
        <span style="font-size:14px;color:#E8D8B0;min-width:130px;text-align:right;">${editorData.issuedDate}</span>
      </div>
      <div style="display:flex;justify-content:flex-end;align-items:baseline;gap:16px;margin-bottom:6px;">
        <span style="font-size:11px;color:#7A6A50;text-transform:uppercase;letter-spacing:1px;">DUE</span>
        <span style="font-size:14px;color:#E8D8B0;min-width:130px;text-align:right;">${editorData.dueDate}</span>
      </div>
      <div style="display:flex;justify-content:flex-end;align-items:baseline;gap:16px;margin-top:8px;">
        <span style="font-size:11px;color:#7A6A50;"></span>
        <span style="font-size:14px;min-width:130px;text-align:right;">
          <span style="display:inline-block;font-family:'Press Start 2P',monospace;font-size:7px;color:#FF3D8C;border:1px solid #FF3D8C;padding:4px 8px;letter-spacing:1px;text-shadow:0 0 6px rgba(255,61,140,0.5);box-shadow:0 0 8px rgba(255,61,140,0.15);">${editorData.status}</span>
        </span>
      </div>
    </div>
  </div>

  <!-- Addresses -->
  <div style="padding:32px 60px;display:grid;grid-template-columns:1fr 1fr;gap:40px;border-bottom:1px solid #2E2E2E;">
    <div>
      <div style="font-family:'Press Start 2P',monospace;font-size:7px;color:#FFB347;letter-spacing:2px;margin-bottom:14px;"><span style="color:#FF3D8C;font-size:6px;margin-right:10px;">▶</span>FROM</div>
      <div style="font-size:17px;color:#E8D8B0;margin-bottom:8px;letter-spacing:1px;">${editorData.fromName}</div>
      <div style="font-size:13px;color:#7A6A50;line-height:1.9;">${fromAddressHtml}</div>
    </div>
    <div>
      <div style="font-family:'Press Start 2P',monospace;font-size:7px;color:#FFB347;letter-spacing:2px;margin-bottom:14px;"><span style="color:#FF3D8C;font-size:6px;margin-right:10px;">▶</span>BILLED TO</div>
      <div style="font-size:17px;color:#E8D8B0;margin-bottom:8px;letter-spacing:1px;">${editorData.toName}</div>
      <div style="font-size:13px;color:#7A6A50;line-height:1.9;">${toAddressHtml}</div>
    </div>
  </div>

  <!-- Line Items -->
  <div style="padding:32px 60px;">
    <div style="font-family:'Press Start 2P',monospace;font-size:7px;color:#FFB347;letter-spacing:2px;margin-bottom:18px;display:flex;align-items:center;gap:12px;">
      <span style="color:#FF3D8C;font-size:6px;">▶</span>
      <span>SERVICES</span>
      <span style="flex:1;height:1px;background:repeating-linear-gradient(to right,#2E2E2E 0px,#2E2E2E 6px,transparent 6px,transparent 10px);"></span>
    </div>
    <div style="position:relative;">
      <!-- Dashed left line -->
      <div style="position:absolute;left:-12px;top:0;width:2px;height:100%;background:repeating-linear-gradient(to bottom,#FFB347 0,#FFB347 4px,transparent 4px,transparent 8px);opacity:0.5;"></div>
      <table style="width:100%;border-collapse:collapse;">
        <thead>
          <tr style="background:#222222;border-top:1px solid #3A3A3A;border-bottom:1px solid #3A3A3A;">
            <th style="font-family:'Press Start 2P',monospace;font-size:7px;color:#7A6A50;letter-spacing:1px;padding:12px 14px;text-align:left;text-transform:uppercase;width:45%;">DESCRIPTION</th>
            <th style="font-family:'Press Start 2P',monospace;font-size:7px;color:#7A6A50;letter-spacing:1px;padding:12px 14px;text-align:right;text-transform:uppercase;width:10%;">QTY</th>
            <th style="font-family:'Press Start 2P',monospace;font-size:7px;color:#7A6A50;letter-spacing:1px;padding:12px 14px;text-align:right;text-transform:uppercase;width:18%;">RATE</th>
            <th style="font-family:'Press Start 2P',monospace;font-size:7px;color:#7A6A50;letter-spacing:1px;padding:12px 14px;text-align:right;text-transform:uppercase;width:15%;">AMOUNT</th>
          </tr>
        </thead>
        <tbody>
          ${itemsRows}
        </tbody>
      </table>
    </div>
  </div>

  <!-- Totals -->
  <div style="padding:0 60px 40px;display:flex;justify-content:flex-end;">
    <div style="width:340px;">
      <div style="display:flex;justify-content:space-between;align-items:center;padding:9px 0;border-bottom:1px solid #2E2E2E;">
        <span style="font-size:12px;color:#7A6A50;text-transform:uppercase;letter-spacing:1px;">SUBTOTAL</span>
        <span style="font-size:14px;color:#E8D8B0;">$${fmt(editorData.subtotal)}</span>
      </div>
      <div style="display:flex;justify-content:space-between;align-items:center;padding:9px 0;border-bottom:1px solid #2E2E2E;">
        <span style="font-size:12px;color:#7A6A50;text-transform:uppercase;letter-spacing:1px;">DISCOUNT</span>
        <span style="font-size:14px;color:#E8D8B0;">— $${fmt(editorData.discount)}</span>
      </div>
      <div style="display:flex;justify-content:space-between;align-items:center;padding:9px 0;">
        <span style="font-size:12px;color:#7A6A50;text-transform:uppercase;letter-spacing:1px;">TAX (${editorData.taxRate}%)</span>
        <span style="font-size:14px;color:#E8D8B0;">$${fmt(editorData.taxAmount)}</span>
      </div>
      <!-- Total Due block -->
      <div style="margin-top:14px;border:1px solid #C47D1A;background:#222222;padding:22px 24px;display:flex;justify-content:space-between;align-items:center;position:relative;overflow:hidden;">
        <!-- Top gradient line -->
        <div style="position:absolute;top:0;left:0;right:0;height:3px;background:linear-gradient(90deg,#FF3D8C,#FFB347,#FF3D8C);"></div>
        <!-- Dot pattern -->
        <div style="position:absolute;top:0;right:0;width:100px;height:100%;background-image:radial-gradient(circle,rgba(255,179,71,0.12) 1px,transparent 1px);background-size:8px 8px;pointer-events:none;"></div>
        <div style="font-family:'Press Start 2P',monospace;font-size:8px;color:#FF3D8C;letter-spacing:2px;line-height:2;text-shadow:0 0 8px rgba(255,61,140,0.4);flex-shrink:0;margin-right:15px;">TOTAL<br>DUE</div>
        <div style="font-family:'Press Start 2P',monospace;font-size:18px;color:#FFB347;letter-spacing:2px;text-shadow:3px 3px 0 #7A4A00,0 0 20px rgba(255,179,71,0.3);position:relative;z-index:1;text-align:right;word-break:break-all;">$${fmt(editorData.totalDue)}</div>
      </div>
    </div>
  </div>

  <!-- Footer Info -->
  <div style="padding:32px 60px 40px;display:grid;grid-template-columns:1fr 1fr;gap:40px;border-top:1px solid #2E2E2E;">
    <div>
      <div style="font-family:'Press Start 2P',monospace;font-size:7px;color:#FFB347;letter-spacing:2px;margin-bottom:14px;"><span style="color:#FF3D8C;font-size:6px;margin-right:10px;">▶</span>NOTES</div>
      <div style="font-size:13px;color:#7A6A50;line-height:1.9;">${notesHtml}</div>
    </div>
    <div>
      <div style="font-family:'Press Start 2P',monospace;font-size:7px;color:#FFB347;letter-spacing:2px;margin-bottom:14px;"><span style="color:#FF3D8C;font-size:6px;margin-right:10px;">▶</span>PAYMENT DETAILS</div>
      ${paymentRows}
    </div>
  </div>

  <!-- Page Footer -->
  <div style="padding:16px 60px;background:#111111;display:flex;justify-content:space-between;align-items:center;border-top:1px solid #2E2E2E;">
    <div style="font-family:'Press Start 2P',monospace;font-size:6px;color:#C47D1A;letter-spacing:2px;opacity:0.7;">DMGE RATE SYSTEM</div>
  </div>

</div>

<!-- Font preloader: render hidden text to force font loading -->
<div style="position:absolute;left:-9999px;top:-9999px;">
  <span style="font-family:'Press Start 2P',monospace;">.</span>
  <span style="font-family:'Share Tech Mono',monospace;">.</span>
</div>

</body>
</html>`;
  } else {
    // FALLBACK LEGACY DESIGN
    const clientMultiplier = client.rateMultiplier || 1.0;
    const fig = buildInvoiceFigures(job, clientMultiplier);
    const companyName = profile.branding?.companyName || profile.companyName || profile.name || 'Freelancer';
    const logoSrc = profile.branding?.logoBase64 || profile.logoUrl;
    const dmgeLogoSVG = `<div style="background:#000;padding:10px;display:inline-block;border:4px solid #FFB347;"><div style="color:#FFB347;font-size:14px;font-weight:bold;margin-bottom:4px;">DMGE</div><div style="color:#E91E63;font-size:8px;">RATE SYSTEM</div></div>`;
    const finalLogo = logoSrc ? `<img src="${logoSrc}" style="max-height:80px;max-width:250px;object-fit:contain;border:2px solid #000;" />` : dmgeLogoSVG;
    const lineRows = [];
    lineRows.push(`<tr><td style="padding:12px 0;"><b>${job.role} - ${job.category}</b><br><small>${job.model} (${job.complexity}, ${job.usage})</small></td><td style="padding:12px 0;">$${fmt(fig.baseRate)}</td><td style="padding:12px 0;">${job.units}</td><td style="padding:12px 0;text-align:right;">$${fmt(fig.base)}</td></tr>`);
    if (job.materials && job.materials.length > 0) {
      job.materials.forEach(m => {
        lineRows.push(`<tr><td style="padding:12px 0;">Material: ${m.name}</td><td style="padding:12px 0;">$${fmt(m.cost)}</td><td style="padding:12px 0;">${m.qty}</td><td style="padding:12px 0;text-align:right;">$${fmt(m.cost * m.qty)}</td></tr>`);
      });
    }
    invoiceHTML = `<!DOCTYPE html><html><head><meta charset="utf-8"><style>@import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');*{margin:0;padding:0;box-sizing:border-box;}body{font-family:'Press Start 2P',cursive;background:#fff;color:#1a1a1a;padding:40px;font-size:8px;}table{width:100%;border-collapse:collapse;margin-bottom:30px;}th{text-align:left;padding:10px;font-size:9px;border:1px solid #000;background:#000;color:#fff;}td{padding:10px;border:1px solid #000;font-size:8px;}</style></head><body><div style="max-width:800px;margin:0 auto;"><div style="display:flex;justify-content:space-between;align-items:flex-end;margin-bottom:20px;"><div style="font-size:24px;">INVOICE</div><div>${finalLogo}</div></div><div style="background:#000;color:#fff;display:flex;justify-content:space-between;padding:10px;margin-bottom:20px;"><div>INVOICE #: ${job.invoiceNumber || '1001'}</div><div>DATE: ${new Date().toLocaleDateString()}</div></div><div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:25px;"><div><strong>SENDER:</strong><br>${companyName}<br>${profile.companyAddress || ''}</div><div><strong>BILL TO:</strong><br>${client.name}<br>${client.address || ''}<br>${client.city || ''}</div></div><table><thead><tr><th>QTY</th><th>DESCRIPTION</th><th>UNIT COST</th><th style="text-align:right;">TOTAL</th></tr></thead><tbody>${lineRows.join('')}</tbody></table><div style="border-top:2px solid #000;margin-top:10px;padding:10px 0;font-size:11px;font-weight:bold;text-align:right;">BALANCE DUE: $${fmt(job.price)}</div></div></body></html>`;
  }

  // Create a hidden container, inject HTML, wait for fonts, then capture
  const container = document.createElement('div');
  container.style.cssText = 'position:fixed;left:-9999px;top:0;z-index:-1;';
  container.innerHTML = invoiceHTML;
  document.body.appendChild(container);

  // Wait for fonts to load
  try {
    await document.fonts.ready;
    // Extra delay to ensure rendering is complete
    await new Promise(r => setTimeout(r, 1500));
  } catch(e) {
    await new Promise(r => setTimeout(r, 2000));
  }

  const targetEl = container.querySelector('div') || container;

  const options = {
    margin: [0, 0, 0, 0],
    filename: `${job.invoiceNumber || 'INV'}_${job.role.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: {
      scale: 2,
      useCORS: true,
      letterRendering: true,
      backgroundColor: editorData ? '#050505' : '#ffffff',
      windowWidth: 760,
      logging: false
    },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
  };

  try {
    if (returnBase64) {
      return await new Promise((resolve) => {
        html2pdf().set(options).from(invoiceHTML).toPdf().get('pdf').then((pdf) => {
          document.body.removeChild(container);
          resolve(pdf.output('datauristring'));
        });
      });
    } else {
      await html2pdf().set(options).from(invoiceHTML).save();
      document.body.removeChild(container);
    }
  } catch(e) {
    document.body.removeChild(container);
    throw e;
  }
}
