#!/usr/bin/env bash
# secret-scan.sh の判定を代表パスで検証する。
#
# 検出パターンが壊れると、秘匿ファイルを「黙って見逃す」形で失敗する（CI は緑のまま）。
# ガード自体を検証しないと壊れたことに気づけないため、本番の検査の前に毎回実行する。
set -euo pipefail

scan="$(dirname "$0")/secret-scan.sh"
failures=0

# $1 = 期待（detect / pass）、$2 = パス
check() {
  local expected=$1 path=$2 status=0
  printf '%s\n' "$path" | bash "$scan" - >/dev/null || status=$?
  local actual
  case $status in
    0) actual=pass ;;
    1) actual=detect ;;
    *) actual="error($status)" ;;
  esac
  if [ "$actual" != "$expected" ]; then
    echo "NG: ${path} -> ${actual}（期待: ${expected}）"
    failures=$((failures + 1))
  fi
}

# 検出すべきもの
check detect config/master.key
check detect front/.env
check detect front/.env.local
check detect base/.env.production
check detect .env
check detect certs/server.pem
check detect certs/SERVER.PEM
check detect secrets/id_rsa
check detect secrets/id_ed25519
check detect keystore/release.jks
check detect gcp/serviceAccountKey.json
check detect gcp/credentials.json
check detect 日本語/.env

# 素通りさせるもの（テンプレート・型定義・名前が似ているだけのファイル）
check pass front/.env.example
check pass front/.env.local.example
check pass front/.env.sample
check pass src/env.d.ts
check pass front/.env.d.ts
check pass docs/keyboard.md
check pass src/apiKey.ts
check pass README.md
check pass front/src/lib/auth-server.ts

# 空の入力（追跡ファイルが無い）は検出なし。grep の一致 0 件で落ちないこと
if ! printf '' | bash "$scan" - >/dev/null; then
  echo "NG: 空の入力で失敗した（一致 0 件を失敗扱いしている）"
  failures=$((failures + 1))
fi

if [ "$failures" -gt 0 ]; then
  echo "::error::secret-scan.sh の判定が期待と異なります（${failures} 件）"
  exit 1
fi
echo "OK: secret-scan.sh の判定は期待どおりです"
