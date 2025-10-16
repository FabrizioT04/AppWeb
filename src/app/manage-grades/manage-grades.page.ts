import { Component, OnInit, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, NavController, ToastController } from '@ionic/angular';
import { ActivatedRoute } from '@angular/router';
import { Firestore, collection, query, where, getDocs, doc, getDoc, writeBatch, setDoc } from '@angular/fire/firestore';
import { addIcons } from 'ionicons';
import { saveOutline } from 'ionicons/icons';

@Component({
  selector: 'app-manage-grades',
  templateUrl: './manage-grades.page.html',
  styleUrls: ['./manage-grades.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule]
})
export class ManageGradesPage implements OnInit {

  public estudiantesConNotas: any[] = [];
  public asignacionId: string | null = null;
  public courseId: string | null = null;
  public tituloClase = 'Gestionar Notas';
  
  public cargando = true;
  public guardando = false;

  private firestore = inject(Firestore);
  private route = inject(ActivatedRoute);
  private navController = inject(NavController);
  private toastController = inject(ToastController);
  private cdr = inject(ChangeDetectorRef);

  constructor() {
    addIcons({ saveOutline });
  }

  ngOnInit() {
    this.asignacionId = this.route.snapshot.paramMap.get('id');
    if (this.asignacionId) {
      this.loadStudentGrades();
    }
  }

  async loadStudentGrades() {
    this.cargando = true;
    try {
      const asignacionRef = doc(this.firestore, 'asignaciones', this.asignacionId!);
      const asignacionSnap = await getDoc(asignacionRef);
      if (asignacionSnap.exists()) {
        const asignacionData = asignacionSnap.data();
        this.courseId = asignacionData['cursoId']; 
        const cursoRef = doc(this.firestore, 'cursos', this.courseId!);
        const cursoSnap = await getDoc(cursoRef);
        if (cursoSnap.exists()) {
          this.tituloClase = cursoSnap.data()['nombre'];
        }
      }

      const qInscripciones = query(collection(this.firestore, 'inscripciones'), where('asignacionId', '==', this.asignacionId));
      const inscripcionesSnapshot = await getDocs(qInscripciones);

      const promesas = inscripcionesSnapshot.docs.map(async (inscripcionDoc) => {
        const estudianteId = inscripcionDoc.data()['estudianteId'];
        const userRef = doc(this.firestore, 'usuarios', estudianteId);
        const userSnap = await getDoc(userRef);

        if (!userSnap.exists()) return null;

        const qCalificaciones = query(collection(this.firestore, 'calificaciones'), where('asignacionId', '==', this.asignacionId), where('estudianteId', '==', estudianteId));
        const calificacionSnap = await getDocs(qCalificaciones);
        
        let notas: {
          bimestre1: number, bimestre2: number, bimestre3: number, bimestre4: number,
          promedioFinal: number,
          calificacionId: string | null
        } = { bimestre1: 0, bimestre2: 0, bimestre3: 0, bimestre4: 0, promedioFinal: 0, calificacionId: null };

        if (!calificacionSnap.empty) {
          const calificacionData = calificacionSnap.docs[0].data();
          notas.bimestre1 = calificacionData['bimestre1'] || 0;
          notas.bimestre2 = calificacionData['bimestre2'] || 0;
          notas.bimestre3 = calificacionData['bimestre3'] || 0;
          notas.bimestre4 = calificacionData['bimestre4'] || 0;
          notas.promedioFinal = calificacionData['promedioFinal'] || 0;
          notas.calificacionId = calificacionSnap.docs[0].id;
        }
        
        return {
          id: userSnap.id,
          nombreCompleto: userSnap.data()['nombreCompleto'],
          notas: notas
        };
      });

      this.estudiantesConNotas = (await Promise.all(promesas)).filter(e => e !== null) as any[];

    } catch (error) {
      console.error("Error al cargar datos de estudiantes:", error);
    } finally {
      this.cargando = false;
      this.cdr.detectChanges();
    }
  }
  
  // Se actualiza el cálculo del promedio para 4 notas
  calcularPromedio(item: any) {
    const nota1 = Number(item.notas.bimestre1) || 0;
    const nota2 = Number(item.notas.bimestre2) || 0;
    const nota3 = Number(item.notas.bimestre3) || 0;
    const nota4 = Number(item.notas.bimestre4) || 0;
    const promedio = (nota1 + nota2 + nota3 + nota4) / 4;
    item.notas.promedioFinal = Math.round(promedio * 100) / 100;
  }

  async saveGrades() {
    this.guardando = true;
    const batch = writeBatch(this.firestore);

    this.estudiantesConNotas.forEach(item => {
      const calificacionRef = item.notas.calificacionId 
        ? doc(this.firestore, 'calificaciones', item.notas.calificacionId)
        : doc(collection(this.firestore, 'calificaciones'));

      // Se guardan los 4 bimestres
      batch.set(calificacionRef, {
        asignacionId: this.asignacionId,
        estudianteId: item.id,
        bimestre1: Number(item.notas.bimestre1) || 0,
        bimestre2: Number(item.notas.bimestre2) || 0,
        bimestre3: Number(item.notas.bimestre3) || 0,
        bimestre4: Number(item.notas.bimestre4) || 0,
        promedioFinal: item.notas.promedioFinal
      }, { merge: true });
    });

    try {
      await batch.commit();
      this.presentToast('Notas guardadas con éxito.', 'success');
      this.navController.back();
    } catch (error) {
      console.error("Error guardando notas:", error);
      this.presentToast('Ocurrió un error al guardar las notas.', 'danger');
    } finally {
      this.guardando = false;
    }
  }

  async presentToast(message: string, color: 'success' | 'danger' | 'warning') {
    const toast = await this.toastController.create({ message, duration: 3000, color });
    toast.present();
  }
}