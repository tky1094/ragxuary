# ragxuary
RAGネイティブなドキュメンテーションツール

## セットアップ

### 1. リポジトリのクローン

```bash
git clone https://github.com/tky1094/ragxuary.git
cd ragxuary
```

### 2. 環境変数の設定

```bash
cp .env.example .env
# 必要に応じて .env を編集
```

### 3. 開発環境の起動

```bash
# PostgreSQL と Redis を起動
docker compose up -d

# 起動確認
docker compose ps
```

## License

MIT