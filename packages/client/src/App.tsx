import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { trpc, trpcClient, queryClient, TrpcProvider } from '@/trpc';
import { AuthContext, useAuthProvider } from '@/hooks/use-auth';
import { ToastContext, useToastProvider } from '@/hooks/use-toast';
import { ToastContainer } from '@/components/ui/Toast';

// Layouts
import { PublicLayout } from '@/components/layout/PublicLayout';
import { AuthLayout } from '@/components/layout/AuthLayout';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { RouteGuard } from '@/components/layout/RouteGuard';

// Auth pages
import { LoginPage } from '@/pages/auth/LoginPage';
import { RegisterPage } from '@/pages/auth/RegisterPage';
import { ForgotPasswordPage } from '@/pages/auth/ForgotPasswordPage';

// Public pages
import { StudioLandingPage } from '@/pages/public/StudioLandingPage';
import { ClassSchedulePage } from '@/pages/public/ClassSchedulePage';
import { ClassDetailPage } from '@/pages/public/ClassDetailPage';

// Customer pages
import { MyBookingsPage } from '@/pages/bookings/MyBookingsPage';
import { BookingDetailPage } from '@/pages/bookings/BookingDetailPage';
import { CreditsPage } from '@/pages/credits/CreditsPage';
import { BuyCreditsPage } from '@/pages/credits/BuyCreditsPage';
import { SubscribePage } from '@/pages/credits/SubscribePage';

// Profile pages
import { ProfilePage } from '@/pages/profile/ProfilePage';
import { DataExportPage } from '@/pages/profile/DataExportPage';
import { DeleteAccountPage } from '@/pages/profile/DeleteAccountPage';

// Teacher pages
import { TeacherSchedulePage } from '@/pages/teacher/TeacherSchedulePage';
import { ClassSessionPage } from '@/pages/teacher/ClassSessionPage';

// Admin pages
import { AdminDashboardPage } from '@/pages/admin/AdminDashboardPage';
import { ClassManagementPage } from '@/pages/admin/ClassManagementPage';
import { ScheduleManagementPage } from '@/pages/admin/ScheduleManagementPage';
import { ScheduleEntryEditorPage } from '@/pages/admin/ScheduleEntryEditorPage';
import { TeacherManagementPage } from '@/pages/admin/TeacherManagementPage';
import { CustomerListPage } from '@/pages/admin/CustomerListPage';
import { CustomerDetailPage } from '@/pages/admin/CustomerDetailPage';
import { CreditPackConfigPage } from '@/pages/admin/CreditPackConfigPage';
import { SubscriptionTierConfigPage } from '@/pages/admin/SubscriptionTierConfigPage';
import { RevenueReportsPage } from '@/pages/admin/RevenueReportsPage';
import { WaitlistManagementPage } from '@/pages/admin/WaitlistManagementPage';
import { StudioSettingsPage } from '@/pages/admin/StudioSettingsPage';

// Super admin pages
import { TenantListPage } from '@/pages/super/TenantListPage';
import { CreateTenantPage } from '@/pages/super/CreateTenantPage';
import { TenantDetailPage } from '@/pages/super/TenantDetailPage';
import { GlobalSettingsPage } from '@/pages/super/GlobalSettingsPage';

function AppRoutes() {
  return (
    <Routes>
      {/* Root redirect */}
      <Route path="/" element={<Navigate to="/zen-flow" replace />} />

      {/* Auth pages (public layout) */}
      <Route element={<PublicLayout />}>
        <Route path="/auth/login" element={<LoginPage />} />
        <Route path="/auth/register" element={<RegisterPage />} />
        <Route path="/auth/forgot-password" element={<ForgotPasswordPage />} />
      </Route>

      {/* Public studio pages */}
      <Route element={<PublicLayout />}>
        <Route path="/:tenantSlug" element={<StudioLandingPage />} />
        <Route path="/:tenantSlug/schedule" element={<ClassSchedulePage />} />
        <Route path="/:tenantSlug/class/:classId" element={<ClassDetailPage />} />
      </Route>

      {/* Customer pages (require auth) */}
      <Route element={<AuthLayout />}>
        <Route
          path="/bookings"
          element={
            <RouteGuard requireAuth allowedRoles={['customer', 'tenant_admin', 'super_admin']}>
              <MyBookingsPage />
            </RouteGuard>
          }
        />
        <Route
          path="/bookings/:bookingId"
          element={
            <RouteGuard requireAuth allowedRoles={['customer', 'tenant_admin', 'super_admin']}>
              <BookingDetailPage />
            </RouteGuard>
          }
        />
        <Route
          path="/credits"
          element={
            <RouteGuard requireAuth allowedRoles={['customer', 'tenant_admin', 'super_admin']}>
              <CreditsPage />
            </RouteGuard>
          }
        />
        <Route
          path="/credits/buy"
          element={
            <RouteGuard requireAuth allowedRoles={['customer', 'tenant_admin', 'super_admin']}>
              <BuyCreditsPage />
            </RouteGuard>
          }
        />
        <Route
          path="/credits/subscribe"
          element={
            <RouteGuard requireAuth allowedRoles={['customer', 'tenant_admin', 'super_admin']}>
              <SubscribePage />
            </RouteGuard>
          }
        />
      </Route>

      {/* Profile pages (require auth, any role) */}
      <Route element={<AuthLayout />}>
        <Route
          path="/profile"
          element={<RouteGuard requireAuth><ProfilePage /></RouteGuard>}
        />
        <Route
          path="/profile/export"
          element={<RouteGuard requireAuth><DataExportPage /></RouteGuard>}
        />
        <Route
          path="/profile/delete"
          element={<RouteGuard requireAuth><DeleteAccountPage /></RouteGuard>}
        />
      </Route>

      {/* Teacher pages */}
      <Route element={<AuthLayout />}>
        <Route
          path="/teacher/schedule"
          element={
            <RouteGuard requireAuth allowedRoles={['teacher', 'tenant_admin', 'super_admin']}>
              <TeacherSchedulePage />
            </RouteGuard>
          }
        />
        <Route
          path="/teacher/class/:sessionId"
          element={
            <RouteGuard requireAuth allowedRoles={['teacher', 'tenant_admin', 'super_admin']}>
              <ClassSessionPage />
            </RouteGuard>
          }
        />
      </Route>

      {/* Admin pages */}
      <Route element={<AuthLayout />}>
        <Route
          path="/admin"
          element={
            <RouteGuard requireAuth allowedRoles={['tenant_admin', 'super_admin']}>
              <AdminDashboardPage />
            </RouteGuard>
          }
        />
        <Route
          path="/admin/classes"
          element={
            <RouteGuard requireAuth allowedRoles={['tenant_admin', 'super_admin']}>
              <ClassManagementPage />
            </RouteGuard>
          }
        />
        <Route
          path="/admin/schedule"
          element={
            <RouteGuard requireAuth allowedRoles={['tenant_admin', 'super_admin']}>
              <ScheduleManagementPage />
            </RouteGuard>
          }
        />
        <Route
          path="/admin/schedule/:entryId"
          element={
            <RouteGuard requireAuth allowedRoles={['tenant_admin', 'super_admin']}>
              <ScheduleEntryEditorPage />
            </RouteGuard>
          }
        />
        <Route
          path="/admin/teachers"
          element={
            <RouteGuard requireAuth allowedRoles={['tenant_admin', 'super_admin']}>
              <TeacherManagementPage />
            </RouteGuard>
          }
        />
        <Route
          path="/admin/customers"
          element={
            <RouteGuard requireAuth allowedRoles={['tenant_admin', 'super_admin']}>
              <CustomerListPage />
            </RouteGuard>
          }
        />
        <Route
          path="/admin/customers/:customerId"
          element={
            <RouteGuard requireAuth allowedRoles={['tenant_admin', 'super_admin']}>
              <CustomerDetailPage />
            </RouteGuard>
          }
        />
        <Route element={<AdminLayout />}>
          <Route
            path="/admin/pricing/packs"
            element={
              <RouteGuard requireAuth allowedRoles={['tenant_admin', 'super_admin']}>
                <CreditPackConfigPage />
              </RouteGuard>
            }
          />
          <Route
            path="/admin/pricing/subscriptions"
            element={
              <RouteGuard requireAuth allowedRoles={['tenant_admin', 'super_admin']}>
                <SubscriptionTierConfigPage />
              </RouteGuard>
            }
          />
        </Route>
        <Route
          path="/admin/reports"
          element={
            <RouteGuard requireAuth allowedRoles={['tenant_admin', 'super_admin']}>
              <RevenueReportsPage />
            </RouteGuard>
          }
        />
        <Route
          path="/admin/waitlists"
          element={
            <RouteGuard requireAuth allowedRoles={['tenant_admin', 'super_admin']}>
              <WaitlistManagementPage />
            </RouteGuard>
          }
        />
        <Route
          path="/admin/settings"
          element={
            <RouteGuard requireAuth allowedRoles={['tenant_admin', 'super_admin']}>
              <StudioSettingsPage />
            </RouteGuard>
          }
        />
      </Route>

      {/* Super admin pages */}
      <Route element={<AuthLayout />}>
        <Route
          path="/super/tenants"
          element={
            <RouteGuard requireAuth allowedRoles={['super_admin']}>
              <TenantListPage />
            </RouteGuard>
          }
        />
        <Route
          path="/super/tenants/new"
          element={
            <RouteGuard requireAuth allowedRoles={['super_admin']}>
              <CreateTenantPage />
            </RouteGuard>
          }
        />
        <Route
          path="/super/tenants/:tenantId"
          element={
            <RouteGuard requireAuth allowedRoles={['super_admin']}>
              <TenantDetailPage />
            </RouteGuard>
          }
        />
        <Route
          path="/super/settings"
          element={
            <RouteGuard requireAuth allowedRoles={['super_admin']}>
              <GlobalSettingsPage />
            </RouteGuard>
          }
        />
      </Route>
    </Routes>
  );
}

function Providers({ children }: { children: React.ReactNode }) {
  const auth = useAuthProvider();
  const toast = useToastProvider();

  return (
    <TrpcProvider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <AuthContext.Provider value={auth}>
          <ToastContext.Provider value={toast}>
            {children}
            <ToastContainer />
          </ToastContext.Provider>
        </AuthContext.Provider>
      </QueryClientProvider>
    </TrpcProvider>
  );
}

export function App() {
  return (
    <BrowserRouter>
      <Providers>
        <AppRoutes />
      </Providers>
    </BrowserRouter>
  );
}
