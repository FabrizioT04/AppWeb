import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, NavController, AlertController, ToastController } from '@ionic/angular';
import { ActivatedRoute } from '@angular/router';
import { Firestore, collection, query, where, onSnapshot, doc, deleteDoc, collectionData } from '@angular/fire/firestore';
import { Observable, of } from 'rxjs';
import { createOutline, trashOutline, add } from 'ionicons/icons';

@Component({
  selector: 'app-user-list',
  templateUrl: './user-list.page.html',
  styleUrls: ['./user-list.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule],
})
export class UserListPage implements OnInit {
  public users: any[] = [];
  private allUsers: any[] = [];
  public pageTitle = 'Todos los Usuarios';
  public isLoading = true;
  public searchTerm = '';
  public userRoleFilter: string | null = null;

  // --- VARIABLES PARA EL FILTRO DE GRADO (AHORA PÚBLICAS) ---
  public grados$: Observable<any[]> = of([]);
  public selectedGradeId: string = 'all';

  private firestore = inject(Firestore);
  private route = inject(ActivatedRoute);
  private navCtrl = inject(NavController);
  private alertCtrl = inject(AlertController);
  private toastCtrl = inject(ToastController);

  constructor() {}

  ngOnInit() {
    this.userRoleFilter = this.route.snapshot.paramMap.get('role');
    if (this.userRoleFilter === 'estudiante') {
      this.pageTitle = 'Lista de Estudiantes';
      this.loadGrados();
    } else if (this.userRoleFilter) {
      this.pageTitle = `Lista de ${this.userRoleFilter}s`;
    }
    this.loadUsers();
  }

  get icons() {
    return { createOutline, trashOutline, add };
  }

  loadGrados() {
    this.grados$ = collectionData(collection(this.firestore, 'grados'), { idField: 'id' });
  }

  loadUsers() {
    this.isLoading = true;
    let usersQuery;
    const usersCollection = collection(this.firestore, 'usuarios');

    if (this.userRoleFilter === 'estudiante' && this.selectedGradeId !== 'all') {
      usersQuery = query(usersCollection, where('rol', '==', 'estudiante'), where('gradoId', '==', this.selectedGradeId));
    } else if (this.userRoleFilter) {
      usersQuery = query(usersCollection, where('rol', '==', this.userRoleFilter));
    } else {
      usersQuery = query(usersCollection);
    }

    onSnapshot(usersQuery, (snapshot) => {
      this.allUsers = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      this.filterUsers();
      this.isLoading = false;
    });
  }

  filterUsers() {
    const term = this.searchTerm.trim().toLowerCase();
    if (!term) {
      this.users = [...this.allUsers];
    } else {
      this.users = this.allUsers.filter(user => 
        user.nombreCompleto.toLowerCase().includes(term) ||
        user.email.toLowerCase().includes(term)
      );
    }
  }

  handleSearch(event: any) {
    this.searchTerm = event.target.value || '';
    this.filterUsers();
  }

  // --- FUNCIÓN PARA EL FILTRO DE GRADO (AHORA PÚBLICA) ---
  handleGradeFilterChange(event: any) {
    this.selectedGradeId = event.detail.value;
    this.loadUsers();
  }

  goToCreateUser() {
    this.navCtrl.navigateForward('/create-user');
  }

  goToEditUser(userId: string) {
    this.navCtrl.navigateForward(`/edit-user/${userId}`);
  }

  async deleteUser(userId: string, userName: string) {
    const alert = await this.alertCtrl.create({
        header: 'Confirmar Eliminación',
        message: `¿Estás seguro de que quieres eliminar a ${userName}?`,
        buttons: [
            { text: 'Cancelar', role: 'cancel' },
            {
                text: 'Eliminar',
                handler: async () => {
                    try {
                        await deleteDoc(doc(this.firestore, 'usuarios', userId));
                        this.presentToast('Usuario eliminado con éxito.', 'success');
                    } catch (error) {
                        this.presentToast('Error al eliminar el usuario.', 'danger');
                    }
                }
            }
        ]
    });
    await alert.present();
  }

  async presentToast(message: string, color: 'success' | 'danger') {
    const toast = await this.toastCtrl.create({ message, duration: 2000, color });
    toast.present();
  }

  getRoleColor(role: string): string {
    switch (role?.toLowerCase()) {
      case 'administrador': return 'danger';
      case 'profesor': return 'secondary';
      case 'estudiante': return 'primary';
      default: return 'medium';
    }
  }
}
