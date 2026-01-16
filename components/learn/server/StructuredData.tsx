/**
 * Server component that renders JSON-LD structured data scripts.
 * Must remain a server component - no "use client" directive.
 */

interface StructuredDataProps {
  schemas: object[];
}

export function StructuredData({ schemas }: StructuredDataProps) {
  return (
    <>
      {schemas.map((schema, index) => (
        <script
          key={index}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      ))}
    </>
  );
}
