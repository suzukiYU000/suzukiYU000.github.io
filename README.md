# Suzuki Yuma — Research Portfolio

公開サイト: https://suzukiyu000.github.io/

## 構成

- `index.html`: プロフィール、研究、論文、活動実績、連絡先。
- `research-editorial.css` / `research-editorial-project.css`: レイアウト、配色、Humoniiへのリンク。
- `research-editorial.js`: ナビゲーション、論文フィルター、テーマ、メールアドレスのコピー。
- `research-editorial-i18n.js`: 日本語・英語・簡体字中国語・韓国語・スペイン語・フランス語・ドイツ語・ポルトガル語の切り替え。
- `research-editorial-particles.js` / `research-editorial-intro.js`: 点群から名前を形成する導入と読み込み処理。
- `research-editorial-motion.js`: 導入から本文への移行とページ内の動き。
- `assets/research-editorial/`: ローカル配信するフォント、そのライセンス、共有制御の映像。

## ローカル確認

このフォルダで `python -m http.server 8765 --bind 127.0.0.1` を実行し、
`http://127.0.0.1:8765/` を開きます。ビルドや外部翻訳サービスは不要です。
言語は `?lang=en` などでも指定できます。

## 公開

GitHub Pagesは `website` ブランチのルートから配信します。
作業用ブランチで変更を確認した後、`website` に反映してpushすると、
GitHub Actionsの `pages build and deployment` が公開を更新します。
試作HTMLやローカルの検証用ファイルを公開対象に含めないよう、追加するファイルを明示してください。
