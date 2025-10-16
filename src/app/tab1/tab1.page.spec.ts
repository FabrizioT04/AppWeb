import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { Tab1Page } from './tab1.page';
import { IonicModule } from '@ionic/angular';
import { Firestore } from '@angular/fire/firestore';
import { Auth } from '@angular/fire/auth';
import { NavController, AlertController } from '@ionic/angular';
import { ChangeDetectorRef } from '@angular/core';

describe('Tab1Page', () => {
  let component: Tab1Page;
  let fixture: ComponentFixture<Tab1Page>;

  const firestoreMock = {};
  const authMock = {};
  const navControllerMock = {};
  const alertControllerMock = {};
  const cdrMock = { detectChanges: () => {} };

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [IonicModule.forRoot(), Tab1Page],
      providers: [
        { provide: Firestore, useValue: firestoreMock },
        { provide: Auth, useValue: authMock },
        { provide: NavController, useValue: navControllerMock },
        { provide: AlertController, useValue: alertControllerMock },
        { provide: ChangeDetectorRef, useValue: cdrMock }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(Tab1Page);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});


