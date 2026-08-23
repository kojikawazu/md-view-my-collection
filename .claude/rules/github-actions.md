---
description: GitHub Actions のルール — ワークフローの静的解析（actionlint）と発火ルール
globs: ".github/workflows/**"
---

# GitHub Actions のルール

本ルールは 2 つを定める。

1. **ワークフローの静的解析**: ワークフロー自体の誤りを actionlint で機械的に潰す。
2. **発火ルール**: **「変更した内容に関係のあるジョブだけを動かす」**。ドキュメントやルールの更新でテスト・ビルド・デプロイを回さない（CI 時間・コストの浪費、キュー待ちによる他 PR のブロック、無意味なデプロイの発生を防ぐ）。

## ワークフローの静的解析（actionlint）

**ワークフローを追加・変更したら、[actionlint](https://github.com/rhysd/actionlint) による検証を CI で必須にする。** ワークフローの誤りは「push して実際に動かすまで気づけない」ため、CI 時間を溶かす前に機械で潰す。

検出できるもの:

| 検出内容 | 例 |
|---|---|
| ランナーラベルの誤り | `runs-on: ubuntu-lates`（typo）／未登録のセルフホストラベル |
| アクション入力名の誤り | `actions/checkout@v4` に `fetch-dept:`（正: `fetch-depth`） |
| 式・コンテキストの誤り | 存在しない `steps.<id>.outputs.*` の参照、型の不一致 |
| ジョブ依存の誤り | `needs:` が存在しないジョブ ID を指している |
| **スクリプトインジェクション** | `run: echo "${{ github.event.pull_request.title }}"` のように untrusted input を `run:` へ直接埋め込む（環境変数経由に直す） |
| シェルスクリプトの不備 | `run:` の中身（shellcheck 連携。クォート漏れ等） |
| cron 式・glob の誤り | `schedule` の cron 構文、`branches` のパターン |

**検出できないもの**（機械では判断できないため、レビューで見る）: ブランチ名・パスフィルタの内容が意図と合っているか、参照しているシークレットが実在するか、ジョブの実行順序が業務的に正しいか。

### CI での実行

`.github/workflows/actionlint.yml` として**独立したワークフロー**で実行する。

- **パスフィルタをかけず、全 PR で常に実行する**。実行は数秒で終わるため、「ワークフローを変更したときだけ動かす」ための判定ジョブ（後述の `dorny/paths-filter`）を足すほうが高くつく。必須チェックにしても pending で詰まらない。
  - **本プロジェクトでは、この 1 本だけが常時実行**である。既存の `test.yml` / `docs.yml` はワークフローレベルの `paths` で絞っており、そのため必須チェックにできない（`test.yml` 冒頭の注意書き）。actionlint はその制約を負わない。
- **`actions/checkout` を必ず先に置く**。actionlint は Git リポジトリの中から `.github/workflows` を探すため、リポジトリ外で実行するとエラー終了する。
- **バージョンを固定する**。`latest` にすると、コードを変えていないのに新リリースの検査強化で CI が落ちる。更新は依存更新として明示的に行う（`run:` 内のバージョンは Dependabot では更新されない）。**`Makefile` の `ACTIONLINT_VERSION` と同じ値に揃える**（ローカル green / CI red を防ぐ。`docs.yml` の markdownlint と同じ理由）。
- **shellcheck の追加設定は不要**。GitHub ホストの ubuntu ランナーにはプリインストール済みで、PATH にあれば `run:` のシェルスクリプトも自動で併せて検査される。
- **バイナリ取得はチェックサム検証を伴わない**ため、リスクはバージョン固定（スクリプト URL・本体の双方）で抑える。あわせて**このジョブにシークレットを渡さず `permissions: contents: read` に絞る**（万一取得物が不正でも、読み取り専用のチェックアウト以外に到達できない）。

実体は `.github/workflows/actionlint.yml` を正とする（本ルールに YAML を再掲すると、片方だけ変わったときに食い違う）。

### ローカルでの実行

- **push する前に手元で実行する**。本プロジェクトは **`make actionlint`** を用意しており、CI と同じバージョンで走る。
- 直接入れる場合は `brew install actionlint` / `go install github.com/rhysd/actionlint/cmd/actionlint@latest`。引数なしで実行すると、リポジトリ内の `.github/workflows` を自動検出して全ワークフローを検査する。指摘があれば終了コード 1 で落ちる。

### 抑制と設定

抑制の作法（理由を書く・範囲を最小にする・増えたら設定自体を見直す）は `static-analysis.md` に従う。

**本プロジェクトに `.github/actionlint.yaml` は存在しない**（現時点で抑制も設定も不要なため）。下表の設定ファイルが必要になった時点で新規作成する。actionlint 固有の手段は以下:

| 目的 | 手段 |
|---|---|
| セルフホストランナーのラベルを認識させる | `.github/actionlint.yaml` の `self-hosted-runner.labels` に登録する（`actionlint -init-config` で雛形を生成できる） |
| 特定のエラーメッセージを無視する | `-ignore <正規表現>`（繰り返し指定可）／`.github/actionlint.yaml` の `paths.<glob>.ignore` |
| shellcheck の特定ルールを無視する | 該当箇所の直前に `# shellcheck disable=SC2086` を書く（`run:` 内の対象行のみ） |

- **リポジトリ単位・ワークフロー単位での一括無効化をしない**。無視するなら対象を絞り、設定ファイルに理由をコメントで残す。
- 設定ファイルを作った場合は**コミット対象**。ローカル固有設定に依存しない。

## トリガの基本形

| ワークフロー | トリガ | 補足 |
|---|---|---|
| CI（lint / test / build） | `pull_request`（対象: `main`）+ `push`（`main` のみ） | **全ブランチの push で回さない**。PR で回れば十分 |
| CD（デプロイ） | `push`（`main` のみ）または `release` | PR では動かさない |
| 手動運用（再デプロイ・ロールバック） | `workflow_dispatch` | 手動実行の口を必ず用意する |

- **`concurrency` を必ず設定する**。同一 PR で連続 push した際に古い実行をキャンセルする。

  ```yaml
  concurrency:
    group: ${{ github.workflow }}-${{ github.ref }}
    cancel-in-progress: true   # CD（デプロイ）では false にする（中断で不整合が起きるため）
  ```

- **`permissions` は最小権限**を明示する（既定の広い権限に依存しない）。読み取りだけなら `contents: read`。

## 変更内容と実行対象

| 変更内容 | lint / test / build | デプロイ | 実行する軽量チェック |
|---|---|---|---|
| アプリケーションコード | ✅ | ✅（main マージ時） | — |
| テストコード | ✅ | ❌ | — |
| `docs/**`、`*.md`、`README.md` | ❌ | ❌ | markdown lint、リンク切れチェック |
| `.claude/**`（rules / skills） | ❌ | ❌ | markdown lint |
| `.github/workflows/**` | ✅（自身の検証のため） | ❌ | actionlint（全 PR で常時実行するため、この行の変更に限らず走る） |
| 依存関係（ロックファイル） | ✅ | ✅ | — |
| インフラ定義（Terraform 等） | ❌（アプリのテストは不要） | ✅（インフラ側の適用） | plan の差分確認 |

- **ドキュメント変更でも「何も動かさない」にはしない**。markdown lint・リンク切れ・必須ファイル（README.md / CLAUDE.md）の存在検証は軽量なので実行する。

## パスフィルタの実装（重要な落とし穴）

**ワークフローレベルの `paths` / `paths-ignore` を、required status check（ブランチ保護の必須チェック）と併用してはならない。**

- ワークフロー自体が起動しないと、必須チェックは **`pending` のまま永久に完了せず、PR がマージできなくなる**。
- 一方、**ジョブレベルの `if:` でスキップした場合は「skipped」となり、必須チェックとしては成功扱い**になる。

したがって、**必須チェックにするジョブは「常に起動し、中身をスキップする」形にする**。

```yaml
on:
  pull_request:
    branches: [main]

jobs:
  changes:                      # 変更範囲を判定する
    runs-on: ubuntu-latest
    outputs:
      app: ${{ steps.filter.outputs.app }}
    steps:
      - uses: actions/checkout@v4
      - uses: dorny/paths-filter@v3
        id: filter
        with:
          filters: |
            app:
              - '!(docs/**|**/*.md|.claude/**)'

  test:                         # 必須チェック。常に起動し、中身だけスキップする
    needs: changes
    if: needs.changes.outputs.app == 'true'
    runs-on: ubuntu-latest
    steps:
      - run: echo "run tests"
```

- 必須チェックにしないワークフロー（デプロイ等）は、ワークフローレベルの `paths-ignore` を使ってよい（起動そのものを止める方が安価）。
- **判定条件は「除外リスト」で書く**（`docs/**` 以外はアプリ変更とみなす）。「対象リスト」で書くと、**新しいディレクトリが増えたときに黙ってテストが走らなくなる**。安全側に倒す。

## デプロイの発火

- **デプロイは `main` へのマージを唯一のトリガとする**。PR ブランチから本番へデプロイしない。
- **Environments（`environment:`）を使い、本番は承認ゲートを置く**。シークレットは Environment 単位で管理し、PR からは参照できないようにする。
- **fork からの PR で `pull_request_target` を安易に使わない**。`pull_request_target` は base リポジトリの権限とシークレットで動くため、fork のコードをチェックアウトして実行するとシークレットが漏洩する。
- デプロイ workflow には `concurrency.cancel-in-progress: false` を設定し、**デプロイ途中でのキャンセルによる不整合を防ぐ**。

## PaaS の Git 連携は別系統（Actions だけでは完結しない）

**Vercel / Netlify / Cloud Run などの Git 連携は、GitHub Actions のパスフィルタを一切参照しない。** Actions 側でジョブを止めても、PaaS 側の設定を変えなければデプロイは走る。**発火制御は 2 系統あると認識し、両方を揃える**。

**本プロジェクトの Vercel 側の設定（`front/vercel.json`）の詳細は `.claude/rules/vercel.md` を正準とする。** 制御の分担は明確に分ける: **パスによる実行制御は本ファイル（CI の `paths-filter`）が持ち**、Vercel 側はブランチ単位の制御（`deploymentEnabled`）だけを持つ。パス判定を Vercel 側に置くと、誤判定が「本番が静かに古くなる」形で潜伏するため（`vercel.md`「2. ビルドスキップ」）。

## レビュー観点

- **actionlint が CI に入っているか**。ワークフローを追加・変更する PR で actionlint が実行され、成功しているか。
- actionlint の指摘を `-ignore` や `paths.<glob>.ignore` で握り潰していないか（理由・範囲が最小か）。
- ドキュメント・ルールのみの PR で、テストが起動していないか（**actionlint は常時実行のため、走っていて正しい**）。**PR ブランチでは Vercel のデプロイ自体が発火しないこと**も確認する（`deploymentEnabled`）。なお **main へのマージはドキュメントのみでもデプロイされる**（意図した挙動。`vercel.md`「2. ビルドスキップ」）。
- 逆に、**アプリコードを変更したのに必要なジョブがスキップされていないか**（パスフィルタの書き漏れ）。
- 必須チェックにしているジョブが、ワークフローレベルの `paths` / `paths-ignore` で止められていないか（PR がマージ不能になる）。
- `permissions` が明示され、最小権限になっているか。
