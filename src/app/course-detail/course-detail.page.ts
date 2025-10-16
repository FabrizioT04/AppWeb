import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, NavController } from '@ionic/angular';
import { ActivatedRoute } from '@angular/router';
import { Auth, onAuthStateChanged, User } from '@angular/fire/auth';
import { Firestore, collection, doc, getDoc, query, where, getDocs } from '@angular/fire/firestore';
import { Observable, from, of } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { personCircleOutline, schoolOutline, timeOutline, statsChartOutline, checkmarkDoneOutline, createOutline } from 'ionicons/icons';

// Interfaz para la información completa de la clase
interface ClaseDetalle {
  nombreCurso: string;
  nombreGrado: string;
  nombreProfesor: string;
}

@Component({
  selector: 'app-course-detail',
  templateUrl: './course-detail.page.html',
  styleUrls: ['./course-detail.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule],
})
export class CourseDetailPage implements OnInit {
  public asignacionId: string | null = null;
  public userRole: string | null = null;
  public esProfesorDeEstaClase = false;
  public esEstudianteInscrito = false;
  public claseDetalle$: Observable<ClaseDetalle | null> = of(null);
  
  private currentUser: User | null = null;
  private firestore = inject(Firestore);
  private auth = inject(Auth);
  private route = inject(ActivatedRoute);
  private navCtrl = inject(NavController);

  constructor() {}

  ngOnInit() {
    this.asignacionId = this.route.snapshot.paramMap.get('id');
    
    onAuthStateChanged(this.auth, (user) => {
      if (user && this.asignacionId) {
        this.currentUser = user;
        this.loadPageData(user.uid, this.asignacionId);
      }
    });
  }

  get icons() {
    return { personCircleOutline, schoolOutline, timeOutline, statsChartOutline, checkmarkDoneOutline, createOutline };
  }
  
  async loadPageData(uid: string, asignacionId: string) {
    // 1. Cargar el rol del usuario
    const userDocRef = doc(this.firestore, `usuarios/${uid}`);
    const userSnap = await getDoc(userDocRef);
    if (userSnap.exists()) {
      this.userRole = userSnap.data()['rol']?.toLowerCase();
    }

    // 2. Cargar los detalles de la clase (asignación)
    this.claseDetalle$ = from(getDoc(doc(this.firestore, 'asignaciones', asignacionId))).pipe(
      switchMap(asignacionSnap => {
        if (!asignacionSnap.exists()) return of(null);
        const data = asignacionSnap.data();
        
        // Verificar si el usuario actual es el profesor de esta clase
        if (this.userRole === 'profesor' && data['profesorId'] === uid) {
          this.esProfesorDeEstaClase = true;
        }

        const cursoRef = doc(this.firestore, 'cursos', data['cursoId']);
        const gradoRef = doc(this.firestore, 'grados', data['gradoId']);
        const profesorRef = doc(this.firestore, 'usuarios', data['profesorId']);
        
        return from(Promise.all([getDoc(cursoRef), getDoc(gradoRef), getDoc(profesorRef)])).pipe(
          map(([cursoSnap, gradoSnap, profesorSnap]) => ({
            nombreCurso: cursoSnap.exists() ? cursoSnap.data()['nombre'] : '...',
            nombreGrado: gradoSnap.exists() ? `${gradoSnap.data()['nombre']} - ${gradoSnap.data()['seccion']}` : '...',
            nombreProfesor: profesorSnap.exists() ? profesorSnap.data()['nombreCompleto'] : '...',
          }))
        );
      })
    );

    // 3. Verificar si el estudiante está inscrito
    if (this.userRole === 'estudiante') {
      const inscripcionesQuery = query(
        collection(this.firestore, 'inscripciones'),
        where('estudianteId', '==', uid),
        where('asignacionId', '==', asignacionId)
      );
      const inscripcionesSnap = await getDocs(inscripcionesQuery);
      this.esEstudianteInscrito = !inscripcionesSnap.empty;
    }
  }

  // --- FUNCIONES DE NAVEGACIÓN ---
  goToManageAttendance() {
    this.navCtrl.navigateForward(`/manage-attendance/${this.asignacionId}`);
  }

  goToManageGrades() {
    this.navCtrl.navigateForward(`/manage-grades/${this.asignacionId}`);
  }

  goToMyGrades() {
    // Navegar a la página donde el alumno ve sus notas (my-grades o similar)
    // Necesitarás crear esta página si aún no existe
    console.log('Navegando a mis notas...');
  }

  goToMyAttendance() {
    // Navegar a la página donde el alumno ve sus asistencias
    // Necesitarás crear esta página si aún no existe
    console.log('Navegando a mis asistencias...');
  }
}




