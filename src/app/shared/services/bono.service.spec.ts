import { TestBed } from '@angular/core/testing';

import { BonoService } from './bono.service';

describe('BonoService', () => {
  let service: BonoService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(BonoService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
