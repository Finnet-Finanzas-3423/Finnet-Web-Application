import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { map, catchError, of } from 'rxjs';
import {BonoService} from '../../shared/services/bono.service';

export const hasBondosGuard = () => {
  const bonoService = inject(BonoService);
  const router = inject(Router);

  const userId = localStorage.getItem('id') ? Number(localStorage.getItem('id')) : null;

  if (!userId) {
    router.navigate(['/auth/sign-in']);
    return false;
  }

  return bonoService.getBonosByUser(userId).pipe(
    map(bonos => {
      if (bonos && bonos.length > 0) {
        router.navigate(['/dashboard']);
        return false;
      }
      return true;
    }),
    catchError(() => {
      return of(true);
    })
  );
};
