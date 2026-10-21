import { useState } from 'react';
import { motion } from 'framer-motion';
import { LuSmile } from 'react-icons/lu';
import { getHourInTimezone, formatDurationLong } from '../../../../utils/date';
import { useTodayCheckIn } from '../../../checkIn/hooks/useTodayCheckIn';
import { ENERGY_LEVELS, findMood } from '../../../checkIn/moods';
import StudentCheckInModal from '../../../checkIn/components/StudentCheckInModal';
import HeroParallax from './HeroParallax';

const LANDSCAPE_SRC = `${import.meta.env.BASE_URL}image/0e0f85199245c62378a5be33ae5ec4f5cb9a2555.png`;

/** Greeting by the hour in the student's own timezone, not the browser's. */
function greeting() {
  const hour = getHourInTimezone() ?? new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

function summaryLine({ openCount, minutesLeft, isLoading }) {
  if (isLoading) return 'Getting your day ready…';
  if (openCount === 0) return 'Nothing left today - nice work.';
  const tasks = `${openCount} ${openCount === 1 ? 'task' : 'tasks'} today`;
  const time = formatDurationLong(minutesLeft);
  return time ? `${tasks} · about ${time}` : tasks;
}

/** The pinned "Today's check-in" card over the landscape. Opens the real check-in form. */
function CheckInPeek({ onOpen, motionStyle }) {
  const { checkIn, isLoading, moods, skipped, laterInvite } = useTodayCheckIn();
  const mood = checkIn ? findMood(moods, checkIn.mood) : null;

  return (
    <button type="button" className="sh-checkin" onClick={onOpen} aria-haspopup="dialog">
      <motion.span className="sh-checkin__surface" style={motionStyle}>
        <span className="sh-checkin__label">Today&apos;s check-in</span>
        {isLoading ? (
          <span className="sh-checkin__meta">Loading…</span>
        ) : checkIn ? (
          <>
            <span className="sh-checkin__mood">
              <span className="sh-checkin__face" aria-hidden="true">
                {mood?.iconUrl ? <img src={mood.iconUrl} alt="" /> : mood?.icon ? mood.icon : <LuSmile size={16} />}
              </span>
              {mood?.name ?? checkIn.mood}
            </span>
            <span className="sh-checkin__energy">
              Energy
              <span className="sh-checkin__dots" aria-label={`${checkIn.energy} out of ${ENERGY_LEVELS.length}`}>
                {ENERGY_LEVELS.map((level) => (
                  <span key={level} className="sh-checkin__dot" data-on={level <= checkIn.energy} />
                ))}
              </span>
            </span>
            {checkIn.availableMinutes != null && (
              <span className="sh-checkin__meta">{checkIn.availableMinutes} min available today</span>
            )}
          </>
        ) : (
          <>
            <span className="sh-checkin__mood">
              <span className="sh-checkin__face" aria-hidden="true">
                <LuSmile size={16} />
              </span>
              How are you today?
            </span>
            {/* Skipped earlier today ("Continue to my work"): invited back, gently. */}
            {skipped && laterInvite && <span className="sh-checkin__meta">{laterInvite}</span>}
            <span className="sh-checkin__cta">Check in →</span>
          </>
        )}
      </motion.span>
    </button>
  );
}

export function HomeHero({
  firstName, openCount, minutesLeft, isLoading, scrollContainerRef, isFocusMode = false, reduceMotion = false,
}) {
  const [checkInOpen, setCheckInOpen] = useState(false);
  const name = firstName?.trim();
  const displayName = name ? name.charAt(0).toLocaleUpperCase() + name.slice(1) : 'there';

  return (
    <>
      <HeroParallax
        scrollContainerRef={scrollContainerRef}
        isFocusMode={isFocusMode || checkInOpen}
        reduceMotion={reduceMotion}
        fallbackSrc={LANDSCAPE_SRC}
        renderCheckIn={(motionStyle) => <CheckInPeek motionStyle={motionStyle} onOpen={() => setCheckInOpen(true)} />}
      >
        <h1 className="sh-hero__title">
          {greeting()}, {displayName}
        </h1>
        <p className="sh-hero__summary">{summaryLine({ openCount, minutesLeft, isLoading })}</p>
      </HeroParallax>

      {/* The check-in itself is a dialog of its own (mood tiles,
          energy, note) - the card used to be dropped into a generic
          Modal here, which framed a card inside a dialog. */}
      <StudentCheckInModal isOpen={checkInOpen} onClose={() => setCheckInOpen(false)} />
    </>
  );
}

export default HomeHero;
