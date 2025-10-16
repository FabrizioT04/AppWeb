import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, NavController, ToastController, LoadingController } from '@ionic/angular';
import { ActivatedRoute } from '@angular/router';
import { Firestore, doc, getDoc, updateDoc, collection, collectionData } from '@angular/fire/firestore';
import { Observable, of } from 'rxjs';

// Interfaz para el objeto Grado
interface Grade {
  id: string;
  nombre: string;
  seccion: string;
}

@Component({
  selector: 'app-edit-user',
  templateUrl: './edit-user.page.html',
  styleUrls: ['./edit-user.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule],
})
export class EditUserPage implements OnInit {
  public userId: string | null = null;
  // --- VARIABLES RESTAURADAS ---
  public user: any = {
    nombreCompleto: '',
    email: '',
    rol: 'estudiante',
    gradoId: null,
  };
  public grados$: Observable<Grade[]> = of([]);
  public isLoading = true;

  private firestore = inject(Firestore);
  private route = inject(ActivatedRoute);
  private navCtrl = inject(NavController);
  private toastCtrl = inject(ToastController);
  private loadingCtrl = inject(LoadingController);

  constructor() {}

  ngOnInit() {
    this.userId = this.route.snapshot.paramMap.get('id');
    if (this.userId) {
      this.loadUserData(this.userId);
    }
    this.loadGrados();
  }

  loadGrados() {
    const gradosCollection = collection(this.firestore, 'grados');
    this.grados$ = collectionData(gradosCollection, { idField: 'id' }) as Observable<Grade[]>;
  }

  async loadUserData(id: string) {
    this.isLoading = true;
    const userDocRef = doc(this.firestore, `usuarios/${id}`);
    const docSnap = await getDoc(userDocRef);
    if (docSnap.exists()) {
      this.user = docSnap.data();
      if (!this.user.gradoId) {
        this.user.gradoId = null;
      }
    } else {
      this.presentToast('No se pudo encontrar al usuario.', 'danger');
      this.navCtrl.back();
    }
    this.isLoading = false;
  }

  async saveUser() {
    if (!this.userId) return;

    const loading = await this.loadingCtrl.create({ message: 'Guardando cambios...' });
    await loading.present();

    try {
      const userDocRef = doc(this.firestore, `usuarios/${this.userId}`);
      const dataToUpdate: any = {
        rol: this.user.rol,
      };

      if (this.user.rol === 'estudiante') {
        dataToUpdate.gradoId = this.user.gradoId || null;
      } else {
        dataToUpdate.gradoId = null;
      }

      await updateDoc(userDocRef, dataToUpdate);
      this.presentToast('Usuario actualizado con éxito.', 'success');
      this.navCtrl.back();
    } catch (error) {
      this.presentToast('Error al guardar los cambios.', 'danger');
      console.error(error);
    } finally {
      loading.dismiss();
    }
  }

  async presentToast(message: string, color: 'success' | 'danger') {
    const toast = await this.toastCtrl.create({ message, duration: 2000, color });
    toast.present();
  }
}