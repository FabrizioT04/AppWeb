import { Component, OnInit, inject } from '@angular/core';
import { CommonModule, KeyValuePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { Auth, onAuthStateChanged, User } from '@angular/fire/auth';
import { Firestore, collection, doc, getDoc, query, where, collectionData } from '@angular/fire/firestore';
import { Observable, combineLatest, of, from } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';

// Interfaz para el objeto de horario ya con el nombre del curso
export interface HorarioCompleto {
  id: string;
  dia: string;
  horaInicio: string;
  horaFin: string;
  aula: string;
  nombreCurso: string;
}

@Component({
  selector: 'app-schedule',
  templateUrl: './schedule.page.html',
  styleUrls: ['./schedule.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, KeyValuePipe],
})
export class SchedulePage implements OnInit {
  public horarioAgrupado$: Observable<Map<string, HorarioCompleto[]>> = of(new Map());
  public diasSemana = [
    { valor: '1', nombre: 'Lunes' },
    { valor: '2', nombre: 'Martes' },
    { valor: '3', nombre: 'Miércoles' },
    { valor: '4', nombre: 'Jueves' },
    { valor: '5', nombre: 'Viernes' },
    { valor: '6', nombre: 'Sábado' },
    { valor: '7', nombre: 'Domingo' },
  ];

  private firestore = inject(Firestore);
  private auth = inject(Auth);

  constructor() {}

  ngOnInit() {
    onAuthStateChanged(this.auth, (user) => {
      if (user) {
        this.loadSchedule(user.uid);
      }
    });
  }

  loadSchedule(uid: string) {
    const userDocRef = doc(this.firestore, `usuarios/${uid}`);
    const userDoc$ = from(getDoc(userDocRef));

    this.horarioAgrupado$ = userDoc$.pipe(
      switchMap(userSnap => {
        if (!userSnap.exists()) return of([]);
        const userRole = userSnap.data()['rol'];

        let asignacionIds$: Observable<string[]>;

        if (userRole === 'estudiante') {
          const inscripcionesQuery = query(collection(this.firestore, 'inscripciones'), where('estudianteId', '==', uid));
          asignacionIds$ = collectionData(inscripcionesQuery).pipe(map(inscripciones => inscripciones.map(i => i['asignacionId'])));
        } else if (userRole === 'profesor') {
          const asignacionesQuery = query(collection(this.firestore, 'asignaciones'), where('profesorId', '==', uid));
          asignacionIds$ = collectionData(asignacionesQuery, { idField: 'id' }).pipe(map(asignaciones => asignaciones.map(a => a.id)));
        } else {
          return of([]); // No es estudiante ni profesor
        }
        return asignacionIds$;
      }),
      switchMap(ids => {
        if (ids.length === 0) return of([]);
        const horariosQuery = query(collection(this.firestore, 'horarios'), where('asignacionId', 'in', ids));
        return collectionData(horariosQuery, { idField: 'id' });
      }),
      switchMap((horarios: any[]) => {
        if (horarios.length === 0) return of([]);
        const observables = horarios.map(horario => {
          const asignacionRef = doc(this.firestore, 'asignaciones', horario.asignacionId);
          return from(getDoc(asignacionRef)).pipe(
            switchMap(asignacionSnap => {
              if (!asignacionSnap.exists()) return of({ ...horario, nombreCurso: 'Curso no disponible' });
              const cursoRef = doc(this.firestore, 'cursos', asignacionSnap.data()['cursoId']);
              return from(getDoc(cursoRef)).pipe(
                map(cursoSnap => ({
                  ...horario,
                  nombreCurso: cursoSnap.exists() ? cursoSnap.data()['nombre'] : 'Curso Desconocido',
                } as HorarioCompleto))
              );
            })
          );
        });
        return combineLatest(observables);
      }),
      map((horariosCompletos: HorarioCompleto[]) => {
        const grouped = new Map<string, HorarioCompleto[]>();
        horariosCompletos.forEach(h => {
          const dayName = this.diasSemana.find(d => d.valor === h.dia)?.nombre || 'Día Desconocido';
          if (!grouped.has(dayName)) {
            grouped.set(dayName, []);
          }
          grouped.get(dayName)!.push(h);
        });
        grouped.forEach(value => value.sort((a, b) => a.horaInicio.localeCompare(b.horaInicio)));
        
        // Ordenar el mapa por el orden de los días de la semana
        return new Map([...grouped.entries()].sort((a, b) => {
            const dayIndexA = this.diasSemana.findIndex(d => d.nombre === a[0]);
            const dayIndexB = this.diasSemana.findIndex(d => d.nombre === b[0]);
            return dayIndexA - dayIndexB;
        }));
      })
    );
  }
}

