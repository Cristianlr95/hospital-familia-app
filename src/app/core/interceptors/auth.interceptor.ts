import { HttpContextToken, HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, switchMap, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

const REFRESH_RETRY_CONTEXT = new HttpContextToken<boolean>(() => false);

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  private readonly authService = inject(AuthService);

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    const requiresAuthRefreshHandling = !this.isRefreshEndpoint(request) && !request.context.get(REFRESH_RETRY_CONTEXT);
    const token = this.authService.getAccessToken();

    if (!token) {
      return next.handle(request);
    }

    const authorizedRequest = request.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,
      },
    });

    return next.handle(authorizedRequest).pipe(
      catchError((error) => {
        if (error.status !== 401 || !requiresAuthRefreshHandling) {
          return throwError(() => error);
        }

        return this.authService.refreshSession().pipe(
          switchMap((response) => next.handle(request.clone({
            context: request.context.set(REFRESH_RETRY_CONTEXT, true),
            setHeaders: {
              Authorization: `Bearer ${response.accessToken}`,
            },
          }))),
          catchError((refreshError) => {
            this.authService.clearSession();
            return throwError(() => refreshError);
          }),
        );
      }),
    );
  }

  private isRefreshEndpoint(request: HttpRequest<unknown>): boolean {
    return request.url.includes('/auth/refresh');
  }
}
