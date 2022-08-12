import maze from "./game/maze.json";
import clicker from "./game/clicker.json";
import pinball from "./game/pinball.json";

import race from "./game/race.json";
import silhouette from "./game/silhouette.json";
import toastCatcher from "./game/toastCatcher.json";
import bubbleGum from "./game/bubbleGum.json";
import ballAttack from "./game/ballAttack.json";

export default [
  {
    name: "★0.5 迷路ゲーム",
    game: maze,
  },
  {
    name: "★0.5 クリッカーゲーム",
    game: clicker,
  },
  {
    name: "★0.5 ピンポンゲーム",
    game: pinball,
  },
  {
    name: "★1 かけっこゲーム",
    game: race,
  },
  {
    name: "★1 ボールあてゲーム",
    game: ballAttack,
  },
  {
    name: "★1 シルエットクイズ",
    game: silhouette,
  },
  {
    name: "★1 風船ガム",
    game: bubbleGum,
  },
  {
    name: "★1 トーストキャッチャー",
    game: toastCatcher,
  },
];
