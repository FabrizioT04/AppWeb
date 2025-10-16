import { Component, OnInit, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, ModalController, ToastController } from '@ionic/angular';
import { Firestore, doc, addDoc, updateDoc, collection } from '@angular/fire/firestore';

@Component({
  selector: 'app-schedule-modal',
  templateUrl: './schedule-modal.component.html',
  styleUrls: ['./schedule-modal.component.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule]
})
export class ScheduleModalComponent implements OnInit {
  @Input() asignacionId!: string;
  @Input() horarioData?: any; // Datos existentes si estamos editando

  horario: any = {
    dia: 1,
    horaInicio: '08:00',
    horaFin: '09:30',
    aula: ''
  };
  isEditMode = false;
  guardando = false;

  diasSemana = [
    { valor: 1, nombre: 'Lunes' },
    { valor: 2, nombre: 'Martes' },
    { valor: 3, nombre: 'Miércoles' },
    { valor: 4, nombre: 'Jueves' },
    { valor: 5, nombre: 'Viernes' },
  ];

  private firestore = inject(Firestore);
  private modalController = inject(ModalController);
  private toastController = inject(ToastController);

  constructor() { }

  ngOnInit() {
    if (this.horarioData) {
      this.isEditMode = true;
      this.horario = { ...this.horarioData };
    }
  }

  cancelar() {
    this.modalController.dismiss();
  }

  async guardar() {
    if (!this.horario.aula) {
      this.presentToast('Por favor, ingrese el número del aula.', 'warning');
      return;
    }
    this.guardando = true;

    try {
      if (this.isEditMode) {
        // Actualizar documento existente
        const horarioRef = doc(this.firestore, 'horarios', this.horario.id);
        await updateDoc(horarioRef, {
          dia: this.horario.dia,
          horaInicio: this.horario.horaInicio,
          horaFin: this.horario.horaFin,
          aula: this.horario.aula
        });
      } else {
        // Crear nuevo documento
        const horariosCollection = collection(this.firestore, 'horarios');
        await addDoc(horariosCollection, {
          ...this.horario,
          asignacionId: this.asignacionId
        });
      }
      this.presentToast('Horario guardado con éxito.', 'success');
      this.modalController.dismiss({ recargar: true });
    } catch (error) {
      console.error('Error guardando horario:', error);
      this.presentToast('Ocurrió un error al guardar.', 'danger');
    } finally {
      this.guardando = false;
    }
  }

  async presentToast(message: string, color: 'success' | 'danger' | 'warning') {
    const toast = await this.toastController.create({ message, duration: 3000, color });
    toast.present();
  }
}

