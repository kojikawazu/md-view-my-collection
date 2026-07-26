---
description: JSDoc（TSDoc）ドキュメンテーションコメント規約 — TypeScript の公開シンボルに必須
globs: "front/src/**"
---

# JSDoc 規約（TypeScript）

TypeScript コードの**公開シンボル**には JSDoc（TSDoc 記法）を**必須**とする。TypeDoc によるドキュメント生成を前提とする。

## 必須対象（公開シンボル）

以下の公開シンボルには JSDoc を必ず付与する:

- `export` された関数・クラス・メソッド・型（`type` / `interface`）・定数
- React/Vue コンポーネントの **props 型**（各プロパティに説明）
- カスタムフック（`useXxx`）・composable（`useXxx`）
- 公開 API のハンドラー・サービスメソッド

**任意対象**: `export` されない内部関数、および処理が自明な 1 行ユーティリティ。ただし意図が非自明なものは内部でも付与する。

## 型定義のコメント（型本体 + メンバー）

`type` / `interface` は**型本体と各メンバーの両方**にコメントを付ける。型シグネチャは「形」しか語らないため、**意味・単位・制約・状態の定義**はコメントでしか残せない。

- **型本体**: 1 行目に「**何を表す型か**」を書く。どの層のものか（API レスポンス / ドメインエンティティ / props）も併記すると読み手が迷わない。
- **各プロパティ**: 型名から読み取れない情報を書く。特に以下は必須:
  - **単位**（`durationMs` がミリ秒か秒か）
  - **`null` / `undefined` / 省略の意味**（「未設定」なのか「該当なし」なのか）
  - **制約・不変条件**（値域、フォーマット、他プロパティとの関係）
  - 自明なプロパティ（`id` 等）は省略してよい。**書くことがない項目に埋め草コメントを付けない**。
- **union リテラル**: 各値が**どの状態を指すか**を個別に書く。値の文字列そのものからは業務上の意味が読めない。
- コロケーションした非 `export` の型も、意味が非自明なら同様に付ける（判断は「混乱テスト」に従う）。

```ts
/**
 * レポートのカテゴリ。固定リストであり、DB 側に制約は無く API のバリデーションで担保する。
 */
export type ReportCategory =
  /** 開発全般。言語・フレームワークを問わない */
  | 'Development'
  /** AI・機械学習。LLM 関連もここに含む */
  | 'AI'
  /** クラウド基盤（AWS / GCP 等） */
  | 'Cloud';

/**
 * レポートのドメインエンティティ。API レスポンスと画面表示の共通表現。
 */
export type ReportItem = {
  id: string;
  /** 表示用タイトル。前後の空白は除去済み */
  title: string;
  category: ReportCategory;
  /** 本文（Markdown）。一覧 API は転送量削減のため返さず `undefined` になる */
  content?: string;
  /** タグ。`#` 付きが canonical form（例: `#AI`）。剥がして保存しない */
  tags: string[];
};
```

## 状態・ロジック層のコメント（context / hooks）

Context の value・カスタムフックの戻り値は、**定義ファイルを開かずに利用される**。したがって「値が何を意味するか」「関数が何を変えるか」はコメントでしか伝わらない。

本プロジェクトの該当箇所は `front/src/providers/`（`AppStateProvider` / `LoadingContext`）と `front/src/hooks/`。Zustand 等の store ライブラリは使用していない。

### 必須ラインは「参照範囲」で決める

型定義の配置（`typescript.md`）と同じ軸を使う。

| 対象 | コメント |
|---|---|
| **ファイルを越えて使われる** — Context value の各メンバー、カスタムフックの戻り値、`export` された関数 | **必須** |
| **ファイル内に閉じる** — コンポーネント内の `useState`・ハンドラ関数・ローカル変数 | **条件付き**（「なぜ」が非自明なときのみ。「混乱テスト」に従う） |

コンポーネント内部まで一律必須にしない。`setIsOpen` に「isOpen をセットする」と書くような**埋め草が量産され、本当に重要なコメントが埋もれる**ため。

### 型を先に定義してコメントを型側に置く

Context value やフックの戻り値を**インラインのオブジェクトリテラル**で書くと、その中身は「宣言」ではなく「式」になるため、JSDoc 規約も Lint も効かない。**先に型を定義し、コメントは型のメンバーに書く**。こうすると前節「型定義のコメント」の規約がそのまま効く。

```ts
// ❌ 戻り値型なし — 各値の説明を @returns に詰め込むしかない
/** @returns 現在のレポートと取得中フラグ */
export const useReport = (reportId: string | undefined) => {
  /* ... */
};

// ✅ 戻り値型を明示 → メンバーごとの説明が型側に集まり、Lint も効く
/** レポート詳細の取得結果。 */
type UseReportResult = {
  /** 現在のレポート。未取得時は `undefined`（「該当なし」ではない） */
  report: ReportItem | undefined;
  /** 本文の取得中のみ true。一覧キャッシュを表示中は false */
  isLoading: boolean;
};

export const useReport = (reportId: string | undefined): UseReportResult => {
  /* ... */
};
```

### 書くべき内容

state / 更新関数に書くのは**シグネチャから読めない情報**に限る。

- **その値がいつ変わるか / 誰が変えるか**（「ログアウト時にリセットされる」）
- **初期値・空値の意味**（「空配列は『0 件』であり『未取得』ではない」）
- **副作用の有無**（「この関数は API を呼ばない。再取得は呼び出し側の責務」）
- **他の値との関係・不変条件**（「`selectedId` は必ず `reports` に含まれる ID」）

## 混乱テスト（公開/内部・本番/テストを問わない）

判断軸は「public か否か」ではなく **「1 か月後の自分／他プロジェクト帰りの読み手が『これは何？なぜ？』となるか」**。なるなら、内部関数でもテストコードでも "why" を残す。

- **キャスト・回避策には "why" 必須**: `as unknown as` / `as any` / `@ts-ignore` / `@ts-expect-error` / マジック値 / 複雑な正規表現 / 明示的なワークアラウンド。**型を欺く・仕様を迂回する箇所は、その根拠（なぜ安全か／なぜ必要か）がコードから消える**ため、コメントが唯一の記録になる。
  - 例: テストダブルを `repo as unknown as Repository<Task>` で注入する場合、「ダブルは対象が実際に呼ぶメソッドだけの部分実装で、実型は構造的に大きいため二段キャストで隙間を埋める（実行時は使う分だけで足りる）」と残す。
- **テスト足場**（SUT ビルダー・複雑な fixture・非自明な mock）も、意図が読み取りにくいなら付ける。

## 記述ルール

- **型は書かない**: 型は TypeScript のシグネチャが唯一の真実（source of truth）。JSDoc に `{string}` 等の型ブレースを併記しない（二重管理・型ずれの原因になる）。JSDoc は**意図・意味・制約**を日本語で記述する。
- **要約行必須**: 1 行目にそのシンボルが「何をするか」を簡潔に書く。
- **`@param` 必須**: 全引数に `@param name - 説明` を記述する。オプション引数・デフォルト値の意味も明記する。
- **`@returns` 必須**: 戻り値がある場合は `@returns 説明` を記述する（`void` / JSX 返却のコンポーネントは省略可）。
- **`@throws` 必須**: 意図的に例外を投げる場合は `@throws {ErrorType} 発生条件` を記述する。
- **補助タグ（任意）**: `@example` `@deprecated` `@see` は必要に応じて使う。

## 例

```ts
/**
 * ユーザー ID から表示名を解決する。キャッシュに無ければ API を叩く。
 *
 * @param userId - 対象ユーザーの UUID
 * @param opts - 解決オプション（`force` 指定でキャッシュを無視）
 * @returns 表示名。ユーザーが存在しない場合は `null`
 * @throws {ApiError} API 通信に失敗した場合
 */
export async function resolveDisplayName(
  userId: string,
  opts?: { force?: boolean },
): Promise<string | null> {
  // ...
}
```

## Lint による強制

`eslint-plugin-jsdoc` を導入済み。**有効ルールの唯一の真実は `front/eslint.config.mjs` の JSDoc ブロック**（本書は方針、config は機械強制の実体）。CI の `static-analysis` ジョブ（`pnpm lint`）で検出する。

方針:

- **`require-jsdoc` は採用しない** — JSDoc の付与自体は強制せず、「書いたら完全であること」を強制する（未文書化の既存コードはエラーにせず段階導入する）。
- `settings.jsdoc.mode = "typescript"` + `jsdoc/no-types` で型の再掲を禁止（型は TS シグネチャが唯一の真実）。
- JSDoc ブロックを持つ関数は `jsdoc/require-param`（`checkDestructured: false`）/ `require-param-description` / `check-param-names` を必須。
- 返り値のある関数は `jsdoc/require-returns` / `require-returns-description` を必須。ただし **JSX を返す `.tsx` は `require-returns` を off**（「@returns …の要素」はノイズのため）。`.ts` のフック / lib / API では必須のまま。
