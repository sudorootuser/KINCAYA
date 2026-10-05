import { Injectable, inject } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';

@Injectable({ providedIn: 'root' })
export class SeoService {
  private readonly titleService = inject(Title);
  private readonly meta = inject(Meta);

  updateProduct(name: string, description: string, image: string, price: number): void {
    const fullTitle = `${name} | Kincaya Technology`;
    this.titleService.setTitle(fullTitle);

    this.meta.updateTag({ name: 'description', content: description });
    this.meta.updateTag({ property: 'og:title', content: fullTitle });
    this.meta.updateTag({ property: 'og:description', content: description });
    this.meta.updateTag({ property: 'og:image', content: image });
    this.meta.updateTag({ property: 'og:type', content: 'product' });
    this.meta.updateTag({ name: 'twitter:title', content: fullTitle });
    this.meta.updateTag({ name: 'twitter:description', content: description });
    this.meta.updateTag({ name: 'twitter:image', content: image });
  }

  updatePage(title: string, description: string): void {
    this.titleService.setTitle(`${title} | Kincaya Technology`);
    this.meta.updateTag({ name: 'description', content: description });
    this.meta.updateTag({ property: 'og:title', content: `${title} | Kincaya Technology` });
    this.meta.updateTag({ property: 'og:description', content: description });
    this.meta.updateTag({ property: 'og:type', content: 'website' });
  }

  resetDefault(): void {
    this.titleService.setTitle('Kincaya Technology');
    this.meta.updateTag({
      name: 'description',
      content: 'Kincaya Technology: compra tecnologia para hogar, oficina y negocio con asesoria personalizada, entrega rapida y soporte postventa.',
    });
    this.meta.updateTag({ property: 'og:title', content: 'Kincaya Technology' });
    this.meta.updateTag({ property: 'og:type', content: 'website' });
  }
}
