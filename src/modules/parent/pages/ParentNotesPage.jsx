import { useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Button, EmptyState, Loader, PageHeader } from '../../../components/common';
import NotesListView from '../../student/components/notes/NotesListView';
import { useViewingChild } from '../hooks/useViewingChild';
import parentService from '../services/parent.service';

/** One child's notes - keyed by child, so switching child starts with fresh filters. */
function ChildNotes({ child }) {
  const first = child.firstName || 'Your child';
  const load = useCallback((params) => parentService.listChildNotes(child.id, params), [child.id]);

  return (
    <div className="td-page">
      <PageHeader
        title={`${first}’s notes`}
        description={`The notes ${first} keeps - reminders, things to remember, notes on their work. You can read them here; only ${first} can change them.`}
      />
      <NotesListView load={load} readOnly ownerName={first} />
    </div>
  );
}

/**
 * Notes (/parent/notes) - the sidebar's viewing child's notes, read-only,
 * with the same filters as the student's own Notes page (search, when,
 * status) to look back over a week, a month or a year. The Overview shows
 * only yesterday onwards.
 */
export default function ParentNotesPage() {
  const { viewingChild, children, isLoading } = useViewingChild();

  if (isLoading) return <Loader message="Loading notes…" />;
  if (!children.length) {
    return (
      <div className="td-page">
        <EmptyState
          icon="🗒️"
          title="No children yet"
          description="Once a child is on your account, the notes they keep show up here."
          action={
            <Button as={Link} to="/parent/children">
              Go to My Children
            </Button>
          }
        />
      </div>
    );
  }
  if (!viewingChild) return <Loader message="Loading notes…" />;
  return <ChildNotes key={viewingChild.id} child={viewingChild} />;
}
