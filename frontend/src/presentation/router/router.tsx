import { createBrowserRouter } from 'react-router';
import { RootLayout } from '@/presentation/layout/RootLayout';
import { GestionPersonalPage } from '@/presentation/pages/admin/GestionPersonalPage';
import { AyudaPage } from '@/presentation/pages/AyudaPage';
import { CodigosQrPage } from '@/presentation/pages/CodigosQrPage';
import { CrearCuentaPage } from '@/presentation/pages/CrearCuentaPage';
import { GuiaDetallePage } from '@/presentation/pages/GuiaDetallePage';
import { GuiaPracticaPage } from '@/presentation/pages/GuiaPracticaPage';
import { GuiaResultadosPage } from '@/presentation/pages/GuiaResultadosPage';
import { GuiasPage } from '@/presentation/pages/GuiasPage';
import { HomePage } from '@/presentation/pages/HomePage';
import { IniciarSesionPage } from '@/presentation/pages/IniciarSesionPage';
import { MiCuentaPage } from '@/presentation/pages/MiCuentaPage';
import { NotFoundPage } from '@/presentation/pages/NotFoundPage';
import { AccesoPersonalPage } from '@/presentation/pages/personal/AccesoPersonalPage';
import { ColaAyudaPage } from '@/presentation/pages/personal/ColaAyudaPage';
import { EditorGuiaPage } from '@/presentation/pages/personal/EditorGuiaPage';
import { GuiasGestionPage } from '@/presentation/pages/personal/GuiasGestionPage';
import { PrimerAccesoPage } from '@/presentation/pages/personal/PrimerAccesoPage';
import { ProgresoPage } from '@/presentation/pages/ProgresoPage';
import { VerificarAccesoPage } from '@/presentation/pages/VerificarAccesoPage';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    children: [
      {
        index: true,
        element: <HomePage />,
      },
      {
        path: 'guias',
        element: <GuiasPage />,
      },
      {
        path: 'guias/:slug',
        element: <GuiaDetallePage />,
      },
      {
        path: 'guias/:slug/practica',
        element: <GuiaPracticaPage />,
      },
      {
        path: 'guias/:slug/resultados',
        element: <GuiaResultadosPage />,
      },
      {
        path: 'mi-progreso',
        element: <ProgresoPage />,
      },
      {
        path: 'ayuda',
        element: <AyudaPage />,
      },
      {
        path: 'mi-cuenta',
        element: <MiCuentaPage />,
      },
      {
        // FE-11: página para imprimir los QR (no está en el menú; datos públicos).
        path: 'codigos-qr',
        element: <CodigosQrPage />,
      },
      {
        path: 'iniciar-sesion',
        element: <IniciarSesionPage />,
      },
      {
        path: 'registro',
        element: <CrearCuentaPage />,
      },
      {
        path: 'registro/verificar',
        element: <VerificarAccesoPage />,
      },
      {
        path: 'personal/acceso',
        element: <AccesoPersonalPage />,
      },
      {
        path: 'personal/primer-acceso',
        element: <PrimerAccesoPage />,
      },
      {
        // FE-06: cola de ayuda del monitor (HU-30).
        path: 'personal/cola',
        element: <ColaAyudaPage />,
      },
      {
        // FE-05: gestión de guías del personal (HU-13, HU-15).
        path: 'personal/guias',
        element: <GuiasGestionPage />,
      },
      {
        path: 'personal/guias/nueva',
        element: <EditorGuiaPage />,
      },
      {
        path: 'personal/guias/:slug',
        element: <EditorGuiaPage />,
      },
      {
        path: 'admin/personal',
        element: <GestionPersonalPage />,
      },
      {
        path: '*',
        element: <NotFoundPage />,
      },
    ],
  },
]);
