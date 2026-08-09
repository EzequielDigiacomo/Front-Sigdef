import { Building, Home as HomeIcon, LayoutGrid, Search, Smartphone, User, Users, Wifi } from 'lucide-react';

export default function HomeAppNativa() {
  return (
    <section className="app-nativa-section" id="app-celular">
      <div className="home-container app-nativa-grid">
        <div className="app-nativa-text">
          <div className="app-title-wrapper">
            <h2>
              App Nativa para tu
              <br />
              <span>Celular</span>
            </h2>
            <div className="app-line-decorator" />
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

        <div className="phone-mockup-wrapper">
          <div className="phone-mockup">
            <div className="phone-notch" />

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
                  <div className="phone-module-dot dot-blue" />
                  <span className="phone-module-name">Clubes</span>
                </div>
                <div className="phone-module-item">
                  <div className="phone-module-dot dot-green" />
                  <span className="phone-module-name">Atletas</span>
                </div>
                <div className="phone-module-item">
                  <div className="phone-module-dot dot-orange" />
                  <span className="phone-module-name">Entrenadores</span>
                </div>
                <div className="phone-module-item">
                  <div className="phone-module-dot dot-purple" />
                  <span className="phone-module-name">Selecciones</span>
                </div>
                <div className="phone-module-item">
                  <div className="phone-module-dot dot-red" />
                  <span className="phone-module-name">Delegados</span>
                </div>
                <div className="phone-module-item">
                  <div className="phone-module-dot dot-pink" />
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

            <div className="phone-home-indicator" />
          </div>
        </div>
      </div>
    </section>
  );
}
