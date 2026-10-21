import { useState } from 'react';
import { followAddress } from '../utils/listQuery';

/**
 * A search box whose text lives in the address (hooks/useListQuery).
 *
 *   const [searchText, typeSearch] = useAddressText(query.search, (v) => setQuery({ search: v, page: 1 }));
 *   <SearchInput value={searchText} onChange={(e) => typeSearch(e.target.value)} onClear={() => typeSearch('')} />
 *
 * React Router applies address changes in a transition, so a box bound straight
 * to the address lost letters when typing fast (React put the old value back
 * between keystrokes: "Stu 1" became "St1"). The box shows its own text at once
 * and the address follows; a change made elsewhere still shows (utils/listQuery#followAddress).
 */
export function useAddressText(value, commit) {
  const [state, setState] = useState({ text: value, seen: value, pending: [] });
  const next = followAddress(state, value);
  if (next !== state) setState(next);

  const change = (text) => {
    setState((s) => ({ ...s, text, pending: [...s.pending, text].slice(-50) }));
    commit(text);
  };
  return [next.text, change];
}

export default useAddressText;
