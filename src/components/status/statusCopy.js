import { APP_NAME } from '../../utils/constants';

/**
 * What each status view says (StatusView, ErrorState, the 404 and error
 * pages). One place, so the same failure reads the same everywhere. Plain
 * words: say what happened, whether it's the person's doing (it almost never
 * is), and what will fix it.
 */
export const STATUS_COPY = {
  offline: {
    eyebrow: 'No internet',
    title: 'You’re offline',
    description: 'Check your Wi-Fi or mobile data. This will load again by itself as soon as you’re back online.',
  },
  unreachable: {
    eyebrow: 'Can’t connect',
    title: `We can’t reach ${APP_NAME}`,
    description: 'Your internet is working, but our server isn’t answering. It’s usually back within a few minutes - we’ll keep trying.',
  },
  timeout: {
    eyebrow: 'Taking too long',
    title: 'That took longer than it should',
    description: 'The server didn’t answer in time. Your connection may be slow, or we’re busy. Please try again.',
  },
  maintenance: {
    eyebrow: 'Back soon',
    title: 'We’re making a few improvements',
    description: `${APP_NAME} is being updated right now. Please try again in a few minutes.`,
  },
  server: {
    eyebrow: 'Server error',
    title: 'Something went wrong on our side',
    description: 'It isn’t something you did. Please try again in a moment.',
  },
  notFound: {
    eyebrow: 'Not found',
    title: 'We couldn’t find that',
    description: 'It may have been moved or deleted, or the link may be out of date.',
  },
  forbidden: {
    eyebrow: 'No access',
    title: 'You don’t have access to this',
    description: 'This belongs to another account, or needs permission you don’t have.',
  },
  crash: {
    eyebrow: 'Something broke',
    title: 'This page ran into a problem',
    description: 'Something went wrong while showing this page. It isn’t something you did - reloading usually fixes it.',
  },
  pageNotFound: {
    eyebrow: 'Error 404',
    title: 'We can’t find that page',
    description: 'The link may be broken, or the page may have moved. Check the address, or head back somewhere familiar.',
  },
  generic: {
    eyebrow: null,
    title: 'Something went wrong',
    description: 'Please try again.',
  },
};

export const statusCopy = (kind) => STATUS_COPY[kind] ?? STATUS_COPY.generic;
