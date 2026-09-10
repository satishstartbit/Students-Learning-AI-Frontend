import { Link, useNavigate } from 'react-router-dom';
import {
  PageHeader,
  Card,
  Input,
  Select,
  Button,
  Alert,
  Radio,
  SectionHeader,
  ButtonGroup,
} from '../../../components/common';
import { useForm } from '../../../hooks/useForm';
import { toast } from '../../../hooks/useToast';
import { required, email as emailRule, phone as phoneRule } from '../../../utils/validation';
import { CANADIAN_TIMEZONES, DEFAULT_TIMEZONE } from '../../../utils/locale';
import {
  ADMIN_CREATABLE_ROLES,
  ROLE_LABELS,
  USER_ROLES,
  listPathForRole,
} from '../../../utils/constants';
import adminUserService from '../services/adminUser.service';
import RoleProfileFields from '../../auth/components/RoleProfileFields';
import { buildProfilePayload } from '../../auth/components/profilePayload';

/**
 * Super Admin create-user form.
 *
 * The form changes with the selected role, and Super Admin is not offered -
 * those accounts are provisioned directly in the database.
 *
 * No password field: the account is created without a usable password and the
 * new user is emailed a link to set their own, so an admin never sees, sets
 * or transmits a plaintext password.
 */
/**
 * Teacher and Parent only.
 *
 * Students are added by their parent, so that the parent-child link is always
 * created at the same time and no student can end up without a parent. The
 * API refuses a STUDENT here too.
 */
const ROLE_OPTIONS = ADMIN_CREATABLE_ROLES.map((r) => ({
  value: r,
  label: ROLE_LABELS[r],
}));

const TIMEZONE_OPTIONS = CANADIAN_TIMEZONES.map((tz) => ({
  value: tz.value,
  label: `${tz.label} (${tz.value})`,
}));

export default function CreateUserPage() {
  const navigate = useNavigate();

  const form = useForm({
    initialValues: {
      role: USER_ROLES.TEACHER,
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      timezone: DEFAULT_TIMEZONE,
    },
    validationSchema: {
      role: [required('Choose a role')],
      firstName: [required('Enter a first name')],
      email: [required('Enter an email address'), emailRule()],
      phone: [phoneRule()],
    },
    async onSubmit(values) {
      const { data } = await adminUserService.createUser({
        role: values.role,
        firstName: values.firstName,
        lastName: values.lastName || null,
        email: values.email,
        phone: values.phone || null,
        timezone: values.timezone || undefined,
        profile: buildProfilePayload(values.role, values),
      });

      toast.success(
        `User created - username "${data.username}". They have been emailed a link to set their password.`
      );
      navigate(`/admin/users/${data.id}`);
      return data;
    },
  });

  const role = form.values.role;

  return (
    <>
      <PageHeader
        title="Create user"
        description="The new user sets their own password from an emailed link."
        breadcrumbs={[
          // Follows the role picker, so "back" lands on the matching list.
          { label: `${ROLE_LABELS[role]}s`, to: listPathForRole(role) },
          { label: 'Create user' },
        ]}
      />

      <Card>
        {form.submitError && (
          <Alert variant="error" className="ui-field">
            {form.submitError}
          </Alert>
        )}

        <form onSubmit={form.handleSubmit} noValidate>
          <Radio
            name="role"
            label="Role"
            options={ROLE_OPTIONS}
            direction="row"
            value={role}
            onChange={form.handleChange}
            error={form.touched.role ? form.errors.role : null}
            required
          />

          <SectionHeader title="Account details" as="h3" />

          <Input label="First name" required {...form.getFieldProps('firstName')} />
          <Input label="Last name" {...form.getFieldProps('lastName')} />
          <Input label="Email" type="email" required {...form.getFieldProps('email')} />
          <Input
            label="Phone"
            type="tel"
            hint="e.g. (416) 555-1234"
            {...form.getFieldProps('phone')}
          />
          <Select
            label="Timezone"
            options={TIMEZONE_OPTIONS}
            hint="Used to display dates and times to this user"
            {...form.getFieldProps('timezone')}
          />

          <SectionHeader title={`${ROLE_LABELS[role]} profile`} as="h3" />

          <RoleProfileFields role={role} getProps={form.getFieldProps} includeAdminOnly />

          <ButtonGroup>
            <Button type="submit" loading={form.isSubmitting}>
              Create user
            </Button>
            <Button as={Link} to={listPathForRole(role)} variant="secondary">
              Cancel
            </Button>
          </ButtonGroup>
        </form>
      </Card>
    </>
  );
}

