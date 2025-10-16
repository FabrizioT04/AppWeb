import { Component, OnInit, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, NavController, ToastController } from '@ionic/angular';
import { Firestore, collection, query, where, getDocs, doc, getDoc, writeBatch } from '@angular/fire/firestore';
import { Auth, onAuthStateChanged, User } from '@angular/fire/auth';
import { addIcons } from 'ionicons';
import { personCircleOutline, saveOutline } from 'ionicons/icons';

@Component({
  selector: 'app-manage-attendance',
  templateUrl: './manage-attendance.page.html',
  styleUrls: ['./manage-attendance.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule]
})
export class ManageAttendancePage implements OnInit {

  public asignaciones: any[] = [];
  public estudiantes: any[] = [];
  public asignacionSeleccionada: string | null = null;
  
  public cargandoAsignaciones = true;
  public cargandoEstudiantes = false;
  
  private currentUser: User | null = null;

  // Se inyectan los servicios con el método moderno
  private firestore = inject(Firestore);
  private auth = inject(Auth);
  private cdr = inject(ChangeDetectorRef);
  private toastController = inject(ToastController);
  private navController = inject(NavController);

  constructor() {
    addIcons({ personCircleOutline, saveOutline });
  }

  ngOnInit() {
    onAuthStateChanged(this.auth, (user) => {
      this.currentUser = user;
      if (user) {
        this.cargarAsignaciones();
      }
    });
  }

  async cargarAsignaciones() {
    this.cargandoAsignaciones = true;
    try {
      const q = query(collection(this.firestore, 'asignaciones'), where('profesorId', '==', this.currentUser!.uid));
      const asignacionesSnapshot = await getDocs(q);
      
      const promises = asignacionesSnapshot.docs.map(async (asignacionDoc) => {
        const asignacionData = asignacionDoc.data();
        const cursoRef = doc(this.firestore, 'cursos', asignacionData['cursoId']);
        const gradoRef = doc(this.firestore, 'grados', asignacionData['gradoId']);

        const [cursoSnap, gradoSnap] = await Promise.all([getDoc(cursoRef), getDoc(gradoRef)]);
        
        return {
          id: asignacionDoc.id,
          nombreCurso: cursoSnap.exists() ? cursoSnap.data()['nombre'] : 'Curso Desconocido',
          nombreGrado: gradoSnap.exists() ? `${gradoSnap.data()['nombre']} - ${gradoSnap.data()['seccion']}` : 'Grado Desconocido'
        };
      });

      this.asignaciones = await Promise.all(promises);
    } catch (error) {
      console.error("Error cargando asignaciones:", error);
    } finally {
      this.cargandoAsignaciones = false;
      this.cdr.detectChanges();
    }
  }

  async cargarEstudiantes() {
    if (!this.asignacionSeleccionada) return;

    this.cargandoEstudiantes = true;
    this.estudiantes = [];
    try {
      const qInscripciones = query(collection(this.firestore, 'inscripciones'), where('asignacionId', '==', this.asignacionSeleccionada));
      const inscripcionesSnapshot = await getDocs(qInscripciones);

      const promesas = inscripcionesSnapshot.docs.map(async (inscripcionDoc) => {
        const estudianteId = inscripcionDoc.data()['estudianteId'];
        const userRef = doc(this.firestore, 'usuarios', estudianteId);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          return {
            id: userSnap.id,
            nombreCompleto: userSnap.data()['nombreCompleto'],
            estadoAsistencia: 'PRESENTE'
          };
        }
        return null;
      });

      this.estudiantes = (await Promise.all(promesas)).filter(e => e !== null) as any[];

    } catch (error) {
      console.error("Error al cargar estudiantes:", error);
    } finally {
      this.cargandoEstudiantes = false;
      this.cdr.detectChanges();
    }
  }

  // ¡FUNCIÓN CORREGIDA! Acepta cualquier tipo de valor del evento.
  marcarAsistencia(estudianteId: string, eventValue: any) {
    const estado = String(eventValue || ''); // Convierte el valor a string de forma segura
    const estudiante = this.estudiantes.find(e => e.id === estudianteId);
    if (estudiante) {
      estudiante.estadoAsistencia = estado;
    }
  }

  async guardarLista() {
    if (!this.asignacionSeleccionada || this.estudiantes.length === 0) {
      this.presentToast('No hay lista de asistencia para guardar.', 'warning');
      return;
    }

    const batch = writeBatch(this.firestore);
    const fecha = new Date();

    this.estudiantes.forEach(estudiante => {
      const asistenciaRef = doc(collection(this.firestore, 'asistencias'));
      batch.set(asistenciaRef, {
        asignacionId: this.asignacionSeleccionada,
        estudianteId: estudiante.id,
        fecha: fecha,
        estado: estudiante.estadoAsistencia
      });
    });

    try {
      await batch.commit();
      this.presentToast('Asistencia guardada con éxito.', 'success');
      this.navController.back(); // Regresa a la página anterior
    } catch (error) {
      console.error("Error guardando asistencia:", error);
      this.presentToast('Ocurrió un error al guardar la asistencia.', 'danger');
    }
  }

  async presentToast(message: string, color: 'success' | 'danger' | 'warning') {
    const toast = await this.toastController.create({ message, duration: 3000, color });
    toast.present();
  }
}



