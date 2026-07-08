import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Button from '../components/common/Button';
import { fetchGlobalMetrics } from '../services/saasService';
import { 
  Shield, Users, CreditCard, Building, Check, X, Award, LogIn, ArrowRight,
  Smartphone, Wifi, LayoutGrid, Search, Home as HomeIcon, User, Star, Send, Mail, MessageSquare,
  Timer, Tv, Globe, Layers, Sparkles, Zap
} from 'lucide-react';
import './Home.css';

// Estructura completa de planes unificados
const plansData = {
  sigdef: {
    title: "Solo SIGDEF (Gestión)",
    subtitle: "Módulo Administrativo y Padrón Federativo",
    color: "#10b981",
    cardClass: "", 
    checkClass: "icon-check-green",
    btnFeaturedClass: "btn-acc-green",
    btnOutlineClass: "btn-acc-outline",
    tiers: [
      {
        id: "sigdef-s",
        name: "Plan Esencial",
        limit: "Hasta 500 atletas activos",
        price: "$50",
        period: "/mes",
        annualPrice: "Anual: $480/año (~$40/mes)",
        featured: false,
        icon: LayoutGrid,
        color: "#10b981",
        features: [
          "Panel de Control Único (Admin Federación)",
          "Padrón Digital Básico de Afiliados",
          "Categorización por edad automática",
          "Legajo de Datos Personales (DNI, Pasaporte)",
          "Validación básica de documentación interna",
          "Módulo de tutoría legal para atletas menores",
          "Exportación de planillas a Excel"
        ]
      },
      {
        id: "sigdef-m",
        name: "Plan Profesional",
        limit: "501 a 2,000 atletas activos",
        price: "$120",
        period: "/mes",
        annualPrice: "Anual: $1,150/año (~$96/mes)",
        featured: true,
        icon: Building,
        color: "#10b981",
        features: [
          "Todo lo del Plan Esencial",
          "Doble Dashboard (Federación + Clubes)",
          "Carga descentralizada desde cada Club",
          "Flujo de Aprobación Remota en tiempo real",
          "Gestión avanzada de fotos y legajos médicos",
          "Módulo de matrícula y control de afiliación",
          "Filtros avanzados por club, pago y vigencia"
        ]
      },
      {
        id: "sigdef-l",
        name: "Plan Ecosistema",
        limit: "Más de 2,000 atletas activos",
        price: "$250",
        period: "/mes",
        annualPrice: "Anual: $2,400/año (~$200/mes)",
        featured: false,
        icon: Star,
        color: "#10b981",
        features: [
          "Todo lo del Plan Profesional",
          "App Móvil Dedicada (Android / iOS)",
          "Mensajería interna oficial Federación-Clubes",
          "Centro de Notificaciones masivas con acuse",
          "Auditoría completa de logs y seguridad",
          "Resoluciones y circulares oficiales digitales",
          "Soporte multimedia de alta resolución"
        ]
      }
    ]
  },
  sporttrack: {
    title: "Solo SportTrack (Eventos)",
    subtitle: "Módulo de Competencias, Tiempos y Resultados",
    color: "#0070f3",
    cardClass: "st-theme",
    checkClass: "icon-check-blue",
    btnFeaturedClass: "btn-acc-blue",
    btnOutlineClass: "btn-acc-outline btn-acc-outline-blue",
    tiers: [
      {
        id: "st-s",
        name: "Plan Esencial",
        limit: "Hasta 500 atletas activos",
        price: "$40",
        period: "/mes",
        annualPrice: "Anual: $380/año (~$31/mes)",
        featured: false,
        icon: LayoutGrid,
        color: "#0070f3",
        features: [
          "Inscripción básica de atletas a regatas",
          "Pizarra de resultados en vivo (web pública)",
          "Consola para Juez Cronometrista",
          "Planillas de clasificación y series",
          "Soporte para 1 disciplina deportiva",
          "Reporte PDF automático de regatas",
          "Gráficos básicos de rendimiento"
        ]
      },
      {
        id: "st-m",
        name: "Plan Profesional",
        limit: "501 a 2,000 atletas activos",
        price: "$90",
        period: "/mes",
        annualPrice: "Anual: $860/año (~$71/mes)",
        featured: true,
        icon: Tv,
        color: "#0070f3",
        features: [
          "Todo lo del Plan Esencial",
          "Resultados en vivo dinámicos mediante SignalR",
          "Múltiples consolas de jueces (Largada + Llegada)",
          "Inscripción descentralizada directa por Clubes",
          "Control de penalidades y descalificaciones",
          "Cronograma interactivo de pruebas",
          "Filtros avanzados por series y categorías"
        ]
      },
      {
        id: "st-l",
        name: "Plan Ecosistema",
        limit: "Más de 2,000 atletas activos",
        price: "$190",
        period: "/mes",
        annualPrice: "Anual: $1,800/año (~$150/mes)",
        featured: false,
        icon: Globe,
        color: "#0070f3",
        features: [
          "Todo lo del Plan Profesional",
          "Globo terráqueo 3D interactivo de eventos",
          "Integración de telemetría y GPS en vivo",
          "Marca Blanca (Resultados en dominio propio)",
          "Soporte multidisciplinario avanzado",
          "API pública de resultados e integraciones",
          "Pantalla de resultados adaptada a Streaming/TV"
        ]
      }
    ]
  },
  duo: {
    title: "Pack Dúo (Ecosistema)",
    subtitle: "SIGDEF + SportTrack Integrados (Ahorro del 20%)",
    color: "#3daa94",
    cardClass: "duo-theme",
    checkClass: "icon-check-green",
    btnFeaturedClass: "btn-acc-green",
    btnOutlineClass: "btn-acc-outline",
    tiers: [
      {
        id: "duo-s",
        name: "Plan Esencial",
        limit: "Hasta 500 atletas activos",
        price: "$75",
        period: "/mes",
        annualPrice: "Anual: $720/año (~$60/mes)",
        featured: false,
        icon: Layers,
        color: "#3daa94",
        features: [
          "Plataformas integradas (SIGDEF + SportTrack)",
          "Sincronización básica de padrón a regatas",
          "Legajo básico y 1 consola de cronometrista",
          "Pizarra de resultados en vivo",
          "50% de descuento en setup inicial",
          "1.5% fee de inscripción en torneos de pago",
          "Soporte técnico prioritario por email"
        ]
      },
      {
        id: "duo-m",
        name: "Plan Profesional",
        limit: "501 a 2,000 atletas activos",
        price: "$170",
        period: "/mes",
        annualPrice: "Anual: $1,600/año (~$133/mes)",
        featured: true,
        icon: Sparkles,
        color: "#3daa94",
        features: [
          "SIGDEF Standard + SportTrack Standard",
          "Sincronización automática de atletas de clubes",
          "Inscripción descentralizada con validación",
          "Pagos unificados (Afiliación + Inscripción torneo)",
          "Consolas multi-juez SignalR sincronizadas",
          "Setup inicial e inducción técnica incluidos",
          "2.0% fee de inscripción en torneos de pago"
        ]
      },
      {
        id: "duo-l",
        name: "Plan Ecosistema",
        limit: "Más de 2,000 atletas activos",
        price: "$350",
        period: "/mes",
        annualPrice: "Anual: $3,360/año (~$280/mes)",
        featured: false,
        icon: Zap,
        color: "#3daa94",
        features: [
          "SIGDEF Premium + SportTrack Premium",
          "App Móvil Integrada (Legajo + Live Tracking)",
          "Marca Blanca (Dominio propio y logos incluidos)",
          "Mensajería y notificaciones masivas oficiales",
          "Globo 3D y telemetría avanzada de regatas",
          "Soporte VIP 24/7 y Setup prioritario incluido",
          "Fee de inscripción reducido al 1.0%"
        ]
      }
    ]
  }
};

const Home = () => {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  const [metrics, setMetrics] = useState({
    totalFederaciones: 8,
    totalClubes: 124,
    totalAtletas: 4850,
  });
  const [loadingMetrics, setLoadingMetrics] = useState(true);

  // Estados de control de planes y contacto
  const [selectedTab, setSelectedTab] = useState('sigdef'); // SIGDEF predeterminado para este portal
  const [nivelInteres, setNivelInteres] = useState('');

  useEffect(() => {
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

  const selectNivel = (nivel) => {
    setNivelInteres(nivel);
    setTimeout(() => {
      document.getElementById('contacto')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleAccess = () => {
    if (isAuthenticated) {
      const redirectPath = user.role === 'CLUB' ? '/club' : (user.role === 'SUPERADMIN' ? '/superadmin' : '/dashboard');
      navigate(redirectPath);
    } else {
      navigate('/login');
    }
  };

  const currentPlan = plansData[selectedTab];

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

            <ul style={{ 
              listStyle: 'none', 
              padding: 0, 
              margin: 0, 
              display: 'flex', 
              flexDirection: 'column', 
              gap: '1.25rem',
              textAlign: 'left'
            }}>
              <li style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start', color: '#94a3b8', fontSize: '0.95rem', lineHeight: 1.5 }}>
                <span style={{ color: '#10b981', fontWeight: 'bold', fontSize: '1.1rem', marginTop: '-2px' }}>✓</span>
                <span><strong>Padrón Único y Descentralizado:</strong> Los clubes cargan directamente a sus atletas, reduciendo la carga administrativa de la federación.</span>
              </li>
              <li style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start', color: '#94a3b8', fontSize: '0.95rem', lineHeight: 1.5 }}>
                <span style={{ color: '#10b981', fontWeight: 'bold', fontSize: '1.1rem', marginTop: '-2px' }}>✓</span>
                <span><strong>Gestión de Afiliaciones:</strong> Módulo de cobros integrado para el pago seguro de matrículas, habilitaciones y anualidades.</span>
              </li>
              <li style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start', color: '#94a3b8', fontSize: '0.95rem', lineHeight: 1.5 }}>
                <span style={{ color: '#10b981', fontWeight: 'bold', fontSize: '1.1rem', marginTop: '-2px' }}>✓</span>
                <span><strong>Legajo y Documentación:</strong> Almacenamiento de documentación médica, pasaportes y DNI, con flujos de aprobación y validación en tiempo real.</span>
              </li>
            </ul>

            <div className="hero-card-actions" style={{ display: 'flex', gap: '1rem', width: '100%', justifyContent: 'flex-start' }}>
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

          {/* Celular Mockup */}
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

      {/* ── PLANES DE SUSCRIPCIÓN (Imagen 2 - Con tabs para cotizaciones individuales y dúo) ── */}
      <section className="pricing-section" id="planes">
        <div className="home-container">
          <div className="section-title-wrapper">
            <span>Módulo Administrativo y Padrón Federativo</span>
            <h2>Planes de Suscripción</h2>
          </div>

          {/* Selector de pestañas */}
          <div className="pricing-tabs-wrapper">
            <button
              onClick={() => setSelectedTab('sigdef')}
              className={`pricing-tab-btn ${selectedTab === 'sigdef' ? 'active-sigdef' : ''}`}
            >
              Solo SIGDEF (Gestión)
            </button>
            <button
              onClick={() => setSelectedTab('duo')}
              className={`pricing-tab-btn ${selectedTab === 'duo' ? 'active-duo' : ''}`}
            >
              Pack Dúo (Ecosistema)
            </button>
          </div>

          <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
            <h3 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#ffffff', margin: '0 0 4px 0' }}>{currentPlan.title}</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: 0 }}>{currentPlan.subtitle}</p>
          </div>

          <div className="pricing-grid">
            {currentPlan.tiers.map((tier) => {
              const isFeatured = tier.featured;
              const CardIcon = tier.icon;
              const annualColor = selectedTab === 'sporttrack' ? '#0070f3' : selectedTab === 'duo' ? '#3daa94' : '#10b981';

              return (
                <div 
                  key={tier.id} 
                  className={`pricing-card ${isFeatured ? 'featured' : ''}`}
                  style={{
                    border: isFeatured ? `2px solid ${currentPlan.color}` : '1px solid rgba(255, 255, 255, 0.06)'
                  }}
                >
                  {isFeatured && (
                    <div className="plan-badge" style={{ backgroundColor: currentPlan.color }}>
                      MÁS POPULAR
                    </div>
                  )}
                  
                  <div className="pricing-header">
                    <div className="plan-icon-wrapper" style={{ color: isFeatured ? currentPlan.color : '#94a3b8' }}>
                      <CardIcon size={24} />
                    </div>
                    <h3>{tier.name}</h3>
                    <span className="plan-limits">{tier.limit}</span>
                    
                    <div className="plan-price-block">
                      <span className="plan-price">{tier.price}<span>{tier.period}</span></span>
                      <span className="plan-yearly-equivalent" style={{ color: annualColor }}>{tier.annualPrice}</span>
                    </div>
                  </div>

                  <ul className="plan-features">
                    {tier.features.map((feat, idx) => (
                      <li key={idx}>
                        <Check size={16} className={currentPlan.checkClass} />
                        {feat}
                      </li>
                    ))}
                  </ul>

                  <button 
                    onClick={() => selectNivel(`${selectedTab === 'duo' ? 'Pack Dúo' : selectedTab === 'sporttrack' ? 'Solo SportTrack' : 'Solo SIGDEF'} - ${tier.name}`)}
                    className={isFeatured ? currentPlan.btnFeaturedClass : currentPlan.btnOutlineClass} 
                    style={{ marginTop: 'auto', width: '100%' }}
                  >
                    Consultar Plan
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── SECCIÓN PONETE EN CONTACTO (Imagen 4) ── */}
      <section className="contacto-section" id="contacto">
        <div className="home-container">
          
          <div className="contacto-title-wrapper">
            <h2>Ponete en <span>Contacto</span></h2>
            <p style={{ color: 'var(--text-muted)', maxWidth: '580px', margin: '0.5rem auto 0 auto', fontSize: '1.05rem', lineHeight: 1.6 }}>
              ¿Listo para digitalizar tu federación? Nuestro equipo te asesora personalmente.
            </p>
            <div className="app-line-decorator"></div>
          </div>

          <div className="contacto-grid">
            
            {/* Contacto Directo */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="contacto-direct-card">
                <h4>
                  <div className="contacto-direct-icon-wrapper">
                    <Mail size={16} />
                  </div>
                  Contacto Directo
                </h4>
                
                <div className="contacto-detail-group">
                  <div className="contacto-detail-label">Email</div>
                  <div className="contacto-detail-value">info@sigdef.com.ar</div>
                </div>
                
                <div className="contacto-detail-group">
                  <div className="contacto-detail-label">WhatsApp</div>
                  <div className="contacto-detail-value">+54 9 341 228 0901</div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <a href="https://wa.me/5493412280901?text=Hola%20SIGDEF%2C%20quiero%20conocer%20más%20sobre%20sus%20servicios"
                  target="_blank" rel="noopener noreferrer"
                  className="btn-acc-green" style={{ flex: 1, padding: '0.75rem 1rem !important', fontSize: '0.925rem' }}>
                  <MessageSquare size={16} /> WhatsApp
                </a>
                <a href="mailto:info@sigdef.com.ar"
                  className="btn-acc-outline" style={{ flex: 1, padding: '0.75rem 1rem !important', fontSize: '0.925rem' }}>
                  <Mail size={16} /> Email
                </a>
              </div>
            </div>

            {/* Envianos un Mensaje */}
            <div className="contacto-form-card">
              <h4>
                <div className="contacto-form-icon-wrapper">
                  <Send size={16} />
                </div>
                Envianos un Mensaje
              </h4>
              
              <form onSubmit={(e) => { e.preventDefault(); alert('¡Mensaje enviado! Nos contactaremos pronto.'); }} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="contacto-form-group">
                    <label htmlFor="contact-nombre">Nombre</label>
                    <input id="contact-nombre" type="text" placeholder="Tu nombre" required className="contact-input-dark" style={{ marginBottom: 0 }} />
                  </div>
                  <div className="contacto-form-group">
                    <label htmlFor="contact-org">Institución</label>
                    <input id="contact-org" type="text" placeholder="Federación / Club" className="contact-input-dark" style={{ marginBottom: 0 }} />
                  </div>
                </div>
                
                <div className="contacto-form-group">
                  <label htmlFor="contact-email">Email</label>
                  <input id="contact-email" type="email" placeholder="tuemail@institución.com" required className="contact-input-dark" style={{ marginBottom: 0 }} />
                </div>
                
                <div className="contacto-form-group">
                  <label htmlFor="contact-nivel">Nivel de Interés</label>
                  <select
                    id="contact-nivel"
                    value={nivelInteres}
                    onChange={(e) => setNivelInteres(e.target.value)}
                    className="contact-input-dark"
                    style={{
                      marginBottom: 0,
                      cursor: 'pointer',
                      appearance: 'none',
                      backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%238a9bb5' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`,
                      backgroundRepeat: 'no-repeat',
                      backgroundPosition: 'right 1rem center',
                    }}
                  >
                    <option value="" style={{ background: '#0b0f19', color: '#64748b' }}>Seleccioná un plan...</option>
                    <optgroup label="🎁 Pack Dúo (Ecosistema Integrado)" style={{ background: '#0b0f19', color: '#ffffff', fontWeight: 600 }}>
                      <option value="Pack Dúo - Plan Esencial" style={{ background: '#0b0f19', color: '#cbd5e1' }}>Pack Dúo — Plan Esencial (Hasta 500 atletas)</option>
                      <option value="Pack Dúo - Plan Profesional" style={{ background: '#0b0f19', color: '#cbd5e1' }}>Pack Dúo — Plan Profesional (501 a 2,000 atletas)</option>
                      <option value="Pack Dúo - Plan Ecosistema" style={{ background: '#0b0f19', color: '#cbd5e1' }}>Pack Dúo — Plan Ecosistema (Más de 2,000 atletas)</option>
                    </optgroup>
                    <optgroup label="🟢 Solo SIGDEF (Gestión)" style={{ background: '#0b0f19', color: '#ffffff', fontWeight: 600 }}>
                      <option value="Solo SIGDEF - Plan Esencial" style={{ background: '#0b0f19', color: '#cbd5e1' }}>Solo SIGDEF — Plan Esencial (Hasta 500 atletas)</option>
                      <option value="Solo SIGDEF - Plan Profesional" style={{ background: '#0b0f19', color: '#cbd5e1' }}>Solo SIGDEF — Plan Profesional (501 a 2,000 atletas)</option>
                      <option value="Solo SIGDEF - Plan Ecosistema" style={{ background: '#0b0f19', color: '#cbd5e1' }}>Solo SIGDEF — Plan Ecosistema (Más de 2,000 atletas)</option>
                    </optgroup>
                  </select>
                </div>
                
                <div className="contacto-form-group">
                  <label htmlFor="contact-mensaje">Mensaje</label>
                  <textarea id="contact-mensaje" rows={3} placeholder="Contanos cómo podemos ayudarte a crear tu software acorde a tus necesidades" className="contact-input-dark" style={{ marginBottom: 0, resize: 'vertical' }}></textarea>
                </div>

                <button type="submit" className="btn-acc-green" style={{ width: '100%', marginTop: '0.75rem', height: 'auto', padding: '0.85rem' }}>
                  Enviar Mensaje <Send size={16} />
                </button>
              </form>
            </div>

          </div>
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
              <a href="#contacto" className="footer-link">Contacto</a>
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

export default Home;
