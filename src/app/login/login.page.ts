import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, NavController, LoadingController, ToastController } from '@ionic/angular';
import { Auth, signInWithEmailAndPassword } from '@angular/fire/auth';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule],
})
export class LoginPage {
  public credentials = {
    email: '',
    password: '',
  };

  private auth = inject(Auth);
  private navCtrl = inject(NavController);
  private loadingCtrl = inject(LoadingController);
  private toastCtrl = inject(ToastController);

  constructor() {}

  async login() {
    if (!this.credentials.email || !this.credentials.password) {
      this.presentToast('Por favor, ingresa tu correo y contraseña.', 'warning');
      return;
    }

    const loading = await this.loadingCtrl.create({ message: 'Iniciando sesión...' });
    await loading.present();

    try {
      await signInWithEmailAndPassword(this.auth, this.credentials.email, this.credentials.password);
      // Si el inicio de sesión es exitoso, redirige a la página principal de tabs
      this.navCtrl.navigateRoot('/tabs/tab1', { animated: true });
    } catch (error: any) {
      console.error('Error de inicio de sesión:', error);
      this.presentToast('Correo o contraseña incorrectos.', 'danger');
    } finally {
      loading.dismiss();
    }
  }
  
  // --- FUNCIÓN PARA NAVEGAR AL REGISTRO ---
  goToRegister() {
    this.navCtrl.navigateForward('/register');
  }

  async presentToast(message: string, color: 'warning' | 'danger') {
    const toast = await this.toastCtrl.create({ message, duration: 3000, color });
    await toast.present();
  }
}



