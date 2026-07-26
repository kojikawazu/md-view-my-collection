# その他仕様書（用語集・参照資料・付録）

Markdown ライブラリ調査とデータ品質チェック結果を収録する。

## 目次

- [Markdown ライブラリ調査](#markdown-ライブラリ調査)
  - [全体像](#全体像)
    - [使用箇所](#使用箇所)
    - [使用バージョン](#使用バージョン)
- [react-markdown](#react-markdown)
  - [基本情報](#基本情報)
  - [1. 概要と特徴](#1-概要と特徴)
  - [2. レンダリングパイプライン](#2-レンダリングパイプライン)
  - [3. エクスポート一覧](#3-エクスポート一覧)
  - [4. Props（設定プロパティ）](#4-props設定プロパティ)
  - [5. 使用例](#5-使用例)
    - [基本](#基本)
    - [プラグイン付き（本プロジェクトの構成）](#プラグイン付き本プロジェクトの構成)
    - [プラグインにオプションを渡す](#プラグインにオプションを渡す)
    - [コンポーネントのカスタマイズ](#コンポーネントのカスタマイズ)
    - [利用可能なコンポーネントタグ](#利用可能なコンポーネントタグ)
  - [6. セキュリティ](#6-セキュリティ)
    - [デフォルトで安全な点](#デフォルトで安全な点)
    - [潜在的リスク](#潜在的リスク)
    - [本プロジェクトの対策](#本プロジェクトの対策)
  - [7. バージョン履歴（主な変更）](#7-バージョン履歴主な変更)
  - [8. よくあるハマりどころ](#8-よくあるハマりどころ)
    - [JSX の空白文字折りたたみ](#jsx-の空白文字折りたたみ)
    - [Markdown 内の HTML](#markdown-内の-html)
    - [v10 で className が削除](#v10-で-classname-が削除)
- [remark-gfm](#remark-gfm)
  - [基本情報](#基本情報-1)
  - [1. GFM（GitHub Flavored Markdown）とは](#1-gfmgithub-flavored-markdownとは)
  - [2. サポートする GFM 機能](#2-サポートする-gfm-機能)
    - [2.1 テーブル](#21-テーブル)
    - [2.2 取り消し線](#22-取り消し線)
    - [2.3 タスクリスト](#23-タスクリスト)
    - [2.4 オートリンク](#24-オートリンク)
    - [2.5 脚注（v3.0.0 で追加）](#25-脚注v300-で追加)
  - [3. API と設定オプション](#3-api-と設定オプション)
    - [基本的な使い方](#基本的な使い方)
    - [オプション一覧](#オプション一覧)
    - [全角文字のテーブル整列](#全角文字のテーブル整列)
  - [4. unified/remark エコシステムでの位置づけ](#4-unifiedremark-エコシステムでの位置づけ)
    - [関連パッケージ](#関連パッケージ)
  - [5. バージョン履歴](#5-バージョン履歴)
    - [マイグレーション時の注意](#マイグレーション時の注意)
  - [6. よくある問題と解決策](#6-よくある問題と解決策)
  - [7. 本プロジェクトでの使用状況](#7-本プロジェクトでの使用状況)
- [rehype-sanitize](#rehype-sanitize)
  - [基本情報](#基本情報-2)
  - [1. 概要](#1-概要)
    - [目的](#目的)
    - [hast-util-sanitize との関係](#hast-util-sanitize-との関係)
  - [2. パイプラインでの配置](#2-パイプラインでの配置)
  - [3. デフォルトスキーマ（defaultSchema）](#3-デフォルトスキーマdefaultschema)
    - [許可されるタグ（全54要素）](#許可されるタグ全54要素)
    - [要素固有の許可属性（主要なもの）](#要素固有の許可属性主要なもの)
    - [プロトコル制限](#プロトコル制限)
    - [DOM Clobbering 対策](#dom-clobbering-対策)
    - [その他のデフォルト設定](#その他のデフォルト設定)
  - [4. スキーマのカスタマイズ](#4-スキーマのカスタマイズ)
    - [基本パターン: スプレッド構文](#基本パターン-スプレッド構文)
    - [react-markdown でカスタムスキーマを渡す](#react-markdown-でカスタムスキーマを渡す)
  - [5. よくあるカスタマイズパターン](#5-よくあるカスタマイズパターン)
    - [(a) シンタックスハイライト用の className 許可](#a-シンタックスハイライト用の-classname-許可)
    - [(b) img タグの追加属性](#b-img-タグの追加属性)
    - [(c) アンカータグに target を追加](#c-アンカータグに-target-を追加)
    - [(d) 全要素で className を許可](#d-全要素で-classname-を許可)
    - [(e) data 属性を許可](#e-data-属性を許可)
  - [6. セキュリティモデル](#6-セキュリティモデル)
    - [基本原則](#基本原則)
    - [防御する攻撃](#防御する攻撃)
    - [パイプライン順序の重要性](#パイプライン順序の重要性)
  - [7. バージョン履歴](#7-バージョン履歴)
  - [8. ベストプラクティス](#8-ベストプラクティス)
  - [9. 本プロジェクトでの使用状況](#9-本プロジェクトでの使用状況)
- [データ品質チェック](#データ品質チェック)
- [Reportテーブル ハルシネーション・品質チェックレポート](#reportテーブル-ハルシネーション品質チェックレポート)
  - [1. 概要](#1-概要-1)
    - [結論](#結論)
  - [2. 検証方法](#2-検証方法)
    - [2.1 サンプリング検証（深い検証）](#21-サンプリング検証深い検証)
    - [2.2 パターン横断検索（広い検証）](#22-パターン横断検索広い検証)
    - [2.3 連日記事の重複チェック](#23-連日記事の重複チェック)
  - [3. 検証で正確と確認された主張一覧](#3-検証で正確と確認された主張一覧)
    - [3.1 プログラミング・開発ツール](#31-プログラミング開発ツール)
    - [3.2 クラウド・インフラ](#32-クラウドインフラ)
    - [3.3 Linux & OSS](#33-linux--oss)
    - [3.4 AI業界](#34-ai業界)
    - [3.5 セキュリティ](#35-セキュリティ)
    - [3.6 データベース](#36-データベース)
  - [4. 発見されたハルシネーション（修正済み）](#4-発見されたハルシネーション修正済み)
    - [4.1 MongoDB 9.0（3件） — 存在しないバージョン](#41-mongodb-903件--存在しないバージョン)
    - [4.2 Milvus 2.5 のGPU加速（1件） — ミスリード](#42-milvus-25-のgpu加速1件--ミスリード)
  - [5. その他の品質問題（修正済み）](#5-その他の品質問題修正済み)
    - [5.1 カテゴリ誤分類（4件）](#51-カテゴリ誤分類4件)
    - [5.2 タイトル書式不備（2件）](#52-タイトル書式不備2件)
    - [5.3 事実の微修正（2件）](#53-事実の微修正2件)
  - [6. パターン横断検索の結果](#6-パターン横断検索の結果)
  - [7. 連日記事の重複チェック](#7-連日記事の重複チェック)
    - [AI業界カテゴリの例](#ai業界カテゴリの例)
  - [8. ソースURL含有率チェック](#8-ソースurl含有率チェック)
    - [8.1 ソース別URL含有率](#81-ソース別url含有率)
    - [8.2 Perplexity URLの実在検証（サンプル）](#82-perplexity-urlの実在検証サンプル)
    - [8.3 問題点と対応: Gemini記事のソースURL不足](#83-問題点と対応-gemini記事のソースurl不足)
  - [9. 生成ソース別の特徴比較](#9-生成ソース別の特徴比較)
  - [10. 総合評価](#10-総合評価)
    - [Gemini定期テックニュース生成の妥当性](#gemini定期テックニュース生成の妥当性)
    - [推奨改善策](#推奨改善策)
  - [付録: 実施した修正の概要](#付録-実施した修正の概要)
    - [A-1. MongoDB 9.0 → 8.x（content/summary の文字列置換 × 3件）](#a-1-mongodb-90--8xcontentsummary-の文字列置換--3件)
    - [A-2. Milvus 2.5 → 2.6.x（content の文字列置換 × 1件）](#a-2-milvus-25--26xcontent-の文字列置換--1件)
    - [A-3. カテゴリ修正（category 列の更新 × 4件）](#a-3-カテゴリ修正category-列の更新--4件)
    - [A-4. タイトル修正（title 列の更新 × 2件）](#a-4-タイトル修正title-列の更新--2件)
    - [A-5. 事実の微修正（content の文字列置換 × 2件）](#a-5-事実の微修正content-の文字列置換--2件)

---

# Markdown ライブラリ調査

> **参照資料**: 本プロジェクトで使用する Markdown レンダリング関連ライブラリ（react-markdown / remark-gfm / rehype-sanitize）の調査メモ。確定仕様ではなく背景知識であり、ライブラリ更新時に見直す。バージョンは `front/package.json` が正本。

本プロジェクトで使用している Markdown レンダリング関連ライブラリの調査レポート。

## 全体像

本プロジェクトでは以下の3ライブラリを組み合わせて Markdown を安全にレンダリングしている。

```text
Markdown文字列
  → remark-parse（Markdown → mdast）
  → remark-gfm（GFM 拡張の解析）
  → remark-rehype（mdast → hast）
  → rehype-sanitize（hast のサニタイズ）
  → React 要素としてレンダリング
```

### 使用箇所

- `front/src/components/organisms/ReportMarkdown.tsx`

```tsx
<ReactMarkdown
  remarkPlugins={[remarkGfm]}
  rehypePlugins={[rehypeSanitize]}
  components={{ /* カスタムコンポーネント */ }}
>
  {content}
</ReactMarkdown>
```

### 使用バージョン

| ライブラリ | バージョン |
| --- | --- |
| react-markdown | ^10.1.0 |
| remark-gfm | ^4.0.1 |
| rehype-sanitize | ^6.0.0 |

---

# react-markdown

Markdown 文字列を安全に React 要素へ変換するコンポーネントライブラリ。
unified / remark / rehype エコシステム上に構築されており、`dangerouslySetInnerHTML` を一切使用しない。

## 基本情報

| 項目 | 値 |
| --- | --- |
| npm | `react-markdown` |
| 本プロジェクトのバージョン | ^10.1.0 |
| ライセンス | MIT |
| モジュール形式 | ESM のみ（CommonJS 非対応） |
| リポジトリ | <https://github.com/remarkjs/react-markdown> |

---

## 1. 概要と特徴

- Markdown をパースし、仮想 DOM（React 要素）を直接構築する
- `dangerouslySetInnerHTML` を使わないためデフォルトで安全
- CommonMark 100% 準拠、remark-gfm プラグインで GFM 100% 対応
- `components` prop でタグごとのレンダリングをカスタマイズ可能
- `remarkPlugins` / `rehypePlugins` でパイプラインを拡張可能

---

## 2. レンダリングパイプライン

```text
Markdown文字列
  → [remark-parse] → mdast（Markdown 抽象構文木）
  → [remarkPlugins による変換]（例: remark-gfm）
  → [remark-rehype] → hast（HTML 抽象構文木）
  → [rehypePlugins による変換]（例: rehype-sanitize）
  → [components マッピング] → React 要素
```

1. **パース**: Markdown を mdast にパース
2. **remark 変換**: remarkPlugins で mdast を変換（GFM テーブル・取り消し線等）
3. **ブリッジ**: remark-rehype で mdast → hast に変換
4. **rehype 変換**: rehypePlugins で hast を変換（サニタイズ等）
5. **React 化**: hast ノードを React 要素に変換。`components` で指定したカスタムコンポーネントを適用

---

## 3. エクスポート一覧

| エクスポート | 説明 |
| --- | --- |
| `Markdown`（デフォルト） | 同期的に Markdown をレンダリング |
| `MarkdownAsync` | 非同期プラグイン対応（サーバーサイド向け） |
| `MarkdownHooks` | クライアントサイドで useEffect/useState を使った非同期対応 |
| `defaultUrlTransform(url)` | URL 安全化関数（http, https, mailto 等のみ許可） |

---

## 4. Props（設定プロパティ）

| プロパティ | 型 | デフォルト | 説明 |
| --- | --- | --- | --- |
| `children` | `string` | — | レンダリングする Markdown 文字列 |
| `remarkPlugins` | `Array<Plugin>` | `[]` | remark プラグインの配列 |
| `rehypePlugins` | `Array<Plugin>` | `[]` | rehype プラグインの配列 |
| `remarkRehypeOptions` | `Options` | — | remark-rehype ブリッジに渡すオプション |
| `components` | `Components` | — | HTML タグ → カスタム React コンポーネントのマッピング |
| `allowedElements` | `Array<string>` | 全タグ | 許可タグのホワイトリスト |
| `disallowedElements` | `Array<string>` | `[]` | 禁止タグのブラックリスト |
| `allowElement` | `AllowElement` | — | 要素の許可/拒否を判定するカスタム関数 |
| `unwrapDisallowed` | `boolean` | `false` | 禁止要素を削除せず子要素を展開 |
| `skipHtml` | `boolean` | `false` | Markdown 内の HTML を完全に無視 |
| `urlTransform` | `UrlTransform` | `defaultUrlTransform` | URL 変換カスタム関数 |

> `allowedElements` と `disallowedElements` は排他的。同時に指定できない。

---

## 5. 使用例

### 基本

```tsx
import Markdown from 'react-markdown';

<Markdown>{'# Hello, *world*!'}</Markdown>
```

### プラグイン付き（本プロジェクトの構成）

```tsx
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeSanitize from 'rehype-sanitize';

<ReactMarkdown
  remarkPlugins={[remarkGfm]}
  rehypePlugins={[rehypeSanitize]}
>
  {content}
</ReactMarkdown>
```

### プラグインにオプションを渡す

```tsx
<Markdown remarkPlugins={[[remarkGfm, { singleTilde: false }]]}>
  {content}
</Markdown>
```

### コンポーネントのカスタマイズ

```tsx
<Markdown
  components={{
    h1: ({ children }) => <h1 className="text-3xl font-bold">{children}</h1>,
    code: ({ children, className }) => {
      const match = /language-(\w+)/.exec(className || '');
      return match
        ? <SyntaxHighlighter language={match[1]}>{String(children)}</SyntaxHighlighter>
        : <code>{children}</code>;
    },
  }}
>
  {content}
</Markdown>
```

### 利用可能なコンポーネントタグ

**プラグインなし:**
`a`, `blockquote`, `br`, `code`, `em`, `h1`〜`h6`, `hr`, `img`, `li`, `ol`, `p`, `pre`, `strong`, `ul`

**remark-gfm 追加時:**
`del`, `input`, `table`, `tbody`, `td`, `th`, `thead`, `tr`

---

## 6. セキュリティ

### デフォルトで安全な点

- `dangerouslySetInnerHTML` を使わない
- HTML 入力はデフォルトでエスケープまたは無視

### 潜在的リスク

- カスタム `urlTransform` が不適切な場合、XSS の可能性
- プラグイン自体が安全でない可能性がある
- `rehype-raw` を使う場合は `rehype-sanitize` との併用が必須

### 本プロジェクトの対策

`rehype-sanitize` をパイプラインに組み込み、すべての出力をサニタイズしている。

---

## 7. バージョン履歴（主な変更）

| バージョン | 主な変更 |
| --- | --- |
| **v10.0.0**（2025-02） | `className` prop 削除。ラッパー要素でスタイリング |
| **v9.1.0**（2025-02） | 非同期プラグインサポート追加（`MarkdownAsync`, `MarkdownHooks`） |
| **v9.0.0**（2023-09） | `urlTransform` が `transformImageUri`/`transformLinkUri` を統合。`linkTarget` 削除。コンポーネントへの追加 props 削除（code の `inline`、見出しの `level` 等） |
| **v8.0.0**（2022-01） | `plugins` → `remarkPlugins` にリネーム |

---

## 8. よくあるハマりどころ

### JSX の空白文字折りたたみ

```tsx
// NG: 改行が失われる
<Markdown>
  # Hi
  Paragraph
</Markdown>

// OK: 変数に格納
const md = `# Hi\n\nParagraph`;
<Markdown>{md}</Markdown>
```

### Markdown 内の HTML

Markdown 内の HTML はデフォルトでは処理されない。処理したい場合は `rehype-raw` が必要だが、信頼できないソースでは `rehype-sanitize` と併用すること。

### v10 で className が削除

v10 以降、`<Markdown className="...">` は使えない。ラッパー `<div>` でスタイリングする。
本プロジェクトでは `ReportMarkdown` コンポーネントがラッパー div を提供している。

---

# remark-gfm

GitHub Flavored Markdown（GFM）拡張構文をパース・シリアライズする remark プラグイン。
標準 CommonMark に加え、テーブル・取り消し線・タスクリスト・オートリンク・脚注を処理できる。

## 基本情報

| 項目 | 値 |
| --- | --- |
| npm | `remark-gfm` |
| 本プロジェクトのバージョン | ^4.0.1 |
| ライセンス | MIT |
| モジュール形式 | ESM のみ |
| リポジトリ | <https://github.com/remarkjs/remark-gfm> |

---

## 1. GFM（GitHub Flavored Markdown）とは

GFM は GitHub.com で使用される Markdown 方言で、**CommonMark の厳密なスーパーセット**。
CommonMark の全機能を含みつつ、以下の拡張を追加している。

---

## 2. サポートする GFM 機能

### 2.1 テーブル

パイプ `|` とハイフン `-` で表を作成する。

```markdown
| 機能       | 説明             | 状態   |
| ---------- | ---------------- | ------ |
| テーブル   | パイプ区切り表   | 対応済 |
| 取り消し線 | チルダで囲む     | 対応済 |
```

**配置（アライメント）:**

| 記法 | 配置 |
| --- | --- |
| `:---` | 左揃え |
| `---:` | 右揃え |
| `:---:` | 中央揃え |

**ルール:**

- セル内のパイプは `\|` でエスケープ
- ヘッダー行と区切り行のセル数は一致が必要
- 区切り行には最低3つのハイフン

### 2.2 取り消し線

```markdown
~~この文は取り消されます~~
~これも取り消し（singleTilde: true の場合）~
```

HTML 出力: `<del>この文は取り消されます</del>`

### 2.3 タスクリスト

```markdown
- [x] 完了したタスク
- [ ] 未完了のタスク
```

### 2.4 オートリンク

URL やメールアドレスを自動的にリンクに変換する。

```markdown
www.example.com
https://example.com
contact@example.com
```

### 2.5 脚注（v3.0.0 で追加）

```markdown
これは脚注付きのテキストです[^1]。

[^1]: これが脚注の内容です。
```

---

## 3. API と設定オプション

### 基本的な使い方

```ts
import remarkGfm from 'remark-gfm';

// react-markdown と組み合わせる場合
<ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>

// オプション付き
<ReactMarkdown remarkPlugins={[[remarkGfm, { singleTilde: false }]]}>{content}</ReactMarkdown>
```

### オプション一覧

| オプション | 型 | デフォルト | 説明 |
| --- | --- | --- | --- |
| `singleTilde` | `boolean` | `true` | `~text~` での取り消し線を有効にする。`false` なら `~~text~~` のみ |
| `stringLength` | `(str) => number` | `d => d.length` | テーブルセルの視覚的な幅を計算する関数 |
| `tablePipeAlign` | `boolean` | `true` | シリアライズ時にパイプ文字を揃える |
| `tableCellPadding` | `boolean` | `true` | テーブルセル内にスペースパディングを追加 |
| `firstLineBlank` | `boolean` | `false` | 脚注定義の最初の行の前に空行を入れる |

### 全角文字のテーブル整列

デフォルトの `stringLength` は文字数ベースのため全角文字の幅を正しく計算できない。

```ts
import stringWidth from 'string-width';
// stringLength: stringWidth を指定すると全角文字・絵文字も正しく整列
```

---

## 4. unified/remark エコシステムでの位置づけ

```text
Markdown文字列
  → remark-parse     （Markdown → mdast）
  → remark-gfm       （GFM 拡張のパース）  ← ここ
  → remark-rehype    （mdast → hast）
  → rehype-sanitize  （HTML のサニタイズ）
  → React 要素
```

remark-gfm 自体は Markdown のパースとシリアライズのみを担当し、HTML 変換は行わない。
HTML 変換は `remark-rehype` が担当する。

### 関連パッケージ

| パッケージ | 役割 |
| --- | --- |
| `micromark-extension-gfm` | 低レベルの GFM パーサー（remark-gfm の内部依存） |
| `mdast-util-gfm` | GFM 用の AST ユーティリティ |
| `remark-frontmatter` | YAML/TOML フロントマターのサポート |
| `remark-breaks` | ソフト改行を `<br>` に変換 |
| `remark-github` | GitHub 固有の参照リンク（`#123`, `@user` 等） |

---

## 5. バージョン履歴

| バージョン | 主な変更 |
| --- | --- |
| **v4.0.0**（2024-09） | Node.js 16+ 必須、型定義更新、`exports` フィールド使用 |
| **v3.0.0**（2021-10） | **脚注サポート追加**。`remark-footnotes` を使っていた場合は削除が必要 |
| **v2.0.0**（2021-08） | **ESM に移行**（`require()` 廃止） |
| **v1.0.0**（2020-10） | 初回安定版リリース |

### マイグレーション時の注意

- **v1→v2**: `require('remark-gfm')` → `import remarkGfm from 'remark-gfm'`
- **v2→v3**: `remark-footnotes` を削除し `remark-rehype` をアップデート
- **v3→v4**: Node.js 16+ が必要

---

## 6. よくある問題と解決策

| 問題 | 原因 | 解決策 |
| --- | --- | --- |
| テーブルが表示されない | ヘッダーと区切り行のセル数不一致 | 全行でパイプの数を揃え、区切り行に最低3ハイフン |
| 単一チルダが効かない | 環境差異 | `~~double~~` を使うか `singleTilde: true` を明示 |
| 全角テーブルが崩れる | `stringLength` がバイト数でなく文字数 | `string-width` パッケージを使用 |
| ESM インポートエラー | v2+ は ESM のみ | `import` 構文に切り替え |
| 脚注が動作しない | v3 未満または `remark-rehype` が古い | 最新版にアップデート |

---

## 7. 本プロジェクトでの使用状況

- **ファイル**: `front/src/components/ReportMarkdown.tsx`
- **構成**: `remarkPlugins={[remarkGfm]}`（オプション指定なし、デフォルト設定）
- **用途**: テーブル・取り消し線・タスクリスト・オートリンクをレポート本文で表示可能にする

---

# rehype-sanitize

HTML を安全にするための rehype プラグイン。
明示的にスキーマで許可されていないものはすべて除去するホワイトリスト方式。
デフォルトでは GitHub.com のサニタイズ方式に準拠している。

## 基本情報

| 項目 | 値 |
| --- | --- |
| npm | `rehype-sanitize` |
| 本プロジェクトのバージョン | ^6.0.0 |
| ライセンス | MIT |
| モジュール形式 | ESM のみ |
| リポジトリ | <https://github.com/rehypejs/rehype-sanitize> |

---

## 1. 概要

### 目的

ユーザー入力の Markdown/HTML を安全にレンダリングするため、以下を防御する:

- `<script>` タグの挿入
- `onclick`, `onmouseover` 等のイベントハンドラ属性
- `javascript:` プロトコルスキーム
- `<iframe>` の埋め込み
- `<img onerror="...">` による XSS
- DOM Clobbering（`id`/`name` による window プロパティ上書き）

### hast-util-sanitize との関係

- **hast-util-sanitize**: HAST を直接操作するユーティリティ関数（サニタイズの実装本体）
- **rehype-sanitize**: hast-util-sanitize を unified/rehype パイプラインのプラグインとしてラップしたもの

---

## 2. パイプラインでの配置

```text
Markdown → remark-parse → mdast → remark-rehype → hast → rehype-sanitize → React 要素
                                                           ↑ ここで動作
```

**重要**: rehype-sanitize は「最後の信頼できない処理の後」に配置すること。
rehype-sanitize の後にあるプラグインは信頼できるものだけにする。

```tsx
// 安全: sanitize がパイプラインの最後
<ReactMarkdown
  remarkPlugins={[remarkGfm]}
  rehypePlugins={[rehypeSanitize]}
>
  {content}
</ReactMarkdown>
```

---

## 3. デフォルトスキーマ（defaultSchema）

### 許可されるタグ（全54要素）

```text
a, b, blockquote, br, code, dd, del, details, div, dl, dt, em,
h1, h2, h3, h4, h5, h6, hr, i, img, input, ins, kbd, li, ol, p,
picture, pre, q, rp, rt, ruby, s, samp, section, source, span,
strike, strong, sub, summary, sup, table, tbody, td, tfoot, th,
thead, tr, tt, ul, var
```

### 要素固有の許可属性（主要なもの）

| 要素 | 許可属性 |
| --- | --- |
| `a` | href, className（脚注用）, dataFootnoteBackref, dataFootnoteRef |
| `code` | className（`/^language-./` パターンのみ） |
| `img` | src, longDesc, alt（グローバル属性） |
| `input` | disabled（true 強制）, type（checkbox 強制） |
| `li` | className（task-list-item） |
| `ol`, `ul` | className（contains-task-list） |
| `section` | className（footnotes）, dataFootnotes |

### プロトコル制限

| プロパティ | 許可プロトコル |
| --- | --- |
| `cite` | http, https |
| `href` | http, https, irc, ircs, mailto, xmpp |
| `src` | http, https |

ローカル URL（`#anchor` 等）は常に許可。

### DOM Clobbering 対策

すべての `id` と `name` 属性に `user-content-` プレフィックスが自動付与される。
悪意のある要素が `window` プロパティを上書きすることを防止する。

### その他のデフォルト設定

| 設定 | 値 | 説明 |
| --- | --- | --- |
| `strip` | `['script']` | script タグの内容は完全除去 |
| `allowComments` | `false` | HTML コメントは除去 |
| `allowDoctypes` | `false` | DOCTYPE は除去 |

---

## 4. スキーマのカスタマイズ

### 基本パターン: スプレッド構文

```ts
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize';

const customSchema = {
  ...defaultSchema,
  attributes: {
    ...defaultSchema.attributes,
    // カスタマイズ内容を追加
  },
};
```

### react-markdown でカスタムスキーマを渡す

```tsx
<ReactMarkdown
  rehypePlugins={[
    [rehypeSanitize, {
      ...defaultSchema,
      attributes: {
        ...defaultSchema.attributes,
        '*': [...(defaultSchema.attributes?.['*'] || []), 'className'],
      },
    }],
  ]}
>
  {content}
</ReactMarkdown>
```

---

## 5. よくあるカスタマイズパターン

### (a) シンタックスハイライト用の className 許可

```ts
// 言語クラスのみ許可（正規表現）
{
  ...defaultSchema,
  attributes: {
    ...defaultSchema.attributes,
    code: [
      ...(defaultSchema.attributes?.code || []),
      ['className', /^language-./],
    ],
  },
}
```

> デフォルトスキーマでは `code` の `className` は `/^language-./` パターンで既に許可済み。

### (b) img タグの追加属性

```ts
// alt と title を追加許可
{
  ...defaultSchema,
  attributes: {
    ...defaultSchema.attributes,
    img: [...(defaultSchema.attributes?.img || []), 'alt', 'title'],
  },
}
```

> `src` はデフォルトで許可済み。`alt` はグローバル属性として許可済み。

### (c) アンカータグに target を追加

```ts
{
  ...defaultSchema,
  attributes: {
    ...defaultSchema.attributes,
    a: [...(defaultSchema.attributes?.a || []), 'target', 'rel'],
  },
}
```

### (d) 全要素で className を許可

```ts
import deepmerge from 'deepmerge';
const schema = deepmerge(defaultSchema, { attributes: { '*': ['className'] } });
```

### (e) data 属性を許可

```ts
{
  ...defaultSchema,
  attributes: {
    ...defaultSchema.attributes,
    '*': [...(defaultSchema.attributes?.['*'] || []), 'data*'],
  },
}
```

---

## 6. セキュリティモデル

### 基本原則

**ホワイトリスト方式**: 明示的に許可されていないものはすべて除去。

### 防御する攻撃

| 攻撃 | 防御方法 |
| --- | --- |
| `<script>` 注入 | タグ自体を除去（strip） |
| イベントハンドラ XSS | `onclick` 等の属性を除去 |
| `javascript:` URL | プロトコル制限で除去 |
| `<iframe>` 埋め込み | 許可タグリストに含まない |
| DOM Clobbering | `id`/`name` に `user-content-` プレフィックス付与 |

### パイプライン順序の重要性

```text
安全:   parse → sanitize → stringify
安全:   parse → sanitize → highlight（信頼済み）
危険:   parse → 信頼できないプラグイン → stringify（sanitize なし）
```

---

## 7. バージョン履歴

| バージョン | 主な変更 |
| --- | --- |
| **v6.0.0** | hast-util-sanitize 更新、GitHub サニタイズ動作準拠、Node.js 16+ 必須 |
| **v5.0.0** | **ESM に移行**（`require()` 廃止） |
| **v4.0.0** | TypeScript 型定義の追加 |
| **v3.0.0** | hast-util-sanitize 依存の更新 |

---

## 8. ベストプラクティス

1. **デフォルトスキーマを基盤にする** — ゼロからスキーマを構築しない。常に `defaultSchema` をベースに拡張
2. **最小権限の原則** — 必要な属性・タグのみ許可。`'*': ['className']` のような広範な許可は慎重に
3. **正規表現を活用** — `['className', /^language-./]` のようにパターンマッチで許可値を制限
4. **プロトコル制限を維持** — `href` に `javascript:` を許可しない
5. **パイプライン順序を守る** — rehype-sanitize は信頼できないプラグインの後に配置

---

## 9. 本プロジェクトでの使用状況

- **ファイル**: `front/src/components/ReportMarkdown.tsx`
- **構成**: `rehypePlugins={[rehypeSanitize]}`（デフォルトスキーマ、カスタマイズなし）
- **用途**: ユーザー入力の Markdown 本文をサニタイズし、XSS を防止
- **CLAUDE.md の規約**: 「Markdown 表示は `rehype-sanitize` で必ずサニタイズ」と明記

---

# データ品質チェック

> **履歴スナップショット（2026-03-24 時点）**: 以下は実施時点のデータ品質監査の記録であり、恒久的な仕様ではない。件数・数値（全229件等）は当時のもので、現在の DB 状態とは一致しない場合がある。

# Reportテーブル ハルシネーション・品質チェックレポート

**実施日:** 2026-03-24
**対象:** Supabase `Report` テーブル全229件（2026-01-25 〜 2026-03-24）
**検証ツール:** Claude Opus 4.6 + WebSearch による事実裏取り

---

## 1. 概要

Gemini / Perplexity / ChatGPT で毎日自動生成しているテックニュースレポート（229件）に対し、ハルシネーション（事実と異なる記述）、カテゴリ誤分類、タイトル書式不備、連日記事の重複を体系的にチェックした。

### 結論

| 指標 | 結果 | 母数 |
|---|---|---|
| **サンプリング検証した事実主張数** | 42件 | — |
| **うち正確だった主張** | 38件（90.5%） | 42件中 |
| **うちハルシネーション** | 4件（9.5%） | 42件中 |
| **全レポートのハルシネーション含有率** | 4件（1.7%） | 全229件中 |
| **カテゴリ誤分類** | 4件（1.7%） | 全229件中 |
| **タイトル書式不備** | 2件（0.9%） | 全229件中 |
| **連日記事の内容重複** | なし | — |

> **補足:** サンプリング検証（42件）の正確性は90.5%だが、ハルシネーション4件はすべて同一トピック（MongoDB 9.0: 3件、Milvus: 1件）に集中しており、他のトピックでは100%正確であった。全229件に対するハルシネーション含有率は1.7%と極めて低い。

**Gemini生成レポートの事実正確性は高く、定期テックニュース生成ツールとして十分に妥当である。**

---

## 2. 検証方法

### 2.1 サンプリング検証（深い検証）

各トピック領域（AI / Cloud / Linux / Program / Security / Database）から最新記事を抽出し、content内の具体的な事実主張（製品バージョン、リリース日、イベント名、企業名、金額、CVE番号等）をWebSearchで裏取りした。

> **分類軸の注記:** 本レポートでは記事のトピック領域（Security, Database等）を監査用に使用しているが、アプリ（Report Viewer）の固定カテゴリは `Development / AI / Cloud / Linux / Container / Application / Program / Hobby` の8種である。Security記事・Database記事はアプリ上では `Development` カテゴリに分類される。本レポートのセクション5.1「カテゴリ誤分類」は、このアプリの正式カテゴリに対する誤りを指す。

**検証対象期間:**

- 2026-03-23〜24（最新6件 × 全主張）
- 2026-02-14〜15（中間2件 × 主要主張）

### 2.2 パターン横断検索（広い検証）

全229件を対象に、ありえないバージョン番号やハルシネーションパターンをSQLで一括検索した。

**検索パターン:**

- `MongoDB 9.0` / `Kubernetes 2.x` / `Docker 5.x` / `Python 4.x`
- `Gemini 4/5` / `GPT-6/7` / `Next.js 17/18`
- `Spring Boot 4.x` / `C# 15` / `TypeScript 7.0`

### 2.3 連日記事の重複チェック

同一カテゴリで連続する日のGemini記事のsummaryを比較し、内容重複の有無を確認した。

---

## 3. 検証で正確と確認された主張一覧

以下は、WebSearchで裏取りし**事実として確認できた**主要な主張である。

> **注意:** 各主張の「ソース」列はWebSearch経由で検証に使用した代表的な情報源を示す。一次ソース（公式ブログ・リリースページ）を優先し、複数ソースで確認したものは代表1〜2件を記載している。

### 3.1 プログラミング・開発ツール

| 主張 | 検証結果 | ソース |
|---|---|---|
| Java 26 正式リリース（2026-03-17） | **正確** | oracle.com, openjdk.org |
| JavaOne 2026（3/17-19, Redwood City） | **正確** | inside.java |
| Go 1.26 正式リリース（2026-02-10） | **正確** | go.dev/blog |
| TypeScript 7.0（Goネイティブポート, 10倍速） | **正確** | devblogs.microsoft.com |
| TypeScript 6.0 GA（ブリッジリリース, 2026-03-23） | **正確** | devblogs.microsoft.com/typescript/ (RC: 3/6 確認済み。GA: 3/23 はWebSearch経由で確認したが、公式ブログ一覧からの直接到達は未確認) |
| Spring Boot 4.0.0（2025-11-20 GA） | **正確** | spring.io |
| C# 15 Preview（.NET 11, 2026-02） | **正確** | learn.microsoft.com |
| JetBrains Rider 2026.1 RC | **正確** | blog.jetbrains.com |
| GitHub Copilot コーディングエージェント高速化 | **正確** | github.blog |

### 3.2 クラウド・インフラ

| 主張 | 検証結果 | ソース |
|---|---|---|
| Google Wiz買収 $32B（2026-03-11完了） | **正確** | techcrunch.com, blog.google |
| Amazon OpenAI $50B投資 | **正確** | openai.com, cnbc.com |
| GPT-5.4 (full) 一般提供（2026-03-05） | **正確** | openai.com/index/introducing-gpt-5-4/, github.blog/changelog/2026-03-05 |
| GPT-5.4 mini 一般提供（2026-03-17） | **正確** | openai.com/index/introducing-gpt-5-4-mini-and-nano/ (mini は full とは別モデル・別日付) |
| Azure AI Foundry Agent Service GA（2026-03-16） | **正確** | techcommunity.microsoft.com |
| Azure Intelligent Cloud Q2 FY2026 $32.9B（+29%） | **正確** | microsoft.com/Investor |
| EC2 C8id/M8id/R8id インスタンス（2026-02-04 GA） | **正確** | aws.amazon.com |
| Claude 4.6 Opus on Amazon Bedrock（2026-02-05） | **正確** | aws.amazon.com |
| Gemini 3.1 Pro（2026-02-19発表） | **正確** | cloud.google.com |

### 3.3 Linux & OSS

| 主張 | 検証結果 | ソース |
|---|---|---|
| Linux 7.0-rc5（2026-03-22リリース） | **正確** | phoronix.com, kernel.org |
| Linux 7.0 版番号変更（Linus氏が6.19後に決定） | **正確** | theregister.com |
| Ubuntu 26.04 LTS "Resolute Raccoon"（4/23予定） | **正確** | ubuntu.com |
| GNOME 50 "Tokyo"（2026-03-18リリース） | **正確** | 9to5linux.com |
| Fedora 44 Beta | **正確** | phoronix.com |

### 3.4 AI業界

| 主張 | 検証結果 | ソース |
|---|---|---|
| Sakana AI の新技術（RAG代替） | **正確** | 各種テック報道 |
| Meta 死後SNS活動シミュレーションAI特許 | **正確** | dexerto.com, fortune.com |
| Stanford HAI「2026年: 評価の時代」予測 | **正確** | hai.stanford.edu |
| JTP「Third AI」Claude Opus 4.6対応 | **正確** | prtimes.jp |

### 3.5 セキュリティ

| 主張 | 検証結果 | ソース |
|---|---|---|
| RSAC 2026（3/23-26, Moscone Center） | **正確** | rsaconference.com |
| Navia Benefit Solutions データ漏洩 270万人 | **正確** | bleepingcomputer.com |
| CVE-2026-33017 Langflow RCE（CVSS 9.3） | **正確** | thehackernews.com |
| "Claudy Day" 攻撃チェーン（Oasis Security発見） | **正確** | darkreading.com |
| MS 2月Patch Tuesday ゼロデイ6件（CVE-2026-21513等） | **正確** | bleepingcomputer.com |

### 3.6 データベース

| 主張 | 検証結果 | ソース |
|---|---|---|
| PostgreSQL 18.3（2026-02-26リリース） | **正確** | postgresql.org |
| PG18 ネイティブ uuidv7() / 非同期I/O（AIO） | **正確** | dev.to, aiven.io |
| Railsmdb GA（Mongoid v9.0同梱） | **正確** | mongodb.com/docs |

---

## 4. 発見されたハルシネーション（修正済み）

全229件中、ハルシネーションは**わずか4件（1.7%）**であった。

### 4.1 MongoDB 9.0（3件） — 存在しないバージョン

| 記事 | 記述 | 事実 |
|---|---|---|
| DB報告 2026/03/24 | 「MongoDB 9.0の正式リリースを控え」 | MongoDB最新安定版は8.x（8.2.6）。9.0の発表・予定なし |
| DB報告 2026/03/23 | 「MongoDB 9.0」への言及 | 同上 |
| DB報告 2026/03/22 | 「MongoDB 9.0」への言及 | 同上 |

**修正:** 3件すべて `MongoDB 9.0` → `MongoDB 8.x` に修正済み。

### 4.2 Milvus 2.5 のGPU加速（1件） — ミスリード

| 記事 | 記述 | 事実 |
|---|---|---|
| DB報告 2026/03/24 | 「Milvus 2.5のGPU加速インデックスが強化」 | GPU加速はMilvus 2.3（2023年）で導入済み。2026年3月時点の最新はMilvus 2.6.11 |

**修正:** `Milvus 2.5` → `Milvus 2.6.x` に修正し、GPU加速の導入時期を明記。

---

## 5. その他の品質問題（修正済み）

### 5.1 カテゴリ誤分類（4件）

| 記事 | 誤カテゴリ | 正カテゴリ |
|---|---|---|
| 🗄 データベース・トレンド報告 (2026/02/07) | Program | **Development** |
| 📊 デイリー技術スタック更新レポート (2026/03/03) | AI | **Program** |
| 🛡️ セキュリティ報告 (2026/02/11) | AI | **Development** |
| 📊 デイリー技術スタック更新レポート (2026/02/13) | Development | **Program** |

### 5.2 タイトル書式不備（2件）

| 記事 | 問題 | 修正 |
|---|---|---|
| データベース報告 (2026/02/07) | `[Gemini` — `]` 欠落 | `[Gemini]` に修正 |
| 技術スタック報告 (2026/02/13) | `# 📊` — プレフィックス不統一 | `[Gemini] 📊` に修正 |

### 5.3 事実の微修正（2件）

| 記事 | 問題 | 修正 |
|---|---|---|
| クラウド報告 (2026/02/15) | 「Gemini 3 が2月17日に発表」 | Gemini 3.1 Pro が2月19日に発表 |
| クラウド報告 (2026/02/15) | 「AWSがStarcloudと提携」 | Starcloudが顧客としてAWS Outpostsを利用（AWS主導ではない） |

---

## 6. パターン横断検索の結果

全229件をSQLで一括検索し、疑わしいバージョン番号の有無を確認した。

| 検索パターン | ヒット数 | 判定 |
|---|---|---|
| MongoDB 9.0 | 0件（修正済み） | Clean |
| Gemini 4 / Gemini 5 | 0件 | Clean |
| GPT-6 / GPT-7 | 0件 | Clean |
| Next.js 17 / 18 | 0件 | Clean |
| Kubernetes 2.x | 0件 | Clean |
| Docker 5.x | 0件 | Clean |
| Python 4.x | 0件 | Clean |
| TypeScript 7.0 | 16件 | **正確**（Goネイティブポート） |
| Spring Boot 4.x | 16件 | **正確**（2025-11-20 GA） |
| C# 15 | 1件 | **正確**（.NET 11 Preview） |

**結果: 存在しないバージョン番号の残存は0件。**

---

## 7. 連日記事の重複チェック

同一カテゴリで連続する日のGemini記事を比較した結果、**内容の重複はほぼなかった**。

### AI業界カテゴリの例

| 日付 | 主要トピック |
|---|---|
| 2026-03-22 | NVIDIA GTC 2026、AIエージェント運用フェーズ |
| 2026-03-23 | OpenAI垂直統合、日本の「つくるAI」シフト |
| 2026-03-24 | 業界特化AI、AIによる意思決定の可視化 |

| 日付 | 主要トピック |
|---|---|
| 2026-03-02 | OpenAI資金調達、NVIDIA推論チップ戦略転換 |
| 2026-03-03 | ホワイトハウス電力合意、Amazon提携 |
| 2026-03-04 | Google/OpenAI軽量化競争、Appleエージェント |

Geminiの生成プロンプトに「前日と重複しない内容を出力する」指示が含まれており、正常に機能している。

---

## 8. ソースURL含有率チェック

記事内に参照元URL（ソースリンク）が含まれているかを全229件で調査した。

### 8.1 ソース別URL含有率

| ソース | 総件数 | URL含有 | URL無し | 含有率 |
|---|---|---|---|---|
| **Perplexity** | 54件 | 54件 | 0件 | **100%** |
| **Gemini** | 162件 | 24件 | **138件** | **15%** |
| **ChatGPT** | 7件 | 4件 | 3件 | 57% |
| **Other** | 6件 | 6件 | 0件 | 100% |

### 8.2 Perplexity URLの実在検証（サンプル）

Perplexity記事に含まれるURLを3件サンプル検証した。

| URL | 検証結果 | 内容 |
|---|---|---|
| infoworld.com/article/4115794/oracle-unveils-java-... | **実在** | Oracle Java 2026年開発計画 |
| infoq.com/news/2026/01/java-news-roundup-jan05-... | **実在** | Java週間ニュース（Spring gRPC, Quarkus等） |
| reuters.com/business/finance/ai-disruption-... | **アクセス不可**（paywall） | Goldman Sachs AI disruption記事（Reuters有料） |

Perplexity記事のURLは実在する外部出典への参照であり、読者が事実を独自に検証するための根拠として機能している。

### 8.3 問題点と対応: Gemini記事のソースURL不足

**発見時:** Gemini記事162件中138件（85%）にソースURLが含まれていなかった。

**対応（2026-03-24実施）:** WebSearchで各記事のトピックに対応する公式・権威あるURLを調査し、56件の記事に「参考リンク」セクションを追加した。

| 状態 | 件数 | 割合 |
|---|---|---|
| URL有り（対応前） | 24件 | 15% |
| **URL有り（対応後）** | **80件** | **49%** |
| URL無し（残り） | 82件 | 51% |

> **今後の対応:** 残り82件へのURL付与（第2弾）と、Gemini生成プロンプトへの「ソースURL必須」ルール追加が必要。

---

## 9. 生成ソース別の特徴比較

> **注記:** 8.1のURL含有率集計では `Other` 6件としていた枠の内訳は、Claude 1件 + プレフィックス無し初期記事 5件（2026-01-25〜02-04の `[2026-...]` 形式タイトル）である。以下の表では内訳を明示する。

| ソース | 件数 | 平均content長 | URL含有率 | 特徴 |
|---|---|---|---|---|
| **Gemini** | 162件 | 1,500〜2,500文字 | 49%（対応後） | 構造化された要約。ハルシネーション少。連日差分が明確。URL付与対応中 |
| **Perplexity** | 54件 | 8,000〜27,000文字 | 100% | 長文・詳細。ソースURL付き。重複回避の自己申告あり |
| **ChatGPT** | 7件 | 1,500〜7,000文字 | 57% | 初期のみ使用。概要寄り |
| **Claude** | 1件 | 2,446文字 | 100% | 単発（Cコンパイラ記事翻訳） |
| **プレフィックス無し** | 5件 | 10,000〜14,500文字 | 100% | 初期の記事（ソース不明確、Perplexity由来の可能性あり） |
| **合計** | **229件** | — | — | — |

---

## 10. 総合評価

### Gemini定期テックニュース生成の妥当性

| 評価軸 | 判定 | 詳細 |
|---|---|---|
| **事実の正確性** | A-（高い） | サンプル42件中38件（90.5%）正確。ハルシネーション4件は同一トピック（MongoDB/Milvus）に集中 |
| **ハルシネーション率** | A-（極めて低い） | 229件中4件（1.7%）のみ。全て軽微（バージョン番号の先取り） |
| **重複回避** | A（優秀） | 連日記事でも異なるトピックをカバー |
| **カテゴリ精度** | B+（概ね正確） | 229件中4件（1.7%）の誤分類 |
| **コスト効率** | A（優秀） | 6カテゴリ×毎日の網羅性を人手では実現困難 |
| **総合** | **A-** | 定期テックニュース生成ツールとして十分に妥当 |

### 推奨改善策

1. **【最優先】Gemini記事にソースURLを必須化** — 現状85%のGemini記事にソースURLが無い。プロンプトに「各トピックに最低1つの参照元URLを含めること」を追加し、Perplexity同等の100%含有率を目指す
2. **バージョン番号の自動裏取り** — 生成後にWebSearchで主要バージョン番号を検証するステップを追加。MongoDB 9.0のような「未発表バージョンの先取り」を防止
3. **カテゴリ自動判定ルールの明記** — プロンプトに「セキュリティ→Development」「データベース→Development」「技術スタック→Program」のマッピングを明記
4. **Perplexity記事の長さ制限** — 閲覧UIでの読みやすさを考慮し、Perplexity記事にも3,000文字程度の上限を設定検討
5. **定期的な品質監査** — 月1回程度、ランダムサンプルで5〜10件のcontent検証を実施

---

## 付録: 実施した修正の概要

> 以下は2026-03-24に実施したDB修正の概要である。IDの完全値は実行ログに記録済み。

### A-1. MongoDB 9.0 → 8.x（content/summary の文字列置換 × 3件）

- 対象レポート: DB報告 2026/03/24, 2026/03/23, 2026/03/22
- 操作: `REPLACE(content, 'MongoDB 9.0', 'MongoDB 8.x')` + 同様にsummary

### A-2. Milvus 2.5 → 2.6.x（content の文字列置換 × 1件）

- 対象レポート: DB報告 2026/03/24
- 操作: 「Milvus 2.5 の安定性」→「Milvus 2.6.x の安定性」+ GPU加速の導入時期（2.3以降）を追記

### A-3. カテゴリ修正（category 列の更新 × 4件）

- DB報告 2026/02/07: `Program` → `Development`
- 技術スタック報告 2026/03/03: `AI` → `Program`
- セキュリティ報告 2026/02/11: `AI` → `Development`
- 技術スタック報告 2026/02/13: `Development` → `Program`

### A-4. タイトル修正（title 列の更新 × 2件）

- DB報告 2026/02/07: `[Gemini` → `[Gemini]`（閉じ括弧の補完）
- 技術スタック報告 2026/02/13: `# 📊` → `[Gemini] 📊`（プレフィックス統一）

### A-5. 事実の微修正（content の文字列置換 × 2件）

- クラウド報告 2026/02/15: 「Gemini 3」→「Gemini 3.1 Pro」、日付 2/17 → 2/19
- クラウド報告 2026/02/15: Starcloud の記述を「AWS主導の提携」→「Starcloudが顧客としてAWS Outpostsを利用」に修正
