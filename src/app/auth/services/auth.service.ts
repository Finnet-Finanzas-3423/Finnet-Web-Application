import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../../environments/environment.development';
import { Observable } from 'rxjs';
import { Login } from '../models/login.model';
import { Profile } from '../models/profile.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = environment.apiUrl
  private http = inject(HttpClient);

  signIn(email:string, password:string):Observable<Login>{
    return this.http.post<Login>(`${this.apiUrl}/auth/login`, { email, password });
  }

  signUp(
    email: string,
    password: string,
    ruc: string,
    razonSocial: string,
    direccion: string,
    sectorEmpresarial: string
  ):Observable<any>{
    return this.http.post<any>(`${this.apiUrl}/auth/register`, {
      email,
      password,
      ruc,
      razonSocial,
      direccion,
      sectorEmpresarial
    });
  }

  profile():Observable<Profile>{
    return this.http.get<Profile>(`${this.apiUrl}/auth/profile`);
  }
  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('id');
  }
}
