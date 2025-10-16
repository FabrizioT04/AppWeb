import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, NavController, ActionSheetController, LoadingController, ToastController } from '@ionic/angular';
import { Auth, onAuthStateChanged, signOut, User } from '@angular/fire/auth';
import { Firestore, doc, getDoc, updateDoc } from '@angular/fire/firestore';
import { Storage, ref, uploadString, getDownloadURL } from '@angular/fire/storage';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { camera, logOutOutline } from 'ionicons/icons';

// Interfaz para tipar los datos del usuario
interface UserProfile {
  nombreCompleto: string;
  email: string;
  rol: string;
  photoURL?: string;
}

@Component({
  selector: 'app-tab3',
  templateUrl: 'tab3.page.html',
  styleUrls: ['tab3.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule],
})
export class Tab3Page implements OnInit {
  public currentUser: User | null = null;
  public userProfile: UserProfile | null = null;
  public cargando = true;

  // Inyección de dependencias
  private auth = inject(Auth);
  private firestore = inject(Firestore);
  private storage = inject(Storage);
  private navCtrl = inject(NavController);
  private actionSheetCtrl = inject(ActionSheetController);
  private loadingCtrl = inject(LoadingController);
  private toastCtrl = inject(ToastController);

  constructor() {}

  ngOnInit() {
    onAuthStateChanged(this.auth, (user) => {
      if (user) {
        console.log('Paso 1: Usuario autenticado. UID:', user.uid);
        this.currentUser = user;
        this.loadUserProfile(user.uid);
      } else {
        console.log('Usuario no autenticado.');
        this.currentUser = null;
        this.userProfile = null;
        this.cargando = false;
      }
    });
  }
  
  get icons() {
    return { camera, logOutOutline };
  }

  async loadUserProfile(uid: string) {
    this.cargando = true;
    console.log(`Paso 2: Buscando perfil en Firestore para el UID: ${uid}`);
    try {
      const userDocRef = doc(this.firestore, `usuarios/${uid}`);
      const docSnap = await getDoc(userDocRef);

      if (docSnap.exists()) {
        console.log('Paso 3: ¡Documento encontrado!', docSnap.data());
        this.userProfile = docSnap.data() as UserProfile;
      } else {
        console.warn(`Paso 3: ADVERTENCIA - No se encontró ningún documento en la colección 'usuarios' con el ID: ${uid}`);
        this.userProfile = null;
      }
    } catch (error) {
      console.error("Paso 3: ERROR - Ocurrió un error al cargar el perfil:", error);
      this.userProfile = null;
    } finally {
      this.cargando = false;
    }
  }

  // --- FUNCIONALIDAD PARA CAMBIAR FOTO ---

  async changeProfilePicture() {
    const actionSheet = await this.actionSheetCtrl.create({
      header: 'Seleccionar fuente',
      buttons: [
        { text: 'Tomar foto', handler: () => this.selectImage(CameraSource.Camera) },
        { text: 'Elegir de la galería', handler: () => this.selectImage(CameraSource.Photos) },
        { text: 'Cancelar', role: 'cancel' }
      ]
    });
    await actionSheet.present();
  }

  async selectImage(source: CameraSource) {
    try {
      const image = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source: source
      });

      if (image && image.dataUrl && this.currentUser) {
        const loading = await this.loadingCtrl.create({ message: 'Subiendo foto...' });
        await loading.present();

        const userId = this.currentUser.uid;
        const storageRef = ref(this.storage, `profile_pictures/${userId}`);
        
        await uploadString(storageRef, image.dataUrl, 'data_url');
        
        const downloadUrl = await getDownloadURL(storageRef);
        
        const userDocRef = doc(this.firestore, `usuarios/${userId}`);
        await updateDoc(userDocRef, { photoURL: downloadUrl });

        if (this.userProfile) {
          this.userProfile.photoURL = downloadUrl;
        }
        
        loading.dismiss();
        this.presentToast('Foto de perfil actualizada con éxito.', 'success');
      }
    } catch (error) {
      console.error('Error al seleccionar la imagen:', error);
      this.presentToast('No se pudo actualizar la foto.', 'danger');
    }
  }

  // --- FIN DE FUNCIONALIDAD ---

  async logout() {
    try {
      await signOut(this.auth);
      this.navCtrl.navigateRoot('/login', { animated: true });
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  }

  async presentToast(message: string, color: 'success' | 'danger') {
    const toast = await this.toastCtrl.create({ message, duration: 2000, color });
    toast.present();
  }
}
