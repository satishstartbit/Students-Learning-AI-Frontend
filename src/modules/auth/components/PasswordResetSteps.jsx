import { Link } from 'react-router-dom';
import { LuCheck, LuLock, LuTriangleAlert } from 'react-icons/lu';
import { Button, PasswordInput } from '../../../components/common';
import { useForm } from '../../../hooks/useForm';
import { matches, password as passwordRule, required } from '../../../utils/validation';
import { AuthSplitLayout } from './AuthSplitLayout';
import { checkPassword } from './passwordReset';

/** The red "That didn't work" box used across the reset steps. */
export function ResetAlert({ title, children }) {
  return (
    <div className="lg-alert lg-alert--error" role="alert">
      <LuTriangleAlert className="lg-alert__icon" aria-hidden="true" />
      <div>
        <p className="lg-alert__title">{title}</p>
        {children && <p className="lg-alert__text">{children}</p>}
      </div>
    </div>
  );
}

/** "At least 8 characters" ... ticked off live as the password is typed. */
function PasswordChecklist({ value }) {
  return (
    <ul className="lg-rules" aria-label="Your new password needs">
      {checkPassword(value).map((rule) => (
        <li key={rule.key} className="lg-rules__item" data-met={rule.met || undefined}>
          <span className="lg-rules__dot" aria-hidden="true">
            {rule.met && <LuCheck />}
          </span>
          {rule.label}
          <span className="ui-sr-only">{rule.met ? ' - done' : ' - not yet'}</span>
        </li>
      ))}
    </ul>
  );
}

/**
 * "Choose a new password 🔒" - new password with the live checklist, confirm,
 * Save new password. Shared by the code flow (/forgot-password) and the
 * emailed link (/reset-password?token=).
 *
 * @param onSave     async ({ password, confirmPassword }) => void; a throw is
 *                   shown above the form
 * @param restart    { to } or { onClick } - "Start again" once saving fails
 *                   (a code or link that has run out)
 */
export function NewPasswordStep({ onSave, restart }) {
  const form = useForm({
    initialValues: { password: '', confirmPassword: '' },
    validationSchema: {
      password: [required('Choose a new password'), passwordRule('Your new password needs everything on this list')],
      confirmPassword: [required('Type your new password again'), matches('password', 'The two passwords don’t match')],
    },
    onSubmit: (values) => onSave(values),
  });

  return (
    <AuthSplitLayout
      title={
        <span className="lg-title-fit">
          Choose a new password <span aria-hidden="true">🔒</span>
        </span>
      }
      lead="Pick something you’ll remember. You’ll use it the next time you sign in."
    >
      {form.submitError && <ResetAlert title="We couldn’t save your password">{form.submitError}</ResetAlert>}

      <form onSubmit={form.handleSubmit} noValidate className="lg-form">
        <PasswordInput
          label="New password"
          autoComplete="new-password"
          placeholder="Create a password"
          startAdornment={<LuLock />}
          reserveHelper={false}
          {...form.getFieldProps('password')}
        />
        <PasswordChecklist value={form.values.password} />

        <PasswordInput
          label="Confirm new password"
          autoComplete="new-password"
          placeholder="Type it again"
          startAdornment={<LuLock />}
          {...form.getFieldProps('confirmPassword')}
        />

        <Button type="submit" fullWidth size="lg" loading={form.isSubmitting} className="lg-submit">
          Save new password
        </Button>
      </form>

      {form.submitError && restart && (
        <p className="lg-foot">
          Code or link run out?
          {restart.to ? (
            <Link to={restart.to}>Start again</Link>
          ) : (
            <button type="button" onClick={restart.onClick}>
              Start again
            </button>
          )}
        </p>
      )}
    </AuthSplitLayout>
  );
}

/** "Password updated 🎉" - every session was signed out, so back to sign in. */
export function PasswordUpdatedStep() {
  return (
    <AuthSplitLayout
      title={
        <>
          Password updated <span aria-hidden="true">🎉</span>
        </>
      }
      lead="You’re all set. Sign in with your new password."
    >
      <Button as={Link} to="/login" fullWidth size="lg" className="lg-submit">
        Back to sign in
      </Button>
    </AuthSplitLayout>
  );
}
