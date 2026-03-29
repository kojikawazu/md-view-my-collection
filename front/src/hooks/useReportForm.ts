import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ExternalUrlInput, MutationResult, ReportItem, User } from '@/types';
import { CATEGORIES } from '@/constants';

interface UseReportFormOptions {
  user: User | null;
  reportId?: string;
  reports?: ReportItem[];
  onSubmit: (data: Omit<ReportItem, 'id'>) => Promise<MutationResult>;
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
  const [serverError, setServerError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [externalUrls, setExternalUrls] = useState<ExternalUrlInput[]>([]);

  const [formData, setFormData] = useState<Omit<ReportItem, 'id'>>({
    title: '',
    summary: '',
    content: '',
    category: CATEGORIES[0],
    author: user?.username || 'Guest Editor',
    publishDate: new Date().toISOString().split('T')[0],
    tags: [],
    externalUrls: [],
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
        setExternalUrls(
          (existing.externalUrls ?? []).map((eu) => ({
            url: eu.url,
            label: eu.label ?? '',
          })),
        );
      }
    }
  }, [reportId, reports, user, router, isHydrated]);

  const handleChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (fieldErrors[name]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
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
    if (fieldErrors.tags) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next.tags;
        return next;
      });
    }
  };

  const handleSubmitAttempt = (event: React.FormEvent) => {
    event.preventDefault();
    if (formData.tags.length === 0) {
      setTagError('タグを入力してください。');
      return;
    }
    setShowConfirmModal(true);
  };

  const addExternalUrl = () =>
    setExternalUrls((prev) => [...prev, { url: '', label: '' }]);

  const removeExternalUrl = (index: number) => {
    setExternalUrls((prev) => prev.filter((_, i) => i !== index));
    setFieldErrors((prev) => {
      const next: Record<string, string> = {};
      for (const [key, val] of Object.entries(prev)) {
        const match = key.match(/^externalUrls\.(\d+)\.(.+)$/);
        if (!match) {
          next[key] = val;
          continue;
        }
        const idx = Number(match[1]);
        if (idx === index) continue;
        const newIdx = idx > index ? idx - 1 : idx;
        next[`externalUrls.${newIdx}.${match[2]}`] = val;
      }
      return next;
    });
  };

  const updateExternalUrl = (index: number, field: 'url' | 'label', value: string) => {
    setExternalUrls((prev) => prev.map((eu, i) => (i === index ? { ...eu, [field]: value } : eu)));
    const errorKey = `externalUrls.${index}.${field}`;
    if (fieldErrors[errorKey]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[errorKey];
        return next;
      });
    }
  };

  const handleConfirmSubmit = async () => {
    setServerError(null);
    setFieldErrors({});
    const urlErrors: Record<string, string> = {};
    externalUrls.forEach((eu, i) => {
      const trimmedUrl = eu.url.trim();
      const trimmedLabel = eu.label.trim();
      const hasInput = trimmedUrl || trimmedLabel;
      if (!hasInput) return;
      if (!trimmedUrl) {
        urlErrors[`externalUrls.${i}.url`] = 'URLは必須です。';
      } else if (!/^https?:\/\//.test(trimmedUrl)) {
        urlErrors[`externalUrls.${i}.url`] = 'URLはhttp://またはhttps://で始まる必要があります。';
      }
      if (trimmedLabel.length > 200) {
        urlErrors[`externalUrls.${i}.label`] = 'ラベルは200文字以内です。';
      }
    });
    if (Object.keys(urlErrors).length > 0) {
      setFieldErrors(urlErrors);
      return;
    }

    const activeUrls = externalUrls
      .filter((eu) => eu.url.trim())
      .map((eu) => ({ url: eu.url.trim(), label: eu.label.trim() }));
    const submitData = { ...formData, externalUrls: activeUrls };
    const result = await onSubmit(submitData as Omit<ReportItem, 'id'>);
    if (!result.ok) {
      if (result.status === 401 || result.status === 403) {
        router.push('/login');
      } else if (result.fieldErrors) {
        setFieldErrors(result.fieldErrors);
      } else {
        setServerError(result.error);
      }
    }
  };

  return {
    formData,
    tagError,
    serverError,
    fieldErrors,
    externalUrls,
    showConfirmModal,
    setShowConfirmModal,
    handleChange,
    handleTagsChange,
    handleSubmitAttempt,
    handleConfirmSubmit,
    addExternalUrl,
    removeExternalUrl,
    updateExternalUrl,
    goBack: () => router.back(),
  };
};
