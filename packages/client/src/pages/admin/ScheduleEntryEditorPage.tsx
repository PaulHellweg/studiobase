import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { useToast } from '@/hooks/use-toast';
import { trpc } from '@/trpc';

export function ScheduleEntryEditorPage() {
  const { entryId } = useParams();
  const { t } = useTranslation();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const isNew = entryId === 'new';
  const utils = trpc.useUtils();

  const { data: classTypes } = trpc.classType.list.useQuery({ limit: 100 });

  const [form, setForm] = useState({
    classTypeId: '',
    teacherId: '',
    dayOfWeek: '',
    startTime: '09:00',
    endTime: '10:00',
    location: '',
  });

  const createSchedule = trpc.schedule.create.useMutation({
    onSuccess: () => {
      addToast(t('admin.entrySaved', 'Schedule entry saved'), 'success');
      utils.schedule.list.invalidate();
      navigate('/admin/schedule');
    },
    onError: (err) => addToast(err.message, 'error'),
  });

  const updateSchedule = trpc.schedule.update.useMutation({
    onSuccess: () => {
      addToast(t('admin.entrySaved', 'Schedule entry saved'), 'success');
      utils.schedule.list.invalidate();
      navigate('/admin/schedule');
    },
    onError: (err) => addToast(err.message, 'error'),
  });

  const handleSave = (e: React.FormEvent, status?: 'published') => {
    e.preventDefault();
    if (isNew) {
      createSchedule.mutate({
        classTypeId: form.classTypeId,
        teacherId: form.teacherId,
        dayOfWeek: form.dayOfWeek ? parseInt(form.dayOfWeek) : null,
        startTime: form.startTime,
        endTime: form.endTime,
        location: form.location || undefined,
      });
    } else if (entryId) {
      updateSchedule.mutate({
        id: entryId,
        classTypeId: form.classTypeId || undefined,
        teacherId: form.teacherId || undefined,
        dayOfWeek: form.dayOfWeek ? parseInt(form.dayOfWeek) : null,
        startTime: form.startTime || undefined,
        endTime: form.endTime || undefined,
        location: form.location || undefined,
        status: status,
      });
    }
  };

  const isPending = createSchedule.isPending || updateSchedule.isPending;

  return (
    <div>
      <Link
        to="/admin/schedule"
        className="inline-flex items-center gap-1 text-sm text-[--color-text-muted] hover:text-[--color-text] mb-6"
      >
        <ArrowLeft size={16} />
        {t('admin.scheduleManagement', 'Schedule')}
      </Link>
      <h1 className="font-heading text-2xl font-bold text-[--color-text] mb-6">
        {isNew ? t('admin.createEntry', 'New Entry') : t('admin.editEntry', 'Edit Entry')}
      </h1>
      <Card className="max-w-2xl">
        <CardContent>
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[--color-text] mb-1">{t('admin.classType', 'Class Type')}</label>
              <select
                value={form.classTypeId}
                onChange={(e) => setForm({ ...form, classTypeId: e.target.value })}
                className="w-full px-3 py-2 border border-[--color-border] rounded-none bg-white text-[--color-text] text-sm focus:outline-none focus:border-[--color-primary]"
                required
              >
                <option value="">{t('common.select', 'Select...')}</option>
                {(classTypes ?? []).map((ct) => (
                  <option key={ct.id} value={ct.id}>{ct.name}</option>
                ))}
              </select>
            </div>
            <Input
              label={t('admin.teacherId', 'Teacher ID')}
              value={form.teacherId}
              onChange={(e) => setForm({ ...form, teacherId: e.target.value })}
              placeholder="Teacher UUID"
              required
            />
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-[--color-text] mb-1">{t('admin.day', 'Day')}</label>
                <select
                  value={form.dayOfWeek}
                  onChange={(e) => setForm({ ...form, dayOfWeek: e.target.value })}
                  className="w-full px-3 py-2 border border-[--color-border] rounded-none bg-white text-[--color-text] text-sm focus:outline-none focus:border-[--color-primary]"
                >
                  <option value="">{t('admin.oneOff', 'One-off')}</option>
                  {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map((day, i) => (
                    <option key={i} value={i}>{day}</option>
                  ))}
                </select>
              </div>
              <Input label={t('admin.startTime', 'Start Time')} type="time" value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} />
            </div>
            <Input label={t('admin.endTime', 'End Time')} type="time" value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })} />
            <Input label={t('admin.location', 'Location')} value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="Main Studio" />
            <div className="flex gap-3 pt-4">
              <Button type="submit" variant="secondary" disabled={isPending}>
                {t('admin.saveDraft', 'Save as Draft')}
              </Button>
              <Button type="button" onClick={(e) => handleSave(e as unknown as React.FormEvent, 'published')} disabled={isPending}>
                {t('admin.publish', 'Publish')}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
