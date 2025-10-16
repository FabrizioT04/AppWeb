import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { Auth, onAuthStateChanged, User } from '@angular/fire/auth';
import { Firestore, collection, query, where, getDocs, doc, getDoc } from '@angular/fire/firestore';

@Component({
  selector: 'app-my-grades',
  templateUrl: './my-grades.page.html',
  styleUrls: ['./my-grades.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule]
})
export class MyGradesPage implements OnInit {
  public misInscripciones: any[] = [];
  public cargando = true;
  private currentUser: User | null = null;

  private auth: Auth = inject(Auth);
  private firestore: Firestore = inject(Firestore);

  constructor() { }

  ngOnInit() {
    onAuthStateChanged(this.auth, (user) => {
      if (user) {
        this.currentUser = user;
        this.loadMyGrades();
      } else {
        this.cargando = false;
      }
    });
  }

  async loadMyGrades() {
    if (!this.currentUser) return;
    try {
      const q = query(collection(this.firestore, "inscripciones"), where("estudianteId", "==", this.currentUser.uid));
      const querySnapshot = await getDocs(q);
      const inscripcionesPromises = querySnapshot.docs.map(async (inscripcionDoc) => {
        const inscripcionData = inscripcionDoc.data();
        const cursoDocRef = doc(this.firestore, 'cursos', inscripcionData['cursoId']);
        const cursoSnap = await getDoc(cursoDocRef);
        if (cursoSnap.exists()) {
          return {
            curso: cursoSnap.data(),
            notas: inscripcionData['notas']
          };
        }
        return null;
      });
      const results = await Promise.all(inscripcionesPromises);
      this.misInscripciones = results.filter(r => r !== null);
    } catch (error) {
      console.error("Error al cargar mis notas:", error);
    } finally {
      this.cargando = false;
    }
  }
}
