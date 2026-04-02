import { useCallback, useState } from 'react';
import { CalendarIcon, UsersIcon, ClockIcon, MapPinIcon } from 'lucide-react';
import { toast } from 'sonner';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Pagination } from '@/components/ui/Pagination';
import { usePagination } from '@/hooks/useServerPagination';
import { DashboardSkeleton } from '@/components/ui/Skeleton';
import { GroupClass, Trainer, Room } from '@/data/types';
import { listAvailableClasses, enrollInClass } from '@/apis/members';

interface ClassesPageProps {
  trainers: Trainer[];
  rooms: Room[];
}

const PAGE_SIZE = 6;

export function ClassesPage({
  trainers,
  rooms
}: ClassesPageProps) {
  const [enrolling, setEnrolling] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Server-side pagination for classes
  const fetchClasses = useCallback(async (skip: number, limit: number) => {
    const res = await listAvailableClasses(skip, limit);
    return res;
  }, []);

  const {
    data: classes,
    isLoading,
    currentPage,
    totalPages,
    totalItems,
    setPage,
    refresh
  } = usePagination<GroupClass>(fetchClasses, { pageSize: PAGE_SIZE });

  const handleEnroll = async (classId: number) => {
    setEnrolling(classId);
    try {
      await enrollInClass(String(classId));
      toast.success('Successfully enrolled in class!');
      refresh(); // Refresh to get updated enrollment count
    } catch (error) {
      console.error('Failed to enroll:', error);
      toast.error('Failed to enroll in class. Please try again.');
    } finally {
      setEnrolling(null);
    }
  };

  const getTrainerName = (trainerId: number) => {
    const trainer = trainers.find(t => t.trainer_id === trainerId);
    return trainer ? trainer.full_name : 'Unknown Trainer';
  };

  const getRoomName = (roomId: number) => {
    const room = rooms.find(r => r.room_id === roomId);
    return room ? room.room_name : 'Unknown Room';
  };

  const getStatusBadge = (status: string, currentEnrollment: number, maxCapacity: number) => {
    if (status === 'full' || currentEnrollment >= maxCapacity) {
      return <Badge variant="danger">Full</Badge>;
    }
    if (status === 'cancelled') {
      return <Badge variant="danger">Cancelled</Badge>;
    }
    if (status === 'completed') {
      return <Badge variant="neutral">Completed</Badge>;
    }
    return <Badge variant="success">Available</Badge>;
  };

  if (isLoading && classes.length === 0) return <DashboardSkeleton />;

  // Filter classes based on search term (client-side filtering of server data)
  const filteredClasses = searchTerm
    ? classes.filter(classItem => 
        classItem.class_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        getTrainerName(classItem.trainer_id).toLowerCase().includes(searchTerm.toLowerCase()) ||
        getRoomName(classItem.room_id).toLowerCase().includes(searchTerm.toLowerCase())
      )
    : classes;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
          Fitness Classes
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
          Browse and enroll in our fitness classes
        </p>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <Input
          placeholder="Search classes by name, instructor, or room..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-md"
        />
      </div>

      {/* Results count */}
      {searchTerm && (
        <div className="mb-4 text-sm text-slate-500 dark:text-slate-400">
          Found {filteredClasses.length} class{filteredClasses.length !== 1 ? 'es' : ''} matching "{searchTerm}"
        </div>
      )}

      {filteredClasses.length === 0 ? (
        <Card>
          <div className="py-8 text-center">
            <CalendarIcon className="w-10 h-10 text-slate-200 dark:text-slate-600 mx-auto mb-2" />
            <p className="text-sm text-slate-400 dark:text-slate-500">
              {searchTerm ? 'No classes found matching your search.' : 'No classes available at the moment.'}
            </p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
              {searchTerm ? 'Try adjusting your search terms.' : 'Check back later for new class schedules.'}
            </p>
          </div>
        </Card>
      ) : (
        <>
          <div className="space-y-4">
            {filteredClasses.map((classItem) => (
              <Card key={classItem.class_id}>
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                        {classItem.class_name}
                      </h3>
                      <div className="flex items-center gap-4 mt-2 text-sm text-slate-500 dark:text-slate-400">
                        <div className="flex items-center gap-1">
                          <CalendarIcon className="w-4 h-4" />
                          {new Date(classItem.class_date).toLocaleDateString()}
                        </div>
                        <div className="flex items-center gap-1">
                          <ClockIcon className="w-4 h-4" />
                          {classItem.start_time} - {classItem.end_time}
                        </div>
                        <div className="flex items-center gap-1">
                          <MapPinIcon className="w-4 h-4" />
                          {getRoomName(classItem.room_id)}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      {getStatusBadge(classItem.status, classItem.current_enrollment, classItem.max_capacity)}
                      <div className="flex items-center gap-1 text-sm text-slate-500 dark:text-slate-400">
                        <UsersIcon className="w-4 h-4" />
                        {classItem.current_enrollment}/{classItem.max_capacity}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-slate-600 dark:text-slate-300">
                      Instructor: <span className="font-medium">{getTrainerName(classItem.trainer_id)}</span>
                    </div>
                    
                    <Button
                      onClick={() => handleEnroll(classItem.class_id)}
                      disabled={
                        enrolling === classItem.class_id ||
                        classItem.status === 'full' ||
                        classItem.status === 'cancelled' ||
                        classItem.status === 'completed' ||
                        classItem.current_enrollment >= classItem.max_capacity
                      }
                      className="min-w-[100px]"
                    >
                      {enrolling === classItem.class_id ? (
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Enrolling...
                        </div>
                      ) : classItem.current_enrollment >= classItem.max_capacity ? (
                        'Full'
                      ) : classItem.status === 'cancelled' ? (
                        'Cancelled'
                      ) : classItem.status === 'completed' ? (
                        'Completed'
                      ) : (
                        'Enroll'
                      )}
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Pagination */}
          <div className="mt-6 flex justify-center">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setPage}
              totalItems={totalItems}
              pageSize={PAGE_SIZE}
            />
          </div>
        </>
      )}
    </div>
  );
}
