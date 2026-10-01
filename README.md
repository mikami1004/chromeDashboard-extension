# Dashboard Chrome Extension

Chromeの新しいタブ(New tab)画面を時計、天気予報、ToDoリストを備えたパーソナルダッシュボードに置き換えるChrome拡張機能です。

## 主な機能
- 時計＆挨拶メッセージ：時間帯（朝・昼・夜）に応じた挨拶と時刻の表示
- 背景画像：開くたびに背景画像が変わります。(picsum.photos使用)
- 現在地の天気表示：ブラウザの位置情報を利用して現在地の天気・気温・市区町村を自動表示（OpenMetro & OpenStreetMap API）
- ToDoリスト：タスクの追加、削除機能(`chrome.storage` によるデータの保存)

## インストール方法
1. このリポジトリをダウンロードまたはクローンします。
   ```bash
   git clone [https://github.com/mikami1004/chromeDashboard-extension.git](https://github.com/mikami1004/chromeDashboard-extension.git)
   ```
2. Google Chromeを開き、アドレスバーに`chrome://extensions`を入力して移動します。
3. 画面右上の**デベロッパーモード**をオンにします。
4. 画面左上の**「パッケージ化されていない拡張機能を読み込む」**をクリックします。
5. クローン（ダウンロード）したプロジェクトフォルダを選択します。
6. 新しいタブを開くと起動します。

> **Note**: 初回起動時に位置情報の利用許可を求められた場合は、「許可」を選択してください。

## 使用技術

- HTML5 / CSS3 / JavaScript (ES6+)
- Manifest V3 (Chrome Extension)
- APIs:
  - [Open-Meteo API](https://open-meteo.com/) (天気予報データの取得)
  - [OpenStreetMap Nominatim API](https://nominatim.org/) (緯度・経度からの地名変換)
