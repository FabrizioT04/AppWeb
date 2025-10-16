import { Component, OnInit, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, ModalController, AlertController } from '@ionic/angular';
import { ActivatedRoute, ParamMap } from '@angular/router';
import { Firestore, collection, query, where, getDocs, doc, deleteDoc } from '@angular/fire/firestore';
import { Auth, onAuthStateChanged, User } from '@angular/fire/auth';
import { addIcons } from 'ionicons';
import { addCircleOutline, pencilOutline, trashOutline } from 'ionicons/icons';
// 1. Importar el nuevo componente Modal
import { ScheduleModalComponent } from '../components/schedule-modal/schedule-modal.component';

@Component({
  selector: 'app-schedule-detail',
  templateUrl: './schedule-detail.page.html',
  styleUrls: ['./schedule-detail.page.scss'],
  standalone: true,
  // 2. Añadir el Modal a los imports
  imports: [IonicModule, CommonModule, FormsModule, ScheduleModalComponent]
})
export class ScheduleDetailPage implements OnInit {

  public horarioAgrupado: { dia: string, clases: any[] }[] = [];
  public cargando = true;
  public courseId: string | null = null;
  public asignacionId: string | null = null;

  public esAdmin = false;
  private currentUser: User | null = null;
  private adminUID = "tmTBWCCtinRiWl9nrO2YVCqveyt2"; // Reemplaza con tu UID de admin

  diasSemana = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

  private firestore = inject(Firestore);
  private activatedRoute = inject(ActivatedRoute);
  private cdr = inject(ChangeDetectorRef);
  private auth = inject(Auth);
  private modalController = inject(ModalController);
  private alertController = inject(AlertController);

  constructor() {
    addIcons({ addCircleOutline, pencilOutline, trashOutline });
  }

  ngOnInit() {
    onAuthStateChanged(this.auth, (user) => {
      this.currentUser = user;
      this.verificarRolUsuario();
      this.activatedRoute.paramMap.subscribe((params: ParamMap) => {
        const idFromRoute = params.get('id');
        if (idFromRoute) {
          this.courseId = idFromRoute;
          this.cargarHorario(this.courseId);
        }
      });
    });
  }

  verificarRolUsuario() {
    if (this.currentUser) {
      this.esAdmin = this.currentUser.uid === this.adminUID;
    } else {
      this.esAdmin = false;
    }
  }

  async cargarHorario(courseId: string) {
    this.cargando = true;
    try {
      const qAsignacion = query(collection(this.firestore, 'asignaciones'), where('cursoId', '==', courseId));
      const asignacionSnapshot = await getDocs(qAsignacion);
      if (asignacionSnapshot.empty) {
        console.log('No se encontró asignación para este curso');
        this.cargando = false;
        return;
      }
      const asignacionDoc = asignacionSnapshot.docs[0];
      this.asignacionId = asignacionDoc.id;

      const qHorario = query(collection(this.firestore, 'horarios'), where('asignacionId', '==', this.asignacionId));
      const horarioSnapshot = await getDocs(qHorario);
      const clases = horarioSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      const grupos: { [key: number]: any[] } = {};
      clases.forEach((clase: any) => {
        const dia = clase['dia'];
        if (!grupos[dia]) {
          grupos[dia] = [];
        }
        grupos[dia].push(clase);
      });

      this.horarioAgrupado = Object.keys(grupos).map(key => ({
        dia: this.diasSemana[parseInt(key)],
        clases: grupos[parseInt(key)].sort((a, b) => a.horaInicio.localeCompare(b.horaInicio))
      })).sort((a, b) => this.diasSemana.indexOf(a.dia) - this.diasSemana.indexOf(b.dia));

    } catch (error) {
      console.error("Error cargando el horario: ", error);
    } finally {
      this.cargando = false;
      this.cdr.detectChanges();
    }
  }

  // ¡NUEVA FUNCIÓN! Abre el modal para crear o editar un bloque de horario
  async openScheduleModal(horario?: any) {
    const modal = await this.modalController.create({
      component: ScheduleModalComponent,
      componentProps: {
        asignacionId: this.asignacionId,
        horarioData: horario // Pasa el bloque de horario si estamos editando
      }
    });

    await modal.present();

    const { data } = await modal.onDidDismiss();
    if (data && data.recargar) {
      this.cargarHorario(this.courseId!);
    }
  }

  // ¡NUEVA FUNCIÓN! Elimina un bloque de horario
  async deleteHorario(horarioId: string) {
    const alert = await this.alertController.create({
      header: 'Confirmar Eliminación',
      message: '¿Estás seguro de que quieres eliminar este bloque de horario?',
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Eliminar',
          handler: async () => {
            try {
              await deleteDoc(doc(this.firestore, 'horarios', horarioId));
              this.cargarHorario(this.courseId!); // Recargar la lista
            } catch (error) {
              console.error("Error al eliminar el horario:", error);
            }
          },
        },
      ],
    });
    await alert.present();
  }
}


