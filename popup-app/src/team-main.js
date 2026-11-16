import { createApp } from "vue";
import "@material/web/button/filled-button.js";
import "@material/web/button/text-button.js";
import TeamPage from "./pages/TeamPage.vue";
import "./variables.css";
import "./shared.css";
import "./pack-fullscreen.css";

createApp(TeamPage).mount("#app");
