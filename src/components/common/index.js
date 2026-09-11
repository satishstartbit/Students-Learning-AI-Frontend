/**
 * Common component library.
 *
 * Import from here rather than reaching into individual files:
 *   import { Button, Card, DataTable } from '@/components/common';
 *
 * The design-system stylesheet is imported once, here, so any consumer of a
 * shared component gets consistent styling.
 */
import './common.css';

// --- Form ---------------------------------------------------------------
export { default as Input } from './Input';
export { default as Textarea } from './Textarea';
export { default as Select } from './Select';
export { default as MultiSelect } from './MultiSelect';
export { default as Checkbox } from './Checkbox';
export { default as Radio } from './Radio';
export { default as DatePicker } from './DatePicker';
export { default as TimePicker } from './TimePicker';
export { default as FileUpload } from './FileUpload';
export { default as ImageUpload } from './ImageUpload';
export { default as SearchInput } from './SearchInput';
export { default as PasswordInput } from './PasswordInput';
export { default as FormField } from './FormField';
export { default as FormError } from './FormError';
export { default as FieldHelper } from './FieldHelper';
export { default as Label } from './Label';

// --- Buttons ------------------------------------------------------------
export { default as Button } from './Button';
export { default as IconButton } from './IconButton';
export { default as ButtonGroup } from './ButtonGroup';

// --- Feedback -----------------------------------------------------------
export { default as Alert } from './Alert';
export { default as Toast } from './Toast';
export { default as Loader } from './Loader';
export { default as Spinner } from './Spinner';
export { default as EmptyState } from './EmptyState';
export { default as ErrorState } from './ErrorState';
export { default as ConfirmationModal } from './ConfirmationModal';

// --- Layout -------------------------------------------------------------
export { default as Modal } from './Modal';
export { default as Drawer } from './Drawer';
export { default as Card } from './Card';
export { default as PageHeader } from './PageHeader';
export { default as SectionHeader } from './SectionHeader';
export { default as Tabs } from './Tabs';
export { default as Badge } from './Badge';
export { default as StatusBadge } from './StatusBadge';
export { default as Avatar } from './Avatar';
export { default as BrandMark } from './BrandMark';
export { default as StickyNote } from './StickyNote';
export { default as StickyNoteColorPicker } from './StickyNoteColorPicker';
export { default as StickyBoard } from './StickyBoard';

// --- Data display -------------------------------------------------------
export { default as Table } from './Table';
export { default as Pagination } from './Pagination';
export { default as DataTable } from './DataTable';
export { default as ProgressBar } from './ProgressBar';
export { default as CircularProgress } from './CircularProgress';
export { default as ProgressCard } from './ProgressCard';
export { default as StatCard } from './StatCard';
export { default as Dropdown } from './Dropdown';

// --- Navigation ---------------------------------------------------------
export { default as Navbar } from './Navbar';
export { default as Sidebar } from './Sidebar';
export { default as Breadcrumb } from './Breadcrumb';
export { default as ProtectedRoute } from './ProtectedRoute';
export { default as RoleGuard } from './RoleGuard';
