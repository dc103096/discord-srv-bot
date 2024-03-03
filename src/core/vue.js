import { createApp } from "vue";
import { createPinia } from "pinia";

export default () => {
  console.log("Vue initialized");
  const vue = createApp({});
  const pinia = createPinia();

  vue.use(pinia);
}