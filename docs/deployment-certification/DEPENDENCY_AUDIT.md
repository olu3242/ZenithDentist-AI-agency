# Dependency Audit

## Real diff (`git diff origin/main...HEAD -- package.json`)

Only changes: two new **devDependencies** (`vitest@^4.1.9`, `@vitest/coverage-v8@^4.1.9`) and five new npm scripts (`test`, `test:coverage`, `test:e2e`, `migration:validate`, `smoke:pipeline`). **Zero new runtime/production dependencies.**

## Verification

- `npm ls --depth=0` — zero `invalid`/`missing`/`UNMET DEPENDENCY` entries.
- `npm install` completed without error (ran earlier in this session as a precondition for `npm run build`/`npm run test`).
- `npm run build` (full Next.js production build) completed successfully — see `BUILD_CERTIFICATION.md` for the full log tail. A successful production build is direct proof that every import resolves, including dynamic imports, since Next.js statically analyzes the import graph at build time.
- No new peer-dependency warnings surfaced during `npm install` or `npm run build`.

## Conclusion

**PASS.** This PR introduces no new runtime dependency risk. The only dependency-shaped change is test tooling, which is dev-only and cannot affect the production bundle or Vercel's production install step (`npm install --omit=dev` would not even install these packages).
