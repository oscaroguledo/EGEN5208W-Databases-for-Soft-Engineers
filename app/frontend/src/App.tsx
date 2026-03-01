import React, { useState, Suspense, lazy } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Layout } from './components/Layout';
import { PageTransition } from './components/PageTransition';
import {
  User,
  Member,
  Trainer,
  Room,
  FitnessGoal,
  HealthMetric,
  TrainerAvailability,
  GroupClass,
  ClassRegistration,
  PersonalSession,
  Equipment } from
'./data/types';
import {
  INITIAL_USERS,
  INITIAL_MEMBERS,
  INITIAL_TRAINERS,
  INITIAL_ROOMS,
  INITIAL_FITNESS_GOALS,
  INITIAL_HEALTH_METRICS,
  INITIAL_TRAINER_AVAILABILITY,
  INITIAL_GROUP_CLASSES,
  INITIAL_CLASS_REGISTRATIONS,
  INITIAL_PERSONAL_SESSIONS,
  INITIAL_EQUIPMENT } from
'./data/initialData';
import { toast } from 'sonner';
// ─── Maintenance mode flag ────────────────────────────────────────────────────
// Set to true to show the maintenance page for all users
const MAINTENANCE_MODE = false;
// ─── Lazy-loaded pages ────────────────────────────────────────────────────────
const LoginPage = lazy(() =>
import('./pages/LoginPage').then((m) => ({
  default: m.LoginPage
}))
);
const RegistrationPage = lazy(() =>
import('./pages/member/RegistrationPage').then((m) => ({
  default: m.RegistrationPage
}))
);
const DashboardPage = lazy(() =>
import('./pages/member/DashboardPage').then((m) => ({
  default: m.DashboardPage
}))
);
const ProfilePage = lazy(() =>
import('./pages/member/ProfilePage').then((m) => ({
  default: m.ProfilePage
}))
);
const HealthHistoryPage = lazy(() =>
import('./pages/member/HealthHistoryPage').then((m) => ({
  default: m.HealthHistoryPage
}))
);
const ClassesPage = lazy(() =>
import('./pages/member/ClassesPage').then((m) => ({
  default: m.ClassesPage
}))
);
const AvailabilityPage = lazy(() =>
import('./pages/trainer/AvailabilityPage').then((m) => ({
  default: m.AvailabilityPage
}))
);
const SchedulePage = lazy(() =>
import('./pages/trainer/SchedulePage').then((m) => ({
  default: m.SchedulePage
}))
);
const RoomBookingPage = lazy(() =>
import('./pages/admin/RoomBookingPage').then((m) => ({
  default: m.RoomBookingPage
}))
);
const EquipmentPage = lazy(() =>
import('./pages/admin/EquipmentPage').then((m) => ({
  default: m.EquipmentPage
}))
);
const NotFoundPage = lazy(() =>
import('./pages/NotFoundPage').then((m) => ({
  default: m.NotFoundPage
}))
);
const MaintenancePage = lazy(() =>
import('./pages/MaintenancePage').then((m) => ({
  default: m.MaintenancePage
}))
);
// ─── Types ────────────────────────────────────────────────────────────────────
export type Page =
'login' |
'register' |
'member-dashboard' |
'member-profile' |
'member-health' |
'member-classes' |
'trainer-availability' |
'trainer-schedule' |
'admin-rooms' |
'admin-equipment' |
'not-found' |
'maintenance';
const PAGE_ROLES: Record<Page, string[]> = {
  login: [],
  register: [],
  'member-dashboard': ['member'],
  'member-profile': ['member'],
  'member-health': ['member'],
  'member-classes': ['member'],
  'trainer-availability': ['trainer'],
  'trainer-schedule': ['trainer'],
  'admin-rooms': ['admin'],
  'admin-equipment': ['admin'],
  'not-found': [],
  maintenance: []
};
const HOME_PAGE: Record<string, Page> = {
  member: 'member-dashboard',
  trainer: 'trainer-schedule',
  admin: 'admin-rooms'
};
const ROLE_LABELS: Record<string, string> = {
  member: 'Member',
  trainer: 'Trainer',
  admin: 'Admin'
};
// ─── Loading fallback ─────────────────────────────────────────────────────────
function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <motion.div
        className="flex flex-col items-center gap-3"
        initial={{
          opacity: 0,
          scale: 0.9
        }}
        animate={{
          opacity: 1,
          scale: 1
        }}
        transition={{
          duration: 0.3
        }}>

        <div className="relative w-10 h-10">
          <motion.div
            className="absolute inset-0 rounded-full border-2 border-teal-500/30"
            animate={{
              rotate: 360
            }}
            transition={{
              duration: 1.2,
              repeat: Infinity,
              ease: 'linear'
            }} />

          <motion.div
            className="absolute inset-0 rounded-full border-2 border-transparent border-t-teal-500"
            animate={{
              rotate: 360
            }}
            transition={{
              duration: 0.8,
              repeat: Infinity,
              ease: 'linear'
            }} />

        </div>
        <span className="text-sm text-slate-500 dark:text-slate-400">
          Loading…
        </span>
      </motion.div>
    </div>);

}
// ─── App ──────────────────────────────────────────────────────────────────────
export function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentPage, setCurrentPage] = useState<Page>('login');
  const [previousPage, setPreviousPage] = useState<Page | null>(null);
  const [users, setUsers] = useState<User[]>(INITIAL_USERS);
  const [members, setMembers] = useState<Member[]>(INITIAL_MEMBERS);
  const [trainers] = useState<Trainer[]>(INITIAL_TRAINERS);
  const [rooms, setRooms] = useState<Room[]>(INITIAL_ROOMS);
  const [fitnessGoals, setFitnessGoals] = useState<FitnessGoal[]>(
    INITIAL_FITNESS_GOALS
  );
  const [healthMetrics, setHealthMetrics] = useState<HealthMetric[]>(
    INITIAL_HEALTH_METRICS
  );
  const [trainerAvailability, setTrainerAvailability] = useState<
    TrainerAvailability[]>(
    INITIAL_TRAINER_AVAILABILITY);
  const [groupClasses, setGroupClasses] = useState<GroupClass[]>(
    INITIAL_GROUP_CLASSES
  );
  const [classRegistrations, setClassRegistrations] = useState<
    ClassRegistration[]>(
    INITIAL_CLASS_REGISTRATIONS);
  const [personalSessions, setPersonalSessions] = useState<PersonalSession[]>(
    INITIAL_PERSONAL_SESSIONS
  );
  const [equipment, setEquipment] = useState<Equipment[]>(INITIAL_EQUIPMENT);
  // ─── Navigation with auth guards ───────────────────────────────────────────
  const handleNavigate = (page: Page) => {
    if (!currentUser) {
      toast.error('Please sign in to access that page.');
      setCurrentPage('login');
      return;
    }
    const allowedRoles = PAGE_ROLES[page];
    // Page has no role restriction (login, register, not-found, maintenance)
    if (allowedRoles.length === 0) {
      setPreviousPage(currentPage);
      setCurrentPage(page);
      return;
    }
    // User doesn't have the required role
    if (!allowedRoles.includes(currentUser.role)) {
      const requiredRole = allowedRoles[0];
      toast.error(
        `Access denied. This page is for ${ROLE_LABELS[requiredRole] ?? requiredRole}s only.`
      );
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
    setCurrentUser(null);
    setCurrentPage('login');
    setPreviousPage(null);
  };
  const handleRegister = (newUser: User, newMember: Member) => {
    setUsers((u) => [...u, newUser]);
    setMembers((m) => [...m, newMember]);
  };
  const handleUpdateMember = (updated: Member) =>
  setMembers((ms) =>
  ms.map((m) => m.member_id === updated.member_id ? updated : m)
  );
  const handleAddGoal = (goal: FitnessGoal) =>
  setFitnessGoals((gs) => [...gs, goal]);
  const handleAddMetric = (metric: HealthMetric) =>
  setHealthMetrics((ms) => [...ms, metric]);
  const handleAddAvailability = (slot: TrainerAvailability) =>
  setTrainerAvailability((a) => [...a, slot]);
  const handleUpdateAvailability = (slot: TrainerAvailability) =>
  setTrainerAvailability((a) =>
  a.map((x) => x.availability_id === slot.availability_id ? slot : x)
  );
  const handleDeleteAvailability = (id: number) =>
  setTrainerAvailability((a) => a.filter((x) => x.availability_id !== id));
  const handleUpdateSession = (s: PersonalSession) =>
  setPersonalSessions((ss) =>
  ss.map((x) => x.session_id === s.session_id ? s : x)
  );
  const handleUpdateClass = (c: GroupClass) =>
  setGroupClasses((cs) => cs.map((x) => x.class_id === c.class_id ? c : x));
  const handleAddEquipment = (e: Equipment) => setEquipment((eq) => [...eq, e]);
  const handleUpdateEquipment = (e: Equipment) =>
  setEquipment((eq) =>
  eq.map((x) => x.equipment_id === e.equipment_id ? e : x)
  );
  const handleDeleteEquipment = (id: number) =>
  setEquipment((eq) => eq.filter((x) => x.equipment_id !== id));
  // ─── Maintenance mode ──────────────────────────────────────────────────────
  if (MAINTENANCE_MODE) {
    return (
      <Suspense fallback={<PageLoader />}>
        <MaintenancePage />
      </Suspense>);

  }
  // ─── Unauthenticated views ─────────────────────────────────────────────────
  if (!currentUser) {
    return (
      <Suspense fallback={<PageLoader />}>
        <AnimatePresence mode="wait" initial={false}>
          {currentPage === 'register' ?
          <motion.div
            key="register"
            initial={{
              opacity: 0,
              x: 30
            }}
            animate={{
              opacity: 1,
              x: 0
            }}
            exit={{
              opacity: 0,
              x: -30
            }}
            transition={{
              duration: 0.25,
              ease: 'easeInOut'
            }}>

              <RegistrationPage
              users={users}
              members={members}
              onRegister={handleRegister} />

            </motion.div> :

          <motion.div
            key="login"
            initial={{
              opacity: 0,
              x: -30
            }}
            animate={{
              opacity: 1,
              x: 0
            }}
            exit={{
              opacity: 0,
              x: 30
            }}
            transition={{
              duration: 0.25,
              ease: 'easeInOut'
            }}>

              <LoginPage
              users={users}
              onLogin={handleLogin}
              onGoRegister={() => setCurrentPage('register')} />

            </motion.div>
          }
        </AnimatePresence>
      </Suspense>);

  }
  // ─── Authenticated page renderer ───────────────────────────────────────────
  const renderPage = () => {
    const allowedRoles = PAGE_ROLES[currentPage];
    // Redirect if user doesn't have access (shouldn't normally reach here due to handleNavigate guard)
    if (allowedRoles.length > 0 && !allowedRoles.includes(currentUser.role)) {
      return (
        <NotFoundPage
          onGoHome={() =>
          setCurrentPage(HOME_PAGE[currentUser.role] || 'login')
          }
          onGoBack={
          previousPage ? () => setCurrentPage(previousPage) : undefined
          } />);


    }
    switch (currentPage) {
      case 'member-dashboard':
        return (
          <DashboardPage
            currentUser={currentUser}
            members={members}
            healthMetrics={healthMetrics}
            fitnessGoals={fitnessGoals}
            classRegistrations={classRegistrations}
            personalSessions={personalSessions}
            trainers={trainers}
            rooms={rooms} />);


      case 'member-profile':
        return (
          <ProfilePage
            currentUser={currentUser}
            members={members}
            fitnessGoals={fitnessGoals}
            healthMetrics={healthMetrics}
            onUpdateMember={handleUpdateMember}
            onAddGoal={handleAddGoal}
            onAddMetric={handleAddMetric} />);


      case 'member-health':
        return (
          <HealthHistoryPage
            currentUser={currentUser}
            members={members}
            healthMetrics={healthMetrics} />);

      case 'member-classes':
        return (
          <ClassesPage
            currentUser={currentUser}
            members={members}
            classes={groupClasses}
            trainers={trainers}
            rooms={rooms} />);


      case 'trainer-schedule':
        return (
          <SchedulePage
            currentUser={currentUser}
            trainers={trainers}
            personalSessions={personalSessions}
            groupClasses={groupClasses}
            members={members}
            rooms={rooms} />);


      case 'trainer-availability':
        return (
          <AvailabilityPage
            currentUser={currentUser}
            trainers={trainers}
            availability={trainerAvailability}
            onAddAvailability={handleAddAvailability}
            onUpdateAvailability={handleUpdateAvailability}
            onDeleteAvailability={handleDeleteAvailability} />);


      case 'admin-rooms':
        return (
          <RoomBookingPage
            rooms={rooms}
            personalSessions={personalSessions}
            groupClasses={groupClasses}
            trainers={trainers}
            members={members}
            onUpdateSession={handleUpdateSession}
            onUpdateClass={handleUpdateClass} />);


      case 'admin-equipment':
        return (
          <EquipmentPage
            equipment={equipment}
            rooms={rooms}
            onAddEquipment={handleAddEquipment}
            onUpdateEquipment={handleUpdateEquipment}
            onDeleteEquipment={handleDeleteEquipment} />);


      case 'not-found':
      default:
        return (
          <NotFoundPage
            onGoHome={() =>
            setCurrentPage(HOME_PAGE[currentUser.role] || 'login')
            }
            onGoBack={
            previousPage ? () => setCurrentPage(previousPage) : undefined
            } />);


    }
  };
  return (
    <Layout
      currentUser={currentUser}
      currentPage={currentPage}
      onNavigate={handleNavigate}
      onLogout={handleLogout}>

      <Suspense fallback={<PageLoader />}>
        <PageTransition pageKey={currentPage}>{renderPage()}</PageTransition>
      </Suspense>
    </Layout>);

}