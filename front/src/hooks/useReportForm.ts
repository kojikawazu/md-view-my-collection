import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ReportItem, User } from '@/types';
import { CATEGORIES } from '@/constants';

interface UseReportFormOptions {
  user: User | null;
  reportId?: string;
  reports?: ReportItem[];
  onSubmit: (data: Omit<ReportItem, 'id'>) => void;
  isHydrated?: boolean;
}

export const useReportForm = ({
  user,
  reportId,
  reports,
  onSubmit,
  isHydrated = true,
}: UseReportFormOptions) => {
  const router = useRouter();
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [tagError, setTagError] = useState<string | null>(null);

  const [formData, setFormData] = useState<Omit<ReportItem, 'id'>>({
    title: '',
    summary: '',
    content: '',
    category: CATEGORIES[0],
    author: user?.username || 'Guest Editor',
    publishDate: new Date().toISOString().split('T')[0],
    tags: [],
  });

  useEffect(() => {
    if (!isHydrated) return;
    if (!user) {
      router.push('/login');
    }
    if (reportId && reports) {
      const existing = reports.find((report) => report.id === reportId);
      if (existing) {
        const { id: _, ...rest } = existing;
        setFormData({ ...rest, summary: rest.summary ?? '' });
      }
    }
  }, [reportId, reports, user, router, isHydrated]);

  const handleChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleTagsChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const tags = event.target.value
      .split(',')
      .map((tag) => {
        const trimmed = tag.trim();
        if (!trimmed) return '';
        return trimmed.startsWith('#') ? trimmed : `#${trimmed}`;
      })
      .filter(Boolean);
    setFormData((prev) => ({ ...prev, tags }));
    if (tags.length > 0) setTagError(null);
  };

  const handleSubmitAttempt = (event: React.FormEvent) => {
    event.preventDefault();
    if (formData.tags.length === 0) {
      setTagError('タグを入力してください。');
      return;
    }
    setShowConfirmModal(true);
  };

  const handleConfirmSubmit = () => {
    onSubmit(formData);
  };

  return {
    formData,
    tagError,
    showConfirmModal,
    setShowConfirmModal,
    handleChange,
    handleTagsChange,
    handleSubmitAttempt,
    handleConfirmSubmit,
    goBack: () => router.back(),
  };
};
