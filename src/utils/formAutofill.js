/**
 * Values a browser or password manager put into a form's text fields without
 * telling React (QA 2026-10-16, "the first sign-in fails, the second works"):
 * Chrome's saved-password autofill and several password managers set the
 * input's value directly, so the form's state still holds '' and the first
 * submit is refused as empty. hooks/useForm reads them at submit time.
 *
 * Only plain text-like inputs and textareas, only where the form's own value
 * is empty: anything React already knows about wins, and formatted widgets
 * (phone boxes, pickers, checkboxes, files) are left alone.
 *
 * @param form    the <form> being submitted (or a button inside it)
 * @param values  the form's current values, keyed by field name
 * @returns { name: value } for each field the browser filled, or null
 */
const TEXT_TYPES = new Set(['text', 'email', 'password', 'tel', 'search', 'url']);

export function browserFilledValues(form, values = {}) {
  const owner = form?.elements ? form : form?.form;
  if (!owner?.elements?.namedItem) return null;
  const found = {};
  for (const name of Object.keys(values)) {
    const el = owner.elements.namedItem(name);
    // A RadioNodeList (several fields share the name) has no tagName.
    const tag = el?.tagName;
    const isText = (tag === 'INPUT' && TEXT_TYPES.has(String(el.type).toLowerCase())) || tag === 'TEXTAREA';
    if (!isText) continue;
    const mine = values[name];
    if ((mine === '' || mine == null) && typeof el.value === 'string' && el.value !== '') found[name] = el.value;
  }
  return Object.keys(found).length ? found : null;
}

export default browserFilledValues;
