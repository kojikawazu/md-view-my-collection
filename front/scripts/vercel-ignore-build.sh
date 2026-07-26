#!/usr/bin/env bash
# 終了コード 0 = ビルドをスキップ / 非 0 = ビルドを実行（Vercel の規約。直感と逆）
set -uo pipefail

# 除外パス（ビルド成果物に影響しないものだけを列挙する）
EXCLUDES=(
  ':(top,exclude)docs'
  ':(top,exclude).claude'
  ':(top,exclude).github'
  ':(top,exclude)*.md'
)

# 比較基準は「前回"成功した"デプロイの SHA」。HEAD^ を使わない（理由は 2.2）
BASE="${VERCEL_GIT_PREVIOUS_SHA:-}"

# 基準が取れない場合は安全側 = ビルドを実行する
#   - 初回デプロイ / Ignored Build Step 未設定 → 変数が空
#   - shallow clone で基準コミットがローカルに存在しない → cat-file が失敗
if [ -z "$BASE" ] || ! git cat-file -e "${BASE}^{commit}" 2>/dev/null; then
  echo "baseline unavailable (VERCEL_GIT_PREVIOUS_SHA='${BASE}') -> build"
  exit 1
fi

if git diff --quiet "$BASE" HEAD -- "${EXCLUDES[@]}"; then
  echo "only ignored paths changed since ${BASE} -> skip"
  exit 0
fi

echo "deployable changes found since ${BASE} -> build"
exit 1
