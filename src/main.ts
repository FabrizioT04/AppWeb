import { enableProdMode } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { appConfig } from './app/app.config';
import { environment } from './environments/environment';

if (environment.production) {
  enableProdMode();
}

// Esta línea es la más importante: le dice a la app que use nuestra configuración
bootstrapApplication(AppComponent, appConfig)
  .catch((err) => console.error(err));
