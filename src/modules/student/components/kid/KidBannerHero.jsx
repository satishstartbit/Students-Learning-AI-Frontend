import { useRef } from 'react';
import { motion } from 'motion/react';
import { TextAnimate } from '../../../../components/ui/text-animate';
import { cn } from '../../../../lib/utils';
import { HomeSticker } from './home/HomeBits';
import { BannerParallaxContext, useBannerParallax } from './useBannerParallax';
import './home/kidHome.css';

/**
 * The paper-craft picture banner at the top of a K-4 page (Home, My week):
 * the title, a sticker and one short line over the picture's open sky on the
 * left, the scene on the right.
 *
 * From a small tablet up the banner takes the picture's shape (at least
 * 13rem, at most 28rem - bottom-aligned, so a very wide screen trims only
 * sky) and the words sit over its sky; on a phone the words come first and
 * the picture follows, zoomed onto its right two-thirds so the animal stays
 * big. The space around the picture is the picture's own sky colour.
 *
 * `children` are the moving overlays (BannerBits), placed in % of the
 * picture; the whole scene also drifts slowly (kh-hero-drift). Everything
 * moving stops in calm mode and follows reduced motion.
 *
 * @param art       { src, srcSmall, width, height, sky } - two WebP widths and
 *                  the sky colour. Without `src` the children bring the
 *                  picture themselves (BannerPicture in ParallaxLayers).
 * @param titleId   id of the h1 (the section is labelled by it)
 * @param title     the h1 text - drifts in word by word
 * @param sticker   StickerArt slug beside the title
 * @param subtitle  the short line (node)
 * @param textAt    'middle' (default) or 'top' - for a picture whose hills
 *                  rise high on the left, the words sit in the upper sky
 * @param popOut    something in the picture may come out of it towards you,
 *                  over the page below (My work's turtle): the banner clips
 *                  only its top and sides (clip-path) instead of all round,
 *                  and sits above the page's content
 * @param parallax  the picture is split into depths (children are
 *                  BannerParallax#ParallaxLayer): they move apart as the page
 *                  scrolls and with the mouse, the words float up and fade
 *                  (useBannerParallax)
 */
export function KidBannerHero({ parallax = false, ...props }) {
  return parallax ? <ParallaxBanner {...props} /> : <BannerFrame {...props} />;
}

function ParallaxBanner(props) {
  const sectionRef = useRef(null);
  const { layer, textStyle, handlers, enabled } = useBannerParallax(sectionRef);

  return (
    <BannerParallaxContext.Provider value={layer}>
      <BannerFrame {...props} sectionRef={sectionRef} textStyle={textStyle} sectionProps={{ ...handlers, 'data-parallax': enabled ? 'on' : 'off' }} />
    </BannerParallaxContext.Provider>
  );
}

function BannerFrame({ art, titleId, title, sticker = 'star', subtitle, textAt = 'middle', popOut = false, sectionRef, textStyle, sectionProps, children }) {
  const ratio = `${art.width} / ${art.height}`;

  return (
    <section
      ref={sectionRef}
      aria-labelledby={titleId}
      className={cn(
        'kh-banner relative isolate flex flex-col border-b border-kid-edge/60 sm:max-h-[28rem] sm:min-h-[13rem] sm:flex-row sm:items-center',
        popOut ? 'z-[2] [clip-path:inset(0_0_-80%_0)]' : 'overflow-hidden'
      )}
      style={{ backgroundColor: art.sky, '--kh-art-ratio': ratio }}
      {...sectionProps}
    >
      <motion.div
        style={textStyle}
        className={cn(
          'relative z-10 px-5 pb-2 pt-6 sm:max-w-[46%] sm:px-8 sm:py-6 lg:max-w-[45%] lg:px-10',
          textAt === 'top' && 'sm:self-start sm:pt-[3.2%]'
        )}
      >
        <div className="flex items-start gap-2">
          <TextAnimate
            as="h1"
            id={titleId}
            by="word"
            animation="blurInUp"
            startOnView={false}
            className="font-kid-display text-[clamp(1.6rem,3.4vw,2.75rem)] font-semibold leading-[1.08] text-kid-ink"
          >
            {title}
          </TextAnimate>
          {sticker && <HomeSticker slug={sticker} tilt={-10} delay={0.6} className="relative mt-1 size-9 shrink-0 sm:size-10 lg:size-12" />}
        </div>

        {subtitle && <p className="mt-2.5 font-kid-body text-base leading-snug text-kid-ink-soft sm:text-[1.05rem] lg:text-lg">{subtitle}</p>}
      </motion.div>

      <div aria-hidden="true" className="relative ml-[-50%] w-[150%] shrink-0 sm:absolute sm:bottom-0 sm:left-0 sm:ml-0 sm:w-full">
        <div className="kh-hero-drift relative" style={{ aspectRatio: ratio }}>
          {art.src && <BannerPicture {...art} />}
          {children}
        </div>
      </div>
    </section>
  );
}

/**
 * A banner picture (or one layer of it) in two WebP widths. Fills the scene
 * box unless `className` places it (a sky plate painted wider than the scene).
 */
export function BannerPicture({ src, srcSmall, smallWidth = 1000, bigWidth = 2000, className = 'absolute inset-0 size-full' }) {
  return (
    <img
      src={src}
      srcSet={srcSmall ? `${srcSmall} ${smallWidth}w, ${src} ${bigWidth}w` : undefined}
      sizes="(min-width: 1024px) calc(100vw - 15rem), (min-width: 640px) 100vw, 150vw"
      alt=""
      decoding="async"
      fetchPriority="high"
      draggable="false"
      className={cn('select-none', className)}
    />
  );
}

export default KidBannerHero;
