import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, NavController } from '@ionic/angular';
import { ActivatedRoute, ParamMap } from '@angular/router';
import { Auth, onAuthStateChanged, User } from '@angular/fire/auth';
import { Firestore, doc, getDoc, collection, query, where, getDocs, limit } from '@angular/fire/firestore';
import { addIcons } from 'ionicons';
import { personCircleOutline, personAddOutline, checkboxOutline, documentTextOutline, timeOutline } from 'ionicons/icons';

@Component({
  selector: 'app-attendance-history',
  templateUrl: './attendance-history.page.html',
  styleUrls: ['./attendance-history.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule],
})
export class AttendanceHistoryPage implements OnInit {

  public curso: any = null;
  public profesor: any = null;
  public cargando = true;
  public esProfesorDelCurso = false;
  public esEstudianteDelCurso = false;
  public misNotas: any = null;
  public historialAsistencias: any[] = [];
  public miHistorialAsistencia: any[] = [];

  private courseId: string | null = null;
  private currentUser: User | null = null;
  private asignacionId: string | null = null;

  constructor(
    private activatedRoute: ActivatedRoute,
    private firestore: Firestore,
    private auth: Auth,
    private navController: NavController,
    private cdr: ChangeDetectorRef
  ) {
    addIcons({ personCircleOutline, personAddOutline, checkboxOutline, documentTextOutline, timeOutline });
  }

  ngOnInit() {
    this.activatedRoute.paramMap.subscribe((params: ParamMap) => {
      const idFromRoute = params.get('id');
      if (idFromRoute) {
        this.courseId = idFromRoute;
        onAuthStateChanged(this.auth, (user) => {
          if (user) {
            this.currentUser = user;
            this.loadCourseData(this.courseId!);
          } else {
            this.navController.navigateRoot('/login');
          }
        });
      }
    });
  }

  async loadCourseData(id: string) {
    this.cargando = true;
    try {
      const courseDocRef = doc(this.firestore, 'cursos', id);
      const courseSnap = await getDoc(courseDocRef);
      if (!courseSnap.exists()) { return; }
      this.curso = courseSnap.data();
      this.curso.id = courseSnap.id;

      const asignacionQuery = query(collection(this.firestore, 'asignaciones'), where("cursoId", "==", id), limit(1));
      const asignacionSnapshot = await getDocs(asignacionQuery);

      if (!asignacionSnapshot.empty) {
        const asignacionData = asignacionSnapshot.docs[0].data();
        this.asignacionId = asignacionSnapshot.docs[0].id;
        const profesorId = asignacionData['profesorId'];
        if (profesorId) {
          const userDocRef = doc(this.firestore, 'usuarios', profesorId);
          const userSnap = await getDoc(userDocRef);
          if (userSnap.exists()) {
            this.profesor = userSnap.data();
          }
        }
      }

      if (this.currentUser && this.profesor) {
         this.esProfesorDelCurso = this.currentUser.uid === this.profesor['uid'];
      }
      
      if (this.currentUser && this.asignacionId) {
        const inscripcionQuery = query(
            collection(this.firestore, 'inscripciones'),
            where("asignacionId", "==", this.asignacionId),
            where("estudianteId", "==", this.currentUser.uid),
            limit(1)
        );
        const inscripcionSnapshot = await getDocs(inscripcionQuery);
        this.esEstudianteDelCurso = !inscripcionSnapshot.empty;

        if (this.esEstudianteDelCurso) {
          const calificacionesQuery = query(
            collection(this.firestore, 'calificaciones'),
            where("asignacionId", "==", this.asignacionId),
            where("estudianteId", "==", this.currentUser.uid),
            limit(1)
          );
          const calificacionesSnapshot = await getDocs(calificacionesQuery);
          if (!calificacionesSnapshot.empty) {
            this.misNotas = calificacionesSnapshot.docs[0].data()['notas'];
          }
        }
      }

      if(this.asignacionId) {
        this.cargarHistorialAsistencias();
      }

    } catch (error) {
      console.error("Error al cargar los datos del curso:", error);
    } finally {
      this.cargando = false;
      this.cdr.detectChanges();
    }
  }

  async cargarHistorialAsistencias() {
    if (!this.asignacionId || !this.currentUser) return;
  
    let asistenciaQuery;
    
    if (this.esProfesorDelCurso) {
      asistenciaQuery = query(
        collection(this.firestore, 'asistencias'),
        where("asignacionId", "==", this.asignacionId)
      );
    } else if (this.esEstudianteDelCurso) {
      asistenciaQuery = query(
        collection(this.firestore, 'asistencias'),
        where("asignacionId", "==", this.asignacionId),
        where("estudianteId", "==", this.currentUser.uid)
      );
    } else {
      return;
    }
  
    const asistenciaSnapshot = await getDocs(asistenciaQuery);
    const asistenciasPromises = asistenciaSnapshot.docs.map(async (asistenciaDoc) => {
      const asistenciaData = asistenciaDoc.data();
      const estudianteId = asistenciaData['estudianteId'];
      const userDocRef = doc(this.firestore, 'usuarios', estudianteId);
      const userSnap = await getDoc(userDocRef);
      const nombreCompleto = userSnap.exists() ? userSnap.data()['nombreCompleto'] : 'Estudiante Desconocido';
      
      return {
        ...asistenciaData,
        id: asistenciaDoc.id,
        fecha: (asistenciaData['fecha']).toDate(),
        nombreEstudiante: nombreCompleto,
      };
    });
  
    const asistencias = await Promise.all(asistenciasPromises);
    asistencias.sort((a, b) => b.fecha.getTime() - a.fecha.getTime());

    if (this.esProfesorDelCurso) {
      this.historialAsistencias = asistencias;
    } else if (this.esEstudianteDelCurso) {
      this.miHistorialAsistencia = asistencias;
    }
  }
}
