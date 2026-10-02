import { ChangeDetectionStrategy, Component } from '@angular/core';

/**
 * Decorative constellation for the hero panel.
 *
 * Inline SVG rather than a hosted image on purpose: it stays crisp at any size,
 * costs no request and no layout shift, and recolours itself from the theme
 * tokens instead of shipping a light and a dark raster.
 *
 * Every stroke and fill reads `currentColor` or a token, so the only thing the
 * host has to set is `color`. The whole graphic is `aria-hidden` — it carries no
 * information the surrounding copy does not already state.
 *
 * The pulse rings are the only moving parts, and they animate *out* to opacity 0.
 * That matters: the global `prefers-reduced-motion` rule collapses every
 * animation to its final keyframe, so a reduced-motion visitor gets the static
 * network with the rings simply absent — not a graphic frozen mid-fade.
 */
@Component({
  selector: 'app-hero-visual',
  template: `
    <svg
      viewBox="0 0 480 380"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      class="h-full w-full"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <radialGradient id="hero-halo" cx="50%" cy="45%" r="55%">
          <stop offset="0%" stop-color="currentColor" stop-opacity="0.22" />
          <stop offset="100%" stop-color="currentColor" stop-opacity="0" />
        </radialGradient>
        <linearGradient id="hero-edge" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="currentColor" stop-opacity="0.55" />
          <stop offset="100%" stop-color="currentColor" stop-opacity="0.12" />
        </linearGradient>
      </defs>

      <rect width="480" height="380" fill="url(#hero-halo)" />

      <!-- Orbit rings: depth behind the network, never in front of a node. -->
      <g stroke="currentColor" stroke-opacity="0.12" fill="none">
        <ellipse cx="240" cy="190" rx="196" ry="132" />
        <ellipse cx="240" cy="190" rx="132" ry="88" />
        <ellipse cx="240" cy="190" rx="68" ry="44" />
      </g>

      <!-- Edges first so the nodes always sit on top of their own connections. -->
      <g stroke="url(#hero-edge)" stroke-width="1.25" stroke-linecap="round">
        <path d="M80 122 L172 74" />
        <path d="M172 74 L252 146" />
        <path d="M80 122 L152 206" />
        <path d="M152 206 L252 146" />
        <path d="M252 146 L330 92" />
        <path d="M330 92 L402 172" />
        <path d="M252 146 L302 252" />
        <path d="M402 172 L302 252" />
        <path d="M302 252 L204 300" />
        <path d="M152 206 L204 300" />
        <path d="M204 300 L96 266" />
        <path d="M80 122 L96 266" />
        <path d="M302 252 L388 292" />
        <path d="M172 74 L330 92" />
      </g>

      <!-- Pulse rings — the only animated elements; see the class doc comment. -->
      <g fill="none" stroke="currentColor" stroke-width="1.5">
        <circle class="pulse" cx="252" cy="146" r="8" />
        <circle class="pulse pulse--delayed" cx="96" cy="266" r="7" />
        <circle class="pulse pulse--late" cx="402" cy="172" r="7" />
      </g>

      <g fill="currentColor">
        <circle cx="252" cy="146" r="7" />
        <circle cx="80" cy="122" r="5" />
        <circle cx="402" cy="172" r="5.5" />
        <circle cx="204" cy="300" r="5" />
        <circle cx="172" cy="74" r="4" fill-opacity="0.75" />
        <circle cx="152" cy="206" r="4" fill-opacity="0.75" />
        <circle cx="302" cy="252" r="4.5" fill-opacity="0.75" />
        <circle cx="96" cy="266" r="3.5" fill-opacity="0.6" />
        <circle cx="330" cy="92" r="3.5" fill-opacity="0.6" />
        <circle cx="388" cy="292" r="3" fill-opacity="0.5" />
      </g>

      <!-- Accent nodes: a second hue keeps the graphic from reading as a flat mesh. -->
      <g fill="var(--accent)">
        <circle cx="330" cy="92" r="6" fill-opacity="0.9" />
        <circle cx="152" cy="206" r="5" fill-opacity="0.75" />
      </g>
    </svg>
  `,
  styles: `
    :host {
      display: block;
    }

    .pulse {
      transform-box: fill-box;
      transform-origin: center;
      animation: hero-pulse 4s var(--ease-standard) infinite;
    }

    .pulse--delayed {
      animation-delay: 1.3s;
    }

    .pulse--late {
      animation-delay: 2.6s;
    }

    @keyframes hero-pulse {
      0% {
        opacity: 0.5;
        transform: scale(1);
      }

      70%,
      100% {
        opacity: 0;
        transform: scale(2.6);
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeroVisualComponent {}
