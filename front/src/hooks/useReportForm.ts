import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ExternalUrlInput, MutationResult, ReportItem, User } from '@/types';
import { CATEGORIES } from '@/constants';

/** `useReportForm` の入力。新規作成と編集の両方を 1 つのフックで扱う。 */
interface UseReportFormOptions {
  /** ログイン中ユーザー。未ログインなら初期化時にログイン画面へ退避する。 */
  user: User | null;
  /** 編集対象レポートの ID。未指定なら新規作成モード。 */
  reportId?: string;
  /** 既存レポート一覧。編集時に `reportId` から初期値を引く。 */
  reports?: ReportItem[];
  /** 送信処理本体（作成 or 更新）。AppState 側の関数を渡す。 */
  onSubmit: (data: Omit<ReportItem, 'id'>) => Promise<MutationResult>;
  /** 初期化完了フラグ。false の間は未ログイン退避・初期値投入を保留する。 */
  isHydrated?: boolean;
}

/**
 * レポート作成/編集フォームの状態・バリデーション・送信を管理するフック。
 *
 * 編集時は `reports` から既存値をフォームに流し込み、未ログイン時はログイン画面へ退避する
 * （いずれも `isHydrated` 完了後に実行し、初期化前の誤判定を避ける）。
 * 送信は確認モーダルを挟む二段構え（`handleSubmitAttempt` → `handleConfirmSubmit`）。
 *
 * @returns フォーム値・各種エラー・外部URL操作・確認モーダル制御・各ハンドラ
 */
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
        // 既存レポートでフォームを初期化する。props からの初期化のため effect 内 setState は意図的。
        /* eslint-disable react-hooks/set-state-in-effect */
        setFormData({
          title: existing.title,
          summary: existing.summary ?? '',
          content: existing.content,
          category: existing.category,
          author: existing.author,
          publishDate: existing.publishDate,
          tags: existing.tags,
          externalUrls: existing.externalUrls,
        });
        setExternalUrls(
          (existing.externalUrls ?? []).map((eu) => ({
            url: eu.url,
            label: eu.label ?? '',
          })),
        );
        /* eslint-enable react-hooks/set-state-in-effect */
      }
    }
  }, [reportId, reports, user, router, isHydrated]);

  // 汎用フィールドの変更ハンドラ。入力があった項目のサーバーエラーはその場でクリアする。
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

  // タグ入力（カンマ区切り）を `#` 付き canonical form に正規化して反映する。
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

  // 送信前チェック（タグ必須）。通過したら確認モーダルを開く。実送信は handleConfirmSubmit。
  const handleSubmitAttempt = (event: React.FormEvent) => {
    event.preventDefault();
    if (formData.tags.length === 0) {
      setTagError('タグを入力してください。');
      return;
    }
    setShowConfirmModal(true);
  };

  // 空の外部URL入力行を 1 つ追加する。
  const addExternalUrl = () =>
    setExternalUrls((prev) => [...prev, { url: '', label: '' }]);

  /**
   * 指定インデックスの外部URL行を削除する。
   *
   * 行を消すと後続行のインデックスが 1 つずつ前へ詰まるため、`externalUrls.{i}.{field}` 形式の
   * フィールドエラーキーも同じ規則で貼り替える（削除行のエラーは破棄、後続は index-1 に再割当）。
   * これをしないとエラー表示が別の行にずれてしまう。
   *
   * @param index 削除対象行のインデックス
   */
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

  /**
   * 外部URL行の url / label を更新し、その行の該当エラーをクリアする。
   *
   * @param index 対象行のインデックス
   * @param field 更新するフィールド（`url` または `label`）
   * @param value 新しい値
   */
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

  /**
   * 確認モーダルで確定後の実送信。
   *
   * 外部URLをクライアント側で先行検証し（url/label のいずれかが入力された行のみ対象）、
   * 問題があれば送信せずフィールドエラーを表示する。送信後は結果に応じて分岐する:
   * 401/403 はログイン画面へ、`fieldErrors` があれば各項目に、それ以外は全体エラーに反映する。
   */
  const handleConfirmSubmit = async () => {
    setServerError(null);
    setFieldErrors({});
    const urlErrors: Record<string, string> = {};
    externalUrls.forEach((eu, i) => {
      const trimmedUrl = eu.url.trim();
      const trimmedLabel = eu.label.trim();
      // url も label も空の行は「未入力」として検証・送信の対象外にする。
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

    // url が入力された行だけを送信対象にする（空行は送らない）。
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
