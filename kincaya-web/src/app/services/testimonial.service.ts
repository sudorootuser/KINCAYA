import { Injectable, computed, inject, signal } from '@angular/core';

import { Testimonial } from '../models/testimonial.model';
import { TESTIMONIAL_REPOSITORY } from '../repositories/testimonial.repository';

@Injectable({
  providedIn: 'root',
})
export class TestimonialService {
  private readonly repository = inject(TESTIMONIAL_REPOSITORY);

  private readonly testimonialState = signal<Testimonial[]>([]);
  private readonly loadedState = signal(false);
  private readonly loadingState = signal(false);

  readonly items = computed(() => this.testimonialState());
  readonly loaded = computed(() => this.loadedState());

  constructor() {
    this.ensureLoaded();
  }

  ensureLoaded(): void {
    if (this.loadedState() || this.loadingState()) {
      return;
    }

    this.loadingState.set(true);
    this.repository.getTestimonials().subscribe({
      next: (items) => {
        this.testimonialState.set(Array.isArray(items) ? items : []);
        this.loadedState.set(true);
        this.loadingState.set(false);
      },
      error: () => {
        this.testimonialState.set([]);
        this.loadedState.set(true);
        this.loadingState.set(false);
      },
    });
  }
}
