import { jsPDF } from 'jspdf';

const escapeHtml = (value) =>
    String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');

const dash = (value) => {
    const v = String(value ?? '').trim();
    return v || '—';
};

export const normalizeFederacionEmisor = (f = {}) => ({
    nombre: f.nombre || f.Nombre || 'Federación',
    sigla: f.sigla || f.Sigla || '',
    cuit: f.cuit || f.Cuit || '',
    direccion: f.direccion || f.Direccion || '',
    telefono: f.telefono || f.Telefono || '',
    email: f.email || f.Email || '',
    bancoNombre: f.bancoNombre || f.BancoNombre || '',
    tipoCuenta: f.tipoCuenta || f.TipoCuenta || '',
    numeroCuenta: f.numeroCuenta || f.NumeroCuenta || '',
    titularCuenta: f.titularCuenta || f.TitularCuenta || '',
    emailCobro: f.emailCobro || f.EmailCobro || '',
});

/** Texto formateado para WhatsApp (*negrita* / _cursiva_). */
const buildShareText = (recibo, federacion, { formatMonto, formatFecha, tipoPagoLabel, beneficiario }) => {
    const fed = normalizeFederacionEmisor(federacion);
    const lines = [
        `*📄 RECIBO DE PAGO #${recibo.id}*`,
        ``,
        `*${fed.nombre}*`,
    ];
    if (fed.cuit) lines.push(`CUIT/RUC: ${fed.cuit}`);
    if (fed.direccion) lines.push(fed.direccion);
    if (fed.telefono || fed.email) {
        lines.push([fed.telefono, fed.email].filter(Boolean).join(' · '));
    }
    lines.push(
        ``,
        `━━━━━━━━━━━━━━━━`,
        `*Fecha:* ${formatFecha(recibo.fechaPago)}`,
        `*Beneficiario:* ${beneficiario}`,
        `*Concepto:* ${tipoPagoLabel(recibo.tipoPago)}`,
        `*Monto:* ${formatMonto(recibo.monto)}`,
        `*Referencia:* ${dash(recibo.referencia)}`,
    );
    if (recibo.notas) lines.push(`*Notas:* ${recibo.notas}`);
    lines.push(
        `━━━━━━━━━━━━━━━━`,
        ``,
        `_Comprobante formal: adjuntá el PDF recibo-${recibo.id}.pdf en este chat._`,
    );
    return lines.join('\n');
};

export const buildReciboHtml = (recibo, federacion, helpers) => {
    const fed = normalizeFederacionEmisor(federacion);
    const { formatMonto, formatFecha, tipoPagoLabel, beneficiario } = helpers;
    const bancoLine = [
        fed.bancoNombre,
        fed.tipoCuenta,
        fed.numeroCuenta ? `Nº ${fed.numeroCuenta}` : '',
        fed.titularCuenta ? `Titular: ${fed.titularCuenta}` : '',
    ]
        .filter(Boolean)
        .join(' · ');

    return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <title>Recibo #${escapeHtml(recibo.id)}</title>
  <style>
    * { box-sizing: border-box; }
    body {
      font-family: 'Segoe UI', Arial, sans-serif;
      color: #0f172a;
      margin: 0;
      padding: 24px;
      background: #fff;
    }
    .sheet {
      max-width: 720px;
      margin: 0 auto;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 28px;
    }
    .header {
      display: flex;
      justify-content: space-between;
      gap: 16px;
      border-bottom: 2px solid #0ea5e9;
      padding-bottom: 16px;
      margin-bottom: 20px;
    }
    .org h1 {
      margin: 0 0 6px;
      font-size: 20px;
      color: #0369a1;
    }
    .org p { margin: 2px 0; font-size: 12px; color: #475569; }
    .meta { text-align: right; }
    .meta .label { font-size: 11px; text-transform: uppercase; color: #64748b; letter-spacing: 0.04em; }
    .meta .value { font-size: 18px; font-weight: 700; }
    .grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px 20px;
      margin: 18px 0;
    }
    .field .k {
      font-size: 11px;
      text-transform: uppercase;
      color: #64748b;
      letter-spacing: 0.04em;
    }
    .field .v {
      font-size: 14px;
      font-weight: 600;
      margin-top: 2px;
      word-break: break-word;
    }
    .amount {
      margin-top: 8px;
      padding: 14px 16px;
      background: #ecfdf5;
      border: 1px solid #a7f3d0;
      border-radius: 10px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .amount span { color: #047857; font-size: 13px; font-weight: 700; text-transform: uppercase; }
    .amount strong { color: #065f46; font-size: 22px; }
    .bank {
      margin-top: 18px;
      padding-top: 14px;
      border-top: 1px dashed #cbd5e1;
      font-size: 12px;
      color: #475569;
    }
    .footer {
      margin-top: 24px;
      font-size: 11px;
      color: #94a3b8;
      text-align: center;
    }
    @media print {
      body { padding: 0; }
      .sheet { border: none; border-radius: 0; padding: 0; }
    }
  </style>
</head>
<body>
  <div class="sheet">
    <div class="header">
      <div class="org">
        <h1>${escapeHtml(fed.nombre)}${fed.sigla ? ` (${escapeHtml(fed.sigla)})` : ''}</h1>
        <p>CUIT/RUC: ${escapeHtml(dash(fed.cuit))}</p>
        <p>${escapeHtml(dash(fed.direccion))}</p>
        <p>${escapeHtml([fed.telefono, fed.email].filter(Boolean).join(' · ') || '—')}</p>
      </div>
      <div class="meta">
        <div class="label">Recibo</div>
        <div class="value">#${escapeHtml(recibo.id)}</div>
        <div class="label" style="margin-top:8px">Fecha</div>
        <div>${escapeHtml(formatFecha(recibo.fechaPago))}</div>
      </div>
    </div>

    <div class="grid">
      <div class="field">
        <div class="k">Beneficiario</div>
        <div class="v">${escapeHtml(beneficiario)}</div>
      </div>
      <div class="field">
        <div class="k">Concepto</div>
        <div class="v">${escapeHtml(tipoPagoLabel(recibo.tipoPago))}</div>
      </div>
      <div class="field">
        <div class="k">Referencia</div>
        <div class="v">${escapeHtml(dash(recibo.referencia))}</div>
      </div>
      <div class="field">
        <div class="k">Registrado por</div>
        <div class="v">${escapeHtml(dash(recibo.registradoPor))}</div>
      </div>
      <div class="field" style="grid-column: 1 / -1">
        <div class="k">Notas</div>
        <div class="v">${escapeHtml(dash(recibo.notas))}</div>
      </div>
    </div>

    <div class="amount">
      <span>Monto pagado</span>
      <strong>${escapeHtml(formatMonto(recibo.monto))}</strong>
    </div>

    <div class="bank">
      <strong>Datos de cobro</strong><br/>
      ${escapeHtml(bancoLine || 'Completá los datos bancarios en el perfil de la federación.')}
      ${fed.emailCobro ? `<br/>Email cobro: ${escapeHtml(fed.emailCobro)}` : ''}
    </div>

    <div class="footer">Documento generado por SIGDEF · ${escapeHtml(new Date().toLocaleString('es-AR'))}</div>
  </div>
</body>
</html>`;
};

export const printRecibo = (recibo, federacion, helpers) => {
    const html = buildReciboHtml(recibo, federacion, helpers);
    const win = window.open('', '_blank', 'noopener,noreferrer,width=900,height=700');
    if (!win) throw new Error('El navegador bloqueó la ventana de impresión.');
    win.document.open();
    win.document.write(html);
    win.document.close();
    win.focus();
    setTimeout(() => {
        win.print();
    }, 250);
};

export const buildReciboPdfBlob = (recibo, federacion, helpers) => {
    const fed = normalizeFederacionEmisor(federacion);
    const { formatMonto, formatFecha, tipoPagoLabel, beneficiario } = helpers;
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
    const margin = 18;
    let y = 20;

    const line = (text, opts = {}) => {
        const {
            size = 11,
            style = 'normal',
            color = [15, 23, 42],
            gap = 6,
        } = opts;
        doc.setFont('helvetica', style);
        doc.setFontSize(size);
        doc.setTextColor(...color);
        const lines = doc.splitTextToSize(String(text ?? ''), 210 - margin * 2);
        doc.text(lines, margin, y);
        y += gap * lines.length;
    };

    line(fed.nombre + (fed.sigla ? ` (${fed.sigla})` : ''), { size: 16, style: 'bold', color: [3, 105, 161], gap: 8 });
    line(`CUIT/RUC: ${dash(fed.cuit)}`, { size: 10, color: [71, 85, 105], gap: 5 });
    line(dash(fed.direccion), { size: 10, color: [71, 85, 105], gap: 5 });
    line([fed.telefono, fed.email].filter(Boolean).join(' · ') || '—', { size: 10, color: [71, 85, 105], gap: 8 });

    doc.setDrawColor(14, 165, 233);
    doc.setLineWidth(0.6);
    doc.line(margin, y, 210 - margin, y);
    y += 10;

    line(`Recibo #${recibo.id}`, { size: 14, style: 'bold', gap: 7 });
    line(`Fecha: ${formatFecha(recibo.fechaPago)}`, { size: 11, gap: 7 });
    line(`Beneficiario: ${beneficiario}`, { size: 11, gap: 7 });
    line(`Concepto: ${tipoPagoLabel(recibo.tipoPago)}`, { size: 11, gap: 7 });
    line(`Monto: ${formatMonto(recibo.monto)}`, { size: 13, style: 'bold', color: [6, 95, 70], gap: 8 });
    line(`Referencia: ${dash(recibo.referencia)}`, { size: 11, gap: 7 });
    line(`Registrado por: ${dash(recibo.registradoPor)}`, { size: 11, gap: 7 });
    line(`Notas: ${dash(recibo.notas)}`, { size: 11, gap: 10 });

    line('Datos de cobro', { size: 11, style: 'bold', gap: 6 });
    line(`Banco: ${dash(fed.bancoNombre)}`, { size: 10, color: [71, 85, 105], gap: 5 });
    line(`Cuenta: ${dash([fed.tipoCuenta, fed.numeroCuenta].filter(Boolean).join(' · '))}`, {
        size: 10,
        color: [71, 85, 105],
        gap: 5,
    });
    line(`Titular: ${dash(fed.titularCuenta)}`, { size: 10, color: [71, 85, 105], gap: 5 });
    line(`Email cobro: ${dash(fed.emailCobro)}`, { size: 10, color: [71, 85, 105], gap: 10 });

    line(`Generado por SIGDEF · ${new Date().toLocaleString('es-AR')}`, {
        size: 9,
        color: [148, 163, 184],
        gap: 5,
    });

    return doc.output('blob');
};

export const downloadReciboPdf = (recibo, federacion, helpers) => {
    const blob = buildReciboPdfBlob(recibo, federacion, helpers);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `recibo-${recibo.id}.pdf`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
};

/** Comparte el PDF con el menú nativo del sistema (WSP, email, etc.). */
export const shareRecibo = async (recibo, federacion, helpers) => {
    const text = buildShareText(recibo, federacion, helpers);
    const blob = buildReciboPdfBlob(recibo, federacion, helpers);
    const file = new File([blob], `recibo-${recibo.id}.pdf`, { type: 'application/pdf' });

    if (navigator.share) {
        try {
            if (navigator.canShare?.({ files: [file] })) {
                await navigator.share({
                    title: `Recibo #${recibo.id}`,
                    text,
                    files: [file],
                });
                return { method: 'native-file' };
            }
            await navigator.share({
                title: `Recibo #${recibo.id}`,
                text,
            });
            downloadReciboPdf(recibo, federacion, helpers);
            return { method: 'native-text' };
        } catch (err) {
            if (err?.name === 'AbortError') return { method: 'cancelled' };
        }
    }

    downloadReciboPdf(recibo, federacion, helpers);
    return { method: 'download-only' };
};
