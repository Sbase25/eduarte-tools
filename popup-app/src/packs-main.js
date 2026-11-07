import { createApp } from "vue";
import "@material/web/button/filled-button.js";
import "@material/web/button/text-button.js";
import "@material/web/iconbutton/icon-button.js";
import FullScreenPack from "./pages/FullScreenPack.vue";
import "./variables.css";
import "./shared.css";
import "./pack-fullscreen.css";

createApp(FullScreenPack).mount("#app");
