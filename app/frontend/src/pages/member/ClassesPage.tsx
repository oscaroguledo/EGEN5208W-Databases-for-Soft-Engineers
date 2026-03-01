import React, { useEffect, useState } from 'react';
import { CalendarIcon, UsersIcon, ClockIcon, MapPinIcon, SearchIcon } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Input } from '../../components/ui/Input';
import { Pagination, usePagination } from '../../components/ui/Pagination';
import { DashboardSkeleton } from '../../components/ui/Skeleton';
import { User, Member, GroupClass, Trainer, Room } from '../../data/types';

interface ClassesPageProps {
  currentUser: User;
  members: Member[];
  classes: GroupClass[];
  trainers: Trainer[];
  rooms: Room[];
}

export function ClassesPage({
  currentUser,
  members,
  trainers,
  rooms
}: ClassesPageProps) {
  const [loading, setLoading] = useState(true);
  const [classes, setClasses] = useState<GroupClass[]>([]);
  const [enrolling, setEnrolling] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Call pagination hook unconditionally to preserve hooks order
  const pagination = usePagination(classes, 6); // Show 6 classes per page
  
  useEffect(() => {
    const fetchClasses = async () => {
      try {
        // In a real app, this would fetch from the API
        // For now, we'll use mock data with more classes to demonstrate pagination
        const mockClasses: GroupClass[] = [
          {
            class_id: 1,
            class_name: "Yoga Flow",
            trainer_id: 1,
            room_id: 1,
            class_date: "2026-03-15",
            start_time: "09:00",
            end_time: "10:00",
            max_capacity: 20,
            current_enrollment: 15,
            status: "scheduled"
          },
          {
            class_id: 2,
            class_name: "HIIT Training",
            trainer_id: 2,
            room_id: 2,
            class_date: "2026-03-15",
            start_time: "10:30",
            end_time: "11:30",
            max_capacity: 15,
            current_enrollment: 12,
            status: "scheduled"
          },
          {
            class_id: 3,
            class_name: "Spin Class",
            trainer_id: 1,
            room_id: 3,
            class_date: "2026-03-16",
            start_time: "18:00",
            end_time: "19:00",
            max_capacity: 25,
            current_enrollment: 25,
            status: "full"
          },
          {
            class_id: 4,
            class_name: "Pilates",
            trainer_id: 3,
            room_id: 1,
            class_date: "2026-03-16",
            start_time: "08:00",
            end_time: "09:00",
            max_capacity: 12,
            current_enrollment: 8,
            status: "scheduled"
          },
          {
            class_id: 5,
            class_name: "Boxing",
            trainer_id: 2,
            room_id: 2,
            class_date: "2026-03-16",
            start_time: "19:30",
            end_time: "20:30",
            max_capacity: 10,
            current_enrollment: 7,
            status: "scheduled"
          },
          {
            class_id: 6,
            class_name: "Zumba",
            trainer_id: 3,
            room_id: 3,
            class_date: "2026-03-17",
            start_time: "17:00",
            end_time: "18:00",
            max_capacity: 30,
            current_enrollment: 22,
            status: "scheduled"
          },
          {
            class_id: 7,
            class_name: "CrossFit",
            trainer_id: 1,
            room_id: 1,
            class_date: "2026-03-17",
            start_time: "06:00",
            end_time: "07:00",
            max_capacity: 15,
            current_enrollment: 15,
            status: "full"
          },
          {
            class_id: 8,
            class_name: "Meditation",
            trainer_id: 3,
            room_id: 2,
            class_date: "2026-03-17",
            start_time: "12:00",
            end_time: "12:30",
            max_capacity: 20,
            current_enrollment: 5,
            status: "scheduled"
          },
          {
            class_id: 9,
            class_name: "Strength Training",
            trainer_id: 2,
            room_id: 3,
            class_date: "2026-03-18",
            start_time: "16:00",
            end_time: "17:00",
            max_capacity: 12,
            current_enrollment: 9,
            status: "scheduled"
          },
          {
            class_id: 10,
            class_name: "Aqua Fitness",
            trainer_id: 1,
            room_id: 1,
            class_date: "2026-03-18",
            start_time: "11:00",
            end_time: "12:00",
            max_capacity: 18,
            current_enrollment: 14,
            status: "scheduled"
          },
          {
            class_id: 11,
            class_name: "Kickboxing",
            trainer_id: 3,
            room_id: 2,
            class_date: "2026-03-18",
            start_time: "18:30",
            end_time: "19:30",
            max_capacity: 20,
            current_enrollment: 18,
            status: "full"
          },
          {
            class_id: 12,
            class_name: "Barre",
            trainer_id: 2,
            room_id: 3,
            class_date: "2026-03-19",
            start_time: "09:30",
            end_time: "10:30",
            max_capacity: 15,
            current_enrollment: 11,
            status: "scheduled"
          }
        ];
        setClasses(mockClasses);
      } catch (error) {
        console.error('Failed to fetch classes:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchClasses();
  }, []);

  const handleEnroll = async (classId: number) => {
    setEnrolling(classId);
    try {
      // In a real app, this would call the enrollment API
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      
      // Update local state
      setClasses(prev => prev.map(cls => 
        cls.class_id === classId 
          ? { ...cls, current_enrollment: cls.current_enrollment + 1 }
          : cls
      ));
      
      alert('Successfully enrolled in class!');
    } catch (error) {
      console.error('Failed to enroll:', error);
      alert('Failed to enroll in class. Please try again.');
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

  if (loading) return <DashboardSkeleton />;

  // Filter classes based on search term
  const filteredClasses = classes.filter(classItem => 
    classItem.class_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    getTrainerName(classItem.trainer_id).toLowerCase().includes(searchTerm.toLowerCase()) ||
    getRoomName(classItem.room_id).toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Update pagination to use filtered classes - but we need to call this conditionally
  // This is problematic for hooks order, so we'll use the original pagination with all classes
  // and filter the displayed results instead
  const paginatedFilteredClasses = pagination.paginated.filter(classItem => 
    classItem.class_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    getTrainerName(classItem.trainer_id).toLowerCase().includes(searchTerm.toLowerCase()) ||
    getRoomName(classItem.room_id).toLowerCase().includes(searchTerm.toLowerCase())
  );

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
            {paginatedFilteredClasses.map((classItem) => (
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
              currentPage={pagination.currentPage}
              totalPages={Math.max(1, Math.ceil(filteredClasses.length / 6))}
              onPageChange={pagination.setCurrentPage}
              totalItems={filteredClasses.length}
              pageSize={6}
            />
          </div>
        </>
      )}
    </div>
  );
}
