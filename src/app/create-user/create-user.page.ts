import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, NavController, ToastController } from '@ionic/angular';
import { Auth, createUserWithEmailAndPassword } from '@angular/fire/auth';
import { Firestore, collection, collectionData, doc, setDoc } from '@angular/fire/firestore';
import { Observable } from 'rxjs';

interface UserData {
  nombreCompleto: string;
  email: string;
  rol: 'estudiante' | 'profesor' | 'administrador';
  photoURL: string;
  gradoId?: string;
}

interface Grade {
  id: string;
  nombre: string;
  seccion: string;
}

@Component({
  selector: 'app-create-user',
  templateUrl: './create-user.page.html',
  styleUrls: ['./create-user.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule]
})
export class CreateUserPage implements OnInit {
  usuario = {
    nombreCompleto: '',
    email: '',
    password: '',
    rol: 'estudiante',
    gradoId: undefined as string | undefined // ** CORRECCIÓN AQUÍ **
  };

  guardando = false;
  public grados$: Observable<Grade[]>;
  private auth = inject(Auth);
  private firestore = inject(Firestore);
  private navCtrl = inject(NavController);
  private toastCtrl = inject(ToastController);

  constructor() {
    const gradosCollection = collection(this.firestore, 'grados');
    this.grados$ = collectionData(gradosCollection, { idField: 'id' }) as Observable<Grade[]>;
  }

  ngOnInit() {}

  async crearUsuario() {
    if (!this.usuario.nombreCompleto || !this.usuario.email || !this.usuario.password || !this.usuario.rol) {
      this.presentToast('Por favor, complete todos los campos requeridos.', 'warning');
      return;
    }
    if (this.usuario.rol === 'estudiante' && !this.usuario.gradoId) {
      this.presentToast('Por favor, seleccione un grado para el estudiante.', 'warning');
      return;
    }

    this.guardando = true;

    try {
      const userCredential = await createUserWithEmailAndPassword(this.auth, this.usuario.email, this.usuario.password);
      const user = userCredential.user;
      const userData: UserData = {
        nombreCompleto: this.usuario.nombreCompleto,
        email: this.usuario.email,
        rol: this.usuario.rol as 'estudiante' | 'profesor' | 'administrador',
        photoURL: ''
      };

      if (userData.rol === 'estudiante') {
        userData.gradoId = this.usuario.gradoId;
      }

      const userDocRef = doc(this.firestore, `usuarios/${user.uid}`);
      await setDoc(userDocRef, userData);
      this.presentToast('Usuario creado con éxito.', 'success');
      this.navCtrl.back();
    } catch (error: any) {
      const errorMessage = this.firebaseErrorToText(error.code);
      this.presentToast(errorMessage, 'danger');
    } finally {
      this.guardando = false;
    }
  }

  async presentToast(message: string, color: 'success' | 'danger' | 'warning') {
    const toast = await this.toastCtrl.create({ message, duration: 3000, color });
    toast.present();
  }

  private firebaseErrorToText(code: string): string {
    switch (code) {
      case 'auth/email-already-in-use': return 'El correo electrónico ya está en uso.';
      case 'auth/invalid-email': return 'El correo electrónico no es válido.';
      case 'auth/weak-password': return 'La contraseña debe tener al menos 6 caracteres.';
      default: return 'Ocurrió un error inesperado.';
    }
  }
}


