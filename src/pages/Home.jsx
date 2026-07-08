import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Button from '../components/common/Button';
import { fetchPlanes, fetchGlobalMetrics } from '../services/saasService';
import { 
  Shield, Users, CreditCard, Building, Check, X, Award, LogIn, ArrowRight,
  Smartphone, Wifi, LayoutGrid, Search, Home as HomeIcon, User, Star
} from 'lucide-react';
import './Home.css';

const Home = () => {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  // Estados de datos remotos con fallbacks robustos
  const [metrics, setMetrics] = useState({
    totalFederaciones: 8,
    totalClubes: 124,
    totalAtletas: 4850,
  });
  const [loadingMetrics, setLoadingMetrics] = useState(true);

  useEffect(() => {
    // Cargar métricas globales
    setLoadingMetrics(true);
    fetchGlobalMetrics()
      .then(data => {
        if (data) {
          setMetrics({
            totalFederaciones: data.totalFederaciones || 8,
            totalClubes: data.totalClubes || 124,
            totalAtletas: data.totalAtletas || 4850,
          });
        }
      })
      .catch(err => console.warn('Usando métricas locales de fallback:', err))
      .finally(() => setLoadingMetrics(false));
  }, []);

  const handleAccess = () => {
    if (isAuthenticated) {
      const redirectPath = user.role === 'CLUB' ? '/club' : (user.role === 'SUPERADMIN' ? '/superadmin' : '/dashboard');
      navigate(redirectPath);
    } else {
      navigate('/login');
    }
  };

  return (
    <div className="home-page fade-in">
      
      {/* ── NAVBAR SUPERIOR ── */}
      <header className="home-header">
        <div className="logo-container" onClick={() => navigate('/')}>
          <img src="/logo_icon.png" alt="SIGDEF Logo" className="logo-img" />
          <span style={{ fontSize: '1.45rem', fontWeight: 850, letterSpacing: '-0.5px' }} className="text-gradient-green">
            SIGDEF
          </span>
        </div>
        <div>
          <button onClick={handleAccess} className="btn-acc-green" style={{ padding: '0.5rem 1.5rem', fontSize: '0.9rem' }}>
            {isAuthenticated ? (
              <>
                Ir a mi Panel <ArrowRight size={16} />
              </>
            ) : (
              <>
                Iniciar Sesión <LogIn size={16} />
              </>
            )}
          </button>
        </div>
      </header>

      {/* ── HERO SECTION ── */}
      <section className="hero">
        <div className="hero-bg-glow" />
        <div className="home-container hero-content-grid">
          
          {/* Tarjeta del Hero (Imagen 1) */}
          <div className="hero-card">
            <div className="hero-card-header">
              <div className="hero-shield-wrapper">
                <Shield size={24} />
              </div>
              <div className="hero-card-title-group">
                <h1>SIGDEF</h1>
                <span>Administración y Padrón Digital</span>
              </div>
            </div>

            <p className="hero-card-description">
              La columna vertebral de tu federación. Controla la identidad institucional de atletas, entrenadores, tutores y clubes en un panel único y centralizado. Automatiza las acreditaciones y los cobros de matrículas de manera transparente.
            </p>

            <div className="hero-features-list">
              <div className="hero-feature-item">
                <Users size={20} className="hero-feature-icon" />
                <div className="hero-feature-info">
                  <h4>Padrón Único y Descentralizado</h4>
                  <p>Los clubes cargan directamente a sus atletas, reduciendo la carga administrativa de la federación.</p>
                </div>
              </div>

              <div className="hero-feature-item">
                <CreditCard size={20} className="hero-feature-icon" />
                <div className="hero-feature-info">
                  <h4>Gestión de Afiliaciones</h4>
                  <p>Módulo de cobros integrado para el pago seguro de matrículas, habilitaciones y anualidades.</p>
                </div>
              </div>

              <div className="hero-feature-item">
                <Shield size={20} className="hero-feature-icon" />
                <div className="hero-feature-info">
                  <h4>Legajo y Documentación</h4>
                  <p>Almacenamiento de documentación médica, pasaportes y DNI, con flujos de aprobación y validación en tiempo real.</p>
                </div>
              </div>
            </div>

            <div className="hero-card-actions">
              <a href="#planes" className="btn-acc-outline" style={{ display: 'inline-flex', alignItems: 'center' }}>
                Ver Planes &nbsp; &rsaquo;
              </a>
              <button onClick={handleAccess} className="btn-acc-green">
                Acceder a SIGDEF
              </button>
            </div>
          </div>

          {/* Gráfico y widgets flotantes interactivos */}
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
                  
                  {/* Grid lines */}
                  <line x1="10" y1="20" x2="390" y2="20" stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
                  <line x1="10" y1="60" x2="390" y2="60" stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
                  <line x1="10" y1="100" x2="390" y2="100" stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
                  <line x1="10" y1="140" x2="390" y2="140" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />

                  {/* Area fill */}
                  <path d="M 10 130 Q 90 95, 160 105 T 280 45 T 390 25 L 390 140 L 10 140 Z" fill="url(#chart-glow)" />

                  {/* Line path */}
                  <path d="M 10 130 Q 90 95, 160 105 T 280 45 T 390 25" fill="none" stroke="#10b981" strokeWidth="3" strokeLinecap="round" />

                  {/* Active dot */}
                  <circle cx="390" cy="25" r="5" fill="#10b981" />
                  <circle cx="390" cy="25" r="11" fill="#10b981" opacity="0.3" className="pulse-dot" />
                </svg>
              </div>

              <div className="floating-widget w-athletes">
                <div className="widget-icon"><Users size={20} /></div>
                <div className="widget-info">
                  <span className="widget-label">Total Atletas</span>
                  <span className="widget-value">{metrics.totalAtletas.toLocaleString()}</span>
                </div>
              </div>

              <div className="floating-widget w-validation">
                <div className="widget-icon"><Shield size={20} /></div>
                <div className="widget-info">
                  <span className="widget-label">Apto Médico Legajo</span>
                  <span className="badge-status-anim">Validando</span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ── SECCIÓN APP NATIVA (Imagen 3) ── */}
      <section className="app-nativa-section" id="app-celular">
        <div className="home-container app-nativa-grid">
          
          <div className="app-nativa-text">
            <div className="app-title-wrapper">
              <h2>App Nativa para tu<br /><span>Celular</span></h2>
              <div className="app-line-decorator"></div>
            </div>

            <p className="app-nativa-desc">
              SIGDEF no se queda en el escritorio. Diseñamos una aplicación móvil nativa para que los delegados, entrenadores y administradores puedan gestionar su federación o clubes desde cualquier lugar.
            </p>

            <div className="app-features-list">
              <div className="app-feature-item">
                <div className="app-feature-icon-wrapper">
                  <Smartphone size={22} />
                </div>
                <div className="app-feature-info">
                  <h4>Android</h4>
                  <p>App nativa en React Native. Misma experiencia, mismo diseño, en cada dispositivo.</p>
                </div>
              </div>

              <div className="app-feature-item">
                <div className="app-feature-icon-wrapper">
                  <LayoutGrid size={22} />
                </div>
                <div className="app-feature-info">
                  <h4>Panel completo en el bolsillo</h4>
                  <p>Acceso a todos los módulos: Atletas, Clubes, Pagos, Entrenadores y más.</p>
                </div>
              </div>

              <div className="app-feature-item">
                <div className="app-feature-icon-wrapper">
                  <Wifi size={22} />
                </div>
                <div className="app-feature-info">
                  <h4>Sincronización en tiempo real</h4>
                  <p>Los cambios se reflejan instantáneamente entre la app móvil y el panel web.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Celular Mockup en CSS/HTML (Imagen 3) */}
          <div className="phone-mockup-wrapper">
            <div className="phone-mockup">
              <div className="phone-notch"></div>
              
              <div className="phone-screen">
                <div className="phone-header">
                  <h5>Bienvenido,</h5>
                  <h4>Juan Pérez</h4>
                  <p>Panel de control de Federación Argentina de Canoas</p>
                </div>

                <div className="phone-stats-grid">
                  <div className="phone-stat-chip blue">
                    <span>Total Atletas</span>
                    <span className="phone-stat-value">51</span>
                  </div>
                  <div className="phone-stat-chip green">
                    <span>Clubes Registrados</span>
                    <span className="phone-stat-value">20</span>
                  </div>
                  <div className="phone-stat-chip red">
                    <span>Atletas con Deuda</span>
                    <span className="phone-stat-value">3</span>
                  </div>
                </div>

                <h6 className="phone-section-title">Módulos de Gestión</h6>
                
                <div className="phone-modules-list">
                  <div className="phone-module-item">
                    <div className="phone-module-dot dot-blue"></div>
                    <span className="phone-module-name">Clubes</span>
                  </div>
                  <div className="phone-module-item">
                    <div className="phone-module-dot dot-green"></div>
                    <span className="phone-module-name">Atletas</span>
                  </div>
                  <div className="phone-module-item">
                    <div className="phone-module-dot dot-orange"></div>
                    <span className="phone-module-name">Entrenadores</span>
                  </div>
                  <div className="phone-module-item">
                    <div className="phone-module-dot dot-purple"></div>
                    <span className="phone-module-name">Selecciones</span>
                  </div>
                  <div className="phone-module-item">
                    <div className="phone-module-dot dot-red"></div>
                    <span className="phone-module-name">Delegados</span>
                  </div>
                  <div className="phone-module-item">
                    <div className="phone-module-dot dot-pink"></div>
                    <span className="phone-module-name">Tutores</span>
                  </div>
                </div>
              </div>

              <div className="phone-nav-bar">
                <div className="phone-nav-item active">
                  <HomeIcon size={16} />
                  <span>Inicio</span>
                </div>
                <div className="phone-nav-item">
                  <Users size={16} />
                  <span>Atletas</span>
                </div>
                <div className="phone-nav-floating">
                  <Search size={18} />
                </div>
                <div className="phone-nav-item">
                  <Building size={16} />
                  <span>Clubes</span>
                </div>
                <div className="phone-nav-item">
                  <User size={16} />
                  <span>Perfil</span>
                </div>
              </div>

              <div className="phone-home-indicator"></div>
            </div>
          </div>

        </div>
      </section>

      {/* ── PLANES DE SUSCRIPCIÓN (Imagen 2) ── */}
      <section className="pricing-section" id="planes">
        <div className="home-container">
          <div className="section-title-wrapper">
            <span>Módulo Administrativo y Padrón Federativo</span>
            <h2>Planes de Suscripción</h2>
          </div>

          <div className="pricing-grid">
            
            {/* PLAN ESENCIAL */}
            <div className="pricing-card">
              <div className="pricing-header">
                <div className="plan-icon-wrapper">
                  <LayoutGrid size={24} />
                </div>
                <h3>Plan Esencial</h3>
                <span className="plan-limits">Hasta 500 atletas activos</span>
                
                <div className="plan-price-block">
                  <span className="plan-price">$50<span>/mes</span></span>
                  <span className="plan-yearly-equivalent">Anual: $480/año (~$40/mes)</span>
                </div>
              </div>

              <ul className="plan-features">
                <li><Check size={16} className="icon-check-green" /> Panel de Control Único (Admin Federación)</li>
                <li><Check size={16} className="icon-check-green" /> Padrón Digital Básico de Afiliados</li>
                <li><Check size={16} className="icon-check-green" /> Categorización por edad automática</li>
                <li><Check size={16} className="icon-check-green" /> Legajo de Datos Personales (DNI, Pasaporte)</li>
                <li><Check size={16} className="icon-check-green" /> Validación básica de documentación interna</li>
                <li><Check size={16} className="icon-check-green" /> Módulo de tutoría legal para atletas menores</li>
                <li><Check size={16} className="icon-check-green" /> Exportación de planillas a Excel</li>
              </ul>

              <button onClick={handleAccess} className="btn-acc-outline" style={{ marginTop: 'auto', width: '100%' }}>
                Consultar Plan
              </button>
            </div>

            {/* PLAN PROFESIONAL */}
            <div className="pricing-card featured">
              <div className="plan-badge">MÁS POPULAR</div>
              
              <div className="pricing-header">
                <div className="plan-icon-wrapper">
                  <Building size={24} />
                </div>
                <h3>Plan Profesional</h3>
                <span className="plan-limits">501 a 2,000 atletas activos</span>
                
                <div className="plan-price-block">
                  <span className="plan-price">$120<span>/mes</span></span>
                  <span className="plan-yearly-equivalent">Anual: $1,150/año (~$96/mes)</span>
                </div>
              </div>

              <ul className="plan-features">
                <li><Check size={16} className="icon-check-green" /> Todo lo del Plan Esencial</li>
                <li><Check size={16} className="icon-check-green" /> Doble Dashboard (Federación + Clubes)</li>
                <li><Check size={16} className="icon-check-green" /> Carga descentralizada desde cada Club</li>
                <li><Check size={16} className="icon-check-green" /> Flujo de Aprobación Remota en tiempo real</li>
                <li><Check size={16} className="icon-check-green" /> Gestión avanzada de fotos y legajos médicos</li>
                <li><Check size={16} className="icon-check-green" /> Módulo de matrícula y control de afiliación</li>
                <li><Check size={16} className="icon-check-green" /> Filtros avanzados por club, pago y vigencia</li>
              </ul>

              <button onClick={handleAccess} className="btn-acc-green" style={{ marginTop: 'auto', width: '100%' }}>
                Consultar Plan
              </button>
            </div>

            {/* PLAN ECOSISTEMA */}
            <div className="pricing-card">
              <div className="pricing-header">
                <div className="plan-icon-wrapper">
                  <Star size={24} />
                </div>
                <h3>Plan Ecosistema</h3>
                <span className="plan-limits">Más de 2,000 atletas activos</span>
                
                <div className="plan-price-block">
                  <span className="plan-price">$250<span>/mes</span></span>
                  <span className="plan-yearly-equivalent">Anual: $2,400/año (~$200/mes)</span>
                </div>
              </div>

              <ul className="plan-features">
                <li><Check size={16} className="icon-check-green" /> Todo lo del Plan Profesional</li>
                <li><Check size={16} className="icon-check-green" /> App Móvil Dedicada (Android / iOS)</li>
                <li><Check size={16} className="icon-check-green" /> Mensajería interna oficial Federación-Clubes</li>
                <li><Check size={16} className="icon-check-green" /> Centro de Notificaciones masivas con acuse</li>
                <li><Check size={16} className="icon-check-green" /> Auditoría completa de logs y seguridad</li>
                <li><Check size={16} className="icon-check-green" /> Resoluciones y circulares oficiales digitales</li>
                <li><Check size={16} className="icon-check-green" /> Soporte multimedia de alta resolución</li>
              </ul>

              <button onClick={handleAccess} className="btn-acc-outline" style={{ marginTop: 'auto', width: '100%' }}>
                Consultar Plan
              </button>
            </div>

          </div>
        </div>
      </section>

      {/* ── CTA SECCIÓN ── */}
      <section className="cta-section">
        <div className="cta-glow" />
        <div className="home-container cta-content">
          <h2>¿Querés integrar tu institución deportiva?</h2>
          <p>
            Inscribí a tus atletas, aprobá documentación y controlá el estado administrativo de tu club o federación de manera automatizada.
          </p>
          <button onClick={handleAccess} className="btn-acc-green" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
            {isAuthenticated ? 'Ir a Mi Panel' : 'Ingresar al Portal'} <ArrowRight size={18} />
          </button>
        </div>
      </section>

      {/* ── FOOTER DE LA PLATAFORMA ── */}
      <footer className="home-footer-premium">
        <div className="home-container footer-content">
          <div className="footer-main-info">
            <div className="footer-logo">
              <img src="/logo_icon.png" alt="SIGDEF" style={{ height: '36px' }} />
              <span style={{ fontSize: '1.25rem', fontWeight: 800 }} className="text-gradient-green">SIGDEF</span>
            </div>
            <p className="footer-company-desc">
              SaaS de digitalización federativa oficial. Llevando el control administrativo, aptos médicos y padrones del canotaje nacional a una plataforma ágil y transparente.
            </p>
            <div className="footer-developer">
              Tecnología oficial en integración con <span>SportTrack</span>
            </div>
          </div>

          <div className="footer-column">
            <h4>Contacto</h4>
            <div className="footer-links">
              <a href="mailto:soporte@sigdef.com" className="footer-link">
                <Mail size={16} style={{ marginRight: '4px' }} /> soporte@sigdef.com
              </a>
              <a href="https://wa.me/5493412280901" className="footer-link">
                <Smartphone size={16} style={{ marginRight: '4px' }} /> WhatsApp Soporte
              </a>
            </div>
          </div>

          <div className="footer-column">
            <h4>Enlaces Rápidos</h4>
            <div className="footer-links">
              <span className="footer-link" style={{ cursor: 'pointer' }} onClick={handleAccess}>
                Acceso Staff / Clubs
              </span>
              <a href="#app-celular" className="footer-link">App de Celular</a>
              <a href="#planes" className="footer-link">Planes de Pago</a>
            </div>
          </div>
        </div>
        
        <div className="footer-bottom">
          <div className="home-container">
            <p>© 2026 SIGDEF · Sistema de Gestión Deportiva Federativa · Todos los derechos reservados</p>
          </div>
        </div>
      </footer>

    </div>
  );
};

// Simple Mail component wrapper since Lucide might export Mail or we might need it for contact links
const Mail = ({ size, ...props }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size || 24}
    height={size || 24}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <rect width="20" height="16" x="2" y="4" rx="2" />
    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
  </svg>
);

export default Home;
