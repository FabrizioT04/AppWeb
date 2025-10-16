import { Component } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { addIcons } from 'ionicons';
// Se cambia el ícono de 'newspaper' por 'home'
import { homeOutline, schoolOutline, personCircleOutline } from 'ionicons/icons';

@Component({
  selector: 'app-tabs',
  templateUrl: 'tabs.page.html',
  styleUrls: ['tabs.page.scss'],
  standalone: true,
  imports: [IonicModule],
})
export class TabsPage {
  constructor() {
    addIcons({ homeOutline, schoolOutline, personCircleOutline });
  }
}


