import { Component, OnInit, ChangeDetectorRef } from '@angular/core'; // 1. Importar ChangeDetectorRef
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, NavController, ToastController } from '@ionic/angular';
import { ActivatedRoute, ParamMap } from '@angular/router';
import { Firestore, collection, query, where, getDocs, writeBatch, doc } from '@angular/fire/firestore';

@Component({
  selector: 'app-enroll-students',
  templateUrl: './enroll-students.page.html',
  styleUrls: ['./enroll-students.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule]
})
export class EnrollStudentsPage implements OnInit {

  public listaEstudiantes: any[] = [];
  public cargando = true;
  public guardando = false;
  public asignacionId: string | null = null;
  private inscripcionesOriginales: Set<string> = new Set();

  constructor(
    private activatedRoute: ActivatedRoute,
    private firestore: Firestore,
    private navController: NavController,
    private toastController: ToastController,
    private cdr: ChangeDetectorRef // 2. Inyectar el servicio en el constructor
  ) { }

  ngOnInit() {
    this.activatedRoute.paramMap.subscribe((params: ParamMap) => {
      const idFromRoute = params.get('id');
      if (idFromRoute) {
        this.asignacionId = idFromRoute;
        this.cargarEstudiantes();
      }
    });
  }

  async cargarEstudiantes() {
    this.cargando = true;
    try {
      // 1. Obtener todos los estudiantes de la escuela
      const qEstudiantes = query(collection(this.firestore, 'usuarios'), where('rol', '==', 'estudiante'));
      const estudiantesSnapshot = await getDocs(qEstudiantes);
      const todosLosEstudiantes = estudiantesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), inscrito: false }));

      // 2. Obtener los que ya están inscritos en esta asignación
      const qInscritos = query(collection(this.firestore, 'inscripciones'), where('asignacionId', '==', this.asignacionId));
      const inscritosSnapshot = await getDocs(qInscritos);
      const estudiantesInscritosIds = new Set(inscritosSnapshot.docs.map(doc => doc.data()['estudianteId']));
      this.inscripcionesOriginales = new Set(inscritosSnapshot.docs.map(doc => doc.id));


      // 3. Marcar los estudiantes que ya están inscritos
      this.listaEstudiantes = todosLosEstudiantes.map(estudiante => {
        if (estudiantesInscritosIds.has(estudiante.id)) {
          estudiante.inscrito = true;
        }
        return estudiante;
      });

    } catch (error) {
      console.error("Error al cargar estudiantes:", error);
      this.presentToast('Error al cargar la lista de estudiantes', 'danger');
    } finally {
      this.cargando = false;
      this.cdr.detectChanges(); // 3. Forzar la actualización de la vista
    }
  }

  async guardarInscripciones() {
    if (!this.asignacionId) return;

    this.guardando = true;
    const batch = writeBatch(this.firestore);
    const añoActual = new Date().getFullYear();

    try {
        const qInscripcionesActuales = query(collection(this.firestore, 'inscripciones'), where('asignacionId', '==', this.asignacionId));
        const inscripcionesSnapshot = await getDocs(qInscripcionesActuales);
        const inscripcionesMap = new Map(inscripcionesSnapshot.docs.map(d => [d.data()['estudianteId'], d.id]));

        for (const estudiante of this.listaEstudiantes) {
            const estaInscritoAhora = inscripcionesMap.has(estudiante.id);

            if (estudiante.inscrito && !estaInscritoAhora) {
                // Añadir nueva inscripción
                const nuevaInscripcionRef = doc(collection(this.firestore, 'inscripciones'));
                batch.set(nuevaInscripcionRef, {
                    asignacionId: this.asignacionId,
                    estudianteId: estudiante.id,
                    año: añoActual
                });
            } else if (!estudiante.inscrito && estaInscritoAhora) {
                // Borrar inscripción existente
                const inscripcionId = inscripcionesMap.get(estudiante.id);
                if (inscripcionId) {
                    const inscripcionRef = doc(this.firestore, 'inscripciones', inscripcionId);
                    batch.delete(inscripcionRef);
                }
            }
        }

        await batch.commit();
        this.presentToast('Inscripciones actualizadas con éxito', 'success');
        this.navController.back();

    } catch (error) {
        console.error("Error al guardar inscripciones:", error);
        this.presentToast('Ocurrió un error al guardar los cambios', 'danger');
    } finally {
        this.guardando = false;
        this.cdr.detectChanges(); // 3. Forzar la actualización de la vista
    }
  }
  
  async presentToast(message: string, color: string) {
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      color,
    });
    toast.present();
  }
}

