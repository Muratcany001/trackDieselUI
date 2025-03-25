import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

export const authGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const token = localStorage.getItem('token');

  console.log('Auth Guard çalışıyor...');
  console.log('Token durumu:', token ? 'Token var' : 'Token yok');
  console.log('İstenen route:', state.url);

  if (!token) {
    console.log('Token bulunamadı, login sayfasına yönlendiriliyor');
    router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
    return false;
  }

  console.log('Token bulundu, erişim izni verildi');
  return true;
};
