import { legalBlocks } from './legalBlocks';
import './legal.css';

/**
 * A legal document as the admin wrote it in Platform settings: "## " lines
 * are headings, "- " lines bullets, blank lines split paragraphs. Rendered as
 * React text - never as HTML - so nothing the admin types can inject markup.
 */
export function LegalText({ body }) {
  return (
    <div className="lgl-text">
      {legalBlocks(body).map((block, i) => {
        const key = `${block.type}-${i}`;
        if (block.type === 'heading') return <h2 key={key}>{block.text}</h2>;
        if (block.type === 'list') {
          return (
            <ul key={key}>
              {block.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          );
        }
        return <p key={key}>{block.text}</p>;
      })}
    </div>
  );
}

export default LegalText;
