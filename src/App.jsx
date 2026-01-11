import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import MainLayout from './components/layout/MainLayout';
import MainLayoutClub from './components/layout/MainLayoutClub';
import Login from './pages/Login';

import Dashboard from './pages/Dashboard';
import AtletasList from './pages/FederacionAdmin/Atletas/AtletasList';
import AtletasForm from './pages/FederacionAdmin/Atletas/AtletasForm';
import DelegadosList from './pages/FederacionAdmin/Delegados/DelegadosList';
import DelegadosForm from './pages/FederacionAdmin/Delegados/DelegadosForm';
import ClubesList from './pages/FederacionAdmin/Clubes/ClubesList';
import ClubesForm from './pages/FederacionAdmin/Clubes/ClubesForm';
import ClubDetalles from './pages/FederacionAdmin/Clubes/ClubDetalles';
import EventosList from './pages/FederacionAdmin/Eventos/EventosList';
import EventosForm from './pages/FederacionAdmin/Eventos/EventosForm';
import EventoDetalle from './pages/FederacionAdmin/Eventos/EventoDetalle';
import DistanciasList from './pages/FederacionAdmin/Eventos/DistanciasList';
import DistanciasForm from './pages/FederacionAdmin/Eventos/DistanciasForm';
import TutoresList from './pages/FederacionAdmin/Tutores/TutoresList';
import TutoresForm from './pages/FederacionAdmin/Tutores/TutoresForm';
import InscripcionesList from './pages/FederacionAdmin/Inscripciones/InscripcionesList';
import InscripcionesForm from './pages/FederacionAdmin/Inscripciones/InscripcionesForm';
import EntrenadoresSeleccionList from './pages/FederacionAdmin/EntrenadorSeleccion/EntrenadorSeleccionList';
import EntrenadoresSeleccionForm from './pages/FederacionAdmin/EntrenadorSeleccion/EntrenadorSeleccionForm';
import SeleccionCategoriaDetalle from './pages/FederacionAdmin/EntrenadorSeleccion/SeleccionCategoriaDetalle';
import EntrenadoresList from './pages/FederacionAdmin/Entrenadores/EntrenadoresList';
import UserManagement from './pages/FederacionAdmin/Usuarios/UserManagement';
import FederacionDetalles from './pages/FederacionAdmin/Federacion/FederacionDetalles';
import AgentesLibresList from './pages/FederacionAdmin/AgentesLibres/AgentesLibresList';

import ClubDashboard from './pages/ClubAdmin/Dashboard/ClubDashboard';
import ClubInfo from './pages/ClubAdmin/Info/ClubInfo';
import ClubAtletas from './pages/ClubAdmin/Atletas/ClubAtletas';
import ClubAtletasForm from './pages/ClubAdmin/Atletas/ClubAtletasForm';
import ClubTutores from './pages/ClubAdmin/Tutores/ClubTutores';
import ClubTutoresForm from './pages/ClubAdmin/Tutores/ClubTutoresForm';
import ClubEventos from './pages/ClubAdmin/Eventos/ClubEventos';
import ClubEventosForm from './pages/ClubAdmin/Eventos/ClubEventosForm';
import ClubEventoDetalle from './pages/ClubAdmin/Eventos/ClubEventoDetalle';
import EventosDisponibles from './pages/ClubAdmin/Eventos/EventosDisponibles';
import ClubEntrenadores from './pages/ClubAdmin/Entrenadores/ClubEntrenadores';
import ClubEntrenadoresForm from './pages/ClubAdmin/Entrenadores/ClubEntrenadoresForm';
import ClubDelegados from './pages/ClubAdmin/Delegados/ClubDelegados';
import ClubDelegadosForm from './pages/ClubAdmin/Delegados/ClubDelegadosForm';

import { ThemeProvider } from './context/ThemeContext';

const PrivateRoute = ({ children, allowedRoles }) => {
  const { isAuthenticated, loading, user } = useAuth();

  if (loading) return <div>Cargando...</div>;

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  if (allowedRoles && !allowedRoles.includes(user.role)) {

    const redirectPath = user.role === 'CLUB' ? '/club' : '/dashboard';
    return <Navigate to={redirectPath} replace />;
  }

  return children;
};

const LoginRoute = () => {
  const { isAuthenticated, loading, user } = useAuth();

  if (loading) return <div>Cargando...</div>;

  if (isAuthenticated) {

    const redirectPath = user.role === 'CLUB' ? '/club' : '/dashboard';
    console.log('Usuario ya autenticado, redirigiendo a:', redirectPath);
    return <Navigate to={redirectPath} replace />;
  }

  return <Login />;
};

const RootRedirect = () => {
  const { isAuthenticated, loading, user } = useAuth();

  if (loading) return <div>Cargando...</div>;

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (user.role === 'CLUB') {
    return <Navigate to="/club" replace />;
  }

  return <Navigate to="/dashboard" replace />;
};

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <Routes>
            { }
            <Route path="/" element={<RootRedirect />} />

            <Route path="/login" element={<LoginRoute />} />

            { }
            <Route path="/dashboard" element={
              <PrivateRoute allowedRoles={['FEDERACION']}>
                <MainLayout />
              </PrivateRoute>
            }>
              <Route index element={<Dashboard />} />

              { }
              <Route path="atletas" element={<AtletasList />} />
              <Route path="atletas/nuevo" element={<AtletasForm />} />
              <Route path="atletas/editar/:id" element={<AtletasForm />} />

              <Route path="delegados" element={<DelegadosList />} />
              <Route path="delegados/nuevo" element={<DelegadosForm />} />
              <Route path="delegados/editar/:id" element={<DelegadosForm />} />

              <Route path="delegados-club/nuevo" element={<DelegadosForm />} />

              { /* CLUBES */}
              <Route path="clubes" element={<ClubesList />} />
              <Route path="clubes/nuevo" element={<ClubesForm />} />
              <Route path="clubes/editar/:id" element={<ClubesForm />} />
              <Route path="clubes/detalles/:id" element={<ClubDetalles />} />

              { }
              { /*
              <Route path="eventos" element={<EventosList />} />
              <Route path="eventos/nuevo" element={<EventosForm />} />
              <Route path="eventos/editar/:id" element={<EventosForm />} />
              <Route path="eventos/:id" element={<EventoDetalle />} />
              <Route path="eventos/:eventoId/distancias" element={<DistanciasList />} />
              <Route path="eventos/:eventoId/distancias/nueva" element={<DistanciasForm />} />
              <Route path="eventos/:eventoId/distancias/editar/:id" element={<DistanciasForm />} />
*/ }

              { }
              <Route path="tutores" element={<TutoresList />} />
              <Route path="tutores/new" element={<TutoresForm />} />
              <Route path="tutores/:id/edit" element={<TutoresForm />} />

              { }
              { /*
              <Route path="inscripciones" element={<InscripcionesList />} />
              <Route path="inscripciones/new" element={<InscripcionesForm />} />
*/ }

              {/* ENTRENADORES */}
              <Route path="entrenadores" element={<EntrenadoresList viewMode="club" />} />
              <Route path="entrenadores/nuevo" element={<ClubEntrenadoresForm />} />
              <Route path="entrenadores/editar/:id" element={<ClubEntrenadoresForm />} />

              {/* Entrenadores Selección (Grilla Plana) */}
              <Route path="entrenadores-seleccion" element={<EntrenadoresList viewMode="seleccion" />} />

              {/* Selecciones (Dashboard Cards) */}
              <Route path="selecciones" element={<EntrenadoresSeleccionList />} />
              <Route path="selecciones/categoria/:categoryId" element={<SeleccionCategoriaDetalle />} />
              <Route path="entrenadores-seleccion/nuevo" element={<EntrenadoresSeleccionForm />} />
              <Route path="entrenadores-seleccion/editar/:id" element={<EntrenadoresSeleccionForm />} />

              { }
              <Route path="pagos" element={<div>Página de Pagos (En construcción)</div>} />
              <Route path="agentes-libres" element={<AgentesLibresList />} />
              <Route path="federacion" element={<FederacionDetalles />} />
              <Route path="usuarios" element={<UserManagement />} />
            </Route>

            { }
            <Route path="/club" element={
              <PrivateRoute allowedRoles={['CLUB']}>
                <MainLayoutClub />
              </PrivateRoute>
            }>
              <Route index element={<ClubDashboard />} />
              <Route path="info" element={<ClubInfo />} />
              <Route path="atletas" element={<ClubAtletas />} />
              <Route path="atletas/nuevo" element={<ClubAtletasForm />} />
              <Route path="atletas/editar/:id" element={<ClubAtletasForm />} />
              <Route path="tutores" element={<ClubTutores />} />
              <Route path="tutores/nuevo" element={<ClubTutoresForm />} />
              <Route path="tutores/editar/:id" element={<ClubTutoresForm />} />
              { /*
              <Route path="eventos" element={<ClubEventos />} />
              <Route path="eventos/nuevo" element={<ClubEventosForm />} />
              <Route path="eventos/editar/:id" element={<ClubEventosForm />} />
              <Route path="eventos/:id" element={<ClubEventoDetalle />} />
              <Route path="eventos-disponibles" element={<EventosDisponibles />} />
*/ }
              <Route path="entrenadores" element={<ClubEntrenadores />} />
              <Route path="entrenadores/nuevo" element={<ClubEntrenadoresForm />} />
              <Route path="entrenadores/editar/:id" element={<ClubEntrenadoresForm />} />
              <Route path="delegados" element={<ClubDelegados />} />
              <Route path="delegados/nuevo" element={<ClubDelegadosForm />} />
              <Route path="delegados/editar/:id" element={<ClubDelegadosForm />} />
              { /*
              <Route path="inscripciones/nuevo" element={<InscripcionesForm />} />
*/ }
            </Route>

            { }
            <Route path="*" element={<RootRedirect />} />
          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
