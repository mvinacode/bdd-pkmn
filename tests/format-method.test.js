import { describe, expect, it } from 'vitest';
import { formatMethod } from '../js/presentation/modal/appearance.js';

const IMG = 'https://res.cloudinary.com/dkgfa4apm/image/upload/v1/ball.png';

describe('formatMethod — sécurité', () => {
  it('échappe tout HTML du texte saisi', () => {
    const out = formatMethod('<script>alert(1)</script><img src=x onerror=alert(1)>');
    expect(out).not.toMatch(/<script|<img src=x|onerror=alert\(1\)>/);
    expect(out).toContain('&lt;script&gt;');
  });

  it('refuse une couleur qui tenterait d’injecter du CSS ou un attribut', () => {
    expect(formatMethod('[color=red;background:url(x)]a[/color]')).toBe('a');
    expect(formatMethod('[color="><script>]a[/color]')).not.toContain('<script');
    expect(formatMethod('[color=#ff0000]rouge[/color]')).toBe('<span style="color:#ff0000">rouge</span>');
  });

  it('n’accepte que des images https d’hôtes autorisés', () => {
    expect(formatMethod('[img]javascript:alert(1)[/img]')).not.toContain('<img');
    expect(formatMethod('[img]https://evil.example.com/a.png[/img]')).not.toContain('<img');
    expect(formatMethod('[img]http://res.cloudinary.com/a.png[/img]')).not.toContain('<img');
    expect(formatMethod(`[img]${IMG}" onerror="alert(1)[/img]`)).not.toContain('onerror="');
    expect(formatMethod(`[img]${IMG}[/img]`)).toContain(`<img class="method-img" src="${IMG}"`);
  });
});

describe('formatMethod — mise en forme', () => {
  it('gras, italique, souligné', () => {
    expect(formatMethod('[b]a[/b] [i]b[/i] [u]c[/u]')).toBe('<strong>a</strong> <em>b</em> <u>c</u>');
  });

  it('centre une ligne faite seulement d’images collées', () => {
    expect(formatMethod(`Texte\n${IMG} ${IMG}`)).toMatch(/<span class="method-img-row"><img[^>]+> <img[^>]+><\/span>$/);
  });

  it('normalise les fins de ligne Windows', () => {
    expect(formatMethod(`a\r\n${IMG}`)).toContain('method-img-row');
  });
});
