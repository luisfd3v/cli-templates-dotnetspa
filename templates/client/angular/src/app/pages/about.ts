import { Component } from '@angular/core';

@Component({
  selector: 'app-about',
  template: `
    <section class="card">
      <h1>About</h1>
      <p class="muted">
        This SPA was scaffolded by <code>create-dotnetspa</code> and talks to the ASP.NET Core
        backend through the <code>/api</code> proxy.
      </p>

      <dl class="facts">
        <dt>Framework</dt>
        <dd>Angular + TypeScript</dd>
        <dt>Backend</dt>
        <dd>ASP.NET Core (.NET 10)</dd>
      </dl>
    </section>
  `,
})
export class About {}
