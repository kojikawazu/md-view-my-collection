#!/usr/bin/env bash
# Git の追跡対象に秘匿ファイル（鍵・.env 系）が含まれていないかを検査する（Issue #205）。
#
# .gitignore は未追跡ファイルにしか効かず、一度 push した秘匿ファイルは追跡を外しても
# 履歴に残る（対処は鍵のローテーションしかない）。そのため「追跡された時点で落とす」検出を CI に置く。
#
# 使い方:
#   bash .github/scripts/secret-scan.sh      # git ls-files（追跡対象）を検査する
#   ... | bash .github/scripts/secret-scan.sh -   # 標準入力のパス一覧を検査する（secret-scan.test.sh 用）
#
# 終了コード: 0 = 検出なし / 1 = 秘匿ファイルを検出 / それ以外 = 検査自体の失敗
set -euo pipefail

# 検出対象: .env 系・鍵/証明書/キーストア・SSH 秘密鍵・クラウドの認証情報 JSON
SECRET_PATTERN='(^|/)(\.env(\..+)?|[^/]+\.(key|pem|p12|pfx|jks|keystore)|id_rsa|id_ed25519|id_dsa|credentials\.json|serviceAccountKey\.json)$'
# 除外: 値を持たないテンプレート（.env.example 等）と、環境変数の型定義（env.d.ts）
ALLOW_PATTERN='\.(example|sample|template|dist)$|\.env\.d\.ts$'

# grep は一致 0 件で終了コード 1 を返し、-e / pipefail の下ではそれだけでスクリプトが止まる。
# 「秘匿ファイルが無い（正常）」ときにこそ落ちてしまうため、1 だけを正常として扱う。
# 2 以上（正規表現の誤り等）は検査自体の失敗なので、握りつぶさずに落とす。
match() { grep -iE "$1" || [ $? -eq 1 ]; }
exclude() { grep -viE "$1" || [ $? -eq 1 ]; }

if [ "${1:-}" = "-" ]; then
  paths=$(cat)
else
  # 非 ASCII のパスを "\343..." のように引用符付きで出させない（末尾一致の判定が外れるため）
  paths=$(git -c core.quotePath=false ls-files)
fi

found=$(printf '%s\n' "$paths" | match "$SECRET_PATTERN" | exclude "$ALLOW_PATTERN")

if [ -n "$found" ]; then
  echo "::error::秘匿ファイルが Git の追跡対象に含まれています。.gitignore への追加や git rm --cached では履歴から消えないため、該当する鍵・トークンをローテーションしてください。"
  printf '%s\n' "$found"
  exit 1
fi

echo "OK: 追跡対象に秘匿ファイルはありません"
