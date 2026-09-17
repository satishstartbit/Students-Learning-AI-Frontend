import { useState } from 'react';
import { LuSmile } from 'react-icons/lu';
import { Modal } from '../../../../components/common';
import { getHourInTimezone, formatDurationLong } from '../../../../utils/date';
import { useTodayCheckIn } from '../../../checkIn/hooks/useTodayCheckIn';
import { ENERGY_LEVELS, findMood } from '../../../checkIn/moods';
import StudentCheckInCard from '../StudentCheckInCard';

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
function CheckInPeek({ onOpen }) {
  const { checkIn, isLoading, moods } = useTodayCheckIn();
  const mood = checkIn ? findMood(moods, checkIn.mood) : null;

  return (
    <button type="button" className="sh-checkin" onClick={onOpen} aria-haspopup="dialog">
      <span className="sh-checkin__label">Today&apos;s check-in</span>
      {isLoading ? (
        <p className="sh-checkin__meta">Loading…</p>
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
            <p className="sh-checkin__meta">{checkIn.availableMinutes} min available today</p>
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
          <span className="sh-checkin__cta">Check in →</span>
        </>
      )}
    </button>
  );
}

export function HomeHero({ firstName, openCount, minutesLeft, isLoading }) {
  const [checkInOpen, setCheckInOpen] = useState(false);

  return (
    <section className="sh-hero" aria-label="Today">
      <div>
        <h1 className="sh-hero__title">
          {greeting()}, {firstName || 'there'}
        </h1>
        <p className="sh-hero__summary">{summaryLine({ openCount, minutesLeft, isLoading })}</p>
      </div>

      <div className="sh-hero__art">
        <img className="sh-hero__landscape" src={LANDSCAPE_SRC} alt="" aria-hidden="true" draggable="false" />
        <CheckInPeek onOpen={() => setCheckInOpen(true)} />
      </div>

      <Modal isOpen={checkInOpen} onClose={() => setCheckInOpen(false)} title="Today's check-in" size="md">
        <StudentCheckInCard title="How are you today?" onSaved={() => setCheckInOpen(false)} />
      </Modal>
    </section>
  );
}

export default HomeHero;
