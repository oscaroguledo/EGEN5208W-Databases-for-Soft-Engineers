import { useState, useEffect, Suspense, lazy } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Layout } from '@/components/Layout';
import { PageTransition } from '@/components/PageTransition';
import {
  User, Member, Trainer, Room, FitnessGoal, HealthMetric,
  TrainerAvailability, GroupClass, TrainingSession, Equipment,
} from '@/data/types';
import { toast } from 'sonner';

const MAINTENANCE_MODE = false;

const LoginPage       = lazy(() => import('./pages/LoginPage').then(m => ({ default: m.LoginPage })));
const RegistrationPage = lazy(() => import('./pages/member/RegistrationPage').then(m => ({ default: m.RegistrationPage })));
const DashboardPage   = lazy(() => import('./pages/member/DashboardPage').then(m => ({ default: m.DashboardPage })));
const ProfilePage     = lazy(() => import('./pages/member/ProfilePage').then(m => ({ default: m.ProfilePage })));
const HealthHistoryPage = lazy(() => import('./pages/member/HealthHistoryPage').then(m => ({ default: m.HealthHistoryPage })));
const ClassesPage     = lazy(() => import('./pages/member/ClassesPage').then(m => ({ default: m.ClassesPage })));
const AvailabilityPage = lazy(() => import('./pages/trainer/AvailabilityPage').then(m => ({ default: m.AvailabilityPage })));
const SchedulePage    = lazy(() => import('./pages/trainer/SchedulePage').then(m => ({ default: m.SchedulePage })));
const RoomBookingPage = lazy(() => import('./pages/admin/RoomBookingPage').then(m => ({ default: m.RoomBookingPage })));
const EquipmentPage   = lazy(() => import('./pages/admin/EquipmentPage').then(m => ({ default: m.EquipmentPage })));
const NotFoundPage    = lazy(() => import('./pages/NotFoundPage').then(m => ({ default: m.NotFoundPage })));
const MaintenancePage = lazy(() => import('./pages/MaintenancePage').then(m => ({ default: m.MaintenancePage })));

export type Page =
  | 'login' | 'register'
  | 'member-dashboard' | 'member-profile' | 'member-health' | 'member-classes'
  | 'trainer-availability' | 'trainer-schedule'
  | 'admin-rooms' | 'admin-equipment'
  | 'not-found' | 'maintenance';

const PAGE_ROLES: Record<Page, string[]> = {
  login: [], register: [],
  'member-dashboard': ['member'], 'member-profile': ['member'],
  'member-health': ['member'], 'member-classes': ['member'],
  'trainer-availability': ['trainer'], 'trainer-schedule': ['trainer'],
  'admin-rooms': ['admin'], 'admin-equipment': ['admin'],
  'not-found': [], maintenance: [],
};

const HOME_PAGE: Record<string, Page> = {
  member: 'member-dashboard', trainer: 'trainer-schedule', admin: 'admin-rooms',
};

const ROLE_LABELS: Record<string, string> = {
  member: 'Member', trainer: 'Trainer', admin: 'Admin',
};

function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <motion.div className="flex flex-col items-center gap-3"
        initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.3 }}>
        <div className="relative w-10 h-10">
          <motion.div className="absolute inset-0 rounded-full border-2 border-teal-500/30"
            animate={{ rotate: 360 }} transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }} />
          <motion.div className="absolute inset-0 rounded-full border-2 border-transparent border-t-teal-500"
            animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }} />
        </div>
        <span className="text-sm text-slate-500 dark:text-slate-400">Loading…</span>
      </motion.div>
    </div>
  );
}

export function App() {
  const [currentUser, setCurrentUser]   = useState<User | null>(null);
  const [currentPage, setCurrentPage]   = useState<Page>('login');
  const [previousPage, setPreviousPage] = useState<Page | null>(null);

  // Server-driven state — populated from API on mount
  const [members,             setMembers]             = useState<Member[]>([]);
  const [trainers,            setTrainers]            = useState<Trainer[]>([]);
  const [rooms,               setRooms]               = useState<Room[]>([]);
  const [fitnessGoals,        setFitnessGoals]        = useState<FitnessGoal[]>([]);
  const [healthMetrics,       setHealthMetrics]       = useState<HealthMetric[]>([]);
  const [trainerAvailability, setTrainerAvailability] = useState<TrainerAvailability[]>([]);
  const [groupClasses,        setGroupClasses]        = useState<GroupClass[]>([]);
  const [trainingSessions,    setTrainingSessions]    = useState<TrainingSession[]>([]);
  const [equipment,           setEquipment]           = useState<Equipment[]>([]);

  // ── Restore session on page load ──────────────────────────────────────────
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { me } = await import('@/apis/auth');
        const user = await me();
        if (user && mounted) {
          setCurrentUser(user as User);
          setCurrentPage(HOME_PAGE[user.role] || 'login');
        }
      } catch {
        // no valid token — stay on login
      }
    })();
    return () => { mounted = false; };
  }, []);

  // ── Hydrate lists after login ─────────────────────────────────────────────
  useEffect(() => {
    if (!currentUser) return;
    let mounted = true;
    (async () => {
      try {
        const adminApi = await import('@/apis/admin');

        if (currentUser.role === 'admin') {
          const results = await Promise.allSettled([
            import('@/apis/members').then(m => m.listMembers()),
            import('@/apis/trainers').then(m => m.listTrainers()),
            adminApi.listEquipment(),
            adminApi.listRooms(),
          ]);
          if (!mounted) return;
          if (results[0].status === 'fulfilled' && Array.isArray((results[0] as any).value))
            setMembers((results[0] as any).value);
          if (results[1].status === 'fulfilled' && Array.isArray((results[1] as any).value))
            setTrainers((results[1] as any).value);
          if (results[2].status === 'fulfilled') {
            const val = (results[2] as any).value;
            setEquipment(Array.isArray(val) ? val : (val?.data ?? []));
          }
          if (results[3].status === 'fulfilled' && Array.isArray((results[3] as any).value))
            setRooms((results[3] as any).value);
        } else {
          // members and trainers only need rooms (for booking UI)
          const result = await Promise.allSettled([adminApi.listRooms()]);
          if (!mounted) return;
          if (result[0].status === 'fulfilled' && Array.isArray((result[0] as any).value))
            setRooms((result[0] as any).value);
        }
      } catch { /* best-effort */ }
    })();
    return () => { mounted = false; };
  }, [currentUser]);

  // ── Navigation ────────────────────────────────────────────────────────────
  const handleNavigate = (page: Page) => {
    if (!currentUser) { toast.error('Please sign in.'); setCurrentPage('login'); return; }
    const allowed = PAGE_ROLES[page];
    if (allowed.length === 0) { setPreviousPage(currentPage); setCurrentPage(page); return; }
    if (!allowed.includes(currentUser.role)) {
      toast.error(`Access denied. This page is for ${ROLE_LABELS[allowed[0]] ?? allowed[0]}s only.`);
      setCurrentPage(HOME_PAGE[currentUser.role] || 'login');
      return;
    }
    setPreviousPage(currentPage);
    setCurrentPage(page);
  };

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    setCurrentPage(HOME_PAGE[user.role] || 'login');
  };

  const handleLogout = () => {
    import('@/apis/auth').then(({ logout }) => logout().catch(() => {}));
    setCurrentUser(null);
    setCurrentPage('login');
    setPreviousPage(null);
    // clear hydrated state
    setMembers([]); setTrainers([]); setEquipment([]);
    setFitnessGoals([]); setHealthMetrics([]);
    setTrainerAvailability([]); setGroupClasses([]); setTrainingSessions([]);
  };

  const handleRegister = (_user: User, newMember: Member) => {
    setMembers(ms => [...ms, newMember]);
  };

  const handleUpdateMember = (updated: Member) =>
    setMembers(ms => ms.map(m => m.id === updated.id ? updated : m));

  const handleAddGoal    = (g: FitnessGoal)        => setFitnessGoals(gs => [...gs, g]);
  const handleAddMetric  = (m: HealthMetric)        => setHealthMetrics(ms => [...ms, m]);

  const handleAddAvailability    = (s: TrainerAvailability) => setTrainerAvailability(a => [...a, s]);
  const handleUpdateAvailability = (s: TrainerAvailability) =>
    setTrainerAvailability(a => a.map(x => x.id === s.id ? s : x));
  const handleDeleteAvailability = (id: string) =>
    setTrainerAvailability(a => a.filter(x => x.id !== id));

  const handleUpdateSession = (s: TrainingSession) =>
    setTrainingSessions(ss => ss.map(x => x.id === s.id ? s : x));
  const handleAddSession    = (s: TrainingSession) =>
    setTrainingSessions(ss => [...ss, s]);

  const handleBookSession = async (payload: {
    trainer_id: string; room_id: string;
    session_date: string; start_time: string; end_time: string;
  }) => {
    const { bookSession } = await import('@/apis/members');
    const res = await bookSession(payload);
    if (res) { setTrainingSessions(ss => [...ss, res as TrainingSession]); return res; }
    throw new Error('Failed to book session');
  };

  const handleUpdateClass = (c: GroupClass) =>
    setGroupClasses(cs => cs.map(x => x.id === c.id ? c : x));

  // ── Maintenance ───────────────────────────────────────────────────────────
  if (MAINTENANCE_MODE) {
    return <Suspense fallback={<PageLoader />}><MaintenancePage /></Suspense>;
  }

  // ── Unauthenticated ───────────────────────────────────────────────────────
  if (!currentUser) {
    return (
      <Suspense fallback={<PageLoader />}>
        <AnimatePresence mode="wait" initial={false}>
          {currentPage === 'register' ? (
            <motion.div key="register"
              initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.25, ease: 'easeInOut' }}>
              <RegistrationPage onRegister={handleRegister} onGoBack={() => setCurrentPage('login')} />
            </motion.div>
          ) : (
            <motion.div key="login"
              initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 30 }} transition={{ duration: 0.25, ease: 'easeInOut' }}>
              <LoginPage onLogin={handleLogin} onGoRegister={() => setCurrentPage('register')} />
            </motion.div>
          )}
        </AnimatePresence>
      </Suspense>
    );
  }

  // ── Authenticated ─────────────────────────────────────────────────────────
  const renderPage = () => {
    const allowed = PAGE_ROLES[currentPage];
    if (allowed.length > 0 && !allowed.includes(currentUser.role)) {
      return (
        <NotFoundPage
          onGoHome={() => setCurrentPage(HOME_PAGE[currentUser.role] || 'login')}
          onGoBack={previousPage ? () => setCurrentPage(previousPage) : undefined} />
      );
    }
    switch (currentPage) {
      case 'member-dashboard':
        return (
          <DashboardPage
            currentUser={currentUser}
            members={members}
            healthMetrics={healthMetrics}
            trainingSessions={trainingSessions}
            trainers={trainers}
            rooms={rooms}
            onAddSession={handleAddSession}
            onBookSession={handleBookSession} />
        );
      case 'member-profile':
        return (
          <ProfilePage
            currentUser={currentUser}
            members={members}
            onUpdateMember={handleUpdateMember}
            onAddGoal={handleAddGoal}
            onAddMetric={handleAddMetric} />
        );
      case 'member-health':
        return <HealthHistoryPage currentUser={currentUser} />;
      case 'member-classes':
        return <ClassesPage />;
      case 'trainer-schedule':
        return (
          <SchedulePage
            currentUser={currentUser}
            trainers={trainers}
            trainingSessions={trainingSessions}
            groupClasses={groupClasses}
            members={members}
            rooms={rooms} />
        );
      case 'trainer-availability':
        return (
          <AvailabilityPage
            currentUser={currentUser}
            trainers={trainers}
            availability={trainerAvailability}
            onAddAvailability={handleAddAvailability}
            onUpdateAvailability={handleUpdateAvailability}
            onDeleteAvailability={handleDeleteAvailability} />
        );
      case 'admin-rooms':
        return (
          <RoomBookingPage
            rooms={rooms}
            trainingSessions={trainingSessions}
            groupClasses={groupClasses}
            trainers={trainers}
            members={members}
            onUpdateSession={handleUpdateSession}
            onUpdateClass={handleUpdateClass}
            onBookSession={handleBookSession} />
        );
      case 'admin-equipment':
        return <EquipmentPage rooms={rooms} />;
      case 'not-found':
      default:
        return (
          <NotFoundPage
            onGoHome={() => setCurrentPage(HOME_PAGE[currentUser.role] || 'login')}
            onGoBack={previousPage ? () => setCurrentPage(previousPage) : undefined} />
        );
    }
  };

  return (
    <Layout currentUser={currentUser} currentPage={currentPage}
      onNavigate={handleNavigate} onLogout={handleLogout}>
      <Suspense fallback={<PageLoader />}>
        <PageTransition pageKey={currentPage}>{renderPage()}</PageTransition>
      </Suspense>
    </Layout>
  );
}
