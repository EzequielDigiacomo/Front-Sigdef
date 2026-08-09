import React, { useEffect, useState } from 'react';
import Card from '../../components/common/Card';
import { fetchPlanes } from '../../services/saasService';

/**
 * Referencia Render (USD/mes) — https://render.com/pricing
 * Solo muestra costo real de infra. El precio de venta lo definís en el catálogo;
 * abajo, en letra chica, hay una sugerencia según ese costo.
 */
const RENDER_REF = {
    api: {
        starter: { label: 'Web Service Starter', ram: '512 MB', cpu: '0.5', usd: 7 },
        standard: { label: 'Web Service Standard', ram: '2 GB', cpu: '1', usd: 25 },
        pro: { label: 'Web Service Pro', ram: '4 GB', cpu: '2', usd: 85 },
    },
    db: {
        basic256: { label: 'Postgres Basic-256mb', ram: '256 MB', cpu: '0.1', usd: 6 },
        basic1gb: { label: 'Postgres Basic-1gb', ram: '1 GB', cpu: '0.5', usd: 19 },
        basic4gb: { label: 'Postgres Basic-4gb', ram: '4 GB', cpu: '2', usd: 75 },
    },
    storageGbUsd: 0.3,
};

const MARGINS = {
    sigdef: 5.5,
    sporttrack: 3.8,
    duo: 3.2,
};

const roundPrice = (n) => Math.ceil(n / 5) * 5;

const TIERS = [
    {
        key: 'S',
        titulo: 'Plan S — hasta 200 atletas',
        maxAtletas: 200,
        atletasLabel: '200',
        nota: 'Con 200 atletas / evento chico, API Starter alcanza. No hace falta Standard ($25) para iniciar.',
        sigdef: {
            api: RENDER_REF.api.starter,
            db: RENDER_REF.db.basic256,
            storageGb: 2,
            perfil: 'Admin: alta + lecturas. Starter + DB 256 MB alcanza.',
        },
        sporttrack: {
            api: RENDER_REF.api.starter,
            db: RENDER_REF.db.basic1gb,
            storageGb: 5,
            perfil: 'Evento chico: Starter alcanza para iniciar. DB 1 GB por picos del día del evento.',
        },
    },
    {
        key: 'M',
        titulo: 'Plan M — hasta 400 atletas',
        maxAtletas: 400,
        atletasLabel: '400',
        nota: 'SIGDEF sigue admin. SportTrack sube a Standard cuando Starter se quede corto en el evento.',
        sigdef: {
            api: RENDER_REF.api.starter,
            db: RENDER_REF.db.basic1gb,
            storageGb: 5,
            perfil: 'Más padrón/export, poca concurrencia. Starter + DB 1 GB.',
        },
        sporttrack: {
            api: RENDER_REF.api.standard,
            db: RENDER_REF.db.basic1gb,
            storageGb: 12,
            perfil: 'Más series/público: upgrade a Standard ($25) si hace falta.',
        },
    },
    {
        key: 'L',
        titulo: 'Plan L — atletas ilimitados',
        maxAtletas: -1,
        referenciaAtletas: 2000,
        atletasLabel: '2000 (ref.)',
        nota: 'SIGDEF admin. SportTrack: picos altos + posible 2ª API staff/live.',
        sigdef: {
            api: RENDER_REF.api.starter,
            db: RENDER_REF.db.basic1gb,
            storageGb: 10,
            perfil: 'Sigue siendo administrativo. El padrón grande no exige API grande.',
        },
        sporttrack: {
            api: RENDER_REF.api.pro,
            db: RENDER_REF.db.basic4gb,
            storageGb: 32,
            extraApi: RENDER_REF.api.standard,
            perfil: 'Evento grande: API Pro + 2ª API Standard (live) + DB 4 GB.',
        },
    },
];

const money = (n) =>
    `$${Number(n).toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;

const moneyFine = (n) =>
    `$${Number(n).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 3 })}`;

const divisorAtletas = (tier) =>
    tier.maxAtletas > 0 ? tier.maxAtletas : (tier.referenciaAtletas || 2000);

const stackCost = (stack) => {
    const storageUsd = stack.storageGb * RENDER_REF.storageGbUsd;
    const apiUsd = stack.api.usd + (stack.extraApi?.usd || 0);
    const dbUsd = stack.db.usd;
    return {
        storageUsd,
        apiUsd,
        dbUsd,
        total: apiUsd + dbUsd + storageUsd,
    };
};

const buildSuggestion = (tier) => {
    const n = divisorAtletas(tier);
    const sig = stackCost(tier.sigdef);
    const st = stackCost(tier.sporttrack);
    const duoApiUsd = st.apiUsd + tier.sigdef.api.usd;
    const duoInfra = duoApiUsd + st.dbUsd + st.storageUsd;

    return {
        n,
        sig,
        st,
        duoInfra,
        perAthlete: {
            duo: duoInfra / n,
        },
        sugerido: {
            sigdef: roundPrice(sig.total * MARGINS.sigdef),
            sporttrack: roundPrice(st.total * MARGINS.sporttrack),
            duo: roundPrice(duoInfra * MARGINS.duo),
        },
    };
};

const matchCatalogPrice = (planes, product, tierKey) => {
    const needle = `${product} (${tierKey})`.toLowerCase();
    const duoNeedle = `pack dúo (${tierKey})`.toLowerCase();
    const duoNeedle2 = `pack duo (${tierKey})`.toLowerCase();

    const found = (planes || []).find((p) => {
        const nombre = String(p.nombre ?? p.Nombre ?? '').toLowerCase();
        if (product === 'Pack Dúo') {
            return nombre === duoNeedle || nombre === duoNeedle2 || nombre.includes(`dúo (${tierKey.toLowerCase()})`) || nombre.includes(`duo (${tierKey.toLowerCase()})`);
        }
        return nombre === needle || nombre.startsWith(needle.replace(')', ''));
    });
    if (!found) return null;
    const precio = Number(found.precio ?? found.Precio);
    return Number.isFinite(precio) ? precio : null;
};

const cell = { padding: '0.55rem 0.45rem', fontSize: '0.82rem', verticalAlign: 'top' };
const th = {
    ...cell,
    color: 'var(--text-secondary)',
    fontSize: '0.72rem',
    fontWeight: 700,
    borderBottom: '2px solid var(--border-color)',
};

const letraChica = {
    marginTop: '0.65rem',
    fontSize: '0.72rem',
    color: 'var(--text-secondary)',
    lineHeight: 1.45,
};

const StackTable = ({ title, color, accent, stack, cost, n, atletasLabel, margen, sugerido, catalogo }) => (
    <div style={{
        flex: 1,
        minWidth: '280px',
        border: `1px solid ${accent}`,
        borderRadius: '12px',
        padding: '0.85rem',
        background: color,
    }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5rem', marginBottom: '0.65rem' }}>
            <div>
                <div style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--text-primary)' }}>{title}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>{stack.perfil}</div>
            </div>
            <div style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Costo real</div>
                <div style={{ fontWeight: 800, fontSize: '1.15rem' }}>{money(cost.total)}</div>
            </div>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
                <tr>
                    <th style={th}>COMP.</th>
                    <th style={th}>INSTANCIA</th>
                    <th style={th}>COSTO</th>
                    <th style={th}>× {atletasLabel}</th>
                </tr>
            </thead>
            <tbody>
                <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={cell}><strong>API</strong></td>
                    <td style={cell}>
                        {stack.api.label}
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>{stack.api.ram} · {stack.api.cpu} CPU</div>
                    </td>
                    <td style={cell}>{money(stack.api.usd)}</td>
                    <td style={cell}>{moneyFine(stack.api.usd / n)} / atleta</td>
                </tr>
                {stack.extraApi && (
                    <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                        <td style={cell}><strong>2ª API</strong></td>
                        <td style={cell}>
                            {stack.extraApi.label} (live)
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>{stack.extraApi.ram} · {stack.extraApi.cpu} CPU</div>
                        </td>
                        <td style={cell}>{money(stack.extraApi.usd)}</td>
                        <td style={cell}>{moneyFine(stack.extraApi.usd / n)} / atleta</td>
                    </tr>
                )}
                <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={cell}><strong>DB</strong></td>
                    <td style={cell}>
                        {stack.db.label}
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>{stack.db.ram} · {stack.db.cpu} CPU</div>
                    </td>
                    <td style={cell}>{money(stack.db.usd)}</td>
                    <td style={cell}>{moneyFine(stack.db.usd / n)} / atleta</td>
                </tr>
                <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={cell}><strong>Storage</strong></td>
                    <td style={cell}>{stack.storageGb} GB × {money(RENDER_REF.storageGbUsd)}/GB</td>
                    <td style={cell}>{money(cost.storageUsd)}</td>
                    <td style={cell}>{moneyFine(cost.storageUsd / n)} / atleta</td>
                </tr>
                <tr style={{ background: 'rgba(0,0,0,0.12)' }}>
                    <td style={cell} colSpan={2}><strong>Total (costo real)</strong></td>
                    <td style={{ ...cell, fontWeight: 800 }}>{money(cost.total)}</td>
                    <td style={{ ...cell, fontWeight: 700 }}>{moneyFine(cost.total / n)} / atleta</td>
                </tr>
            </tbody>
        </table>
        <p style={letraChica}>
            Costo real para vos: <strong>{money(cost.total)}/mes</strong>
            {' · '}
            Sugerido vender a <strong style={{ color: 'var(--text-primary)' }}>{money(sugerido)}/mes</strong>
            {' '}(×{margen} sobre infra)
            {catalogo != null && (
                <>
                    {' · '}
                    En catálogo: <strong style={{ color: 'var(--text-primary)' }}>{money(catalogo)}</strong>
                    {catalogo !== sugerido && (
                        <span>
                            {' '}
                            ({catalogo < sugerido ? 'por debajo' : 'por encima'} de la sugerencia)
                        </span>
                    )}
                </>
            )}
        </p>
    </div>
);

/** Costo real Render; sugerencia de venta solo en letra chica. Catálogo = lo que vos escribís. */
const RenderPricingSuggestion = ({ catalogVersion = 0 }) => {
    const [catalog, setCatalog] = useState([]);
    const rows = TIERS.map((tier) => ({ tier, calc: buildSuggestion(tier) }));

    useEffect(() => {
        let cancelled = false;
        fetchPlanes()
            .then((data) => {
                if (!cancelled) setCatalog(data || []);
            })
            .catch(() => {
                if (!cancelled) setCatalog([]);
            });
        return () => { cancelled = true; };
    }, [catalogVersion]);

    return (
        <Card>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
                Costo real Render (API + DB)
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '0.75rem' }}>
                Acá solo ves lo que te cuesta la infra (
                <a href="https://render.com/pricing" target="_blank" rel="noreferrer" style={{ color: 'var(--primary)' }}>
                    render.com/pricing
                </a>
                ). El precio de venta lo cargás vos en el <strong>catálogo</strong>; abajo en letra chica hay una sugerencia según ese costo.
            </p>
            <ul style={{ margin: '0 0 1.25rem 1.1rem', padding: 0, color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: 1.55 }}>
                <li><strong>SIGDEF</strong> — admin, baja concurrencia → API Starter.</li>
                <li><strong>SportTrack</strong> — en S arrancás con Starter; Standard/Pro cuando el evento lo pida.</li>
                <li><strong>Pack Dúo</strong> — infra ST + API SIGDEF (misma DB del pico de evento).</li>
            </ul>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {rows.map(({ tier, calc }) => {
                    const catSig = matchCatalogPrice(catalog, 'SIGDEF', tier.key);
                    const catSt = matchCatalogPrice(catalog, 'SportTrack', tier.key);
                    const catDuo = matchCatalogPrice(catalog, 'Pack Dúo', tier.key);

                    return (
                        <div
                            key={tier.key}
                            style={{
                                border: '1px solid var(--border-color)',
                                borderRadius: '12px',
                                padding: '1rem 1.1rem',
                                background: 'var(--bg-secondary, transparent)',
                            }}
                        >
                            <h4 style={{ margin: '0 0 0.35rem', fontSize: '1.05rem', fontWeight: 800 }}>
                                {tier.titulo}
                            </h4>
                            <p style={{ margin: '0 0 1rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                {tier.nota}
                            </p>

                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.85rem', marginBottom: '1rem' }}>
                                <StackTable
                                    title={`SIGDEF (${tier.key}) — admin`}
                                    accent="rgba(16, 185, 129, 0.45)"
                                    color="rgba(16, 185, 129, 0.07)"
                                    stack={tier.sigdef}
                                    cost={calc.sig}
                                    n={calc.n}
                                    atletasLabel={tier.atletasLabel}
                                    margen={MARGINS.sigdef}
                                    sugerido={calc.sugerido.sigdef}
                                    catalogo={catSig}
                                />
                                <StackTable
                                    title={`SportTrack (${tier.key}) — eventos`}
                                    accent="rgba(59, 130, 246, 0.55)"
                                    color="rgba(59, 130, 246, 0.08)"
                                    stack={tier.sporttrack}
                                    cost={calc.st}
                                    n={calc.n}
                                    atletasLabel={tier.atletasLabel}
                                    margen={MARGINS.sporttrack}
                                    sugerido={calc.sugerido.sporttrack}
                                    catalogo={catSt}
                                />
                            </div>

                            <div style={{
                                fontSize: '0.8rem',
                                color: 'var(--text-secondary)',
                                padding: '0.65rem 0.75rem',
                                borderRadius: '8px',
                                border: '1px dashed var(--border-color)',
                            }}>
                                <div>
                                    <strong>Pack Dúo ({tier.key}) — costo real:</strong>{' '}
                                    APIs ST {money(calc.st.apiUsd)}
                                    {' + '}
                                    API SIGDEF {money(tier.sigdef.api.usd)}
                                    {' + '}
                                    DB ST {money(calc.st.dbUsd)}
                                    {' + '}
                                    storage {money(calc.st.storageUsd)}
                                    {' = '}
                                    <strong style={{ color: 'var(--text-primary)' }}>{money(calc.duoInfra)}/mes</strong>
                                    {' · '}
                                    {moneyFine(calc.perAthlete.duo)} / atleta
                                </div>
                                <p style={{ ...letraChica, marginTop: '0.45rem', marginBottom: 0 }}>
                                    Costo real para vos: <strong>{money(calc.duoInfra)}/mes</strong>
                                    {' · '}
                                    Sugerido vender a <strong style={{ color: 'var(--text-primary)' }}>{money(calc.sugerido.duo)}/mes</strong>
                                    {' '}(×{MARGINS.duo} sobre infra)
                                    {catDuo != null && (
                                        <>
                                            {' · '}
                                            En catálogo: <strong style={{ color: 'var(--text-primary)' }}>{money(catDuo)}</strong>
                                            {catDuo !== calc.sugerido.duo && (
                                                <span>
                                                    {' '}
                                                    ({catDuo < calc.sugerido.duo ? 'por debajo' : 'por encima'} de la sugerencia)
                                                </span>
                                            )}
                                        </>
                                    )}
                                </p>
                            </div>
                        </div>
                    );
                })}
            </div>

            <p style={{ marginTop: '1.25rem', fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                El catálogo de arriba es la fuente de verdad de lo que cobrás. Esta sección solo muestra costo Render y una sugerencia orientativa.
                Front en Vercel no está incluido. Con varias federaciones el costo se reparte y el margen real sube.
            </p>
        </Card>
    );
};

export default RenderPricingSuggestion;
