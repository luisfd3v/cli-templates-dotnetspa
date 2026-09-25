<!--
Keep the title in Conventional Commits format. It becomes the commit message on
main and decides the next release version:

  feat: add a Svelte client template     -> minor release
  fix: stop the proxy from ignoring TLS  -> patch release
  docs: clarify the decoupled setup      -> no release
-->

## What changed

<!-- A short summary of the change. -->

## Why

<!-- The problem this solves. Link the issue if there is one. -->

## How was this verified

- [ ] `npm run typecheck`
- [ ] `npm test`
- [ ] `npm run build`
- [ ] Generated a project with the affected combination and it built

<!--
For template changes, mention which combination you tried, e.g.
"vue + coupled + minimal: dotnet build OK, dotnet publish produced wwwroot/index.html".
-->
