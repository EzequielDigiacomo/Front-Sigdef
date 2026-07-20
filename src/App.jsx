import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useParams } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import MainLayout from './components/layout/MainLayout';
import MainLayoutClub from './components/layout/MainLayoutClub';
import MainLayoutSuper from './components/layout/MainLayoutSuper';
import Login from './pages/Login';
import Home from './pages/Home';

// Importaciones del Portal de Superadmin
import SuperDashboard from './pages/SuperAdmin/SuperDashboard';
import FederacionesManagement from './pages/SuperAdmin/FederacionesManagement';
import FederacionesForm from './pages/SuperAdmin/FederacionesForm';
import FederacionView from './pages/SuperAdmin/FederacionView';
import Suscripciones from './pages/SuperAdmin/Suscripciones';
import Auditoria from './pages/SuperAdmin/Auditoria';
import SuperAdminPlanes from './pages/SuperAdmin/SuperAdminPlanes';
import SuperAdminModulePicker from './pages/SuperAdmin/SuperAdminModulePicker';
import PlanGuard from './components/common/PlanGuard';

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
import SeleccionCategoriaDetalle from './pages/FederacionAdmin/EntrenadorSeleccion/SeleccionCategoriaDetalle';
import EntrenadoresList from './pages/FederacionAdmin/Entrenadores/EntrenadoresList';
import EntrenadoresForm from './pages/FederacionAdmin/Entrenadores/EntrenadoresForm';
import UserManagement from './pages/FederacionAdmin/Usuarios/UserManagement';
import FederacionDetalles from './pages/FederacionAdmin/Federacion/FederacionDetalles';
import PagosClubes from './pages/FederacionAdmin/Pagos/PagosClubes';
import MensajesPage from './pages/Shared/MensajesPage';
import RegistroInscripciones from './pages/Shared/RegistroInscripciones';

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
import { warmupApi } from './services/api';

const RedirectEntrenadorEdit = () => {
  const { id, fedId } = useParams();
  const target = fedId
    ? `/superadmin/federacion/${fedId}/entrenadores/editar/${id}`
    : `/dashboard/entrenadores/editar/${id}`;
  return <Navigate to={target} replace />;
};

const RedirectEntrenadoresList = () => {
  const { fedId } = useParams();
  const target = fedId
    ? `/superadmin/federacion/${fedId}/entrenadores`
    : '/dashboard/entrenadores';
  return <Navigate to={target} replace />;
};

const RedirectEntrenadoresNuevo = () => {
  const { fedId } = useParams();
  const target = fedId
    ? `/superadmin/federacion/${fedId}/entrenadores/nuevo`
    : '/dashboard/entrenadores/nuevo';
  return <Navigate to={target} replace />;
};

const PrivateRoute = ({ children, allowedRoles }) => {
  const { isAuthenticated, loading, user } = useAuth();

  React.useEffect(() => {
    if (isAuthenticated) warmupApi(user);
  }, [isAuthenticated, user?.idFederacion, user?.federacionId]);

  if (loading) return <div>Cargando...</div>;

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  if (allowedRoles && !allowedRoles.includes(user.role)) {

    const redirectPath = user.role === 'CLUB' ? '/club' : (user.role === 'SUPERADMIN' ? '/superadmin' : '/dashboard');
    return <Navigate to={redirectPath} replace />;
  }

  // Guard de plan: si el usuario tiene un plan asignado y no es SuperAdmin,
  // verificar que su plan incluya acceso a SIGDEF.
  if (user.role !== 'SUPERADMIN') {
    return (
      <PlanGuard requiereSigdef user={user}>
        {children}
      </PlanGuard>
    );
  }

  return children;
};

const LoginRoute = () => {
  const { isAuthenticated, loading, user } = useAuth();

  if (loading) return <div>Cargando...</div>;

  if (isAuthenticated) {

    const redirectPath = user.role === 'CLUB' ? '/club' : (user.role === 'SUPERADMIN' ? '/superadmin' : '/dashboard');
    console.log('Usuario ya autenticado, redirigiendo a:', redirectPath);
    return <Navigate to={redirectPath} replace />;
  }

  return <Login />;
};

const RootRedirect = () => {
  const { isAuthenticated, loading, user } = useAuth();

  if (loading) return <div>Cargando...</div>;

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  if (user.role === 'CLUB') {
    return <Navigate to="/club" replace />;
  }

  if (user.role === 'SUPERADMIN') {
    return <Navigate to="/superadmin" replace />;
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
            <Route path="/" element={<Home />} />

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
              <Route path="tutores/nuevo" element={<TutoresForm />} />
              <Route path="tutores/new" element={<Navigate to="/dashboard/tutores/nuevo" replace />} />
              <Route path="tutores/:id/edit" element={<TutoresForm />} />

              { }
              { /*
              <Route path="inscripciones" element={<InscripcionesList />} />
              <Route path="inscripciones/new" element={<InscripcionesForm />} />
*/ }

              {/* ENTRENADORES (club + selección unificados) */}
              <Route path="entrenadores" element={<EntrenadoresList />} />
              <Route path="entrenadores/nuevo" element={<EntrenadoresForm />} />
              <Route path="entrenadores/editar/:id" element={<EntrenadoresForm />} />
              <Route path="entrenadores-seleccion" element={<RedirectEntrenadoresList />} />
              <Route path="entrenadores-seleccion/nuevo" element={<RedirectEntrenadoresNuevo />} />
              <Route path="entrenadores-seleccion/editar/:id" element={<RedirectEntrenadorEdit />} />

              {/* Selecciones (Dashboard Cards) */}
              <Route path="selecciones" element={<EntrenadoresSeleccionList />} />
              <Route path="selecciones/categoria/:categoryId" element={<SeleccionCategoriaDetalle />} />

              <Route path="pagos" element={<PagosClubes />} />
              <Route path="registro-inscripciones" element={<RegistroInscripciones modo="admin" />} />
              <Route path="federacion" element={<FederacionDetalles />} />
              <Route path="usuarios" element={<UserManagement />} />
              <Route path="mensajes" element={<MensajesPage modo="admin" />} />
            </Route>

            { }
            <Route path="/club" element={
              <PrivateRoute allowedRoles={['CLUB']}>
                <MainLayoutClub />
              </PrivateRoute>
            }>
              <Route index element={<ClubInfo />} />
              <Route path="info" element={<Navigate to="/club" replace />} />
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
              <Route path="registro-inscripciones" element={<RegistroInscripciones modo="club" />} />
              <Route path="mensajes" element={<MensajesPage modo="club" />} />
              { /*
              <Route path="inscripciones/nuevo" element={<InscripcionesForm />} />
*/ }
            </Route>

            {/* RUTA DE SUPERADMIN GLOBAL */}
            <Route path="/superadmin" element={
              <PrivateRoute allowedRoles={['SUPERADMIN']}>
                <MainLayoutSuper />
              </PrivateRoute>
            }>
              <Route index element={<SuperDashboard />} />
              <Route path="federaciones" element={<FederacionesManagement />} />
              <Route path="federaciones/nueva" element={<FederacionesForm />} />
              <Route path="federaciones/editar/:id" element={<FederacionesForm />} />
              <Route path="suscripciones" element={<Suscripciones />} />
              <Route path="auditoria" element={<Auditoria />} />
              <Route path="planes" element={<SuperAdminPlanes />} />
              <Route path="modulos/:moduleKey" element={<SuperAdminModulePicker />} />
              <Route path="mensajes" element={<MensajesPage modo="super" />} />

              {/* Vista SuperAdmin dentro de una federación específica */}
              <Route path="federacion/:fedId" element={<FederacionView />} />
              <Route path="federacion/:fedId/atletas" element={<AtletasList />} />
              <Route path="federacion/:fedId/atletas/nuevo" element={<AtletasForm />} />
              <Route path="federacion/:fedId/atletas/editar/:id" element={<AtletasForm />} />
              <Route path="federacion/:fedId/clubes" element={<ClubesList />} />
              <Route path="federacion/:fedId/clubes/nuevo" element={<ClubesForm />} />
              <Route path="federacion/:fedId/clubes/editar/:id" element={<ClubesForm />} />
              <Route path="federacion/:fedId/clubes/detalles/:id" element={<ClubDetalles />} />
              <Route path="federacion/:fedId/entrenadores" element={<EntrenadoresList />} />
              <Route path="federacion/:fedId/entrenadores/nuevo" element={<EntrenadoresForm />} />
              <Route path="federacion/:fedId/entrenadores/editar/:id" element={<EntrenadoresForm />} />
              <Route path="federacion/:fedId/entrenadores-seleccion" element={<RedirectEntrenadoresList />} />
              <Route path="federacion/:fedId/entrenadores-seleccion/nuevo" element={<RedirectEntrenadoresNuevo />} />
              <Route path="federacion/:fedId/entrenadores-seleccion/editar/:id" element={<RedirectEntrenadorEdit />} />
              <Route path="federacion/:fedId/selecciones" element={<EntrenadoresSeleccionList />} />
              <Route path="federacion/:fedId/selecciones/categoria/:categoryId" element={<SeleccionCategoriaDetalle />} />
              <Route path="federacion/:fedId/delegados" element={<DelegadosList />} />
              <Route path="federacion/:fedId/delegados/nuevo" element={<DelegadosForm />} />
              <Route path="federacion/:fedId/delegados/editar/:id" element={<DelegadosForm />} />
              <Route path="federacion/:fedId/tutores" element={<TutoresList />} />
              <Route path="federacion/:fedId/tutores/nuevo" element={<TutoresForm />} />
              <Route path="federacion/:fedId/tutores/:id/edit" element={<TutoresForm />} />
              <Route path="federacion/:fedId/pagos" element={<PagosClubes />} />
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
