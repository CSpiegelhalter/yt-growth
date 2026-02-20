# lib/ports/

Interface contracts for external I/O.

## Purpose

Ports define TypeScript interfaces that describe what external capabilities the
application needs, without specifying how they are implemented. This allows
features to depend on abstractions and adapters to implement them.

## Import Rules

**Can import:**
- Nothing (ports are pure types — no runtime dependencies)

**Must NOT import:**
- `lib/features/`
- `lib/adapters/`
- `components/`
- `app/`

**Imported by:**
- `lib/features/` (to declare dependencies on external I/O)
- `lib/adapters/` (to implement the interfaces)
- `app/` (to wire adapters to features)

## Conventions

- One file per port: `<Name>Port.ts` (PascalCase).
- Ports contain only `interface` and `type` declarations.
- No runtime code, no classes, no functions, no side effects.
- Port types use domain vocabulary, not provider vocabulary.

## Example

```ts
// lib/ports/StoragePort.ts
export interface StoragePort {
  put(key: string, data: Buffer, options?: PutOptions): Promise<string>;
  get(key: string): Promise<StorageObject | null>;
  delete(key: string): Promise<boolean>;
  exists(key: string): Promise<boolean>;
  getPublicUrl(key: string): string;
}
```
