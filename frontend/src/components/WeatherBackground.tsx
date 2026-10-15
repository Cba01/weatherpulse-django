import { AnimatePresence, motion } from "motion/react";

import type { WeatherTheme } from "../theme/weatherTheme";

const FADE_SECONDS = 1.2;

/**
 * Full-screen gradient behind the app. CSS can't transition between
 * gradients, so each theme is its own layer: the new one fades in on top
 * while the old one stays opaque underneath until the fade is done.
 */
export function WeatherBackground({ theme }: { theme: WeatherTheme }) {
  return (
    <div className="weather-bg" aria-hidden="true">
      <AnimatePresence initial={false}>
        <motion.div
          key={theme}
          className={`weather-bg__layer weather-bg__layer--${theme}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, transition: { duration: FADE_SECONDS } }}
          exit={{ opacity: 0, transition: { delay: FADE_SECONDS, duration: 0 } }}
        />
      </AnimatePresence>
    </div>
  );
}
