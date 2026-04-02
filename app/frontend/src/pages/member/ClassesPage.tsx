import { useCallback, useState } from 'react';
import { CalendarIcon, UsersIcon, ClockIcon, MapPinIcon } from 'lucide-react';
import { toast } from 'sonner';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Pagination } from '@/components/ui/Pagination';
import { usePagination } from '@/hooks/useServerPagination';
import { ClassesSkeleton } from '@/components/ui/Skeleton';
import { GroupClass } from '@/data/types';
import { listAvailableClasses, enrollInClass } from '@/apis/members';

const PAGE_SIZE = 6;

export function ClassesPage() {
  const [enrolling, setEnrolling] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchClasses = useCallback(async (skip: number, limit: number) => {
    return listAvailableClasses(skip, limit);
  }, []);

  const { data: classes, isLoading, currentPage, totalPages, totalItems, setPage, refresh } =
    usePagination<GroupClass>(fetchClasses, { pageSize: PAGE_SIZE });

  const handleEnroll = async (classId: string) => {
    setEnrolling(classId);
    try {
      await enrollInClass(classId);
      toast.success('Successfully enrolled in class!');
      refresh();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to enroll. Please try again.');
    } finally {
      setEnrolling(null);
    }
  };

  const filtered = searchTerm
    ? classes.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()))
    : classes;

  if (isLoading && classes.length === 0) return <ClassesSkeleton />;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Fitness Classes</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Browse and enroll in our fitness classes</p>
      </div>

      <div className="mb-6">
        <Input placeholder="Search classes by name…" value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)} className="max-w-md" />
      </div>

      {searchTerm && (
        <div className="mb-4 text-sm text-slate-500 dark:text-slate-400">
          Found {filtered.length} class{filtered.length !== 1 ? 'es' : ''} matching "{searchTerm}"
        </div>
      )}

      {filtered.length === 0 ? (
        <Card>
          <div className="py-8 text-center">
            <CalendarIcon className="w-10 h-10 text-slate-200 dark:text-slate-600 mx-auto mb-2" />
            <p className="text-sm text-slate-400 dark:text-slate-500">
              {searchTerm ? 'No classes found matching your search.' : 'No classes available at the moment.'}
            </p>
          </div>
        </Card>
      ) : (
        <>
          <div className="space-y-4">
            {filtered.map(cls => (
              <Card key={cls.id}>
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{cls.name}</h3>
                      <div className="flex items-center gap-4 mt-2 text-sm text-slate-500 dark:text-slate-400">
                        <div className="flex items-center gap-1">
                          <CalendarIcon className="w-4 h-4" />
                          {new Date(cls.class_date).toLocaleDateString()}
                        </div>
                        <div className="flex items-center gap-1">
                          <ClockIcon className="w-4 h-4" />
                          {cls.start_time} – {cls.end_time}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <Badge variant="success">Available</Badge>
                      <div className="flex items-center gap-1 text-sm text-slate-500 dark:text-slate-400">
                        <UsersIcon className="w-4 h-4" />
                        {cls.max_capacity} max
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-end">
                    <Button
                      onClick={() => handleEnroll(cls.id)}
                      disabled={enrolling === cls.id}
                      className="min-w-[100px]">
                      {enrolling === cls.id ? (
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Enrolling…
                        </div>
                      ) : 'Enroll'}
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
          <div className="mt-6 flex justify-center">
            <Pagination currentPage={currentPage} totalPages={totalPages}
              onPageChange={setPage} totalItems={totalItems} pageSize={PAGE_SIZE} />
          </div>
        </>
      )}
    </div>
  );
}
