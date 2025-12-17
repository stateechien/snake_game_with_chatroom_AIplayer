# Snake Game with Chatroom & AI Player

本專案是一個結合 **即時聊天室（Chatroom）** 與 **AI 玩家（AI-controlled Snake）** 的多人貪吃蛇遊戲，目的在於展示：

- 前端互動式遊戲設計
- 即時通訊（聊天室）概念
- AI 玩家決策邏輯
- 模組化 TypeScript / React 架構設計能力

此專案同時具備娛樂性與工程展示價值，適合作為系統設計與前端整合能力的作品集。

---

## 🎮 功能簡介

- 🐍 經典貪吃蛇遊戲
- 💬 即時聊天室（玩家可互動）
- 🤖 AI Player 自動控制蛇的移動
- ⚙️ 模組化設計（遊戲邏輯、UI、AI 分離）
- 🧠 AI 可替換策略（Rule-based，未來可擴充）

---

## 🧠 系統架構概覽

```text
┌────────────┐
│  Game UI   │  ← React Components
└─────┬──────┘
      │
┌─────▼──────┐
│ Game Logic │  ← Snake movement / collision
└─────┬──────┘
      │
┌─────▼──────┐
│ AI Player  │  ← Direction decision logic
└────────────┘
