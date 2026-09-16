import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Select } from '../../../components/common';
import { useApi } from '../../../hooks/useApi';
import { formatGradeRange } from '../../../utils/gradeRange';
import { listGradeLevels } from '../services/curriculum.service';

/**
 * "From grade" / "To grade" pickers for a curriculum master. Options come from
 * the Grade Levels master (its sort value is the grade number), so there is
 * one grade list for the whole platform. Blank on either side = open-ended.
 *
 * `fromProps` / `toProps` are `form.getFieldProps(...)` results.
 */
export default function GradeRangeFields({ fromProps, toProps }) {
  const grades = useApi(listGradeLevels, { immediate: true });

  const options = useMemo(
    () =>
      (grades.data ?? [])
        .map((g) => ({ value: g.extra?.numeric_value, label: g.name }))
        .filter((o) => Number.isInteger(Number(o.value)) && o.value !== null && o.value !== undefined)
        .sort((a, b) => Number(a.value) - Number(b.value))
        .map((o) => ({ value: String(o.value), label: o.label })),
    [grades.data]
  );

  return (
    <div className="ui-field">
      <div className="grid gap-4 md:grid-cols-2">
        <Select label="From grade" placeholder="Any (no lower limit)" options={options} loading={grades.isLoading} {...fromProps} />
        <Select label="To grade" placeholder="Any (no upper limit)" options={options} loading={grades.isLoading} {...toProps} />
      </div>
      <p className="ui-hint" style={{ marginTop: 0 }}>
        Shown to teachers for: <strong>{formatGradeRange(fromProps.value, toProps.value)}</strong>. Grades come from the{' '}
        <Link to="/admin/masters/grade_levels">Grade Levels</Link> list.
      </p>
    </div>
  );
}
