# aiAssistant module

The AI Learning Assistant: students pick a subject/topic and get explanations, hints and practice questions. Parents and teachers see **aggregate** activity only. **Roles:** STUDENT uses it. PARENT (learning summary) and TEACHER (learning activity) read summaries.

## Where it lives
| Route | Page |
|---|---|
| `/student/assistant`, `/student/assistant/history`, `/student/assistant/:sessionId` | `pages/AssistantHomePage.jsx`, `LearningHistoryPage.jsx`, `LearningSessionPage.jsx` (behind `RequireCheckIn`) |
| `/parent/learning-summary` | `pages/ParentLearningSummaryPage.jsx` + `components/LearningSummaryPanel.jsx` (`learningSummary.css`, `ls-`) |
| `/teacher/learning-activity` | `pages/TeacherLearningActivityPage.jsx` |

Components: `ChatBubble`, `ChatInput`, `PracticeQuestionCard`, `SessionProgressSummary`, `SubjectTopicPicker`, `ThinkingIndicator` (`aiAssistant.css`, `ai-`). Service: `services/aiAssistant.service.js`.

**Backend:** `routes/learningAssistant.routes.js` (`/learning-assistant`, STUDENT, `subscriptionGated`) → `controllers/learningAssistant.controller.js` → `services/learningAssistant.service.js` → `services/ai/*` (provider → OpenAI via LangChain) and `services/safety/*`. Summaries: `GET /parent/learning-summary`, `/parent/children/:id/learning-summary`, `GET /teacher/learning-activity`, `/teacher/learning-activity/:studentId`. Models: `AiLearningSession`, `AiLearningMessage`, `AiRequest`, `SafetyEvent`, `SafetyAlert`.

## API (student)
`GET /learning-assistant/subjects` · `POST|GET /learning-assistant/sessions` · `GET /sessions/active` · `GET /sessions/:id` · `POST /sessions/:id/end|messages|explain|hint|practice-questions|practice-questions/answer`

## Rules - read before changing
- **Safety screening is mandatory and fails closed.** Every student message goes through `services/safety` (`checkText`) **before** any model call. On a concern (or a classifier failure), the AI run stops, a safety event is recorded, the parent is emailed, and the student gets a fixed supportive response, never a model-generated one. Never add a path that sends student text to a model without this.
- **Parents and teachers never see raw conversation content.** Their endpoints return aggregates only (sessions, time, subjects, practice results). Keep it that way. There's a negative-access check for this.
- Access: a parent sees their own children, a teacher their linked students (`studentAccess.service.js`).
- Every model call goes through `services/ai` (`ai.service` → provider). Never import an SDK in a controller or feature service. AI requests are recorded (`AiRequest`).
- **No `OPENAI_API_KEY` in this dev environment.** Model-backed endpoints return a clean 500 "AI service is temporarily unavailable". Real generated content can't be verified here. Say so when reporting.

## Verify
- UI: harness with `USERS.student` (mock sessions and messages), `USERS.parent` (`/parent/learning-summary`), `USERS.teacher`.
- Backend: api-tester. Safety fail-closed path (stub the classifier to throw → blocked, no model call), a parent/teacher can't read another family's student, summaries contain no message text.

## Related
`student` (entry points), `parent`, `teacher`, `checkIn` (gate).
