/**
 * "Where it's used" guides for Master Management (user request 2026-10-20):
 * one entry per master, keyed by its address segment (/admin/masters/<key>),
 * shown by MasterGuideButton next to the Add button. Traced from the screens
 * and services that really read each list - keep an entry true when a screen
 * starts or stops using a master (masterGuides.test.js checks the shape).
 *
 * Entry: { summary, usedIn: [{ role, page, path, how }], drives: [..],
 *          whenYouChange: [..], fields: [{ name, effect }], related: [key],
 *          api: { admin, read: [..], code: [..] } }
 * `path` is the page's address; ":id" stands for one record.
 */

const generic = (type) => `GET|POST /api/v1/admin/master/${type}/items · PATCH|DELETE …/items/:id`;

const OFF_HIDES = 'Switching an item off hides it from every picker at once; people who already chose it keep their answer, and history still shows it.';
const BUILT_IN = 'Built-in items can be edited or switched off but not deleted; an item that is in use can only be switched off.';

export const MASTER_GUIDES = {
  // ------------------------------------------------------------------ Academic
  'academic-years': {
    summary: 'The school years that students, teacher–student links, parent invitations and assignments belong to. The one marked "current" is the year new links and invitations use.',
    usedIn: [
      { role: 'Parent', page: 'My Children › Add child, Edit child', path: '/parent/children', how: 'Every child needs an academic year (required); the child card and details show it.' },
      { role: 'Super Admin', page: 'A parent’s record › Add child, Edit user', path: '/admin/users/:id', how: 'The same required Academic year field for a child; the student’s record shows it.' },
      { role: 'Parent', page: 'My Children › Invite a teacher, child details', path: '/parent/children', how: 'Invitations and teacher links show the school year they are for.' },
      { role: 'Teacher', page: 'New / edit assignment › Who it is for', path: '/teacher/assignments/new', how: 'Students are picked from the links of the current year.' },
      { role: 'Teacher', page: 'Assignment details', path: '/teacher/assignments/:id', how: 'Shows the year the assignment belongs to.' },
      { role: 'Super Admin', page: 'Relationships', path: '/admin/relationships', how: 'Each teacher–student link is subject + grade + school year.' },
    ],
    drives: ['Accepting a parent’s invitation links the teacher for the current year.', 'Teacher subject coverage and the parent’s teacher connections are grouped by year.'],
    whenYouChange: ['Only one year can be current; marking another current moves new links and invitations to it.', 'A year students are in can’t be deleted - switch it off instead; those children keep it until they are edited.', OFF_HIDES, BUILT_IN],
    related: ['grade_levels', 'subjects'],
    api: { admin: 'GET|POST /api/v1/admin/master/academic-years · PATCH|DELETE …/:id', read: ['GET /api/v1/parent/lookups/academic-years', 'Used inside teacher, parent and relationship services'], code: ['services/user.service.js (student_profiles.academic_year_id)', 'services/teacherInvitation.service.js', 'services/relationship.service.js', 'services/assignment.service.js'] },
  },
  grade_levels: {
    summary: 'The grade list for the whole platform (Kindergarten to Grade 12). A student’s grade also decides which version of the app they get - the K-4 kid design or the Grade 6+ design.',
    usedIn: [
      { role: 'Student', page: 'Onboarding › Your grade', path: '/student/onboarding', how: 'The student (or their parent) picks a grade.' },
      { role: 'Parent', page: 'My Children › Add / edit child', path: '/parent/children', how: 'Grade of each child.' },
      { role: 'Teacher', page: 'My Profile › Teaching', path: '/teacher/profile', how: 'The grades the teacher teaches.' },
      { role: 'Super Admin', page: 'Create / edit user, Relationships', path: '/admin/users/students', how: 'Student grade and the grade of each teacher link.' },
      { role: 'Super Admin', page: 'Task Types, Topics, Question Types forms › From / To grade', path: '/admin/masters/task-types', how: 'Grade ranges pick from this list.' },
    ],
    drives: ['K-4 vs Grade 6+ experience (utils/gradeBand.js).', 'Teachers only see task types, subjects, topics and question types whose grade range fits the task’s grade - matched by each grade’s number, kept by the server (Kindergarten 0, Grade 1 = 1 …).'],
    whenYouChange: ['The grade number is set from the name for a new grade and never shown here; renaming a grade keeps its number.', OFF_HIDES, BUILT_IN],
    fields: [{ name: 'Order', effect: 'Position in every grade picker - one number per grade.' }],
    related: ['task-types', 'topics', 'question-types', 'subjects'],
    api: { admin: generic('grade_levels'), read: ['GET /api/v1/lookups/grade_levels', 'GET /api/v1/onboarding/lookups/grade_levels', 'GET /api/v1/auth/lookups/master/grade_levels'], code: ['services/curriculum.service.js#gradeNumberFor', 'utils/gradeBand.js'] },
  },
  subjects: {
    summary: 'The school subjects a student takes, with one colour each that is used everywhere the student’s work appears.',
    usedIn: [
      { role: 'Student', page: 'Onboarding › Subjects', path: '/student/onboarding', how: 'The student picks their subjects (both K-4 and Grade 6+).' },
      { role: 'Student', page: 'Plan (sticky notes, list, calendar) and Home', path: '/student/calendar', how: 'Work is painted in its subject’s colour; Add work offers the student’s subjects.' },
      { role: 'Student', page: 'AI Assistant', path: '/student/assistant', how: 'Subject choices for a learning session.' },
      { role: 'Parent', page: 'My Children › Add / edit child, Invite a teacher', path: '/parent/children', how: 'A child’s subjects, and the subjects an invitation is for.' },
      { role: 'Teacher', page: 'My Students and student page', path: '/teacher/students', how: 'Subject chips in the subject colours.' },
      { role: 'Super Admin', page: 'Create / edit student', path: '/admin/users/students', how: 'Student subjects.' },
    ],
    drives: ['Subject colour (field “Colour”) on sticky notes, lists, calendars and teacher lists; a student may pick their own colour on top.', 'New work must use one of the child’s selected subjects.'],
    whenYouChange: ['Changing a colour repaints every place the subject shows at once.', OFF_HIDES, BUILT_IN],
    fields: [{ name: 'Colour', effect: 'The subject’s colour across the platform.' }],
    related: ['grade_levels', 'topics'],
    api: { admin: generic('subjects'), read: ['GET /api/v1/lookups/subjects', 'GET /api/v1/students/:id/profile-options'], code: ['services/studentProfileOptions.service.js', 'services/planner/schoolworkSettings.service.js', 'components/subjects/useSubjectColors'] },
  },
  schools: {
    summary: 'Schools or organizations, prepared for a later phase (school onboarding).',
    usedIn: [],
    drives: ['Nothing reads this list yet - it is hidden from the Master Management dashboard.'],
    whenYouChange: ['Changes have no effect on any screen today.'],
    related: ['academic-years'],
    api: { admin: 'GET|POST /api/v1/admin/master/schools · PATCH|DELETE …/:id', read: [], code: ['services/masterAcademic.service.js'] },
  },

  // ------------------------------------------------------------------ Curriculum & task setup
  'task-types': {
    summary: 'The kinds of work a teacher can create (worksheet, reading, project…), each with the grades it suits and an icon.',
    usedIn: [
      { role: 'Teacher', page: 'New / edit assignment › Task type', path: '/teacher/assignments/new', how: 'Only types whose grade range fits the assignment’s grade are offered.' },
      { role: 'Student', page: 'Plan, Home, Assignments', path: '/student/calendar', how: 'The type’s icon labels teacher work on sticky notes, list and calendar.' },
    ],
    drives: ['Which creation flow the teacher’s form opens.', 'The AI step breakdown uses the type’s “subtask style”.'],
    whenYouChange: ['An assignment that already uses a switched-off type keeps it.', 'A type in use by tasks can’t be deleted.', BUILT_IN],
    fields: [{ name: 'From / To grade', effect: 'Grades the type is offered for (blank = no limit).' }, { name: 'Icon', effect: 'Shown beside teacher work for students.' }],
    related: ['grade_levels', 'topics', 'question-types'],
    api: { admin: 'GET|POST /api/v1/admin/master/task-types · PATCH|DELETE …/:id', read: ['GET /api/v1/curriculum/task-types'], code: ['services/curriculum.service.js', 'services/planner/workDisplay.js'] },
  },
  'curriculum-subjects': {
    summary: 'Subjects teachers choose when creating a task, by grade (the teacher-side subject list).',
    usedIn: [{ role: 'Teacher', page: 'New / edit assignment › Subject', path: '/teacher/assignments/new', how: 'Offered by the assignment’s grade; topics hang under each subject.' }],
    drives: ['Topics belong to one of these subjects.'],
    whenYouChange: ['Deleting a subject also deletes its topics, so it is refused while a task uses either.', BUILT_IN],
    related: ['topics', 'task-types'],
    api: { admin: 'GET|POST /api/v1/admin/master/curriculum-subjects · PATCH|DELETE …/:id', read: ['GET /api/v1/curriculum/subjects'], code: ['services/curriculum.service.js'] },
  },
  topics: {
    summary: 'Topics within each subject, by grade - what an assignment is about.',
    usedIn: [{ role: 'Teacher', page: 'New / edit assignment › Topic', path: '/teacher/assignments/new', how: 'Offered for the chosen subject and the assignment’s grade.' }],
    drives: ['Order is counted within each subject (each subject has its own 1, 2, 3…).'],
    whenYouChange: ['A topic used by a task can’t be deleted - switch it off instead.', BUILT_IN],
    fields: [{ name: 'Subject', effect: 'The subject the topic sits under.' }, { name: 'From / To grade', effect: 'Grades the topic is offered for.' }],
    related: ['curriculum-subjects', 'grade_levels'],
    api: { admin: 'GET|POST /api/v1/admin/master/topics · PATCH|DELETE …/:id', read: ['GET /api/v1/curriculum/subjects/:subjectId/topics'], code: ['services/curriculum.service.js'] },
  },
  'audio-tracks': {
    summary: 'Background sounds a teacher can attach to a task (a link or an uploaded file).',
    usedIn: [
      { role: 'Teacher', page: 'New / edit assignment › Background audio', path: '/teacher/assignments/new', how: 'Pick a track for the task.' },
      { role: 'Student', page: 'Assignment', path: '/student/assignments/:assignmentId', how: 'The track plays while the student works on it.' },
    ],
    whenYouChange: ['A track used by a task can’t be deleted - switch it off instead.', BUILT_IN],
    related: ['task-types'],
    api: { admin: 'GET|POST /api/v1/admin/master/audio-tracks · PATCH|DELETE …/:id', read: ['GET /api/v1/curriculum/audio-tracks'], code: ['services/curriculum.service.js#audioUrlFor'] },
  },
  'question-types': {
    summary: 'The question formats a teacher can add to a task: Quiz, Description, Matching, Passage.',
    usedIn: [
      { role: 'Teacher', page: 'New / edit assignment › Questions', path: '/teacher/assignments/new', how: 'The question builder offers these formats for the task’s grade.' },
      { role: 'Student', page: 'Assignment', path: '/student/assignments/:assignmentId', how: 'Each format has its own answer screen.' },
    ],
    whenYouChange: ['The four formats are built into the answer screens: renaming is fine, but they can’t be deleted.'],
    related: ['task-types', 'grade_levels'],
    api: { admin: 'GET|POST /api/v1/admin/master/question-types · PATCH …/:id', read: ['GET /api/v1/curriculum/question-types'], code: ['services/curriculum.service.js'] },
  },

  // ------------------------------------------------------------------ Assignment
  assignment_types: {
    summary: 'The kinds of work a student (or parent) can add themselves - homework, test prep, a form to sign… - each with an icon.',
    usedIn: [
      { role: 'Student', page: 'Plan › Add work', path: '/student/calendar', how: '“What kind of work is it?”' },
      { role: 'Student', page: 'Home › Add my own task', path: '/student', how: 'Same choices.' },
      { role: 'Parent', page: 'Schedule › Add work for a child', path: '/parent/schedule', how: 'Same choices.' },
    ],
    drives: ['The icon labels the student’s own work on sticky notes, list and calendar.', 'Work read from a photo or PDF is matched to one of these types.'],
    whenYouChange: [OFF_HIDES, BUILT_IN],
    related: ['task-types', 'activity_categories'],
    api: { admin: generic('assignment_types'), read: ['GET /api/v1/lookups/assignment_types'], code: ['services/studentTask.service.js', 'services/intake/intake.service.js', 'services/planner/workDisplay.js'] },
  },

  // ------------------------------------------------------------------ Student
  focus_duration: {
    summary: 'How long a student can usually focus before a break - one of the onboarding questions.',
    usedIn: [
      { role: 'Student', page: 'Onboarding › How long can you focus?', path: '/student/onboarding', how: 'Grade 6+ and K-4 both ask it; the answer is required.' },
    ],
    drives: ['The answer is saved on the student’s learning preferences and given to the AI as “Usual focus length” when it suggests steps for their work.'],
    whenYouChange: [OFF_HIDES, 'Changing the minutes of an item does not change answers students already gave.', BUILT_IN],
    fields: [{ name: 'Duration (minutes)', effect: 'The length the choice stands for.' }],
    related: ['study_time', 'challenge_areas'],
    api: { admin: generic('focus_duration'), read: ['GET /api/v1/onboarding/lookups/focus_duration'], code: ['services/onboarding.service.js', 'services/planner/learnerProfile.js'] },
  },
  study_time: {
    summary: 'Times of day for studying - asked once in onboarding (not the weekly planner’s study times).',
    usedIn: [
      { role: 'Student', page: 'Onboarding › When do you do your best work?', path: '/student/onboarding', how: 'Several can be picked.' },
      { role: 'Parent', page: 'Onboarding and My Profile › About your family › When does homework usually happen?', path: '/parent/profile', how: 'Several can be picked.' },
    ],
    drives: ['Saved as learning preferences (bestStudyTimes / homeworkTimes).'],
    whenYouChange: [OFF_HIDES, BUILT_IN],
    fields: [{ name: 'Start / End time', effect: 'The time window the choice stands for.' }],
    related: ['focus_duration', 'activity_categories'],
    api: { admin: generic('study_time'), read: ['GET /api/v1/onboarding/lookups/study_time'], code: ['services/onboarding.service.js'] },
  },
  challenge_areas: {
    summary: 'Things a student finds harder - asked in onboarding and on the child’s profile, and used to personalize help.',
    usedIn: [
      { role: 'Student', page: 'Onboarding › Things that feel harder', path: '/student/onboarding', how: 'Grade 6+ and K-4.' },
      { role: 'Parent', page: 'My Children › Add / edit child', path: '/parent/children', how: 'Chosen for the child.' },
      { role: 'Super Admin', page: 'Create / edit student', path: '/admin/users/students', how: 'Student profile field.' },
    ],
    drives: ['AI step suggestions for the student’s work take their challenges into account (learner profile).'],
    whenYouChange: [OFF_HIDES, BUILT_IN],
    fields: [{ name: 'Category', effect: 'Groups the choices.' }],
    related: ['strength_areas', 'interest_categories'],
    api: { admin: generic('challenge_areas'), read: ['GET /api/v1/onboarding/lookups/challenge_areas', 'GET /api/v1/parent/lookups/master/challenge_areas'], code: ['services/onboarding.service.js', 'services/parent.service.js', 'services/planner/learnerProfile.js'] },
  },
  strength_areas: {
    summary: 'Things a student is good at - asked in onboarding and on the child’s profile, and used to personalize help.',
    usedIn: [
      { role: 'Student', page: 'Onboarding › Things you’re good at', path: '/student/onboarding', how: 'Grade 6+ and K-4.' },
      { role: 'Parent', page: 'My Children › Add / edit child', path: '/parent/children', how: 'Chosen for the child.' },
      { role: 'Super Admin', page: 'Create / edit student', path: '/admin/users/students', how: 'Student profile field.' },
    ],
    drives: ['AI step suggestions for the student’s work build on their strengths (learner profile).'],
    whenYouChange: [OFF_HIDES, BUILT_IN],
    fields: [{ name: 'Category', effect: 'Groups the choices.' }],
    related: ['challenge_areas', 'interest_categories'],
    api: { admin: generic('strength_areas'), read: ['GET /api/v1/onboarding/lookups/strength_areas', 'GET /api/v1/parent/lookups/master/strength_areas'], code: ['services/onboarding.service.js', 'services/parent.service.js', 'services/planner/learnerProfile.js'] },
  },
  interest_categories: {
    summary: 'A student’s interests - asked in onboarding and on the child’s profile.',
    usedIn: [
      { role: 'Student', page: 'Onboarding › Interests', path: '/student/onboarding', how: 'Grade 6+ and K-4; several can be picked.' },
      { role: 'Parent', page: 'My Children › Add / edit child', path: '/parent/children', how: 'Chosen for the child.' },
      { role: 'Super Admin', page: 'Create / edit student', path: '/admin/users/students', how: 'Student profile field.' },
    ],
    drives: ['Saved on the student’s profile. Unlike strengths and challenges, interests are not given to the AI today.'],
    whenYouChange: [OFF_HIDES, BUILT_IN],
    related: ['strength_areas', 'challenge_areas'],
    api: { admin: generic('interest_categories'), read: ['GET /api/v1/onboarding/lookups/interest_categories', 'GET /api/v1/parent/lookups/master/interest_categories'], code: ['services/onboarding.service.js', 'services/parent.service.js'] },
  },
  activity_categories: {
    summary: 'Kinds of personal activity (practice, family dinner, plans with friends…) a student or parent adds as a busy time, with an icon and colour.',
    usedIn: [
      { role: 'Student', page: 'Study times › Add a busy time › What kind of activity?', path: '/student/study-times', how: 'The busy-time form.' },
      { role: 'Parent', page: 'Schedule › Study times › Add a busy time', path: '/parent/schedule/study-times', how: 'Same form for a child.' },
      { role: 'Student / Parent', page: 'Plan calendar and Schedule', path: '/student/calendar', how: 'Busy times show in their category’s colour and icon.' },
    ],
    drives: ['The planner keeps study time off busy times.'],
    whenYouChange: ['Changing a colour or icon repaints existing busy times.', OFF_HIDES, BUILT_IN],
    fields: [{ name: 'Colour', effect: 'Colour of the busy time on calendars.' }],
    related: ['study_time', 'assignment_types'],
    api: { admin: generic('activity_categories'), read: ['GET /api/v1/lookups/activity_categories'], code: ['services/planner/studentPlanning.service.js#assertCategory', 'services/planner/workDisplay.js'] },
  },

  // ------------------------------------------------------------------ Check-in
  emotional_states: {
    summary: 'The moods a student picks in the daily check-in, each with a face, colour and intensity.',
    usedIn: [
      { role: 'Student', page: 'Check In', path: '/student/check-in', how: 'The mood choices (K-4 and Grade 6+).' },
      { role: 'Student', page: 'Home (K-4), Focus', path: '/student/focus', how: 'Today’s mood shows on the K-4 pages and shapes Focus suggestions.' },
      { role: 'Teacher', page: 'My Students, student page', path: '/teacher/students', how: 'Mood face per student, and check-in alerts.' },
      { role: 'Parent', page: 'Overview, Progress', path: '/parent', how: 'Mood history of each child.' },
    ],
    drives: ['A mood whose intensity is at or above the alert level raises a check-in alert for the student’s teachers.', 'Planning and AI suggestions take today’s mood into account.'],
    whenYouChange: ['Old check-ins keep showing a switched-off mood.', BUILT_IN],
    fields: [{ name: 'Intensity level', effect: 'High values raise check-in alerts.' }, { name: 'Background colour', effect: 'The colour behind the mood face.' }, { name: 'Code', effect: 'Stored on each check-in - don’t change it once used.' }],
    related: ['difficulty_reasons', 'regulation-activities'],
    api: { admin: generic('emotional_states'), read: ['GET /api/v1/lookups/emotional_states'], code: ['services/checkIn.service.js', 'services/checkInAlert.service.js', 'services/planner/learnerProfile.js'] },
  },
  difficulty_reasons: {
    summary: 'Reasons a student can give when work is hard to start or keep going (“What’s making it hard?”), each with the help offered back.',
    usedIn: [
      { role: 'Student', page: 'Focus › I’m stuck', path: '/student/focus', how: 'The short list first, then “Something else…”.' },
      { role: 'Student', page: 'Plan › Need help with a step', path: '/student/calendar', how: 'Same picker.' },
      { role: 'Student (K-4)', page: 'Home plan card, Focus', path: '/student', how: 'Kid version of the picker.' },
    ],
    drives: ['The chosen reason decides which Support Strategies are suggested.'],
    whenYouChange: [OFF_HIDES, BUILT_IN],
    fields: [
      { name: 'Short label / Order on the first screen', effect: 'Puts the reason on the short first list, in that order.' },
      { name: 'First reply', effect: 'The title of the help the student sees.' },
      { name: 'Category', effect: 'A Difficulty Category code - the group under “Something else…”.' },
      { name: 'Strategies', effect: 'Comma-separated Support Strategy codes to offer.' },
    ],
    related: ['difficulty_categories', 'support_strategies'],
    api: { admin: generic('difficulty_reasons'), read: ['GET /api/v1/lookups/difficulty-picker'], code: ['services/masterLookup.service.js#difficultyPicker'] },
  },
  difficulty_categories: {
    summary: 'The groups the difficulty reasons are shown under after “Something else…”.',
    usedIn: [{ role: 'Student', page: 'Focus › I’m stuck › Something else…', path: '/student/focus', how: 'Group headings of the full list (K-4 and Grade 6+).' }],
    whenYouChange: ['Reasons point at a category by its code - keep the code when renaming.', BUILT_IN],
    related: ['difficulty_reasons', 'support_strategies'],
    api: { admin: generic('difficulty_categories'), read: ['GET /api/v1/lookups/difficulty-picker'], code: ['services/masterLookup.service.js#difficultyPicker'] },
  },
  support_strategies: {
    summary: 'What the platform suggests after a student says what is making the work hard.',
    usedIn: [{ role: 'Student', page: 'Focus › I’m stuck, Plan › Need help', path: '/student/focus', how: 'Shown as the ideas to try for the chosen reason.' }],
    whenYouChange: ['Difficulty Reasons list strategies by code - keep the code when renaming.', OFF_HIDES, BUILT_IN],
    related: ['difficulty_reasons', 'regulation-activities'],
    api: { admin: generic('support_strategies'), read: ['GET /api/v1/lookups/difficulty-picker'], code: ['services/masterLookup.service.js#difficultyPicker'] },
  },

  // ------------------------------------------------------------------ Regulation toolkit
  'regulation-activities': {
    summary: 'Breathing, grounding and calming exercises students can do, grouped by category.',
    usedIn: [
      { role: 'Student', page: 'Focus › Exercises', path: '/student/focus', how: 'Tiles by category; the video, picture or sound link plays beside the steps.' },
      { role: 'Student', page: 'Check In', path: '/student/check-in', how: 'Calming ideas suggested after a check-in.' },
      { role: 'Student', page: 'Focus › I’m stuck', path: '/student/focus', how: 'A calming activity to try.' },
    ],
    whenYouChange: [OFF_HIDES, BUILT_IN],
    fields: [{ name: 'Category', effect: 'The tile it sits under.' }, { name: 'Video, picture or sound link', effect: 'Media shown with the steps.' }],
    related: ['emotional_states', 'support_strategies'],
    api: { admin: 'GET|POST /api/v1/admin/master/regulation-activities · PATCH|DELETE …/:id', read: ['GET /api/v1/regulation-toolkit', 'GET /api/v1/regulation-toolkit/recommendation'], code: ['services/regulationToolkit.service.js'] },
  },

  // ------------------------------------------------------------------ Rewards
  'reward-activities': {
    summary: 'How many points each activity earns a student: finishing a step, finishing a task, a focus session, the daily check-in.',
    usedIn: [
      { role: 'Student', page: 'Rewards, Home progress', path: '/student/rewards', how: 'Points add up as the student does these activities.' },
    ],
    drives: ['Points unlock Student Rewards (stickers and emojis).'],
    whenYouChange: ['The activity key is what the app awards on - it can’t be changed; edit the points.', 'Points already earned are not recalculated.'],
    fields: [{ name: 'Points', effect: 'Points per activity.' }],
    related: ['student-rewards'],
    api: { admin: 'GET|POST /api/v1/admin/master/reward-activities · PATCH|DELETE …/:id', read: ['Used by the points service'], code: ['services/pointsAward.service.js'] },
  },
  'student-rewards': {
    summary: 'Stickers and emojis students collect as their points grow.',
    usedIn: [
      { role: 'Student', page: 'Rewards', path: '/student/rewards', how: 'The collection and what is next.' },
      { role: 'Student', page: 'Home › My stickers', path: '/student', how: 'Collected stickers placed on Home (K-4 and Grade 6+).' },
    ],
    whenYouChange: ['Lowering points can unlock a reward for students who already have them.', OFF_HIDES, BUILT_IN],
    fields: [{ name: 'Points required', effect: 'When it unlocks.' }, { name: 'Type', effect: 'Sticker or emoji - each type has its own Order.' }],
    related: ['reward-activities', 'avatars'],
    api: { admin: 'GET|POST /api/v1/admin/master/student-rewards · PATCH|DELETE …/:id', read: ['GET /api/v1/rewards/catalog', 'GET /api/v1/rewards/summary'], code: ['services/reward.service.js', 'services/rewardPicture.service.js'] },
  },

  // ------------------------------------------------------------------ Personalization
  avatars: {
    summary: 'Pictures students can pick as their avatar.',
    usedIn: [
      { role: 'Student', page: 'Make it yours › Avatar', path: '/student/make-it-yours', how: 'The avatar picker (K-4 and Grade 6+).' },
      { role: 'Student', page: 'Sidebar and top bar', path: '/student', how: 'The chosen avatar shows on every page.' },
    ],
    whenYouChange: ['A switched-off avatar disappears from the picker.', BUILT_IN],
    related: ['student-rewards'],
    api: { admin: 'GET|POST /api/v1/admin/master/avatars · PATCH|DELETE …/:id', read: ['Student “Make it yours” endpoints'], code: ['services/masterAppearance.service.js', 'services/avatarPicture.service.js'] },
  },

  // ------------------------------------------------------------------ Billing
  'subscription-plans': {
    summary: 'The plans families buy: price, monthly or yearly, free trial, and how many children and parents fit.',
    usedIn: [
      { role: 'Parent', page: 'Subscription › Choose a plan, Change plan', path: '/parent/subscription', how: 'Plans a family can pick; too-small plans are greyed out.' },
      { role: 'Parent', page: 'Payment', path: '/parent/subscription/checkout', how: 'Price, trial and tax for the chosen plan.' },
      { role: 'Parent', page: 'My Children', path: '/parent/children', how: 'Adding a child or parent is limited by the plan.' },
      { role: 'Super Admin', page: 'Subscriptions, Revenue', path: '/admin/subscriptions', how: 'Plan of each family; revenue by plan.' },
    ],
    drives: ['Renewals charge the plan’s price (after any code, never below its minimum amount), plus tax.'],
    whenYouChange: ['A new price applies from each family’s next renewal.', 'A plan with subscriptions can’t be deleted - switch it off.'],
    fields: [
      { name: 'Number of students / parents', effect: 'How big a family the plan covers (required, at least 1).' },
      { name: 'Trial days', effect: 'Free trial for a family’s first subscription (required, 0 = none).' },
      { name: 'Minimum amount', effect: 'The least a family pays for the plan, whatever discount code is used (required, 0 = no minimum, never above the price).' },
    ],
    related: ['discount-codes'],
    api: { admin: 'GET|POST /api/v1/admin/master/subscription-plans · PATCH|DELETE …/:id', read: ['GET /api/v1/subscriptions/plans'], code: ['services/subscription.service.js', 'services/family.service.js'] },
  },
  'discount-codes': {
    summary: 'Codes that take money off a plan - typed by a parent at checkout, or applied by Super Admin to a family’s subscription.',
    usedIn: [
      { role: 'Parent', page: 'Subscription › Discount code', path: '/parent/subscription', how: 'Typed and applied before paying.' },
      { role: 'Super Admin', page: 'Subscriptions › Apply discount code', path: '/admin/subscriptions', how: 'Applies from the family’s next payment.' },
      { role: 'Super Admin', page: 'Code redemptions', path: '/admin/masters/discount-codes/:id/redemptions', how: 'Who used the code.' },
    ],
    drives: ['A code can take off any amount, but never below the plan’s minimum amount.', 'Renewals keep the subscription’s code.'],
    whenYouChange: ['Start and expiry dates are whole days; usage limits count every family.'],
    related: ['subscription-plans'],
    api: { admin: 'GET|POST /api/v1/admin/master/discount-codes · PATCH|DELETE …/:id', read: ['POST /api/v1/subscriptions/coupons/validate'], code: ['services/couponRules.js', 'services/adminCoupon.service.js'] },
  },
};

/** The master a page belongs to: the segment after /admin/masters/. */
export function masterKeyFromPath(pathname) {
  const match = /^\/admin\/masters\/([^/]+)/.exec(pathname ?? '');
  return match ? match[1] : null;
}

/** The guide for an address segment ("focus_duration", "task-types"), or null. */
export const guideFor = (key) => (key && MASTER_GUIDES[key]) || null;

/** The admin page of a related master. */
export const masterPath = (key) => `/admin/masters/${key}`;

/** Readable name for a related key: "task-types" -> "Task types", "focus_duration" -> "Focus duration". */
export function keyLabel(key) {
  const words = String(key).replace(/[-_]/g, ' ').trim();
  return words.charAt(0).toUpperCase() + words.slice(1);
}
