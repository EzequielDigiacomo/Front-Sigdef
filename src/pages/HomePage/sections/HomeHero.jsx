import { Shield, Users } from 'lucide-react';

export default function HomeHero({ metrics, onAccess }) {
  return (
    <section className="hero">
      <div className="hero-bg-glow" />
      <div className="home-container hero-content-grid">
        <div className="hero-card">
          <div className="hero-card-header" style={{ justifyContent: 'flex-start' }}>
            <div className="hero-shield-wrapper">
              <Shield size={24} />
            </div>
            <div className="hero-card-title-group" style={{ alignItems: 'flex-start', textAlign: 'left' }}>
              <h1 style={{ textAlign: 'left', margin: 0 }}>SIGDEF</h1>
              <span style={{ textAlign: 'left', display: 'block' }}>Administración y Padrón Digital</span>
            </div>
          </div>

          <p className="hero-card-description" style={{ textAlign: 'left' }}>
            La columna vertebral de tu federación. Controla la identidad institucional de atletas, entrenadores, tutores y clubes en un panel único y centralizado. Automatiza las acreditaciones y los cobros de matrículas de manera transparente.
          </p>

          <ul
            style={{
              listStyle: 'none',
              padding: 0,
              margin: 0,
              display: 'flex',
              flexDirection: 'column',
              gap: '1.25rem',
              textAlign: 'left',
            }}
          >
            <li style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start', color: '#94a3b8', fontSize: '0.95rem', lineHeight: 1.5 }}>
              <span style={{ color: '#10b981', fontWeight: 'bold', fontSize: '1.1rem', marginTop: '-2px' }}>✓</span>
              <span>
                <strong>Padrón Único y Descentralizado:</strong> Los clubes cargan directamente a sus atletas, reduciendo la carga administrativa de la federación.
              </span>
            </li>
            <li style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start', color: '#94a3b8', fontSize: '0.95rem', lineHeight: 1.5 }}>
              <span style={{ color: '#10b981', fontWeight: 'bold', fontSize: '1.1rem', marginTop: '-2px' }}>✓</span>
              <span>
                <strong>Gestión de Afiliaciones:</strong> Módulo de cobros integrado para el pago seguro de matrículas, habilitaciones y anualidades.
              </span>
            </li>
            <li style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start', color: '#94a3b8', fontSize: '0.95rem', lineHeight: 1.5 }}>
              <span style={{ color: '#10b981', fontWeight: 'bold', fontSize: '1.1rem', marginTop: '-2px' }}>✓</span>
              <span>
                <strong>Legajo y Documentación:</strong> Almacenamiento de documentación médica, pasaportes y DNI, con flujos de aprobación y validación en tiempo real.
              </span>
            </li>
          </ul>

          <div className="hero-card-actions" style={{ display: 'flex', gap: '1rem', width: '100%', justifyContent: 'flex-start' }}>
            <a href="#planes" className="btn-acc-outline" style={{ display: 'inline-flex', alignItems: 'center' }}>
              Ver Planes &nbsp; &rsaquo;
            </a>
            <button onClick={onAccess} className="btn-acc-green">
              Acceder a SIGDEF
            </button>
          </div>
        </div>

        <div className="hero-visual">
          <div className="dashboard-preview">
            <div className="preview-header">
              <div className="preview-dot-group">
                <div className="preview-dot" />
                <div className="preview-dot" />
                <div className="preview-dot" />
              </div>
              <div className="preview-title">Padrón de Atletas - Crecimiento</div>
            </div>

            <div className="preview-chart-container">
              <svg viewBox="0 0 400 160" width="100%" height="100%">
                <defs>
                  <linearGradient id="chart-glow" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                  </linearGradient>
                </defs>
                <line x1="10" y1="20" x2="390" y2="20" stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
                <line x1="10" y1="60" x2="390" y2="60" stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
                <line x1="10" y1="100" x2="390" y2="100" stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
                <line x1="10" y1="140" x2="390" y2="140" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
                <path d="M 10 130 Q 90 95, 160 105 T 280 45 T 390 25 L 390 140 L 10 140 Z" fill="url(#chart-glow)" />
                <path d="M 10 130 Q 90 95, 160 105 T 280 45 T 390 25" fill="none" stroke="#10b981" strokeWidth="3" strokeLinecap="round" />
                <circle cx="390" cy="25" r="5" fill="#10b981" />
                <circle cx="390" cy="25" r="11" fill="#10b981" opacity="0.3" className="pulse-dot" />
              </svg>
            </div>

            <div className="floating-widget w-athletes">
              <div className="widget-icon">
                <Users size={20} />
              </div>
              <div className="widget-info">
                <span className="widget-label">Total Atletas</span>
                <span className="widget-value">{metrics.totalAtletas.toLocaleString()}</span>
              </div>
            </div>

            <div className="floating-widget w-validation">
              <div className="widget-icon">
                <Shield size={20} />
              </div>
              <div className="widget-info">
                <span className="widget-label">Apto Médico Legajo</span>
                <span className="badge-status-anim">Validando</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
