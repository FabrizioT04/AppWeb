import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { ScheduleDetailPage } from './schedule-detail.page';
import { IonicModule } from '@ionic/angular';
import { Firestore } from '@angular/fire/firestore';
import { NavController } from '@ionic/angular';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';

describe('ScheduleDetailPage', () => {
  let component: ScheduleDetailPage;
  let fixture: ComponentFixture<ScheduleDetailPage>;

  // Mocks para los servicios que necesita la página
  const firestoreMock = {};
  const navControllerMock = {};
  // Mock para simular que la URL tiene un parámetro 'id'
  const activatedRouteMock = {
    paramMap: of({
      get: (key: string) => 'testCourseId', // Simula que el ID del curso es 'testCourseId'
    }),
  };

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [IonicModule.forRoot(), ScheduleDetailPage],
      providers: [
        { provide: Firestore, useValue: firestoreMock },
        { provide: NavController, useValue: navControllerMock },
        { provide: ActivatedRoute, useValue: activatedRouteMock },
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ScheduleDetailPage);
    component = fixture.componentInstance;
    // Espiamos la función real para asegurarnos de que se llama
    spyOn(component, 'cargarHorario').and.callThrough(); 
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should call cargarHorario on init', () => {
    // La prueba ahora verifica que se llame a la función correcta 'cargarHorario'
    expect(component.cargarHorario).toHaveBeenCalledWith('testCourseId');
  });
});