# assignments module

Shared building blocks for assignments. There are **no pages here**. Teachers author work in `teacher` (AssignmentFormPage/DetailsPage), and students answer it in `student` (AssignmentDetailPage). **Roles:** TEACHER and SUPER_ADMIN author, STUDENT answers.

## Where it lives
| Frontend | Purpose |
|---|---|
| `services/assignment.service.js` | `/assignments` for both sides: list/counts/get, create/update, publish/unpublish/archive/delete, files, student start/progress/submit, teacher review |
| `services/curriculum.service.js` | `/curriculum/task-types`, `/subjects`, `/subjects/:id/topics`, `/audio-tracks`, `/question-types` (master-backed pickers) |
| `components/QuestionBuilder.jsx`, `questionDrafts.js`, `PassageEditor.jsx`, `PairsEditor.jsx` | Teacher question authoring (dnd-kit reorder, type pills, points/required) |
| `components/QuestionAnswer.jsx`, `MatchingQuestionKid.jsx`, `MatchingQuestionStandard.jsx`, `hooks/useMatchingAnswer.js` | Student answering, with kid and standard variants of matching |
| `components/ReviewSubmissionModal.jsx` | Teacher marks a submission (score, feedback, return) |
| `components/StudentPicker.jsx`, `BackgroundAudioField.jsx` | Recipients, and background sound (track or upload) |
| `media/*` | Picture for a question or pair: upload / emoji (emoji-mart) / GIF & sticker (`VITE_GIF_PROVIDER`, `VITE_GIF_API_KEY`) |
| `components/assignmentForm.css` | Form styles (`af-`) shared with the teacher form |

**Backend:** `routes/assignment.routes.js` (`/assignments`, `subscriptionGated`; TEACHER/SUPER_ADMIN author, STUDENT works) → `controllers/assignment.controller.js` → `services/assignment.service.js`, `assignmentQuestion.service.js` → `repositories/assignment.repository.js`. Curriculum: `routes/curriculum.routes.js` → `services/curriculum.service.js`. Models: `Assignment`, `AssignmentRecipient`, `AssignmentSubmission`, `AssignmentQuestion`, `SubmissionAnswer`, `AssignmentFile`, `TaskType`, `Subject`, `Topic`, `QuestionType`, `AudioTrack`.

## Rules - read before changing
- **Two lifecycles on one table.** `assignments.source_type`: `teacher` (draft → published → archived, via `published_at`/`archived_at`) versus a student's own task (`manual`/`photo`, see `student` `/my-tasks`) and the OCR flow. "Completed" and "overdue" are derived at read time, never stored.
- **Recipient status** (`ASSIGNMENT_RECIPIENT_STATUS`): `assigned` → `in_progress` (student pressed Start) → `submitted` → `reviewed`/`completed`, or `returned` (sent back with feedback, editable again). The student can edit only in `in_progress`/`returned`.
- **Unpublish** is allowed only while every recipient is still `assigned`. It withdraws the "new assignment" notifications (`notification.repository#deleteForRelated`), and re-publishing notifies again.
- **Recipients** must be inside the teacher's own relationship scope (subject + grade + academic year from `user_relationships`). Don't let a teacher assign to arbitrary students.
- **Question types** (`answerType`): `mcq`, `passage_mcq`, `matching`, `free_text`. The labels and hints come from the `question_types` master. MCQ-like types need `options` + `correctOptionId`. Matching scores partially (`partial_score`). Free text waits for the teacher ("written answers to mark"). A question with `required: false` left blank neither helps nor hurts the score.
- **Task types** come from the Task Types master (about 20 client types, each with `flow_type` `full_assignment` | `simple_reminder` and optional grade range). `simple_reminder` (e.g. permission slips, supplies) uses the short creation flow. Never hardcode the list.
- **Draft autosave** (teacher form): only new or draft assignments, 1.5s debounce, serialised queue. The first save creates the draft and `replaceState`s to `/:id/edit`.
- Files and pictures go through the private storage pipeline (signed URLs). `STORAGE_PROVIDER=local` in dev without S3.
- Background audio starts only while the task is still to do. The player is created once per open (see `student/AssignmentDetailPage#TaskAudio`).

## Verify
- `npx eslint src/modules/assignments src/modules/teacher` · `npm run build`
- UI: harness. Teacher form with `USERS.teacher` (`/teacher/assignments/new`). Student answering with `USERS.kid` and `USERS.student`.
- Backend: api-tester. Publish/unpublish guard, recipient scope, submit then review, returned then edit.

## Related
`teacher` (form, list, details), `student` (answering, focus on the task page), `masterManagement` (task types, subjects, topics, question types, audio tracks), `notifications`.
