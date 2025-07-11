import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BonoModel } from '../models/bono.model';
import {environment} from '../../../environments/environment.production';

@Injectable({
  providedIn: 'root'
})
export class BonoService {
  private readonly baseUrl = `${environment.apiUrl}/bonos`;

  constructor(private http: HttpClient) {}

  createBono(bono: BonoModel): Observable<BonoModel> {
    return this.http.post<BonoModel>(this.baseUrl, bono);
  }

  getBonosByUser(userId: number): Observable<BonoModel[]> {
    return this.http.get<BonoModel[]>(`${this.baseUrl}/user/${userId}`);
  }

  getBonoById(id: number): Observable<BonoModel> {
    return this.http.get<BonoModel>(`${this.baseUrl}/${id}`);
  }

  updateBono(id: number, bono: BonoModel): Observable<BonoModel> {
    return this.http.put<BonoModel>(`${this.baseUrl}/${id}`, bono);
  }

  deleteBono(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  calculateBono(id: number): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/${id}/calculate`, null);
  }
}
