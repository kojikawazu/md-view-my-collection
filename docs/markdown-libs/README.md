# Markdown ライブラリ調査レポート

本プロジェクトで使用している Markdown レンダリング関連ライブラリの調査レポート。

## 目次

| ファイル | 内容 |
| --- | --- |
| [01.react-markdown.md](./01.react-markdown.md) | react-markdown — Markdown → React 変換コンポーネント |
| [02.remark-gfm.md](./02.remark-gfm.md) | remark-gfm — GitHub Flavored Markdown 拡張プラグイン |
| [03.rehype-sanitize.md](./03.rehype-sanitize.md) | rehype-sanitize — HTML サニタイズプラグイン |

## 全体像

本プロジェクトでは以下の3ライブラリを組み合わせて Markdown を安全にレンダリングしている。

```
Markdown文字列
  → remark-parse（Markdown → mdast）
  → remark-gfm（GFM 拡張の解析）
  → remark-rehype（mdast → hast）
  → rehype-sanitize（hast のサニタイズ）
  → React 要素としてレンダリング
```

### 使用箇所

- `front/src/components/ReportMarkdown.tsx`

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
