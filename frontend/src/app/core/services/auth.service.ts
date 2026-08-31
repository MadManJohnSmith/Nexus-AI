import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap, catchError, throwError } from 'rxjs';
import { User, LoginResponse, AuthTokens } from '../models/auth.models';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);

  private readonly API_URL = '/api/v2/auth';
  private readonly ACCESS_TOKEN_KEY = 'nexus_access_token';
  private readonly REFRESH_TOKEN_KEY = 'nexus_refresh_token';
  private readonly USER_KEY = 'nexus_user';

  // Signals State
  private currentUserSignal = signal<User | null>(this.loadStoredUser());
  private accessTokenSignal = signal<string | null>(this.loadStoredToken());

  public currentUser = this.currentUserSignal.asReadonly();
  public isAuthenticated = computed(() => !!this.accessTokenSignal() && !!this.currentUserSignal());
  public userRole = computed(() => this.currentUserSignal()?.role ?? null);
  public isCoordinator = computed(() => this.userRole() === 'COORDINADOR');
  public isAdvisor = computed(() => this.userRole() === 'ASESOR');
  public isStudent = computed(() => this.userRole() === 'ESTUDIANTE');

  private loadStoredUser(): User | null {
    try {
      const stored = localStorage.getItem(this.USER_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  }

  private loadStoredToken(): string | null {
    return localStorage.getItem(this.ACCESS_TOKEN_KEY);
  }

  public getAccessToken(): string | null {
    return this.accessTokenSignal() || localStorage.getItem(this.ACCESS_TOKEN_KEY);
  }

  public login(credentials: { email: string; password: string }): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.API_URL}/login/`, credentials).pipe(
      tap(response => {
        const user: User = {
          id: response.user.id,
          email: response.user.email,
          firstName: response.user.first_name,
          lastName: response.user.last_name,
          fullName: response.user.full_name,
          role: response.user.role,
          isActive: response.user.is_active
        };

        localStorage.setItem(this.ACCESS_TOKEN_KEY, response.access);
        localStorage.setItem(this.REFRESH_TOKEN_KEY, response.refresh);
        localStorage.setItem(this.USER_KEY, JSON.stringify(user));

        this.accessTokenSignal.set(response.access);
        this.currentUserSignal.set(user);
      })
    );
  }

  public refreshToken(): Observable<{ access: string }> {
    const refresh = localStorage.getItem(this.REFRESH_TOKEN_KEY);
    return this.http.post<{ access: string }>(`${this.API_URL}/token/refresh/`, { refresh }).pipe(
      tap(res => {
        localStorage.setItem(this.ACCESS_TOKEN_KEY, res.access);
        this.accessTokenSignal.set(res.access);
      }),
      catchError(err => {
        this.logout();
        return throwError(() => err);
      })
    );
  }

  public logout(): void {
    localStorage.removeItem(this.ACCESS_TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    this.accessTokenSignal.set(null);
    this.currentUserSignal.set(null);
    this.router.navigate(['/auth/login']);
  }
}
