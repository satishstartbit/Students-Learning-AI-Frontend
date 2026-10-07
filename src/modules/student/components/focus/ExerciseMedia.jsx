import { useState } from 'react';
import { LuExternalLink } from 'react-icons/lu';
import { exerciseMedia, illustrationFor } from './exerciseGroups';
import ExerciseIllustration from './ExerciseIllustration';
import './exerciseMedia.css';

/**
 * How to do an exercise: its video when the admin gave it one (a YouTube or
 * Vimeo link, or a video file), else its image, else a built-in picture that
 * shows the steps (ExerciseIllustration). A sound file plays under the
 * picture; any other link opens in a new tab. If a file fails to load, the
 * picture takes its place. The media link is Master Management > Regulation
 * Activities "Video, picture or sound link".
 *
 * Shown beside the exercise on the Focus page, and again while it is being
 * done - in the guided dialog (ExerciseModal) and on a built-in exercise's
 * own page (brainBoosters/ExerciseBreak.jsx).
 *
 *   paused    the built-in picture holds still (the exercise isn't running)
 *   caption   false where the steps are already written beside it
 *
 * Give it `key={exercise.key}` so a new exercise starts fresh.
 */
export function ExerciseMedia({ exercise, tone, paused = false, caption = true }) {
  const media = exerciseMedia(exercise.mediaUrl);
  const [failed, setFailed] = useState(false);
  const kind = failed ? 'none' : media.kind;
  const name = exercise.name;

  if (kind === 'youtube' || kind === 'vimeo' || kind === 'video') {
    return (
      <figure className="fs-media" data-kind={kind}>
        <div className="fs-media__frame fs-media__frame--video">
          {kind === 'video' ? (
            <video src={media.src} controls preload="metadata" playsInline aria-label={`${name}: video`} onError={() => setFailed(true)} />
          ) : (
            <iframe
              src={media.src}
              title={`${name}: video`}
              loading="lazy"
              allow="accelerometer; encrypted-media; gyroscope; picture-in-picture; fullscreen"
              allowFullScreen
              referrerPolicy="strict-origin-when-cross-origin"
            />
          )}
        </div>
        {caption && <figcaption className="fs-media__caption">Watch how it&apos;s done, then try it yourself.</figcaption>}
      </figure>
    );
  }

  if (kind === 'image') {
    return (
      <figure className="fs-media" data-kind="image">
        <div className="fs-media__frame fs-media__frame--image">
          <img src={media.src} alt={`How to do ${name}`} loading="lazy" onError={() => setFailed(true)} />
        </div>
      </figure>
    );
  }

  const picture = <ExerciseIllustration kind={illustrationFor(exercise)} tone={tone} paused={paused} caption={caption} />;

  if (kind === 'audio') {
    return (
      <div className="fs-media" data-kind="audio">
        {picture}
        <audio className="fs-media__audio" src={media.src} controls preload="none" aria-label={`${name}: listen`} onError={() => setFailed(true)} />
      </div>
    );
  }

  if (kind === 'link') {
    return (
      <div className="fs-media" data-kind="link">
        {picture}
        <a className="fs-link fs-media__open" href={media.src} target="_blank" rel="noopener noreferrer">
          Open the video or sound <LuExternalLink size={13} aria-hidden="true" />
        </a>
      </div>
    );
  }

  return picture;
}

export default ExerciseMedia;
