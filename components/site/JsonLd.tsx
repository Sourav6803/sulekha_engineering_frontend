/**
 * Renders a JSON-LD block.
 *
 * The payload is built from our own constants, never from user input, so
 * stringifying it straight into the tag is safe. `<` is still escaped because a
 * future field (a business description, say) could contain one and close the
 * script early.
 */
export default function JsonLd({ data }: { data: object }) {
  const json = JSON.stringify(data).replace(/</g, '\\u003c');

  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />;
}
