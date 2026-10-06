import { Link, useNavigate } from 'react-router-dom';
import { PageHeader, Card, Input, PhoneInput, Button, Alert, SectionHeader, ButtonGroup } from '../../../components/common';
import { useForm } from '../../../hooks/useForm';
import { toast } from '../../../hooks/useToast';
import { emailProblemText } from '../../../utils/emailProblem';
import { required, email as emailRule, phone as phoneRule } from '../../../utils/validation';
import { ROLE_LABELS, USER_ROLES, listPathForRole } from '../../../utils/constants';
import adminUserService from '../services/adminUser.service';
import RoleProfileFields from '../../auth/components/RoleProfileFields';
import { buildProfilePayload } from '../../auth/components/profilePayload';

/**
 * What differs between the two create pages.
 *
 * Teacher and Parent only. Students are added by their parent, so that the
 * parent-child link is always created at the same time and no student can end
 * up without a parent. The API refuses a STUDENT here too. Super Admin is not
 * offered either - those accounts are provisioned directly in the database.
 */
const PAGES = {
  [USER_ROLES.TEACHER]: {
    description: 'The teacher sets their own password from an emailed link.',
    profileTitle: 'Teaching profile',
  },
  [USER_ROLES.PARENT]: {
    description: 'The parent sets their own password from an emailed link. You can add their children on the next page.',
    profileTitle: 'Family profile',
  },
};

/**
 * Super Admin create pages: /admin/users/teachers/create and
 * /admin/users/parents/create. routeConfig passes the `role`; there is no
 * role picker.
 *
 * No password field: the account is created without a usable password and the
 * new user is emailed a link to set their own, so an admin never sees, sets
 * or transmits a plaintext password.
 *
 * No time zone field: the new account gets the app default (backend
 * user.service#createUser), then its owner's device sets theirs on first
 * sign-in (hooks/useDeviceTimezone.js).
 */
export default function CreateUserPage({ role = USER_ROLES.TEACHER }) {
  // Keyed so going from one create page to the other starts a fresh form.
  return <CreateUserForm key={role} role={role} />;
}

function CreateUserForm({ role }) {
  const navigate = useNavigate();
  const label = ROLE_LABELS[role];
  const title = `Create ${label.toLowerCase()}`;
  const listPath = listPathForRole(role);
  const page = PAGES[role];

  const form = useForm({
    initialValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
    },
    validationSchema: {
      firstName: [required('Enter a first name')],
      email: [required('Enter an email address'), emailRule()],
      phone: [phoneRule()],
    },
    async onSubmit(values) {
      const { data } = await adminUserService.createUser({
        role,
        firstName: values.firstName,
        lastName: values.lastName || null,
        email: values.email,
        phone: values.phone || null,
        profile: buildProfilePayload(role, values),
      });

      // The account exists either way; say plainly when the set-password email
      // didn't go out - without it the new user can't sign in.
      if (data.inviteEmail?.sent === false) {
        toast.error(
          `${label} created - username "${data.username}" - but the email with their set-password link didn't go out. ${emailProblemText(data.inviteEmail.problem)} Once email works, use Reset password on their page to send a new link.`,
          { title: "The set-password email didn't go out" }
        );
      } else {
        toast.success(`${label} created - username "${data.username}". They have been emailed a link to set their password.`);
      }
      navigate(`/admin/users/${data.id}`);
      return data;
    },
  });

  return (
    <div className="td-page">
      <PageHeader
        title={title}
        description={page.description}
        breadcrumbs={[{ label: `${label}s`, to: listPath }, { label: title }]}
      />

      <Card>
        {form.submitError && (
          <Alert variant="error" className="ui-field">
            {form.submitError}
          </Alert>
        )}

        <form onSubmit={form.handleSubmit} noValidate>
          <SectionHeader title="Account details" as="h3" />

          <Input label="First name" required {...form.getFieldProps('firstName')} />
          <Input label="Last name" {...form.getFieldProps('lastName')} />
          <Input label="Email" type="email" required {...form.getFieldProps('email')} />
          <PhoneInput label="Phone" {...form.getFieldProps('phone')} />

          <SectionHeader title={page.profileTitle} as="h3" />

          <RoleProfileFields role={role} getProps={form.getFieldProps} includeAdminOnly />

          <ButtonGroup>
            <Button type="submit" loading={form.isSubmitting}>
              {title}
            </Button>
            <Button as={Link} to={listPath} variant="secondary">
              Cancel
            </Button>
          </ButtonGroup>
        </form>
      </Card>
    </div>
  );
}
